// Global Variables
let currentQuizQuestion = 1;
let quizAnswers = {};
let qrScanner = null;
let currentFilter = 'all';
let map = null; // Leaflet map instance
let markers = []; // Array to store map markers

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Feather icons
    feather.replace();
    
    // Set up initial state
    switchTab('home');
    
    // Initialize quiz
    initializeQuiz();
    
    // Initialize map when in map section
    initializeMap();
    
    console.log('Regalbuto Heritage App initialized');
});

// Search and Filter Functions
function filterMonuments() {
    const searchTerm = document.getElementById('monument-search').value.toLowerCase();
    const monuments = document.querySelectorAll('.monument-card');
    let visibleCount = 0;
    
    monuments.forEach(monument => {
        const title = monument.querySelector('h4').textContent.toLowerCase();
        const description = monument.querySelector('.monument-description').textContent.toLowerCase();
        const category = monument.getAttribute('data-category');
        
        const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
        const matchesFilter = currentFilter === 'all' || category === currentFilter;
        
        if (matchesSearch && matchesFilter) {
            monument.style.display = 'block';
            visibleCount++;
        } else {
            monument.style.display = 'none';
        }
    });
    
    updateResultsCount(visibleCount);
}

function filterByCategory(category) {
    currentFilter = category;
    
    // Update active filter tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    // Apply filter
    filterMonuments();
    
    // Scroll to appropriate category section if not showing all
    if (category !== 'all') {
        setTimeout(() => {
            scrollToCategorySection(category);
        }, 300);
    }
}

function scrollToCategorySection(category) {
    // Map filter categories to monument sections
    const categoryMap = {
        'religioso': 'cultura-storia',
        'natura': 'natura-paesaggio', 
        'cultura': 'cultura-storia'
    };
    
    const targetCategory = categoryMap[category] || category;
    const categorySection = document.querySelector(`[data-category-section="${targetCategory}"]`);
    
    if (categorySection) {
        categorySection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

function updateResultsCount(count) {
    const resultsText = document.getElementById('results-text');
    resultsText.textContent = `${count} monumenti trovati`;
}

// Tab Navigation Functions
function switchTab(tabName) {
    // Close QR scanner if open when switching tabs
    const qrModal = document.getElementById('qr-modal');
    if (qrModal && qrModal.style.display === 'block') {
        closeQRScanner();
    }
    
    // Force scroll to top immediately
    window.scrollTo(0, 0);
    
    // Also ensure body scroll is reset
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const activeSection = document.getElementById(tabName);
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    // Update navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNavItem = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    // Refresh icons after tab switch
    setTimeout(() => {
        feather.replace();
        
        // Initialize map if switching to map tab
        if (tabName === 'mappa') {
            if (!map) {
                initializeMap();
            } else {
                // Resize map to fix display issues when switching tabs
                map.invalidateSize();
            }
        }
    }, 100);
    
    console.log(`Switched to tab: ${tabName}`);
}

// Hero Section Functions
function startTour() {
    switchTab('virtual-tour');
    showNotification('Benvenuto nel tour virtuale di Regalbuto!', 'success');
}

// QR Scanner Functions
function startQRScanner() {
    const modal = document.getElementById('qr-modal');
    const qrReaderDiv = document.getElementById('qr-reader');
    
    if (!modal || !qrReaderDiv) {
        console.error('QR modal elements not found');
        return;
    }
    
    // Close any existing scanner first
    if (qrScanner) {
        closeQRScanner();
    }
    
    modal.style.display = 'block';
    
    // Initialize Feather icons for the modal
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Simple and direct close button setup
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
        // Clear any existing event handlers
        closeBtn.onclick = null;
        closeBtn.onmousedown = null;
        closeBtn.ontouchstart = null;
        
        // Set up a single, reliable click handler
        closeBtn.onclick = function() {
            console.log('Close button clicked');
            closeQRScanner();
            return false;
        };
        
        // Add mousedown as additional backup
        closeBtn.onmousedown = function() {
            console.log('Close button mousedown');
            closeQRScanner();
            return false;
        };
        
        // Add touchstart for mobile
        closeBtn.ontouchstart = function() {
            console.log('Close button touchstart');
            closeQRScanner();
            return false;
        };
    }
    
    // Close on background click
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeQRScanner();
        }
    };
    
    // Show loading message
    qrReaderDiv.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <p>Inizializzazione della fotocamera...</p>
            <p style="font-size: 0.9rem; color: #666;">Assicurati di concedere i permessi per la fotocamera</p>
        </div>
    `;
    
    // Initialize QR scanner with delay to ensure DOM is ready
    setTimeout(() => {
        if (typeof Html5Qrcode !== 'undefined') {
            try {
                // Don't clear the div, just create the scanner
                qrScanner = new Html5Qrcode("qr-reader");
                
                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };
                
                // Clear loading message before starting scanner
                qrReaderDiv.innerHTML = '';
                
                qrScanner.start(
                    { facingMode: "environment" }, // Use back camera
                    config,
                    (decodedText, decodedResult) => {
                        console.log(`QR Code detected: ${decodedText}`);
                        handleQRResult(decodedText);
                        closeQRScanner();
                    },
                    (errorMessage) => {
                        // Handle scan errors silently (except critical ones)
                        if (!errorMessage.includes('QR code parse error')) {
                            console.log(`QR Scan error: ${errorMessage}`);
                        }
                    }
                ).then(() => {
                    console.log('QR Scanner started successfully');
                }).catch(err => {
                    console.log('QR Scanner initialization failed:', err);
                    showQRFileFallback();
                });
            } catch (error) {
                console.error('Error creating QR scanner:', error);
                showQRFileFallback();
            }
        } else {
            console.log('html5-qrcode library not loaded');
            showQRFileFallback();
        }
    }, 500);
}

function showQRFileFallback() {
    const qrReaderDiv = document.getElementById('qr-reader');
    qrReaderDiv.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <p>Scanner della fotocamera non disponibile.</p>
            <p>Puoi provare a scansionare un QR code caricando un'immagine:</p>
            <input type="file" id="qr-file" accept="image/*" style="margin: 1rem 0;">
            <button class="btn btn-primary" onclick="scanQRFromFile()">Scansiona da File</button>
        </div>
    `;
    
    // Ripristina il funzionamento del pulsante di chiusura dopo il fallback
    setTimeout(() => {
        const modal = document.getElementById('qr-modal');
        const closeBtn = modal ? modal.querySelector('.close-btn') : null;
        if (closeBtn) {
            // Remove existing event listeners
            closeBtn.onclick = null;
            closeBtn.onmousedown = null;
            closeBtn.ontouchstart = null;
            closeBtn.ontouchend = null;
            
            // Direct action for closing modal - simple and reliable
            const closeAction = function() {
                console.log('Close button activated (fallback mode)');
                const modal = document.getElementById('qr-modal');
                if (modal) {
                    modal.style.display = 'none';
                }
                return false;
            };
            
            // Set up multiple event handlers for maximum compatibility
            closeBtn.onclick = closeAction;
            closeBtn.onmousedown = closeAction;
            closeBtn.ontouchstart = closeAction;
            closeBtn.ontouchend = closeAction;
            
            // Add CSS to ensure button is touchable on mobile
            closeBtn.style.touchAction = 'manipulation';
            closeBtn.style.userSelect = 'none';
            closeBtn.style.webkitUserSelect = 'none';
            closeBtn.style.webkitTouchCallout = 'none';
        }
        
        // Refresh Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }, 100);
}

function scanQRFromFile() {
    const fileInput = document.getElementById('qr-file');
    const file = fileInput.files[0];
    
    if (file) {
        if (typeof Html5Qrcode !== 'undefined') {
            const html5QrCode = new Html5Qrcode("qr-reader");
            html5QrCode.scanFile(file, true)
                .then(decodedText => {
                    console.log(`QR Code from file: ${decodedText}`);
                    handleQRResult(decodedText);
                    closeQRScanner();
                })
                .catch(err => {
                    console.log('QR scan from file failed:', err);
                    showNotification('Impossibile leggere il QR code dall\'immagine', 'error');
                });
        }
    } else {
        showNotification('Seleziona un\'immagine da scansionare', 'warning');
    }
}

function handleQRResult(qrText) {
    const resultDiv = document.getElementById('qr-result');
    
    // Process different types of QR codes
    if (qrText.startsWith('http')) {
        resultDiv.innerHTML = `
            <div style="padding: 1rem; background: #e8f5e8; border-radius: 10px; margin: 1rem 0;">
                <h4>QR Code rilevato!</h4>
                <p>Link trovato: <a href="${qrText}" target="_blank">${qrText}</a></p>
                <button class="btn btn-primary" onclick="window.open('${qrText}', '_blank')">Apri Link</button>
            </div>
        `;
    } else if (qrText.includes('monument:')) {
        // Handle monument-specific QR codes - switch to monument tab and expand specific monument
        const monumentId = qrText.replace('monument:', '');
        closeQRScanner();
        switchTab('monumenti');
        setTimeout(() => {
            expandMonument(monumentId);
            playAudioGuide(monumentId);
        }, 500);
        showNotification(`Monumento ${monumentId} aperto con audio guida!`, 'success');
        return;
    } else {
        resultDiv.innerHTML = `
            <div style="padding: 1rem; background: #fff3cd; border-radius: 10px; margin: 1rem 0;">
                <h4>QR Code rilevato!</h4>
                <p>Contenuto: ${qrText}</p>
            </div>
        `;
    }
    
    showNotification('QR Code scansionato con successo!', 'success');
}

function showMonumentInfo(monumentId) {
    const monuments = {
        'san-basilio': {
            name: 'Chiesa Madre di San Basilio',
            info: 'Costruita nel XVIII secolo, è il centro spirituale di Regalbuto.',
            audio: 'san-basilio-guide.mp3'
        },
        'santantonio': {
            name: 'Convento di Sant\'Antonio',
            info: 'Complesso monastico del XVI secolo con vista panoramica.',
            audio: 'santantonio-guide.mp3'
        }
    };
    
    const monument = monuments[monumentId];
    if (monument) {
        const resultDiv = document.getElementById('qr-result');
        resultDiv.innerHTML = `
            <div style="padding: 1rem; background: #e8f5e8; border-radius: 10px; margin: 1rem 0;">
                <h4>${monument.name}</h4>
                <p>${monument.info}</p>
                <button class="btn btn-primary" onclick="playAudioGuide('${monumentId}')">
                    <i data-feather="headphones"></i>
                    Ascolta Audio Guida
                </button>
            </div>
        `;
        feather.replace();
    }
}

// Flag to prevent multiple close operations
let isClosingQRScanner = false;

function closeQRScanner() {
    // Prevent multiple simultaneous close operations
    if (isClosingQRScanner) {
        return;
    }
    isClosingQRScanner = true;
    
    console.log('Closing QR Scanner...');
    
    // Stop the QR scanner if it exists
    if (qrScanner) {
        try {
            qrScanner.stop().then(() => {
                if (qrScanner && typeof qrScanner.clear === 'function') {
                    qrScanner.clear();
                }
                qrScanner = null;
            }).catch(err => {
                console.log('Error stopping QR scanner:', err);
                qrScanner = null;
            });
        } catch (error) {
            console.log('Error in QR scanner cleanup:', error);
            qrScanner = null;
        }
    }
    
    // Hide the modal
    const modal = document.getElementById('qr-modal');
    if (modal) {
        modal.style.display = 'none';
        console.log('Modal hidden');
    }
    
    // Clear the content
    const qrReaderDiv = document.getElementById('qr-reader');
    const qrResultDiv = document.getElementById('qr-result');
    
    if (qrReaderDiv) {
        qrReaderDiv.innerHTML = '';
    }
    if (qrResultDiv) {
        qrResultDiv.innerHTML = '';
    }
    
    // Reset the flag after a short delay
    setTimeout(() => {
        isClosingQRScanner = false;
    }, 500);
}

// Monument Functions
function toggleMonument(monumentId) {
    const content = document.getElementById(`content-${monumentId}`);
    const monumentCard = content ? content.closest('.monument-card') : null;
    const expandBtn = monumentCard ? monumentCard.querySelector('.expand-btn') : null;
    
    if (content) {
        const isExpanded = content.classList.contains('expanded');
        
        // Close all other monuments
        document.querySelectorAll('.monument-expanded-content').forEach(otherContent => {
            if (otherContent.id !== `content-${monumentId}`) {
                otherContent.classList.remove('expanded');
            }
        });
        
        document.querySelectorAll('.expand-btn').forEach(otherBtn => {
            if (otherBtn !== expandBtn) {
                otherBtn.classList.remove('expanded');
            }
        });
        
        // Toggle current monument
        if (isExpanded) {
            content.classList.remove('expanded');
            if (expandBtn) expandBtn.classList.remove('expanded');
        } else {
            content.classList.add('expanded');
            if (expandBtn) expandBtn.classList.add('expanded');
        }
        
        // Refresh icons after DOM changes
        setTimeout(() => {
            feather.replace();
        }, 100);
        
        console.log(`Toggled monument: ${monumentId}`);
    }
}

function expandMonument(monumentId) {
    const content = document.getElementById(`content-${monumentId}`);
    const arrow = document.getElementById(`arrow-${monumentId}`);
    
    if (content && arrow) {
        content.classList.add('expanded');
        arrow.classList.add('rotated');
        
        // Scroll to the monument
        const monumentElement = content.closest('.monument-accordion');
        if (monumentElement) {
            monumentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Refresh icons
        setTimeout(() => {
            feather.replace();
        }, 100);
        
        console.log(`Expanded monument: ${monumentId}`);
    }
}

// Audio Guide Functions
function playAudioGuide(monumentId) {
    const audioPlayer = document.getElementById('audio-player');
    
    // Audio guide URLs - add new monuments
    const audioGuides = {
        'san-basilio': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        'santantonio': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        'purgatorio': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        'san-giovanni': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        'torre-orologio': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        'cinema-capitol': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        'museo-civico': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        'lago-pozzillo': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        'parco-avventura': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        'punto-panoramico': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        'san-calogero': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        'tecnopolo': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        'monumento-caduti': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
    };
    
    const audioUrl = audioGuides[monumentId];
    
    if (audioUrl) {
        audioPlayer.src = audioUrl;
        audioPlayer.style.display = 'block';
        audioPlayer.play().catch(err => {
            console.log('Audio play failed:', err);
            showNotification('Audio guida non disponibile al momento', 'warning');
        });
        
        showNotification(`Riproduzione audio guida in corso...`, 'info');
    } else {
        showNotification('Audio guida non disponibile per questo monumento', 'warning');
    }
}

// Map Initialization and Management Functions
function initializeMap() {
    // Initialize map only when needed to avoid loading issues
    setTimeout(() => {
        if (!map && document.getElementById('osm-map')) {
            try {
                createMap();
            } catch (error) {
                console.error('Error initializing map:', error);
                showNotification('Errore nel caricamento della mappa', 'warning');
            }
        }
    }, 100);
}

function createMap() {
    // Create map centered on Regalbuto
    map = L.map('osm-map', {
        // Disable scroll zoom by default to prevent conflicts
        scrollWheelZoom: false,
        // Enable zoom on map focus
        zoomControl: true,
        // Smooth zoom animation
        zoomAnimation: true,
        // Prevent map from capturing all scroll events
        touchZoom: 'center'
    }).setView([37.6395, 14.6351], 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(map);
    
    // Get the hint element
    const hint = document.querySelector('.map-interaction-hint');
    
    // Enable scroll zoom when map is focused
    map.on('focus', function() {
        map.scrollWheelZoom.enable();
        if (hint) hint.style.opacity = '0';
    });
    
    // Disable scroll zoom when map loses focus
    map.on('blur', function() {
        map.scrollWheelZoom.disable();
    });
    
    // Enable scroll zoom on click and hide hint
    map.on('click', function() {
        map.scrollWheelZoom.enable();
        if (hint) {
            hint.style.opacity = '0';
            setTimeout(() => {
                if (hint) hint.style.display = 'none';
            }, 300);
        }
        setTimeout(() => {
            map.scrollWheelZoom.disable();
        }, 5000); // Disable after 5 seconds
    });
    
    // Hide hint on any map interaction
    map.on('zoomstart movestart', function() {
        if (hint) {
            hint.style.opacity = '0';
            setTimeout(() => {
                if (hint) hint.style.display = 'none';
            }, 300);
        }
    });
    
    // Add all markers initially
    addAllMarkers();
    
    console.log('Map initialized successfully');
}

function addAllMarkers() {
    // Clear existing markers
    clearMarkers();
    
    // Define locations with coordinates and categories
    const locations = [
        {
            id: 'lago-pozzillo',
            name: 'Lago Pozzillo',
            coords: [37.6587117, 14.5975772],
            category: 'natura',
            description: 'Bacino artificiale con attività ricreative',
            icon: '🏞️'
        },
        {
            id: 'parco-avventura',
            name: 'Parco Avventura Pozzillo',
            coords: [37.6589778, 14.6188852],
            category: 'natura',
            description: 'Percorsi acrobatici nella natura',
            icon: '🌲'
        },
        {
            id: 'san-basilio',
            name: 'Chiesa di San Basilio',
            coords: [37.6526434, 14.6408936],
            category: 'cultura',
            description: 'Principale edificio religioso della città',
            icon: '⛪'
        },
        {
            id: 'santantonio',
            name: 'Convento di Sant\'Antonio',
            coords: [37.6731697, 14.6452891],
            category: 'cultura',
            description: 'Antico convento in zona rurale',
            icon: '🏛️'
        },
        {
            id: 'purgatorio',
            name: 'Chiesa del Purgatorio',
            coords: [37.6526434, 14.6408936],
            category: 'cultura',
            description: 'Arte barocca e devozione popolare',
            icon: '⛪'
        },
        {
            id: 'tecnopolo',
            name: 'Tecnopolo Magnetico',
            coords: [37.6555295, 14.6282223],
            category: 'tecnologia',
            description: 'Centro di innovazione e formazione ICT',
            icon: '💻'
        },
        {
            id: 'calvario',
            name: 'Monte Calvario',
            coords: [37.6264741, 14.7434425],
            category: 'cultura',
            description: 'Sito religioso con vista panoramica',
            icon: '⛰️'
        }
    ];
    
    // Add markers for each location
    locations.forEach(location => {
        const marker = L.marker(location.coords)
            .bindPopup(`
                <div style="text-align: center; min-width: 200px;">
                    <h4 style="margin: 0 0 8px 0; color: #2c3e50;">${location.icon} ${location.name}</h4>
                    <p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">${location.description}</p>
                    <button onclick="openMapLocation('${location.id}')" 
                            style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        🗺️ Portami lì
                    </button>
                </div>
            `)
            .addTo(map);
        
        // Store marker with its category for filtering
        marker.category = location.category;
        marker.locationId = location.id;
        markers.push(marker);
    });
}

function clearMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];
}

function filterMarkersBy(category) {
    if (!map || !markers) return;
    
    markers.forEach(marker => {
        if (category === 'all' || marker.category === category) {
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }
        } else {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        }
    });
    
    // Adjust map view based on visible markers
    if (category !== 'all') {
        const visibleMarkers = markers.filter(marker => 
            marker.category === category && map.hasLayer(marker)
        );
        if (visibleMarkers.length > 0) {
            const group = new L.featureGroup(visibleMarkers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
    } else {
        // Show all markers - reset to default view
        map.setView([37.6395, 14.6351], 13);
    }
}

// Map Location Functions
function filterMapLocations(category) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
    
    // Filter location cards
    const locationCards = document.querySelectorAll('.location-card');
    locationCards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Filter map markers
    if (map) {
        filterMarkersBy(category);
    }
    
    showNotification(`Filtro applicato: ${getCategoryDisplayName(category)}`, 'success');
}

function getCategoryDisplayName(category) {
    const names = {
        'all': 'Tutti i luoghi',
        'natura': 'Natura e Paesaggio',
        'cultura': 'Cultura e Storia',
        'tecnologia': 'Tecnologia'
    };
    return names[category] || category;
}

function openMapLocation(monumentId) {
    // Define Google Maps URLs that open the native app with coordinates
    const mapUrls = {
        'lago-pozzillo': 'https://maps.google.com/maps?q=37.6587117,14.5975772&ll=37.6587117,14.5975772&z=16',
        'parco-avventura': 'https://maps.google.com/maps?q=37.6589778,14.6188852&ll=37.6589778,14.6188852&z=16',
        'san-basilio': 'https://maps.google.com/maps?q=37.6526434,14.6408936&ll=37.6526434,14.6408936&z=17',
        'santantonio': 'https://maps.google.com/maps?q=37.6731697,14.6452891&ll=37.6731697,14.6452891&z=16',
        'calvario': 'https://maps.google.com/maps?q=37.6264741,14.7434425&ll=37.6264741,14.7434425&z=15',
        'tecnopolo': 'https://maps.google.com/maps?q=37.6555295,14.6282223&ll=37.6555295,14.6282223&z=17',
        'purgatorio': 'https://maps.google.com/maps?q=37.6526434,14.6408936&ll=37.6526434,14.6408936&z=17',
        'monumento-caduti': 'https://maps.google.com/maps?q=37.6496168,14.6407503&ll=37.6496168,14.6407503&z=17',
        'default': 'https://maps.google.com/maps?q=37.6395,14.6351&ll=37.6395,14.6351&z=14'
    };
    
    const url = mapUrls[monumentId] || mapUrls['default'];
    
    // Open in a new window/tab to trigger the Maps app
    window.open(url, '_blank', 'noopener,noreferrer');
    
    showNotification('Apertura Google Maps...', 'info');
}

// Featured Card Functions (Home Page)
function toggleFeaturedCard(cardId) {
    const expandedInfo = document.getElementById(`expanded-${cardId}`);
    const expandBtn = document.getElementById(`expand-${cardId}`);
    
    if (expandedInfo && expandBtn) {
        const isExpanded = expandedInfo.classList.contains('expanded');
        
        // Close all other featured cards
        document.querySelectorAll('.card-expanded-info').forEach(otherInfo => {
            if (otherInfo.id !== `expanded-${cardId}`) {
                otherInfo.classList.remove('expanded');
            }
        });
        
        document.querySelectorAll('.card-expand-btn').forEach(otherBtn => {
            if (otherBtn.id !== `expand-${cardId}`) {
                otherBtn.classList.remove('expanded');
            }
        });
        
        // Toggle current card
        if (isExpanded) {
            expandedInfo.classList.remove('expanded');
            expandBtn.classList.remove('expanded');
        } else {
            expandedInfo.classList.add('expanded');
            expandBtn.classList.add('expanded');
        }
        
        // Refresh icons after DOM changes
        setTimeout(() => {
            feather.replace();
        }, 100);
        
        console.log(`Toggled featured card: ${cardId}`);
    }
}

// Quiz Functions
function initializeQuiz() {
    currentQuizQuestion = 1;
    quizAnswers = {};
    updateQuizDisplay();
}

function startQuiz() {
    document.getElementById('quiz-intro').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
    currentQuizQuestion = 1;
    quizAnswers = {};
    updateQuizDisplay();
    showNotification('Quiz avviato! Buona fortuna!', 'info');
}

function updateQuizDisplay() {
    // Hide all questions
    const questions = document.querySelectorAll('.quiz-question');
    questions.forEach(q => q.classList.remove('active'));
    
    // Show current question
    const currentQuestion = document.querySelector(`[data-question="${currentQuizQuestion}"]`);
    if (currentQuestion) {
        currentQuestion.classList.add('active');
    }
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    prevBtn.style.display = currentQuizQuestion > 1 ? 'inline-flex' : 'none';
    
    if (currentQuizQuestion < 10) {
        nextBtn.style.display = 'inline-flex';
        submitBtn.style.display = 'none';
    } else {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-flex';
    }
}

function nextQuestion() {
    // Save current answer
    const currentQuestionDiv = document.querySelector(`[data-question="${currentQuizQuestion}"]`);
    const selectedAnswer = currentQuestionDiv.querySelector('input[type="radio"]:checked');
    
    if (!selectedAnswer) {
        showNotification('Seleziona una risposta prima di continuare', 'warning');
        return;
    }
    
    quizAnswers[`q${currentQuizQuestion}`] = selectedAnswer.value;
    
    if (currentQuizQuestion < 10) {
        currentQuizQuestion++;
        updateQuizDisplay();
    }
}

function previousQuestion() {
    if (currentQuizQuestion > 1) {
        currentQuizQuestion--;
        updateQuizDisplay();
    }
}

function submitQuiz() {
    // Save last answer
    const currentQuestionDiv = document.querySelector(`[data-question="${currentQuizQuestion}"]`);
    const selectedAnswer = currentQuestionDiv.querySelector('input[type="radio"]:checked');
    
    if (!selectedAnswer) {
        showNotification('Seleziona una risposta prima di inviare', 'warning');
        return;
    }
    
    quizAnswers[`q${currentQuizQuestion}`] = selectedAnswer.value;
    
    // Calculate score with new correct answers
    const correctAnswers = { 
        q1: 'b', q2: 'b', q3: 'b', q4: 'b', q5: 'b', 
        q6: 'b', q7: 'c', q8: 'b', q9: 'b', q10: 'c' 
    };
    let score = 0;
    
    for (let q in correctAnswers) {
        if (quizAnswers[q] === correctAnswers[q]) {
            score++;
        }
    }
    
    // Show results
    document.getElementById('quiz-container').style.display = 'none';
    const resultDiv = document.getElementById('quiz-result');
    const scoreText = document.getElementById('quiz-score');
    
    let message = '';
    if (score >= 9) {
        message = 'Perfetto! Conosci molto bene Regalbuto!';
    } else if (score >= 7) {
        message = 'Molto bene! Hai una buona conoscenza della città.';
    } else if (score >= 5) {
        message = 'Discreto! Conosci alcuni aspetti di Regalbuto.';
    } else if (score >= 3) {
        message = 'Non male, ma potresti studiare un po\' di più!';
    } else {
        message = 'Sembra che tu debba esplorare meglio Regalbuto!';
    }
    
    scoreText.textContent = `Hai risposto correttamente a ${score} su 10 domande. ${message}`;
    resultDiv.style.display = 'block';
}

function restartQuiz() {
    document.getElementById('quiz-result').style.display = 'none';
    document.getElementById('quiz-intro').style.display = 'block';
    document.getElementById('quiz-container').style.display = 'none';
    
    // Clear all answers
    const radioButtons = document.querySelectorAll('.quiz-question input[type="radio"]');
    radioButtons.forEach(radio => radio.checked = false);
    
    currentQuizQuestion = 1;
    quizAnswers = {};
    showNotification('Quiz riavviato!', 'info');
}

// Virtual Tour Functions
function loadLocation(locationId) {
    // Remove active class from all location cards
    const locationCards = document.querySelectorAll('.location-card');
    locationCards.forEach(card => card.classList.remove('active'));
    
    // Add active class to selected location
    const selectedCard = event.target.closest('.location-card');
    if (selectedCard) {
        selectedCard.classList.add('active');
    }
    
    // Location URLs for virtual tours
    const locations = {
        'convento': 'https://kuula.co/share/collection/7l2K7?logo=1&info=1&fs=1&vr=1&sd=1&thumbs=1',
        'santa-maria-croce': 'https://kuula.co/share/hdWFx?logo=1&info=1&fs=1&vr=1&zoom=1&autorotate=0.22&thumbs=1&inst=it&gyro=1&cc=1',
        'chiesa-madre': 'https://kuula.co/share/collection/7l2K7?logo=1&info=1&fs=1&vr=1&sd=1&thumbs=1',
        'panorama': 'https://kuula.co/share/collection/7l2K7?logo=1&info=1&fs=1&vr=1&sd=1&thumbs=1',
        'piazza': 'https://kuula.co/share/collection/7l2K7?logo=1&info=1&fs=1&vr=1&sd=1&thumbs=1',
        'monumento-caduti': 'panoramas/panorama.html?img=https://tecnopanoramas.blob.core.windows.net/panoramas/caduti.jpg'
    };
    
    const iframe = document.querySelector('#pano-viewer iframe');
    if (iframe && locations[locationId]) {
        iframe.src = locations[locationId];
        showNotification(`Caricamento ${locationId}...`, 'info');
    }
    
    console.log(`Loading virtual tour location: ${locationId}`);
}

function toggleFullscreen() {
    const viewer = document.getElementById('pano-viewer');
    
    if (!document.fullscreenElement) {
        viewer.requestFullscreen().then(() => {
            showNotification('Modalità schermo intero attivata', 'info');
        }).catch(err => {
            console.log('Fullscreen failed:', err);
            showNotification('Impossibile attivare schermo intero', 'error');
        });
    } else {
        document.exitFullscreen().then(() => {
            showNotification('Schermo intero disattivato', 'info');
        });
    }
}

function toggleVRMode() {
    const iframe = document.querySelector('#pano-viewer iframe');
    const vrBtn = document.querySelector('.btn[onclick="toggleVRMode()"]');
    
    if (iframe) {
        let src = iframe.src;
        let isVRMode = src.includes('vr=1');
        
        // Check if it's a single tour (Santa Maria della Croce)
        let isSingleTour = src.includes('hdWFx');
        
        if (isVRMode) {
            // Disable VR mode
            src = src.replace('vr=1', 'vr=0');
            if (vrBtn) {
                vrBtn.innerHTML = '<i data-feather="eye"></i> Modalità VR';
                vrBtn.classList.remove('btn-primary');
                vrBtn.classList.add('btn-outline');
            }
            showNotification('Modalità VR disattivata', 'info');
        } else {
            // Enable VR mode
            src = src.replace('vr=0', 'vr=1');
            if (vrBtn) {
                vrBtn.innerHTML = '<i data-feather="eye"></i> VR Attiva';
                vrBtn.classList.remove('btn-outline');
                vrBtn.classList.add('btn-primary');
            }
            
            if (isSingleTour) {
                showNotification('Modalità VR attivata! Cerca l\'icona VR nell\'angolo in basso a destra del tour.', 'success');
            } else {
                showNotification('Modalità VR attivata! Cerca l\'icona VR nel tour.', 'success');
            }
        }
        
        // Force iframe reload by temporarily changing src
        iframe.src = 'about:blank';
        setTimeout(() => {
            iframe.src = src;
            // Re-initialize feather icons for the updated button
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        }, 100);
    }
}

function resetView() {
    const iframe = document.querySelector('#pano-viewer iframe');
    if (iframe) {
        // Reload the iframe to reset view
        const src = iframe.src;
        iframe.src = '';
        setTimeout(() => {
            iframe.src = src;
        }, 100);
        showNotification('Vista ripristinata', 'info');
    }
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 2rem;
                right: 2rem;
                z-index: 1000;
                max-width: 400px;
                padding: 1rem;
                border-radius: 10px;
                color: white;
                font-weight: 500;
                animation: slideIn 0.3s ease-out;
            }
            .notification.info { background: #3498db; }
            .notification.success { background: #27ae60; }
            .notification.warning { background: #f39c12; }
            .notification.error { background: #e74c3c; }
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
            }
            .notification button {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @media (max-width: 768px) {
                .notification {
                    top: 1rem;
                    right: 1rem;
                    left: 1rem;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
    
    console.log(`Notification: ${message} (${type})`);
}

// Event Listeners
document.addEventListener('click', function(e) {
    // Close modal when clicking outside
    if (e.target.classList.contains('modal')) {
        closeQRScanner();
    }
});

// Handle back button for mobile
window.addEventListener('popstate', function(e) {
    // You can add navigation state management here if needed
    console.log('Navigation state changed');
});

// Handle orientation change for mobile
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        feather.replace();
    }, 500);
});

// Handle online/offline status
window.addEventListener('online', function() {
    showNotification('Connessione ripristinata', 'success');
});

window.addEventListener('offline', function() {
    showNotification('Connessione assente - alcune funzioni potrebbero non funzionare', 'warning');
});

// Debug helpers
function debugApp() {
    console.log('=== Regalbuto Heritage Debug Info ===');
    console.log('Current tab:', document.querySelector('.nav-item.active')?.dataset.tab);
    console.log('Quiz answers:', quizAnswers);
    console.log('Current quiz question:', currentQuizQuestion);
    console.log('QR Scanner active:', !!qrScanner);
    console.log('========================================');
}

// Make debug function available globally
window.debugApp = debugApp;

// Global event delegation for QR modal close button
document.addEventListener('click', function(e) {
    // Check if clicked element is the QR close button
    if (e.target && (e.target.id === 'qr-close-btn' || e.target.closest('#qr-close-btn'))) {
        console.log('Global close button clicked');
        e.preventDefault();
        e.stopPropagation();
        closeQRScanner();
        return false;
    }
});

// Additional event listeners for touch devices
document.addEventListener('touchend', function(e) {
    if (e.target && (e.target.id === 'qr-close-btn' || e.target.closest('#qr-close-btn'))) {
        console.log('Global close button touched');
        e.preventDefault();
        e.stopPropagation();
        closeQRScanner();
        return false;
    }
});

// Backup initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Feather icons for the modal
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
});

console.log('Regalbuto Heritage - Script loaded successfully');
