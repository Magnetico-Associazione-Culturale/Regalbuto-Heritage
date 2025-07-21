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
    
    // Manage VR button visibility
    manageVRButtonVisibility();
    
    // Initialize map when in map section
    initializeMap();
    
    // Load monuments from JSON data
    loadMonumentsFromJSON();
    
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
        let matchesFilter = false;
        
        if (currentFilter === 'all') {
            matchesFilter = true;
        } else {
            // Check if the category matches the current filter
            matchesFilter = category === currentFilter;
        }
        
        if (matchesSearch && matchesFilter) {
            monument.style.display = 'block';
            visibleCount++;
        } else {
            monument.style.display = 'none';
        }
    });
    
    // Hide/show category sections based on whether they have visible monuments
    const categorySection = document.querySelectorAll('.monuments-category');
    categorySection.forEach(section => {
        const monumentsInSection = section.querySelectorAll('.monument-card');
        let hasVisibleMonuments = false;
        
        monumentsInSection.forEach(monument => {
            const style = window.getComputedStyle(monument);
            if (style.display !== 'none') {
                hasVisibleMonuments = true;
            }
        });
        
        if (hasVisibleMonuments) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
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
        'church': 'patrimonio-religioso',
        'convent': 'patrimonio-religioso',
        'palace': 'architettura-civile',
        'civic': 'architettura-civile',
        'educational': 'educazione',
        'theater': 'cultura-spettacolo',
        'financial': 'istituzioni-finanziarie',
        'technology': 'tecnologia'
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

function initializeMonumentCounter() {
    const monuments = document.querySelectorAll('.monument-card');
    let visibleCount = 0;
    
    // Ensure all category sections are visible by default
    const categorySection = document.querySelectorAll('.monuments-category');
    categorySection.forEach(section => {
        section.style.display = 'block';
    });
    
    monuments.forEach(monument => {
        const computedStyle = window.getComputedStyle(monument);
        if (computedStyle.display !== 'none') {
            visibleCount++;
        }
    });
    
    updateResultsCount(visibleCount);
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
    
    // Manage header visibility for home section
    if (tabName === 'home') {
        document.body.classList.add('home-active');
    } else {
        document.body.classList.remove('home-active');
    }
    
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
        
        // Initialize GPS map if switching to navigation tab
        if (tabName === 'navigazione') {
            initializeGPSMap();
        }
        
        // Manage VR button visibility when switching to virtual tour
        if (tabName === 'virtual-tour') {
            console.log('Switching to virtual-tour tab');
            manageVRButtonVisibility();
            
            // Load Convento di Sant'Antonio as default tour
            setTimeout(() => {
                console.log('Starting default tour load...');
                
                // Hide loading message
                const loadingMessage = document.getElementById('loading-message');
                if (loadingMessage) {
                    console.log('Hiding loading message');
                    loadingMessage.style.display = 'none';
                } else {
                    console.log('Loading message not found');
                }
                
                // Find and activate the convento-sant-antonio card
                const conventoCard = document.querySelector('[onclick*="loadVirtualTour(\'convento-sant-antonio\')"]');
                console.log('Found convento card:', !!conventoCard);
                
                if (conventoCard) {
                    // Remove active class from all cards
                    document.querySelectorAll('.location-card').forEach(card => card.classList.remove('active'));
                    // Add active class to convento card
                    conventoCard.classList.add('active');
                    console.log('Activated convento card');
                }
                
                // Load the virtual tour
                console.log('Loading virtual tour: convento-sant-antonio');
                loadVirtualTour('convento-sant-antonio');
            }, 300);
        }
        
        // Initialize monument counter when switching to monuments tab
        if (tabName === 'monumenti') {
            initializeMonumentCounter();
        }
    }, 100);
    
    console.log(`Switched to tab: ${tabName}`);
}

// Hero Section Functions
function startTour() {
    switchTab('virtual-tour');
    // Removed notification
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
let currentAudioPlayer = null;
let currentAudioInstance = null;
let audioUpdateInterval = null;
let activeAudioPlayers = new Set();

function playAudioGuide(monumentId) {
    // Stop event propagation if called from within a card
    if (event && event.stopPropagation) {
        event.stopPropagation();
    }
    
    // Find the button that was clicked
    const button = event.target.closest('.btn');
    if (!button) return;
    
    // Stop all other active audio players
    stopAllAudioPlayers();
    
    // Get or create audio player container
    let playerContainer = button.parentElement.querySelector('.audio-player-container');
    
    if (!playerContainer) {
        // Create new audio player
        playerContainer = createAudioPlayer(monumentId);
        
        // Replace the button with the player
        button.parentElement.replaceChild(playerContainer, button);
        
        // Track this player
        activeAudioPlayers.add(playerContainer);
    }
    
    // Initialize audio playback
    initializeAudioPlayback(monumentId, playerContainer);
}

function stopAllAudioPlayers() {
    // Stop current audio instance
    if (currentAudioInstance) {
        currentAudioInstance.pause();
        currentAudioInstance = null;
    }
    
    // Clear intervals
    if (audioUpdateInterval) {
        clearInterval(audioUpdateInterval);
        audioUpdateInterval = null;
    }
    
    // Reset all tracked players
    activeAudioPlayers.forEach(player => {
        const playPauseBtn = player.querySelector('.play-pause');
        if (playPauseBtn) {
            playPauseBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
            `;
            playPauseBtn.title = 'Play';
        }
    });
    
    currentAudioPlayer = null;
}

function createAudioPlayer(monumentId) {
    const container = document.createElement('div');
    container.className = 'audio-player-container';
    container.dataset.monumentId = monumentId;
    
    // Get monument name for display
    const monumentName = getMonumentDisplayName(monumentId);
    
    container.innerHTML = `
        <button class="audio-control-btn close-player-btn" onclick="event.stopPropagation(); restoreOriginalButton(this.closest('.audio-player-container'))">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
        <div class="audio-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
            </svg>
            ${monumentName}
        </div>
        <div class="audio-controls-row">
            <button class="audio-control-btn backward" onclick="event.stopPropagation(); seekAudio(-15)" title="Indietro 15 secondi">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="19 20 9 12 19 4 19 20"></polygon>
                    <line x1="5" y1="19" x2="5" y2="5"></line>
                </svg>
            </button>
            <button class="audio-control-btn play-pause" onclick="event.stopPropagation(); toggleAudioPlayback()" title="Play/Pausa">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
            </button>
            <button class="audio-control-btn forward" onclick="event.stopPropagation(); seekAudio(15)" title="Avanti 15 secondi">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 4 15 12 5 20 5 4"></polygon>
                    <line x1="19" y1="5" x2="19" y2="19"></line>
                </svg>
            </button>
        </div>
        <div class="audio-progress-container">
            <span class="audio-time current-time">0:00</span>
            <div class="audio-progress-bar" onclick="event.stopPropagation(); seekToPosition(event)">
                <div class="audio-progress-fill"></div>
            </div>
            <span class="audio-time total-time">0:00</span>
        </div>
        <div class="audio-loading" style="display: none;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            Caricamento audio...
        </div>
        <div class="audio-error" style="display: none;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Errore nel caricamento
        </div>
    `;
    
    return container;
}

function getMonumentDisplayName(monumentId) {
    const displayNames = {
        'san-basilio': 'Chiesa di San Basilio',
        'santantonio': 'Convento di Sant\'Antonio',
        'purgatorio': 'Chiesa del Purgatorio',
        'santa-maria-croce': 'Chiesa di Santa Maria della Croce',
        'san-agostino': 'Chiesa di San Agostino',
        'monumento-caduti': 'Monumento ai Caduti',
        'teatro-urania': 'Teatro Urania',
        'lago-pozzillo': 'Lago Pozzillo',
        'parco-avventura': 'Parco Avventura',
        'tecnopolo': 'Tecnopolo Magnetico',
        'chiesa-santa-maria-la-croce': 'Chiesa di Santa Maria della Croce',
        'chiesa-san-basilio': 'Chiesa di San Basilio',
        'cine-teatro-urania': 'Teatro Urania',
        'convento-sant-agostino': 'Convento di Sant\'Agostino'
    };
    
    return displayNames[monumentId] || monumentId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function initializeAudioPlayback(monumentId, playerContainer) {
    // Stop any currently playing audio
    if (currentAudioInstance) {
        currentAudioInstance.pause();
        currentAudioInstance = null;
    }
    
    // Clear any existing interval
    if (audioUpdateInterval) {
        clearInterval(audioUpdateInterval);
    }
    
    // Set current player
    currentAudioPlayer = playerContainer;
    
    // Load audio guide data from monuments.json
    loadAudioGuideData(monumentId, playerContainer);
}

async function loadAudioGuideData(monumentId, playerContainer) {
    try {
        const response = await fetch('data/monuments.json');
        const monuments = await response.json();
        
        // Find the monument
        let monument = monuments.find(m => m.id === monumentId);
        
        if (monument && monument.audio && monument.audio.path) {
            const audioUrl = monument.audio.path;
            initializeAudioWithUrl(audioUrl, playerContainer, monument.audio);
        } else {
            // Try alternative ID mappings
            const idMappings = {
                'san-basilio': 'chiesa-san-basilio',
                'san-agostino': 'convento-sant-agostino',
                'teatro-urania': 'cine-teatro-urania',
                'purgatorio': 'chiesa-san-rocco',
                'santa-maria-croce': 'chiesa-santa-maria-la-croce',
                'santantonio': 'convento-sant-antonio'
            };
            
            const alternativeId = idMappings[monumentId];
            const alternativeMonument = alternativeId ? monuments.find(m => m.id === alternativeId) : null;
            
            if (alternativeMonument && alternativeMonument.audio && alternativeMonument.audio.path) {
                const audioUrl = alternativeMonument.audio.path;
                initializeAudioWithUrl(audioUrl, playerContainer, alternativeMonument.audio);
            } else {
                // Fallback to default audio guides
                const defaultAudioGuides = {
                    'san-basilio': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                    'santantonio': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                    'purgatorio': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                    'santa-maria-croce': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                    'san-agostino': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                    'monumento-caduti': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                    'teatro-urania': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                    'lago-pozzillo': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                    'parco-avventura': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                    'tecnopolo': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                    'chiesa-santa-maria-la-croce': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
                };
                
                const audioUrl = defaultAudioGuides[monumentId];
                
                if (audioUrl) {
                    initializeAudioWithUrl(audioUrl, playerContainer, { 
                        description: `Audio guida per ${monumentId}`,
                        duration: null 
                    });
                } else {
                    showAudioError(playerContainer, true);
                    // Removed notification
                }
            }
        }
    } catch (error) {
        console.error('Errore nel caricamento dati audio:', error);
        showAudioError(playerContainer, true);
        // Removed notification
    }
}

function initializeAudioWithUrl(audioUrl, playerContainer, audioInfo) {
    showAudioLoading(playerContainer, true);
    
    // First, check if the audio file exists and has content
    fetch(audioUrl, { method: 'HEAD' })
        .then(response => {
            if (!response.ok || response.headers.get('content-length') === '0') {
                throw new Error('File is empty or not found');
            }
            return response;
        })
        .then(() => {
            // File exists and has content, proceed with normal audio loading
            loadRealAudio(audioUrl, playerContainer, audioInfo);
        })
        .catch(error => {
            console.log('Audio file issue:', error.message);
            console.log('Generating test audio for:', audioUrl);
            
            // Generate test audio as fallback
            generateTestAudio(playerContainer, audioInfo);
        });
}

function loadRealAudio(audioUrl, playerContainer, audioInfo) {
    // Create new audio instance
    currentAudioInstance = new Audio(audioUrl);
    
    // Set up event listeners
    currentAudioInstance.addEventListener('loadedmetadata', () => {
        showAudioLoading(playerContainer, false);
        updateAudioDisplay(playerContainer);
        startAudioUpdateInterval(playerContainer);
        
        // Auto-play immediately after loading
        currentAudioInstance.play().then(() => {
            // Update play button to pause icon
            const playPauseBtn = playerContainer.querySelector('.play-pause');
            if (playPauseBtn) {
                playPauseBtn.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                `;
                playPauseBtn.title = 'Pausa';
            }
        }).catch(err => {
            console.log('Audio play failed:', err);
        });
    });
    
    currentAudioInstance.addEventListener('ended', () => {
        resetAudioPlayer(playerContainer);
    });
    
    currentAudioInstance.addEventListener('error', () => {
        console.log('Audio loading error, fallback to test audio');
        generateTestAudio(playerContainer, audioInfo);
    });
}

function generateTestAudio(playerContainer, audioInfo) {
    try {
        // Create Web Audio API context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Generate a pleasant tone sequence for Chiesa di San Basilio
        const sampleRate = audioContext.sampleRate;
        const duration = 30; // 30 seconds
        const frameCount = sampleRate * duration;
        
        const audioBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        // Create a church bell-like sound with multiple harmonics
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            
            // Create bell sound with fundamental frequency and harmonics
            const fundamental = 440; // A4 note
            const bell = Math.sin(2 * Math.PI * fundamental * t) * Math.exp(-t * 0.3) * 0.3 +
                        Math.sin(2 * Math.PI * fundamental * 2 * t) * Math.exp(-t * 0.5) * 0.2 +
                        Math.sin(2 * Math.PI * fundamental * 3 * t) * Math.exp(-t * 0.7) * 0.1;
            
            // Add multiple bell strikes
            let sample = 0;
            for (let strike = 0; strike < 6; strike++) {
                const strikeTime = strike * 5; // Every 5 seconds
                if (t > strikeTime && t < strikeTime + 2) {
                    const relativeTime = t - strikeTime;
                    sample += bell * Math.exp(-relativeTime * 0.5);
                }
            }
            
            channelData[i] = sample * 0.3; // Reduce volume
        }
        
        // Convert to audio data URL
        const audioData = audioBufferToWav(audioBuffer);
        const audioBlob = new Blob([audioData], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create audio element with generated audio
        currentAudioInstance = new Audio(audioUrl);
        
        currentAudioInstance.addEventListener('loadedmetadata', () => {
            showAudioLoading(playerContainer, false);
            updateAudioDisplay(playerContainer);
            startAudioUpdateInterval(playerContainer);
            
            // Auto-play the test audio
            currentAudioInstance.play().then(() => {
                const playPauseBtn = playerContainer.querySelector('.play-pause');
                if (playPauseBtn) {
                    playPauseBtn.innerHTML = `
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                    `;
                    playPauseBtn.title = 'Pausa';
                }
            });
        });
        
        currentAudioInstance.addEventListener('ended', () => {
            resetAudioPlayer(playerContainer);
            URL.revokeObjectURL(audioUrl); // Clean up
        });
        
        console.log('Test audio generated successfully for Chiesa di San Basilio');
        
    } catch (error) {
        console.error('Error generating test audio:', error);
        showAudioError(playerContainer, true);
    }
}

// Helper function to convert AudioBuffer to WAV
function audioBufferToWav(buffer) {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert samples to 16-bit PCM
    const samples = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
    }
    
    return arrayBuffer;
}

function toggleAudioPlayback() {
    if (!currentAudioInstance || !currentAudioPlayer) return;
    
    const playPauseBtn = currentAudioPlayer.querySelector('.play-pause');
    
    if (currentAudioInstance.paused) {
        currentAudioInstance.play();
        playPauseBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
        `;
        playPauseBtn.title = 'Pausa';
    } else {
        currentAudioInstance.pause();
        playPauseBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;
        playPauseBtn.title = 'Play';
    }
}

function seekAudio(seconds) {
    if (!currentAudioInstance) return;
    
    currentAudioInstance.currentTime = Math.max(0, 
        Math.min(currentAudioInstance.duration, currentAudioInstance.currentTime + seconds)
    );
}

function seekToPosition(event) {
    if (!currentAudioInstance) return;
    
    const progressBar = event.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const percentage = (event.clientX - rect.left) / rect.width;
    
    currentAudioInstance.currentTime = percentage * currentAudioInstance.duration;
}

function updateAudioDisplay(playerContainer) {
    if (!currentAudioInstance || !playerContainer) return;
    
    const currentTime = currentAudioInstance.currentTime;
    const duration = currentAudioInstance.duration;
    
    // Update time displays
    const currentTimeElement = playerContainer.querySelector('.current-time');
    const totalTimeElement = playerContainer.querySelector('.total-time');
    const progressFill = playerContainer.querySelector('.audio-progress-fill');
    
    if (currentTimeElement) {
        currentTimeElement.textContent = formatTime(currentTime);
    }
    
    if (totalTimeElement) {
        totalTimeElement.textContent = formatTime(duration);
    }
    
    if (progressFill) {
        const percentage = (currentTime / duration) * 100;
        progressFill.style.width = `${percentage}%`;
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function startAudioUpdateInterval(playerContainer) {
    audioUpdateInterval = setInterval(() => {
        updateAudioDisplay(playerContainer);
    }, 1000);
}

function resetAudioPlayer(playerContainer) {
    const playPauseBtn = playerContainer.querySelector('.play-pause');
    if (playPauseBtn) {
        playPauseBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;
        playPauseBtn.title = 'Play';
    }
    
    if (audioUpdateInterval) {
        clearInterval(audioUpdateInterval);
        audioUpdateInterval = null;
    }
}

function restoreOriginalButton(playerContainer) {
    const monumentId = playerContainer.dataset.monumentId;
    
    // Stop current audio
    if (currentAudioInstance) {
        currentAudioInstance.pause();
        currentAudioInstance = null;
    }
    
    // Clear interval
    if (audioUpdateInterval) {
        clearInterval(audioUpdateInterval);
        audioUpdateInterval = null;
    }
    
    // Create original button
    const originalButton = document.createElement('button');
    originalButton.className = 'btn btn-primary';
    originalButton.onclick = () => playAudioGuide(monumentId);
    originalButton.innerHTML = `
        <i data-feather="headphones"></i>
        Ascolta Audio Guida
    `;
    
    // Replace player with original button
    playerContainer.parentElement.replaceChild(originalButton, playerContainer);
    
    // Remove from active players
    activeAudioPlayers.delete(playerContainer);
    
    // Re-initialize feather icons
    feather.replace();
    
    // Reset current player reference
    if (currentAudioPlayer === playerContainer) {
        currentAudioPlayer = null;
    }
}

function showAudioLoading(playerContainer, show) {
    const loadingElement = playerContainer.querySelector('.audio-loading');
    const errorElement = playerContainer.querySelector('.audio-error');
    const controls = playerContainer.querySelectorAll('.audio-controls-row, .audio-progress-container');
    
    if (show) {
        loadingElement.style.display = 'flex';
        errorElement.style.display = 'none';
        controls.forEach(el => el.style.display = 'none');
    } else {
        loadingElement.style.display = 'none';
        controls.forEach(el => el.style.display = 'flex');
    }
}

function showAudioError(playerContainer, show) {
    const errorElement = playerContainer.querySelector('.audio-error');
    const loadingElement = playerContainer.querySelector('.audio-loading');
    const controls = playerContainer.querySelectorAll('.audio-controls-row, .audio-progress-container');
    
    if (show) {
        errorElement.style.display = 'flex';
        loadingElement.style.display = 'none';
        controls.forEach(el => el.style.display = 'none');
    } else {
        errorElement.style.display = 'none';
        controls.forEach(el => el.style.display = 'flex');
    }
}

// Map Initialization and Management Functions
function createCustomIcon(category) {
    // Define Font Awesome icon class and color based on category
    let iconClass = '';
    let iconColor = '';
    
    switch(category) {
        case 'church':
            iconClass = 'fas fa-church';
            iconColor = '#8B4513'; // Brown
            break;
        case 'convent':
            iconClass = 'fas fa-place-of-worship';
            iconColor = '#8B4513'; // Brown
            break;
        case 'palace':
            iconClass = 'fas fa-crown';
            iconColor = '#DAA520'; // Goldenrod
            break;
        case 'monument':
            iconClass = 'fas fa-monument';
            iconColor = '#696969'; // DimGray
            break;
        case 'theater':
            iconClass = 'fas fa-theater-masks';
            iconColor = '#DC143C'; // Crimson
            break;
        case 'civic':
            iconClass = 'fas fa-landmark';
            iconColor = '#4682B4'; // SteelBlue
            break;
        case 'educational':
            iconClass = 'fas fa-graduation-cap';
            iconColor = '#4B0082'; // Indigo
            break;
        case 'financial':
            iconClass = 'fas fa-university';
            iconColor = '#228B22'; // ForestGreen
            break;
        default:
            iconClass = 'fas fa-map-marker-alt';
            iconColor = '#666666'; // Gray
            break;
    }
    
    // Create custom HTML icon using Font Awesome
    const iconHtml = `
        <div style="
            background-color: ${iconColor};
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            border: 3px solid white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(-45deg);
            position: relative;
        ">
            <i class="${iconClass}" style="
                color: white;
                font-size: 14px;
                transform: rotate(45deg);
            "></i>
        </div>
    `;
    
    return L.divIcon({
        html: iconHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
        className: 'custom-map-icon'
    });
}

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
    // Create map centered on Regalbuto's historic center
    // Coordinates calculated as average of main historic landmarks:
    // Palazzo Comunale, Monumento ai Caduti, Chiesa Santa Maria la Croce
    map = L.map('osm-map', {
        // Disable scroll zoom by default to prevent conflicts
        scrollWheelZoom: false,
        // Enable zoom on map focus
        zoomControl: true,
        // Smooth zoom animation
        zoomAnimation: true,
        // Prevent map from capturing all scroll events
        touchZoom: 'center'
    }).setView([37.650573, 14.640587], 16);
    
    // Add CartoDB Positron tiles for a beautiful, clean look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
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
    
    // Load monuments data and create markers
    fetch('data/monuments.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(monuments => {
            console.log('Loaded monuments data:', monuments.length, 'monuments');
            monuments.forEach(monument => {
                if (monument.lat && monument.lon) {
                    // Create custom icon based on category
                    const customIcon = createCustomIcon(monument.category);
                    
                    // Check if monument has virtual tour (360° images)
                    const hasVirtualTour = monument.images && monument.images.some(img => img.format === '360');
                    
                    // Check if monument has audio guide
                    const hasAudioGuide = monument.audio && monument.audio.path;
                    
                    // Create enhanced tooltip content
                    const tooltipContent = createEnhancedTooltip(monument, hasVirtualTour, hasAudioGuide);
                    
                    // Create marker with custom icon
                    const marker = L.marker([monument.lat, monument.lon], {
                        icon: customIcon
                    })
                    .bindPopup(tooltipContent, {
                        maxWidth: 300,
                        minWidth: 280,
                        className: 'map-monument-popup',
                        closeButton: true,
                        autoPan: true
                    })
                    .addTo(map);
                    
                    // Add click event listener for debugging
                    marker.on('click', function(e) {
                        console.log('Marker clicked:', monument.name);
                        console.log('Marker position:', monument.lat, monument.lon);
                        // The popup should open automatically, but let's ensure it does
                        marker.openPopup();
                        
                        // Add a small delay to make sure popup is open before adding event listeners
                        setTimeout(() => {
                            // Make sure popup buttons are clickable
                            const popup = marker.getPopup();
                            if (popup && popup._container) {
                                const buttons = popup._container.querySelectorAll('.tooltip-btn');
                                buttons.forEach(btn => {
                                    btn.style.pointerEvents = 'auto';
                                    btn.style.cursor = 'pointer';
                                });
                            }
                        }, 100);
                    });
                    
                    // Store marker with its category for filtering
                    marker.category = monument.category;
                    marker.monumentId = monument.id;
                    markers.push(marker);
                }
            });
            console.log('Added', markers.length, 'markers to map');
        })
        .catch(error => {
            console.error('Error loading monuments data:', error);
            // Fallback to old static data if needed
            console.log('Falling back to static markers');
            addStaticMarkers();
        });
}

function createEnhancedTooltip(monument, hasVirtualTour, hasAudioGuide) {
    // Find thumbnail image with role or fallback to standard format
    let thumbnailImage = null;
    if (monument.images && monument.images.length > 0) {
        // Look for image with role thumbnail first
        thumbnailImage = monument.images.find(img => img.role === 'thumbnail');
        // If no thumbnail role, use first standard format image
        if (!thumbnailImage) {
            thumbnailImage = monument.images.find(img => img.format === 'standard');
        }
        // If still no image, use first available
        if (!thumbnailImage) {
            thumbnailImage = monument.images[0];
        }
    }
    
    // Get category display name for badge
    const categoryDisplayName = getCategoryDisplayName(monument.category);
    
    // Create actions layout based on available features
    let actionsLayout = '';
    if (hasAudioGuide && hasVirtualTour) {
        // Layout with both audio guide and virtual tour
        actionsLayout = `
            <div class="monument-actions has-audio">
                <button class="btn btn-primary" onclick="playAudioGuideFromMap('${monument.id}')">
                    <i class="fas fa-headphones"></i>
                    <span>Ascolta Audio Guida</span>
                </button>
                <div class="secondary-actions">
                    <button class="btn btn-secondary" onclick="openVirtualTourFromMap('${monument.id}')">
                        <i class="fas fa-vr-cardboard"></i>
                        <span>Tour 360°</span>
                    </button>
                </div>
            </div>
        `;
    } else if (hasAudioGuide) {
        // Layout with only audio guide
        actionsLayout = `
            <div class="monument-actions has-audio">
                <button class="btn btn-primary" onclick="playAudioGuideFromMap('${monument.id}')">
                    <i class="fas fa-headphones"></i>
                    <span>Ascolta Audio Guida</span>
                </button>
            </div>
        `;
    } else if (hasVirtualTour) {
        // Layout with only virtual tour
        actionsLayout = `
            <div class="monument-actions">
                <button class="btn btn-primary" onclick="openVirtualTourFromMap('${monument.id}')">
                    <i class="fas fa-vr-cardboard"></i>
                    <span>Tour 360°</span>
                </button>
            </div>
        `;
    } else {
        // Layout with no special features - leave empty
        actionsLayout = '';
    }

    const tooltip = `
        <div class="map-monument-card">
            ${thumbnailImage ? `
                <div class="monument-image">
                    <img src="${thumbnailImage.path}" alt="${thumbnailImage.alt || monument.name}">
                    <div class="monument-category-badge">${categoryDisplayName}</div>
                </div>
            ` : ''}
            <div class="monument-info">
                <h4>${monument.name}</h4>
                <p class="monument-description">${monument.short_description}</p>
                ${actionsLayout}
            </div>
        </div>
    `;
    
    return tooltip;
}

// Function to create enhanced tooltip for GPS checkpoints without monument data
function createCheckpointTooltip(name, coordinates) {
    const tooltip = `
        <div class="map-monument-card">
            <div class="monument-info">
                <h4>${name}</h4>
                <p class="monument-description">Punto dell'itinerario turistico di Regalbuto</p>
                <div class="monument-actions">
                    <button class="btn btn-primary" onclick="centerGPSMapOnLocation(${coordinates[1]}, ${coordinates[0]})">
                        <i class="fas fa-crosshairs"></i>
                        <span>Centra sulla mappa</span>
                    </button>
                    <button class="btn btn-secondary" onclick="startNavigationToPoint('${name}', ${coordinates[1]}, ${coordinates[0]})">
                        <i class="fas fa-navigation"></i>
                        <span>Naviga qui</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return tooltip;
}

function getCategoryBadge(category) {
    const badges = {
        'church': 'Religioso',
        'convent': 'Religioso',
        'palace': 'Storico',
        'monument': 'Monumentale',
        'theater': 'Culturale',
        'civic': 'Civico',
        'educational': 'Educativo',
        'financial': 'Commerciale',
        'cultura': 'Cultura',
        'natura': 'Natura',
        'sport': 'Sport',
        'tecnologia': 'Tecnologia'
    };
    return badges[category] || 'Culturale';
}

function getCategoryIcon(category) {
    switch(category) {
        case 'church': 
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L8 6v3H4a2 2 0 00-2 2v7a2 2 0 002 2h16a2 2 0 002-2v-7a2 2 0 00-2-2h-4V6l-4-4z"/><path d="M12 2v8"/></svg>';
        case 'convent': 
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>';
        case 'palace': 
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17h20"/><path d="M2 12c0 5 10 5 10 5s10 0 10-5"/></svg>';
        case 'monument': 
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/></svg>';
        case 'theater': 
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h20v18H2zM8 21l4-4 4 4M12 17V9"/></svg>';
        case 'civic': 
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>';
        case 'educational': 
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
        case 'financial': 
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3-3-3-3h-4"/></svg>';
        default: 
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
    }
}

function addStaticMarkers() {
    // Fallback static markers (existing code as backup)
    const locations = [
        // Natura e Paesaggio
        {
            id: 'lago-pozzillo',
            name: 'Lago Pozzillo',
            coords: [37.6587117, 14.5975772],
            category: 'natura',
            description: 'Bacino artificiale con attività ricreative',
            icon: '🏞️'
        },
        
        // Svago e Sport
        {
            id: 'parco-avventura',
            name: 'Parco Avventura Pozzillo',
            coords: [37.6589778, 14.6188852],
            category: 'sport',
            description: 'Percorsi acrobatici nella natura',
            icon: '🌲'
        },
        
        // Tecnologia
        {
            id: 'tecnopolo',
            name: 'Tecnopolo Magnetico',
            coords: [37.6555295, 14.6282223],
            category: 'tecnologia',
            description: 'Centro di innovazione e formazione ICT',
            icon: '💻'
        },
        
        // Cultura e Storia - Chiese
        {
            id: 'chiesa-san-giovanni',
            name: 'Chiesa S. Giovanni',
            coords: [37.649732, 14.640482],
            category: 'cultura',
            description: 'Chiesa dedicata a San Giovanni, importante edificio religioso',
            icon: '⛪'
        },
        {
            id: 'chiesa-san-basilio',
            name: 'Chiesa S. Basilio',
            coords: [37.652803, 14.639812],
            category: 'cultura',
            description: 'Chiesa dedicata a San Basilio, importante testimonianza religiosa',
            icon: '⛪'
        },
        {
            id: 'chiesa-san-rocco',
            name: 'Chiesa di San Rocco',
            coords: [37.652933, 14.640170],
            category: 'cultura',
            description: 'Chiesa del Purgatorio, arte barocca e devozione popolare',
            icon: '⛪'
        },
        {
            id: 'chiesa-del-collegio',
            name: 'Chiesa del Collegio',
            coords: [37.650658, 14.640722],
            category: 'cultura',
            description: 'Chiesa annessa al collegio, centro di formazione religiosa',
            icon: '⛪'
        },
        {
            id: 'chiesa-madonna-del-carmelo',
            name: 'Chiesa Madonna del Carmelo',
            coords: [37.650585, 14.644247],
            category: 'cultura',
            description: 'Chiesa dedicata alla Madonna del Carmelo',
            icon: '⛪'
        },
        {
            id: 'chiesa-san-domenico',
            name: 'Chiesa S. Domenico',
            coords: [37.654306, 14.638889],
            category: 'cultura',
            description: 'Chiesa dedicata a San Domenico',
            icon: '⛪'
        },
        {
            id: 'chiesa-san-sebastiano',
            name: 'Chiesa S. Sebastiano',
            coords: [37.654191, 14.636747],
            category: 'cultura',
            description: 'Chiesa dedicata a San Sebastiano',
            icon: '⛪'
        },
        {
            id: 'chiesa-san-francesco-assisi',
            name: 'Chiesa S. Francesco d\'Assisi',
            coords: [37.653628, 14.634098],
            category: 'cultura',
            description: 'Chiesa dedicata a San Francesco d\'Assisi',
            icon: '⛪'
        },
        {
            id: 'chiesa-sm-delle-grazie-convento',
            name: 'Chiesa S.M. delle Grazie',
            coords: [37.650709, 14.641753],
            category: 'cultura',
            description: 'Chiesa di Santa Maria delle Grazie con convento',
            icon: '⛪'
        },
        {
            id: 'chiesa-sant-antonio-padova',
            name: 'Chiesa S. Antonio da Padova',
            coords: [37.650606, 14.642021],
            category: 'cultura',
            description: 'Chiesa dedicata a Sant\'Antonio da Padova',
            icon: '⛪'
        },
        {
            id: 'chiesa-rurale-san-calogero',
            name: 'Chiesa rurale San Calogero',
            coords: [37.649874, 14.646600],
            category: 'cultura',
            description: 'Chiesa rurale dedicata a San Calogero',
            icon: '⛪'
        },
        
        // Cultura e Storia - Conventi
        {
            id: 'convento-sant-agostino',
            name: 'Convento S. Agostino',
            coords: [37.649602, 14.640310],
            category: 'cultura',
            description: 'Convento dedicato a Sant\'Agostino',
            icon: '🏛️'
        },
        {
            id: 'convento-sant-antonio',
            name: 'Convento Sant\'Antonio',
            coords: [37.669940, 14.625629],
            category: 'cultura',
            description: 'Convento rurale di Sant\'Antonio',
            icon: '🏛️'
        },
        {
            id: 'convento-s-m-delle-grazie',
            name: 'Convento S.M. delle Grazie',
            coords: [37.650955, 14.641503],
            category: 'cultura',
            description: 'Convento di Santa Maria delle Grazie',
            icon: '🏛️'
        },
        
        // Cultura e Storia - Monumenti e Palazzi
        {
            id: 'monumento-ai-caduti',
            name: 'Monumento ai Caduti',
            coords: [37.649513, 14.640744],
            category: 'cultura',
            description: 'Monumento commemorativo dedicato ai caduti delle guerre',
            icon: '🏛️'
        },
        {
            id: 'cine-teatro-urania',
            name: 'Cine Teatro Urania',
            coords: [37.649339, 14.640664],
            category: 'cultura',
            description: 'Teatro comunale e cinema, centro culturale locale',
            icon: '🎭'
        },
        {
            id: 'collegio-di-maria',
            name: 'Collegio di Maria',
            coords: [37.650481, 14.640677],
            category: 'cultura',
            description: 'Istituto educativo femminile',
            icon: '🏛️'
        },
        {
            id: 'palazzo-comunale',
            name: 'Palazzo Comunale',
            coords: [37.652236, 14.640434],
            category: 'cultura',
            description: 'Sede del Municipio di Regalbuto',
            icon: '🏛️'
        },
        {
            id: 'palazzo-marletta',
            name: 'Palazzo Marletta',
            coords: [37.650160, 14.640799],
            category: 'cultura',
            description: 'Palazzo storico della famiglia Marletta',
            icon: '🏛️'
        },
        {
            id: 'palazzo-falcone',
            name: 'Palazzo Falcone',
            coords: [37.651814, 14.640389],
            category: 'cultura',
            description: 'Palazzo storico della famiglia Falcone',
            icon: '🏛️'
        },
        {
            id: 'palazzo-gerardi',
            name: 'Palazzo Gerardi',
            coords: [37.652067, 14.640949],
            category: 'cultura',
            description: 'Palazzo storico della famiglia Gerardi',
            icon: '🏛️'
        },
        {
            id: 'caserma-cc-ex-convento-san-domenico',
            name: 'Caserma C.C. (ex Convento S. Domenico)',
            coords: [37.654446, 14.638834],
            category: 'cultura',
            description: 'Caserma dei Carabinieri, ex Convento di San Domenico',
            icon: '🏛️'
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

// Helper functions for map tooltip actions
window.openVirtualTourFromMap = async function(monumentId) {
    console.log('Opening virtual tour from map for:', monumentId);
    // Close the popup first
    if (map) map.closePopup();
    
    try {
        // Load monuments data from JSON to get 360° images dynamically
        const response = await fetch('data/monuments.json');
        const monuments = await response.json();
        
        // Find the monument by ID
        const monument = monuments.find(m => m.id === monumentId);
        
        if (!monument) {
            console.error('Monument not found:', monumentId);
            showNotification('Monumento non trovato', 'error');
            return;
        }
        
        // Find the first 360° image
        const image360 = monument.images && monument.images.find(img => img.format === '360');
        
        if (!image360) {
            console.error('No 360° image found for monument:', monumentId);
            showNotification('Tour virtuale non disponibile per questo monumento', 'error');
            return;
        }
        
        // Switch to virtual tour tab (same as monument cards)
        switchTab('virtual-tour');
        
        // Wait a moment for the tab to load, then load the location with dynamic data
        setTimeout(() => {
            loadLocationFromJSON(monumentId, image360.path);
        }, 300);
        
        console.log('Loading virtual tour for monument:', monument.name);
        
    } catch (error) {
        console.error('Error loading monument data:', error);
        showNotification('Errore durante il caricamento del tour virtuale', 'error');
    }
};

// Open virtual tour for a monument from monument cards
window.openVirtualTour = async function(monumentId) {
    console.log('Opening virtual tour for:', monumentId);
    
    try {
        // Load monuments data from JSON to get 360° images dynamically
        const response = await fetch('data/monuments.json');
        const monuments = await response.json();
        
        // Find the monument by ID
        const monument = monuments.find(m => m.id === monumentId);
        
        if (!monument) {
            console.error('Monument not found:', monumentId);
            showNotification('Monumento non trovato', 'error');
            return;
        }
        
        // Find the first 360° image
        const image360 = monument.images && monument.images.find(img => img.format === '360');
        
        if (!image360) {
            console.error('No 360° image found for monument:', monumentId);
            showNotification('Tour virtuale non disponibile per questo monumento', 'error');
            return;
        }
        
        // Switch to virtual tour tab
        switchTab('virtual-tour');
        
        // Wait a moment for the tab to load, then load the location with dynamic data
        setTimeout(() => {
            loadLocationFromJSON(monumentId, image360.path);
        }, 300);
        
        console.log('Loading virtual tour for monument:', monument.name);
        
    } catch (error) {
        console.error('Error loading monument data:', error);
        showNotification('Errore durante il caricamento del tour virtuale', 'error');
    }
};

window.playAudioGuideFromMap = function(monumentId) {
    console.log('Playing audio guide from map for:', monumentId);
    // Close the popup first
    if (map) map.closePopup();
    
    // Switch to monuments tab and trigger audio guide
    switchTab('monumenti');
    setTimeout(() => {
        // Find the monument card and trigger audio guide
        const monumentCard = document.querySelector(`[data-monument-id="${monumentId}"]`);
        if (monumentCard) {
            monumentCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                playAudioGuide(monumentId);
            }, 500);
        } else {
            console.warn('Monument card not found for ID:', monumentId);
            // Fallback: try to play audio guide directly
            playAudioGuide(monumentId);
        }
    }, 300);
};

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
        }        } else {
            // Show all markers - reset to historic center view
            map.setView([37.650573, 14.640587], 16);
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
        const cardCategory = card.dataset.category;
        let shouldShow = false;
        
        if (category === 'all') {
            shouldShow = true;
        } else if (category === 'sport') {
            // Include both sport and svago categories
            shouldShow = cardCategory === 'sport' || cardCategory === 'svago';
        } else {
            shouldShow = cardCategory === category;
        }
        
        card.style.display = shouldShow ? 'flex' : 'none';
    });
    
    // Filter monument cards
    const monumentCards = document.querySelectorAll('.monument-card');
    monumentCards.forEach(card => {
        const cardCategory = card.dataset.category;
        let shouldShow = false;
        
        if (category === 'all') {
            shouldShow = true;
        } else if (category === 'sport') {
            // Include both sport and svago categories
            shouldShow = cardCategory === 'sport' || cardCategory === 'svago';
        } else {
            shouldShow = cardCategory === category;
        }
        
        card.style.display = shouldShow ? 'block' : 'none';
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
        'church': 'Chiese',
        'convent': 'Conventi',
        'palace': 'Palazzi',
        'monument': 'Monumenti',
        'theater': 'Teatri',
        'civic': 'Edifici Civici',
        'educational': 'Educazione',
        'financial': 'Finanza'
    };
    return names[category] || category;
}

function openMapLocation(monumentId) {
    console.log('Opening map location for:', monumentId);
    
    // Define Google Maps URLs based on monuments.json data
    const mapUrls = {
        // Chiese
        'chiesa-santa-maria-la-croce': 'https://maps.app.goo.gl/36n3wGo6KZ3wdWKa7',
        'santa-maria-croce': 'https://maps.app.goo.gl/36n3wGo6KZ3wdWKa7', // alias
        'chiesa-san-giovanni': 'https://maps.app.goo.gl/othA2S9tDMcGK3FBA',
        'chiesa-san-basilio': 'https://maps.app.goo.gl/vSNW8QEorSkNDE487',
        'san-basilio': 'https://maps.app.goo.gl/vSNW8QEorSkNDE487', // alias
        'chiesa-san-rocco': 'https://maps.app.goo.gl/RnocN7suTUtA44dcA',
        'purgatorio': 'https://maps.app.goo.gl/RnocN7suTUtA44dcA', // alias
        'chiesa-del-collegio': 'https://maps.app.goo.gl/uoby9MpGjr3MShXR8',
        'chiesa-madonna-del-carmelo': 'https://maps.app.goo.gl/JmebSSTwzJs3wbBj6',
        'chiesa-san-domenico': 'https://maps.app.goo.gl/9YNxj1NhouS5oJ7FA',
        'chiesa-san-sebastiano': 'https://maps.app.goo.gl/qfcQQjYUEF8nXwbbA',
        'chiesa-san-francesco-assisi': 'https://maps.app.goo.gl/BQKrtvufPcqWstZu8',
        'chiesa-sm-delle-grazie-convento': 'https://maps.app.goo.gl/QKmP4c3c6zWVSHiGA',
        'chiesa-sant-antonio-padova': 'https://maps.app.goo.gl/xsGJdJe1ZfeZeLWK8',
        'chiesa-rurale-san-calogero': 'https://maps.google.com/maps?q=37.649874,14.646600&ll=37.649874,14.646600&z=16',
        
        // Conventi
        'convento-sant-agostino': 'https://maps.app.goo.gl/tV7agQC2Wzuy9DdH8',
        'san-agostino': 'https://maps.app.goo.gl/tV7agQC2Wzuy9DdH8', // alias
        'convento-sant-antonio': 'https://maps.app.goo.gl/bwwdjx9qspeiSmxS6',
        'santantonio': 'https://maps.app.goo.gl/bwwdjx9qspeiSmxS6', // alias
        'convento-s-m-delle-grazie': 'https://maps.app.goo.gl/zFR6uWHiXjoAvJgd9',
        
        // Edifici civici
        'caserma-cc-ex-convento-san-domenico': 'https://maps.app.goo.gl/w3B61q3drdJNbEPU6',
        'collegio-di-maria': 'https://maps.app.goo.gl/dXbkhcBzdCwct2WAA',
        'palazzo-comunale': 'https://maps.app.goo.gl/smMJq1Q86eirZLrb6',
        
        // Monumenti
        'monumento-ai-caduti': 'https://maps.app.goo.gl/Y8ZdEJJdnEfLNZfg7',
        'monumento-caduti': 'https://maps.app.goo.gl/Y8ZdEJJdnEfLNZfg7', // alias
        
        // Teatro
        'cine-teatro-urania': 'https://maps.app.goo.gl/bxz44Y7xddcPseqr5',
        'teatro-urania': 'https://maps.app.goo.gl/bxz44Y7xddcPseqr5', // alias
        
        // Istituti finanziari
        'istituto-credito-cooperativo-la-riscossa': 'https://maps.app.goo.gl/1CTjLE8i9ZPcWBSr5',
        'credito-cooperativo-la-riscossa-2': 'https://maps.app.goo.gl/zrWq99t9Cv2TFvTk8',
        'istituto-intesa-san-paolo': 'https://maps.google.com/maps?q=37.6450,14.6380&ll=37.6450,14.6380&z=17',
        
        // Palazzi
        'palazzo-marletta': 'https://maps.app.goo.gl/jnY3iJbPuJmnLMKE6',
        'palazzo-falcone': 'https://maps.app.goo.gl/11szoYS55Rk12owd6',
        'palazzo-gerardi': 'https://maps.app.goo.gl/TGeLkq3mGc6MSkYM7',
        'palazzo-barone-carchiolo': 'https://maps.google.com/maps?q=37.6480,14.6350&ll=37.6480,14.6350&z=17',
        
        // Natura e luoghi esistenti
        'lago-pozzillo': 'https://maps.google.com/maps?q=37.6587117,14.5975772&ll=37.6587117,14.5975772&z=16',
        'parco-avventura': 'https://maps.google.com/maps?q=37.6589778,14.6188852&ll=37.6589778,14.6188852&z=16',
        'calvario': 'https://maps.google.com/maps?q=37.6264741,14.7434425&ll=37.6264741,14.7434425&z=15',
        'tecnopolo': 'https://www.google.com/maps/place/Tecnopolo+Magnetico/@37.6555336,14.6233514,17z/data=!3m1!4b1!4m6!3m5!1s0x131135004bd582e3:0xcdd4146a12d3cf67!8m2!3d37.6555295!4d14.6282223!16s%2Fg%2F11yf2nsc88?entry=ttu&g_ep=EgoyMDI1MDcxMy4wIKXMDSoASAFQAw%3D%3D',
        'tecnopolo-magnetico': 'https://www.google.com/maps/place/Tecnopolo+Magnetico/@37.6555336,14.6233514,17z/data=!3m1!4b1!4m6!3m5!1s0x131135004bd582e3:0xcdd4146a12d3cf67!8m2!3d37.6555295!4d14.6282223!16s%2Fg%2F11yf2nsc88?entry=ttu&g_ep=EgoyMDI1MDcxMy4wIKXMDSoASAFQAw%3D%3D',
        'default': 'https://maps.google.com/maps?q=37.650573,14.640587&ll=37.650573,14.640587&z=16'
    };
    
    const url = mapUrls[monumentId] || mapUrls['default'];
    
    // Open in a new window/tab to trigger the Maps app
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Removed notification
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
    console.log('Loading location:', locationId);
    
    // Remove active class from all location cards
    const locationCards = document.querySelectorAll('.location-card');
    locationCards.forEach(card => card.classList.remove('active'));
    
    // Add active class to selected location
    const selectedCard = event.target.closest('.location-card');
    if (selectedCard) {
        selectedCard.classList.add('active');
    }
    
    // Location URLs for virtual tours with rotation
    const locations = {
        'convento': 'https://kuula.co/share/collection/7l2K7?logo=1&info=1&fs=1&vr=1&sd=1&thumbs=1',
        'santa-maria-croce': 'panoramas/panorama.html?img=src/imgs/360/smaria-altare.JPG&rotation=-90',
        'san-basilio': 'panoramas/panorama.html?img=src/imgs/360/sbasilio-altare.JPG&rotation=-90',
        'panorama': 'https://kuula.co/share/collection/7l2K7?logo=1&info=1&fs=1&vr=1&sd=1&thumbs=1',
        'piazza': 'https://kuula.co/share/collection/7l2K7?logo=1&info=1&fs=1&vr=1&sd=1&thumbs=1',
        'monumento-caduti': 'panoramas/panorama.html?img=src/imgs/360/caduti.JPG&rotation=-90',
        'san-agostino': 'panoramas/panorama.html?img=src/imgs/360/sagostino-altare.JPG&rotation=-90',
        'teatro-urania': 'panoramas/panorama.html?img=src/imgs/360/teatro.JPG&rotation=-90',
        'purgatorio': 'panoramas/panorama.html?img=src/imgs/360/srocco-ingresso.JPG&rotation=-90'
    };
    
    const iframe = document.querySelector('#pano-viewer iframe');
    if (iframe && locations[locationId]) {
        console.log('Setting iframe src to:', locations[locationId]);
        iframe.src = locations[locationId];
        
        // Aggiungi listener per debug
        iframe.onload = function() {
            console.log('Iframe caricato con successo');
        };
        
        iframe.onerror = function() {
            console.error('Errore caricamento iframe');
        };
        
        // Removed notification
    } else {
        console.error('Iframe o location non trovati');
    }
    
    console.log(`Loading virtual tour location: ${locationId}`);
}

// New function to load location using JSON data dynamically
function loadLocationFromJSON(monumentId, imagePath) {
    console.log('Loading location from JSON for monument:', monumentId, 'with image:', imagePath);
    
    // Remove active class from all location cards
    const locationCards = document.querySelectorAll('.location-card');
    locationCards.forEach(card => card.classList.remove('active'));
    
    // Build the panorama URL using the image path from JSON with default rotation
    const panoramaUrl = `panoramas/panorama.html?img=${imagePath}&rotation=-90`;
    
    const iframe = document.querySelector('#pano-viewer iframe');
    if (iframe) {
        console.log('Setting iframe src to:', panoramaUrl);
        iframe.src = panoramaUrl;
        
        // Add debug listeners
        iframe.onload = function() {
            console.log('Iframe loaded successfully');
        };
        
        iframe.onerror = function() {
            console.error('Error loading iframe');
        };
    } else {
        console.error('Iframe not found');
    }
    
    console.log(`Loading virtual tour from JSON for monument: ${monumentId}`);
}

// Function to hide subcategories dropdown
function hideSubcategories() {
    const dropdownContainer = document.getElementById('views-dropdown-container');
    if (dropdownContainer) {
        dropdownContainer.style.display = 'none';
    }
}

// Virtual Tour Configuration - based on monuments.json
const virtualTourConfig = {
    'chiesa-santa-maria-la-croce': {
        name: 'Chiesa di Santa Maria della Croce',
        views: [
            { value: '../src/imgs/360/smaria-ingresso.JPG', text: 'Ingresso principale', rotation: -90 },
            { value: '../src/imgs/360/smaria-altare.JPG', text: 'Altare maggiore', rotation: -90 },
            { value: '../src/imgs/360/smaria-dx.JPG', text: 'Navata destra', rotation: -90 },
            { value: '../src/imgs/360/smaria-sx.JPG', text: 'Navata sinistra', rotation: -90 }
        ]
    },
    'chiesa-san-giovanni': {
        name: 'Chiesa di Sant\'Agostino in San Giovanni', 
        views: [
            { value: '../src/imgs/360/sagostino-ingresso.JPG', text: 'Ingresso', rotation: -90 },
            { value: '../src/imgs/360/sagostino-altare.JPG', text: 'Altare maggiore', rotation: -90 }
        ]
    },
    'chiesa-san-basilio': {
        name: 'Chiesa Madre di San Basilio',
        views: [
            { value: '../src/imgs/360/sbasilio-ingresso.JPG', text: 'Ingresso principale', rotation: -90 },
            { value: '../src/imgs/360/sbasilio-altare.JPG', text: 'Altare principale', rotation: -90 }
        ]
    },
    'convento-sant-agostino': {
        name: 'Convento di Sant\'Agostino',
        views: [
            { value: '../src/imgs/360/sagostino-ingresso.JPG', text: 'Ingresso', rotation: -90 },
            { value: '../src/imgs/360/sagostino-altare.JPG', text: 'Altare', rotation: -90 }
        ]
    },
    'convento-sant-antonio': {
        name: 'Convento di Sant\'Antonio',
        views: [
            { value: '../src/imgs/360/vista-convento-sant-antonio.JPG', text: 'Vista Principale', rotation: 95 },
            { value: '../src/imgs/360/chiostro-convento-sant-antonio.JPG', text: 'Chiostro', rotation: -90 },
            { value: '../src/imgs/360/chiesa-convento-sant-antonio.JPG', text: 'Chiesa', rotation: -90 },
            { value: '../src/imgs/360/grotta-insediamento-sant-antonio.JPG', text: 'Grotta Rupestre', rotation: -90 }
        ]
    },
    // Single view tours
    'chiesa-purgatorio': {
        name: 'Chiesa del Purgatorio (San Rocco)',
        views: [
            { value: '../src/imgs/360/srocco-ingresso.JPG', text: 'Ingresso', rotation: -90 }
        ]
    },
    'chiesa-del-collegio': {
        name: 'Chiesa del Collegio',
        views: [
            { value: '../src/imgs/360/chiesa-collegio.JPG', text: 'Interno', rotation: -90 }
        ]
    },
    'chiesa-rurale-san-calogero': {
        name: 'Chiesa rurale di San Calogero',
        views: [
            { value: '../src/imgs/360/chiesa-san-calogero.JPG', text: 'Interno', rotation: -90 },
            { value: '../src/imgs/360/vista-san-calogero.JPG', text: 'Vista esterna', rotation: 90 }
        ]
    },
    'collegio-di-maria': {
        name: 'Collegio di Maria',
        views: [
            { value: '../src/imgs/360/chiostro-collegio-maria.JPG', text: 'Chiostro', rotation: -90 }
        ]
    },
    'monumento-ai-caduti': {
        name: 'Monumento ai Caduti',
        views: [
            { value: '../src/imgs/360/caduti.JPG', text: 'Vista panoramica', rotation: -90 }
        ]
    },
    'cineteatro-urania': {
        name: 'CineTeatro Urania',
        views: [
            { value: '../src/imgs/360/teatro.JPG', text: 'Sala teatrale', rotation: -90 }
        ]
    }
};

// Main Virtual Tour loader function
function loadVirtualTour(tourId) {
    console.log('loadVirtualTour called with:', tourId);
    
    const config = virtualTourConfig[tourId];
    if (!config) {
        console.warn('Tour configuration not found for:', tourId);
        return;
    }
    
    console.log('Found config:', config);

    // Remove active class from all location cards
    document.querySelectorAll('.location-card').forEach(card => card.classList.remove('active'));
    
    // Add active class to selected location - handle case where event may not be defined
    let selectedCard = null;
    if (typeof event !== 'undefined' && event && event.target) {
        selectedCard = event.target.closest('.location-card');
    } else {
        // Fallback: find the card by onclick attribute
        selectedCard = document.querySelector(`[onclick*="loadVirtualTour('${tourId}')"]`);
    }
    
    if (selectedCard) {
        selectedCard.classList.add('active');
        console.log('Added active class to card:', selectedCard);
    }

    // Load the first/default image
    const defaultImage = config.views[0];
    const iframe = document.querySelector('#pano-viewer iframe');
    console.log('Found iframe:', !!iframe, 'Default image:', defaultImage);
    
    if (iframe && defaultImage) {
        const rotation = defaultImage.rotation || -90; // Default to -90 if not specified
        const panoramaUrl = `panoramas/panorama.html?img=${defaultImage.value}&rotation=${rotation}`;
        console.log('Setting iframe src to:', panoramaUrl);
        iframe.src = panoramaUrl;
        
        // Add error handling for iframe
        iframe.onload = function() {
            console.log('Iframe loaded successfully');
        };
        
        iframe.onerror = function() {
            console.error('Iframe failed to load');
        };
    } else {
        console.error('Missing iframe or defaultImage:', { iframe: !!iframe, defaultImage });
    }

    // Show dropdown if multiple views available
    if (config.views.length > 1) {
        console.log('Showing multiple views dropdown');
        showMultipleViews(config);
    } else {
        console.log('Hiding subcategories - single view');
        hideSubcategories();
    }
}

// Function to show multiple views dropdown
function showMultipleViews(config) {
    const dropdownContainer = document.getElementById('views-dropdown-container');
    const viewsSelect = document.getElementById('views-select');
    
    if (dropdownContainer && viewsSelect) {
        // Clear existing options
        viewsSelect.innerHTML = '<option value="">Seleziona una vista...</option>';
        
        // Add options for this tour
        config.views.forEach(view => {
            const option = document.createElement('option');
            option.value = view.value;
            option.textContent = view.text;
            option.dataset.rotation = view.rotation || -90; // Store rotation in dataset
            viewsSelect.appendChild(option);
        });
        
        // Show the dropdown
        dropdownContainer.style.display = 'flex';
        
        // Set default selection to first view
        viewsSelect.value = config.views[0].value;
        viewsSelect.selectedOptions[0].dataset.rotation = config.views[0].rotation || -90;
    }
}

// Function to handle dropdown view changes
function handleViewChange(imagePath) {
    if (imagePath) {
        // Get the rotation from the selected option
        const viewsSelect = document.getElementById('views-select');
        const selectedOption = viewsSelect.selectedOptions[0];
        const rotation = selectedOption ? (selectedOption.dataset.rotation || -90) : -90;
        
        loadPanoramaView(imagePath, rotation);
    }
}

// Function to load specific panorama view
function loadPanoramaView(imagePath, rotation = -90) {
    console.log('Loading panorama view with image and rotation:', imagePath, rotation);
    
    // Load the panorama
    const iframe = document.querySelector('#pano-viewer iframe');
    if (iframe) {
        const panoramaUrl = `panoramas/panorama.html?img=${imagePath}&rotation=${rotation}`;
        console.log('Setting iframe src to:', panoramaUrl);
        iframe.src = panoramaUrl;
    }
}

// Legacy function - updated to use new system
function loadConventoSantAntonio() {
    loadVirtualTour('convento-sant-antonio');
}

function loadLocationAndScroll(locationId) {
    // Prima carica la location
    loadLocation(locationId);
    
    // Poi scroll automatico verso l'iframe
    const iframe = document.querySelector('#pano-viewer');
    if (iframe) {
        iframe.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

function toggleFullscreen() {
    const viewer = document.getElementById('pano-viewer');
    const iframe = viewer ? viewer.querySelector('iframe') : null;
    
    console.log('toggleFullscreen chiamata');
    console.log('Viewer:', viewer);
    console.log('Iframe src:', iframe ? iframe.src : 'no iframe');
    
    if (!viewer) {
        console.error('Viewer non trovato');
        showNotification('Errore: viewer non trovato', 'error');
        return Promise.reject(new Error('Viewer non trovato'));
    }

    // Verifica se siamo già in fullscreen (nativo o simulato)
    const isFullscreen = document.fullscreenElement || 
                        document.webkitFullscreenElement || 
                        document.mozFullScreenElement || 
                        document.msFullscreenElement ||
                        viewer.getAttribute('data-simulated-fullscreen') === 'true';
    
    if (isFullscreen) {
        exitFullscreenMode();
        return Promise.resolve('fullscreen disabled');
    } else {
        return enterFullscreenMode();
    }
}

function enterFullscreenMode() {
    const viewer = document.getElementById('pano-viewer');
    const iframe = viewer ? viewer.querySelector('iframe') : null;
    
    return new Promise((resolve, reject) => {
        try {
            // Prova prima il fullscreen nativo
            let fullscreenPromise;
            
            if (viewer.requestFullscreen) {
                fullscreenPromise = viewer.requestFullscreen();
            } else if (viewer.webkitRequestFullscreen) {
                fullscreenPromise = viewer.webkitRequestFullscreen();
            } else if (viewer.mozRequestFullScreen) {
                fullscreenPromise = viewer.mozRequestFullScreen();
            } else if (viewer.msRequestFullscreen) {
                fullscreenPromise = viewer.msRequestFullscreen();
            }
            
            if (fullscreenPromise && fullscreenPromise.then) {
                fullscreenPromise.then(() => {
                    console.log('Fullscreen nativo attivato con successo');
                    // Removed notification
                    createExitButton();
                    // Crea anche il pulsante X per uscire dal fullscreen
                    createFullscreenExitButton();
                    resolve('native fullscreen activated');
                }).catch((err) => {
                    console.log('Errore fullscreen nativo:', err);
                    // Fallback per mobile
                    simulateFullscreen();
                    resolve('simulated fullscreen activated');
                });
            } else {
                console.log('API fullscreen non supportata, uso simulazione');
                simulateFullscreen();
                resolve('simulated fullscreen activated');
            }
            
        } catch (err) {
            console.error('Errore fullscreen:', err);
            simulateFullscreen();
            resolve('simulated fullscreen activated');
        }
    });
}

function simulateFullscreen() {
    const viewer = document.getElementById('pano-viewer');
    const iframe = viewer ? viewer.querySelector('iframe') : null;
    
    console.log('Attivazione fullscreen simulato');
    
    // Applica stili per simulare fullscreen
    viewer.style.position = 'fixed';
    viewer.style.top = '0';
    viewer.style.left = '0';
    viewer.style.width = '100vw';
    viewer.style.height = '100vh';
    viewer.style.zIndex = '9999';
    viewer.style.background = '#000';
    
    if (iframe) {
        iframe.style.width = '100%';
        iframe.style.height = '100%';
    }
    
    // Nascondi il contenuto principale
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.overflow = 'hidden';
    }
    
    // Nascondi overflow del body e HTML
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.position = 'fixed';
    
    // Segna come modalità simulata
    viewer.setAttribute('data-simulated-fullscreen', 'true');
    
    // Removed notification
    console.log('Creazione pulsanti di uscita...');
    
    // NON creare pulsanti se è attiva la modalità VR
    const isVRActive = checkIfVRActive();
    if (!isVRActive) {
        console.log('Nessuna modalità VR attiva - creando pulsanti fullscreen');
        createExitButton();
        createFullscreenExitButton();
        
        // Su Android, avvia anche il monitoraggio continuo solo per fullscreen
        if (/Android/i.test(navigator.userAgent)) {
            console.log('Avvio monitoraggio continuo per Android (solo fullscreen)');
            startAndroidFullscreenMonitoring();
            showAndroidEmergencyOverlay();
        }
    } else {
        console.log('Modalità VR attiva - NON creando pulsanti fullscreen (Android usa quello nativo)');
    }
    
    // Debug: verifica se i pulsanti sono stati creati
    setTimeout(() => {
        const exitBtn = document.getElementById('fullscreen-exit-btn');
        const fullscreenExitBtn = document.getElementById('fullscreen-only-exit-btn');
        console.log('Exit button presente:', !!exitBtn);
        console.log('Fullscreen exit button presente:', !!fullscreenExitBtn);
        console.log('VR attivo:', isVRActive);
        
        if (exitBtn) {
            console.log('Exit button styles:', exitBtn.style.cssText);
        }
        if (fullscreenExitBtn) {
            console.log('Fullscreen exit button styles:', fullscreenExitBtn.style.cssText);
        }
    }, 100);
    
    // Aggiungi controlli touch per mobile
    addMobileExitControls(viewer);
}

// Funzione per verificare se la modalità VR è attiva
function checkIfVRActive() {
    // Controlla se c'è un pulsante VR attivo
    const vrExitBtn = document.getElementById('vr-exit-btn');
    if (vrExitBtn) {
        console.log('VR rilevato: pulsante VR exit presente');
        return true;
    }
    
    // Controlla se l'iframe ha parametri VR
    const iframe = document.querySelector('#pano-viewer iframe');
    if (iframe && iframe.src) {
        const src = iframe.src;
        if (src.includes('vr=1')) {
            console.log('VR rilevato: parametro vr=1 nell\'URL');
            return true;
        }
    }
    
    // Controlla se siamo in modalità VR tramite A-Frame
    const viewer = document.getElementById('pano-viewer');
    if (viewer && viewer.getAttribute('data-vr-active') === 'true') {
        console.log('VR rilevato: attributo data-vr-active');
        return true;
    }
    
    console.log('VR non rilevato');
    return false;
}

// Funzione per monitorare continuamente il fullscreen su Android
function startAndroidFullscreenMonitoring() {
    // Evita di creare monitor multipli
    if (window.androidFullscreenMonitor) {
        clearInterval(window.androidFullscreenMonitor);
    }
    
    window.androidFullscreenMonitor = setInterval(() => {
        const viewer = document.getElementById('pano-viewer');
        const isSimulated = viewer && viewer.getAttribute('data-simulated-fullscreen') === 'true';
        const isFullscreen = document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.mozFullScreenElement || 
                           document.msFullscreenElement;
        
        // Controlla se VR è attivo
        const isVRActive = checkIfVRActive();
        
        // Se siamo in fullscreen (simulato o reale) ma NON in VR, assicuriamoci che i pulsanti siano presenti
        if ((isSimulated || isFullscreen) && !isVRActive) {
            const fullscreenExitBtn = document.getElementById('fullscreen-only-exit-btn');
            const androidOverlay = document.getElementById('android-fullscreen-overlay');
            
            if (!fullscreenExitBtn && !androidOverlay) {
                console.log('Android monitor: ricreando pulsanti X mancanti (solo fullscreen, non VR)');
                createFullscreenExitButton();
            }
        } else if (isVRActive) {
            console.log('Android monitor: VR attivo, rimuovendo pulsanti fullscreen');
            removeFullscreenExitButton();
        } else {
            // Non siamo più in fullscreen, ferma il monitor
            clearInterval(window.androidFullscreenMonitor);
            window.androidFullscreenMonitor = null;
        }
    }, 1000); // Controlla ogni secondo
}

// Funzione di emergenza per Android - mostra overlay temporaneo
function showAndroidEmergencyOverlay() {
    // Crea overlay di emergenza che copre tutto lo schermo
    const emergencyOverlay = document.createElement('div');
    emergencyOverlay.id = 'android-emergency-overlay';
    emergencyOverlay.innerHTML = `
        <div style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
            z-index: 2147483647;
        ">
            <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <div style="font-size: 24px; margin-bottom: 20px; font-weight: bold;">MODALITÀ FULLSCREEN ATTIVA</div>
            <div style="font-size: 16px; margin-bottom: 30px;">Cerca la X rossa nell'angolo in alto a destra</div>
            <div style="font-size: 14px; margin-bottom: 20px;">o tocca l'angolo in alto a destra dello schermo</div>
            <div style="font-size: 12px; color: #ccc;">Questo messaggio scomparirà in <span id="emergency-countdown">10</span> secondi</div>
        </div>
    `;
    
    emergencyOverlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 2147483647 !important;
        pointer-events: auto !important;
        background: transparent !important;
    `;
    
    // Quando si tocca l'overlay, esce dal fullscreen
    emergencyOverlay.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Android emergency overlay clicked');
        exitFullscreenMode();
    });
    
    emergencyOverlay.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Android emergency overlay touched');
        exitFullscreenMode();
    }, { passive: false });
    
    document.body.appendChild(emergencyOverlay);
    
    // Countdown per rimuovere l'overlay
    let countdown = 10;
    const countdownElement = document.getElementById('emergency-countdown');
    
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdownElement) {
            countdownElement.textContent = countdown;
        }
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            if (emergencyOverlay.parentNode) {
                emergencyOverlay.remove();
            }
        }
    }, 1000);
    
    console.log('Android emergency overlay created');
}

function addMobileExitControls(viewer) {
    let tapCount = 0;
    let tapTimer = null;
    let touchStartY = 0;
    let touchStartTime = 0;
    
    // Rimuovi eventuali listener esistenti
    removeMobileExitControls(viewer);
    
    // Aggiungi listener per tasto Escape
    const escapeHandler = (e) => {
        if (e.key === 'Escape' || e.keyCode === 27) {
            console.log('Tasto Escape premuto - uscita da fullscreen');
            exitFullscreenMode();
        }
    };
    
    // Doppio tap per uscire
    const doubleTapHandler = (e) => {
        tapCount++;
        console.log('Tap rilevato, count:', tapCount);
        
        if (tapCount === 1) {
            tapTimer = setTimeout(() => {
                tapCount = 0;
            }, 300); // Reset dopo 300ms
        } else if (tapCount === 2) {
            clearTimeout(tapTimer);
            tapCount = 0;
            console.log('Doppio tap rilevato - uscita da fullscreen');
            // Removed notification
            exitFullscreenMode();
        }
    };
    
    // Swipe down dall'alto per uscire
    const touchStartHandler = (e) => {
        const touch = e.touches[0];
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
        console.log('Touch start at Y:', touchStartY);
    };
    
    const touchEndHandler = (e) => {
        const touch = e.changedTouches[0];
        const touchEndY = touch.clientY;
        const touchDuration = Date.now() - touchStartTime;
        const swipeDistance = touchEndY - touchStartY;
        
        console.log('Touch end - Start Y:', touchStartY, 'End Y:', touchEndY, 'Distance:', swipeDistance, 'Duration:', touchDuration);
        
        // Swipe down dall'alto dello schermo (primi 100px)
        if (touchStartY < 100 && swipeDistance > 150 && touchDuration < 1000) {
            console.log('Swipe down dall\'alto rilevato - uscita da fullscreen');
            // Removed notification
            exitFullscreenMode();
        }
    };
    
    // Aggiungi i listener
    document.addEventListener('keydown', escapeHandler);
    viewer.addEventListener('click', doubleTapHandler);
    viewer.addEventListener('touchstart', touchStartHandler, { passive: true });
    viewer.addEventListener('touchend', touchEndHandler, { passive: true });
    
    // Salva i riferimenti per poterli rimuovere dopo
    viewer._mobileExitHandlers = {
        escape: escapeHandler,
        doubleTap: doubleTapHandler,
        touchStart: touchStartHandler,
        touchEnd: touchEndHandler
    };
    
    console.log('Controlli mobile aggiunti per uscita fullscreen');
    
    // Mostra istruzioni per mobile
    setTimeout(() => {
        if (isMobileDevice()) {
            // Removed notification
        }
    }, 2000);
}

function removeMobileExitControls(viewer) {
    if (viewer._mobileExitHandlers) {
        document.removeEventListener('keydown', viewer._mobileExitHandlers.escape);
        viewer.removeEventListener('click', viewer._mobileExitHandlers.doubleTap);
        viewer.removeEventListener('touchstart', viewer._mobileExitHandlers.touchStart);
        viewer.removeEventListener('touchend', viewer._mobileExitHandlers.touchEnd);
        delete viewer._mobileExitHandlers;
        console.log('Controlli mobile rimossi');
    }
}

function exitFullscreenMode() {
    console.log('exitFullscreenMode called');
    
    // Ferma il monitoraggio Android se attivo
    if (window.androidFullscreenMonitor) {
        clearInterval(window.androidFullscreenMonitor);
        window.androidFullscreenMonitor = null;
        console.log('Android fullscreen monitor stopped');
    }
    
    const viewer = document.getElementById('pano-viewer');
    const isSimulated = viewer && viewer.getAttribute('data-simulated-fullscreen') === 'true';
    
    if (isSimulated) {
        // Rimuovi i controlli mobile prima di uscire
        removeMobileExitControls(viewer);
        
        // Uscita dalla modalità simulata
        viewer.style.position = '';
        viewer.style.top = '';
        viewer.style.left = '';
        viewer.style.width = '';
        viewer.style.height = '';
        viewer.style.zIndex = '';
        viewer.style.background = '';
        
        const iframe = viewer.querySelector('iframe');
        if (iframe) {
            iframe.style.width = '';
            iframe.style.height = '';
        }
        
        // Ripristina il main content
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.overflow = '';
        }
        
        // Ripristina il body
        document.body.style.overflow = '';
        document.body.style.position = '';
        
        // Ripristina l'HTML
        document.documentElement.style.overflow = '';
        document.documentElement.style.position = '';
        
        viewer.removeAttribute('data-simulated-fullscreen');
        
        console.log('Fullscreen simulato disattivato');
        // Removed notification
        
    } else {
        // Uscita dalla modalità fullscreen nativa
        try {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => {
                    console.log('Fullscreen nativo disattivato');
                    // Removed notification
                }).catch(err => {
                    console.log('Errore uscita fullscreen nativo:', err);
                    // Removed notification
                });
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
                // Removed notification
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
                // Removed notification
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
                // Removed notification
            }
            
            console.log('Fullscreen nativo disattivato');
            
        } catch (err) {
            console.error('Errore uscita fullscreen:', err);
            // Removed notification
        }
    }
    
    // Rimuovi sempre i pulsanti di uscita
    removeExitButton();
    removeFullscreenExitButton();
}

function createExitButton() {
    // Rimuovi eventuali pulsanti esistenti
    removeExitButton();
    
    const exitBtn = document.createElement('button');
    exitBtn.id = 'fullscreen-exit-btn';
    exitBtn.innerHTML = '×';
    exitBtn.title = 'Esci dallo schermo intero';
    
    // Rileva se siamo su Android per ottimizzare il pulsante
    const isAndroid = /Android/i.test(navigator.userAgent);
    const buttonSize = isAndroid ? '80px' : '60px';
    const fontSize = isAndroid ? '40px' : '32px';
    const topPosition = isAndroid ? '30px' : '20px';
    
    exitBtn.style.cssText = `
        position: fixed !important;
        top: ${topPosition} !important;
        right: 20px !important;
        width: ${buttonSize} !important;
        height: ${buttonSize} !important;
        background: rgba(255, 0, 0, 0.9) !important;
        color: white !important;
        border: 3px solid rgba(255, 255, 255, 0.8) !important;
        border-radius: 50% !important;
        font-size: ${fontSize} !important;
        font-weight: bold !important;
        cursor: pointer !important;
        z-index: 99999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6) !important;
        transition: all 0.3s ease !important;
        line-height: 1 !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -webkit-tap-highlight-color: transparent !important;
        touch-action: manipulation !important;
        font-family: Arial, sans-serif !important;
        opacity: 0.9 !important;
    `;
    
    // Event handler semplificato per massima compatibilità
    exitBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Exit button clicked - onclick');
        exitFullscreenMode();
    };
    
    // Aggiungi anche addEventListener per sicurezza
    exitBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Exit button touched - touchstart');
        exitFullscreenMode();
    }, { passive: false });
    
    // Effetti hover/touch
    exitBtn.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(255, 0, 0, 1)';
        this.style.transform = 'scale(1.1)';
    });
    
    exitBtn.addEventListener('mouseleave', function() {
        this.style.background = 'rgba(255, 0, 0, 0.8)';
        this.style.transform = 'scale(1)';
    });
    
    exitBtn.addEventListener('touchstart', function() {
        this.style.background = 'rgba(255, 0, 0, 1)';
        this.style.transform = 'scale(1.1)';
    });
    
    document.body.appendChild(exitBtn);
    
    // Crea anche l'area touch più grande per facilitare il tocco
    const touchArea = document.createElement('div');
    touchArea.id = 'fullscreen-touch-area';
    touchArea.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: 100px;
        height: 100px;
        z-index: 10000;
        background: transparent;
        cursor: pointer;
        touch-action: manipulation;
    `;
    
    touchArea.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Touch area clicked');
        exitFullscreenMode();
    };
    
    touchArea.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Touch area touched');
        exitFullscreenMode();
    }, { passive: false });
    
    document.body.appendChild(touchArea);
    
    console.log('Exit button and touch area created');
}

// Funzione per creare un pulsante X per uscire dal fullscreen (diverso dal VR)
function createFullscreenExitButton() {
    // Rimuovi eventuali pulsanti fullscreen esistenti
    removeFullscreenExitButton();
    
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isAndroid) {
        // Su Android, crea un overlay completo con area di uscita
        const androidOverlay = document.createElement('div');
        androidOverlay.id = 'android-fullscreen-overlay';
        androidOverlay.innerHTML = `
            <div id="android-exit-area">
                <div id="android-exit-button">✕</div>
                <div id="android-exit-text">TOCCA QUI PER USCIRE</div>
            </div>
        `;
        
        androidOverlay.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 2147483647 !important;
            pointer-events: none !important;
            background: transparent !important;
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'android-fullscreen-overlay-styles';
        styleSheet.textContent = `
            #android-exit-area {
                position: absolute !important;
                top: 0 !important;
                right: 0 !important;
                width: 300px !important;
                height: 300px !important;
                background: radial-gradient(circle, rgba(255, 0, 0, 0.8) 0%, rgba(255, 0, 0, 0.4) 50%, transparent 100%) !important;
                border-radius: 0 0 0 150px !important;
                pointer-events: auto !important;
                cursor: pointer !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: flex-start !important;
                padding-top: 30px !important;
                animation: androidPulse 1.5s infinite !important;
            }
            
            #android-exit-button {
                font-size: 60px !important;
                color: white !important;
                font-weight: 900 !important;
                text-shadow: 0 0 10px rgba(0, 0, 0, 0.8) !important;
                margin-bottom: 10px !important;
                font-family: Arial, sans-serif !important;
            }
            
            #android-exit-text {
                font-size: 12px !important;
                color: white !important;
                font-weight: bold !important;
                text-shadow: 0 0 5px rgba(0, 0, 0, 0.8) !important;
                text-align: center !important;
                font-family: Arial, sans-serif !important;
            }
            
            @keyframes androidPulse {
                0% { opacity: 0.6; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.05); }
                100% { opacity: 0.6; transform: scale(1); }
            }
        `;
        
        document.head.appendChild(styleSheet);
        document.body.appendChild(androidOverlay);
        
        // Event listeners per l'area di uscita
        const exitArea = document.getElementById('android-exit-area');
        
        exitArea.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Android exit area clicked');
            exitFullscreenMode();
        });
        
        exitArea.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Android exit area touched');
            exitFullscreenMode();
        }, { passive: false });
        
        exitArea.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Android exit area touch end');
            exitFullscreenMode();
        }, { passive: false });
        
        console.log('Android fullscreen overlay created');
        
    } else {
        // Desktop/iOS - usa il pulsante normale
        const fullscreenExitBtn = document.createElement('button');
        fullscreenExitBtn.id = 'fullscreen-only-exit-btn';
        fullscreenExitBtn.innerHTML = '×';
        fullscreenExitBtn.title = 'Esci dallo schermo intero';
        
        fullscreenExitBtn.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            width: 60px !important;
            height: 60px !important;
            background: rgba(0, 0, 0, 0.8) !important;
            color: white !important;
            border: 2px solid rgba(255, 255, 255, 0.5) !important;
            border-radius: 50% !important;
            font-size: 32px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            z-index: 99999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
            transition: all 0.3s ease !important;
            line-height: 1 !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            -webkit-tap-highlight-color: transparent !important;
            touch-action: manipulation !important;
            font-family: Arial, sans-serif !important;
            backdrop-filter: blur(10px) !important;
        `;
        
        // Event handlers per desktop
        fullscreenExitBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Desktop fullscreen exit button clicked');
            exitFullscreenMode();
        };
        
        fullscreenExitBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Desktop fullscreen exit button touched');
            exitFullscreenMode();
        }, { passive: false });
        
        document.body.appendChild(fullscreenExitBtn);
        
        console.log('Desktop fullscreen exit button created');
    }
}

function removeFullscreenExitButton() {
    // Rimuovi overlay Android
    const androidOverlay = document.getElementById('android-fullscreen-overlay');
    const androidStyles = document.getElementById('android-fullscreen-overlay-styles');
    
    if (androidOverlay) {
        androidOverlay.remove();
        console.log('Android fullscreen overlay removed');
    }
    
    if (androidStyles) {
        androidStyles.remove();
        console.log('Android fullscreen overlay styles removed');
    }
    
    // Rimuovi pulsanti desktop
    const fullscreenExitBtn = document.getElementById('fullscreen-only-exit-btn');
    const fullscreenTouchArea = document.getElementById('fullscreen-only-touch-area');
    const androidBanner = document.getElementById('android-fullscreen-banner');
    
    if (fullscreenExitBtn) {
        fullscreenExitBtn.remove();
        console.log('Fullscreen exit button removed');
    }
    
    if (fullscreenTouchArea) {
        fullscreenTouchArea.remove();
        console.log('Fullscreen touch area removed');
    }
    
    if (androidBanner) {
        androidBanner.remove();
        console.log('Android fullscreen banner removed');
    }
}

function removeExitButton() {
    const exitBtn = document.getElementById('fullscreen-exit-btn');
    const touchArea = document.getElementById('fullscreen-touch-area');
    
    if (exitBtn) {
        exitBtn.remove();
        console.log('Exit button removed');
    }
    
    if (touchArea) {
        touchArea.remove();
        console.log('Touch area removed');
    }
}

// Funzioni per il pulsante X di uscita dal VR - NON PIÙ USATE
// Il VR usa i controlli nativi di Android
/*
function createVRExitButton() {
    // Rimuovi eventuali pulsanti VR esistenti
    removeVRExitButton();
    
    const vrExitBtn = document.createElement('button');
    vrExitBtn.id = 'vr-exit-btn';
    vrExitBtn.innerHTML = '×';
    vrExitBtn.title = 'Esci dalla modalità VR';
    
    // Rileva se siamo su Android per ottimizzare il pulsante
    const isAndroid = /Android/i.test(navigator.userAgent);
    const buttonSize = isAndroid ? '80px' : '60px';
    const fontSize = isAndroid ? '40px' : '32px';
    const topPosition = isAndroid ? '30px' : '20px';
    
    vrExitBtn.style.cssText = `
        position: fixed !important;
        top: ${topPosition} !important;
        left: 20px !important;
        width: ${buttonSize} !important;
        height: ${buttonSize} !important;
        background: rgba(255, 0, 0, 0.95) !important;
        color: white !important;
        border: 3px solid rgba(255, 255, 255, 0.9) !important;
        border-radius: 50% !important;
        font-size: ${fontSize} !important;
        font-weight: bold !important;
        cursor: pointer !important;
        z-index: 99999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6) !important;
        transition: all 0.3s ease !important;
        line-height: 1 !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -webkit-tap-highlight-color: transparent !important;
        touch-action: manipulation !important;
        font-family: Arial, sans-serif !important;
        backdrop-filter: blur(10px) !important;
        opacity: 0.95 !important;
    `;
    
    // Funzione per uscire dal VR - NON PIÙ USATA
    // Il VR usa i controlli nativi di Android
    function exitVRMode() {
        console.log('Uscita dal VR tramite controlli nativi');
        
        // Rimuovi il flag VR attivo
        const viewer = document.getElementById('pano-viewer');
        if (viewer) {
            viewer.removeAttribute('data-vr-active');
        }
        
        // Invia messaggio all'iframe per uscire dal VR
        const iframe = document.querySelector('#pano-viewer iframe');
        if (iframe) {
            iframe.contentWindow.postMessage({ action: 'exitVR' }, '*');
        }
        
        // Removed notification
        
        // Se siamo in fullscreen, esci anche da quello
        if (document.fullscreenElement || document.webkitFullscreenElement || 
            document.mozFullScreenElement || document.msFullscreenElement) {
            exitFullscreenMode();
        }
    }
    
    // Event handler per il click
    vrExitBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('VR exit button clicked - onclick');
        exitVRMode();
    };
    
    // Event handler per il touch
    vrExitBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('VR exit button touched - touchstart');
        exitVRMode();
    }, { passive: false });
    
    // Effetti hover/touch
    vrExitBtn.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(255, 0, 0, 1)';
        this.style.transform = 'scale(1.1)';
    });
    
    vrExitBtn.addEventListener('mouseleave', function() {
        this.style.background = 'rgba(255, 0, 0, 0.9)';
        this.style.transform = 'scale(1)';
    });
    
    vrExitBtn.addEventListener('touchstart', function() {
        this.style.background = 'rgba(255, 0, 0, 1)';
        this.style.transform = 'scale(1.1)';
    });
    
    vrExitBtn.addEventListener('touchend', function() {
        this.style.background = 'rgba(255, 0, 0, 0.9)';
        this.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(vrExitBtn);
    
    // Crea anche un'area touch più grande per facilitare il tocco
    const vrTouchArea = document.createElement('div');
    vrTouchArea.id = 'vr-touch-area';
    vrTouchArea.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100px;
        height: 100px;
        z-index: 10001;
        background: transparent;
        cursor: pointer;
        touch-action: manipulation;
    `;
    
    vrTouchArea.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('VR touch area clicked');
        exitVRMode();
    };
    
    vrTouchArea.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('VR touch area touched');
        exitVRMode();
    }, { passive: false });
    
    document.body.appendChild(vrTouchArea);
    
    console.log('VR exit button and touch area created');
}

function removeVRExitButton() {
    const vrExitBtn = document.getElementById('vr-exit-btn');
    const vrTouchArea = document.getElementById('vr-touch-area');
    
    if (vrExitBtn) {
        vrExitBtn.remove();
        console.log('VR exit button removed');
    }
    
    if (vrTouchArea) {
        vrTouchArea.remove();
        console.log('VR touch area removed');
    }
}
*/

// Gestione messaggi dal panorama iframe per feedback VR
window.addEventListener('message', function(event) {
    console.log('Messaggio ricevuto da iframe:', event.data);
    
    if (event.data && event.data.action === 'vrActivated') {
        if (event.data.success) {
            console.log('VR attivato con successo nell\'iframe');
            // Segna che il VR è attivo
            const viewer = document.getElementById('pano-viewer');
            if (viewer) {
                viewer.setAttribute('data-vr-active', 'true');
            }
            // Removed notification
            // NON creare pulsante X per VR - Android ha il suo nativo
        } else {
            console.error('Errore VR nell\'iframe:', event.data.error);
            // Removed notification
        }
    }
    
    // Gestione entrata in modalità VR
    if (event.data && event.data.action === 'vrEntered') {
        console.log('Entrato in modalità VR - device ora in VR mode');
        // Segna che il VR è attivo
        const viewer = document.getElementById('pano-viewer');
        if (viewer) {
            viewer.setAttribute('data-vr-active', 'true');
        }
        // Removed notification
        // NON creare pulsante X per VR - Android ha il suo nativo
    }
    
    // Gestione uscita dalla modalità VR
    if (event.data && event.data.action === 'vrExited') {
        console.log('Uscito dalla modalità VR - uscendo anche dal fullscreen');
        // Rimuovi il flag VR attivo
        const viewer = document.getElementById('pano-viewer');
        if (viewer) {
            viewer.removeAttribute('data-vr-active');
        }
        // NON rimuovere pulsante VR perché non lo creiamo più
        // Quando si esce dal VR, esci automaticamente dal fullscreen
        if (document.fullscreenElement || document.webkitFullscreenElement || 
            document.mozFullScreenElement || document.msFullscreenElement) {
            exitFullscreenMode();
            // Removed notification
        }
    }
});

// Gestione eventi fullscreen per rimuovere i pulsanti X quando si esce con ESC
document.addEventListener('fullscreenchange', function() {
    if (!document.fullscreenElement) {
        console.log('Uscita da fullscreen rilevata (ESC o altro)');
        removeExitButton();
        removeFullscreenExitButton();
        removeVRExitButton(); // Rimuovi anche il pulsante VR
    }
});

document.addEventListener('webkitfullscreenchange', function() {
    if (!document.webkitFullscreenElement) {
        console.log('Uscita da webkit fullscreen rilevata');
        removeExitButton();
        removeFullscreenExitButton();
        removeVRExitButton(); // Rimuovi anche il pulsante VR
    }
});

document.addEventListener('mozfullscreenchange', function() {
    if (!document.mozFullScreenElement) {
        console.log('Uscita da moz fullscreen rilevata');
        removeExitButton();
        removeFullscreenExitButton();
        removeVRExitButton(); // Rimuovi anche il pulsante VR
    }
});

document.addEventListener('msfullscreenchange', function() {
    if (!document.msFullscreenElement) {
        console.log('Uscita da ms fullscreen rilevata');
        removeExitButton();
        removeFullscreenExitButton();
        removeVRExitButton(); // Rimuovi anche il pulsante VR
    }
});

function toggleVRMode() {
    const viewer = document.getElementById('pano-viewer');
    const iframe = viewer ? viewer.querySelector('iframe') : null;
    
    console.log('toggleVRMode chiamata');
    console.log('Viewer:', viewer);
    console.log('Iframe src:', iframe ? iframe.src : 'no iframe');
    
    // Verifica se siamo su iPhone
    if (isIPhone()) {
        console.log('iPhone rilevato - VR non supportato');
        // Removed notification
        return;
    }
    
    if (!iframe) {
        console.error('Iframe non trovato');
        // Removed notification
        return;
    }

    // Verifica se è un panorama A-Frame
    if (iframe.src.includes('panorama.html')) {
        console.log('Panorama A-Frame rilevato');
        
        // Controlla se siamo su dispositivo mobile
        if (!isMobileDevice()) {
            console.log('Dispositivo desktop rilevato - VR non supportato');
            // Removed notification
            return;
        }
        
        console.log('Dispositivo mobile rilevato - attivando VR');
        
        try {
            // Attiva solo la modalità VR, senza fullscreen automatico
            console.log('VR: Attivando modalità VR A-Frame');
            iframe.contentWindow.postMessage({ action: 'enterVR' }, '*');
            
            // Segna che il VR è attivo
            const viewer = document.getElementById('pano-viewer');
            viewer.setAttribute('data-vr-active', 'true');
            
            // NON creare pulsante X per VR - Android ha il suo nativo
            console.log('VR: Modalità VR attivata senza pulsanti custom');
            
            // Su Android, non creare pulsanti aggiuntivi
            if (/Android/i.test(navigator.userAgent)) {
                console.log('Android rilevato - usando pulsanti VR nativi');
            }
            
            // Mostra un messaggio per suggerire il fullscreen manualmente
            setTimeout(() => {
                console.log('VR: Modalità VR attivata, suggerimento fullscreen');
                // Potremmo aggiungere un pulsante per fullscreen se necessario
            }, 500);
            
        } catch (err) {
            console.error('Errore nell\'attivazione VR:', err);
            // Removed notification
        }
        
    } else {
        // Metodo tradizionale per iframe Kuula
        let src = iframe.src;
        let isVRMode = src.includes('vr=1');
        
        // Check if it's a single tour (Santa Maria della Croce)
        let isSingleTour = src.includes('hdWFx');
        
        if (isVRMode) {
            // Disable VR mode
            src = src.replace('vr=1', 'vr=0');
            const vrBtn = document.querySelector('.btn[onclick="toggleVRMode()"]');
            if (vrBtn) {
                vrBtn.innerHTML = '<i data-feather="eye"></i> Modalità VR';
                vrBtn.classList.remove('btn-primary');
                vrBtn.classList.add('btn-outline');
            }
            removeVRExitButton(); // Rimuovi il pulsante X del VR
            // Removed notification
        } else {
            // Enable VR mode
            src = src.replace('vr=0', 'vr=1');
            const vrBtn = document.querySelector('.btn[onclick="toggleVRMode()"]');
            if (vrBtn) {
                vrBtn.innerHTML = '<i data-feather="eye"></i> VR Attiva';
                vrBtn.classList.remove('btn-outline');
                vrBtn.classList.add('btn-primary');
            }
            
            // Crea il pulsante X per uscire dal VR dopo un delay
            setTimeout(() => {
                createVRExitButton();
            }, 1000); // Delay per permettere al VR di attivarsi
            
            if (isSingleTour) {
                // Removed notification
            } else {
                // Removed notification
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
        // Removed notification
    }
}

// Utility Functions
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
}

function isIPhone() {
    return /iPhone/i.test(navigator.userAgent);
}

function manageVRButtonVisibility() {
    const vrButtons = document.querySelectorAll('.mobile-only');
    
    vrButtons.forEach(button => {
        if (isIPhone()) {
            // Nascondi il pulsante VR su iPhone
            button.classList.add('hide-on-iphone');
            console.log('VR button nascosto su iPhone');
        } else {
            // Rimuovi la classe se non è iPhone
            button.classList.remove('hide-on-iphone');
        }
    });
}

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

// Funzione di test per i pulsanti X su Android
function testAndroidXButtons() {
    console.log('=== Test Pulsanti X su Android ===');
    console.log('User Agent:', navigator.userAgent);
    console.log('Is Android:', /Android/i.test(navigator.userAgent));
    console.log('Is Mobile:', isMobileDevice());
    
    // Rimuovi tutti i pulsanti esistenti
    removeVRExitButton();
    removeExitButton();
    removeFullscreenExitButton();
    
    // Crea i pulsanti di test
    console.log('Creando pulsanti di test...');
    createVRExitButton();
    createExitButton();
    createFullscreenExitButton();
    
    // Su Android, mostra anche l'overlay di emergenza
    if (/Android/i.test(navigator.userAgent)) {
        console.log('Mostrando overlay di emergenza Android...');
        showAndroidEmergencyOverlay();
    }
    
    // Verifica che siano stati creati
    setTimeout(() => {
        const vrBtn = document.getElementById('vr-exit-btn');
        const exitBtn = document.getElementById('fullscreen-exit-btn');
        const fullscreenBtn = document.getElementById('fullscreen-only-exit-btn');
        const androidOverlay = document.getElementById('android-fullscreen-overlay');
        const emergencyOverlay = document.getElementById('android-emergency-overlay');
        
        console.log('VR Exit Button:', !!vrBtn);
        console.log('Exit Button:', !!exitBtn);
        console.log('Fullscreen Exit Button:', !!fullscreenBtn);
        console.log('Android Overlay:', !!androidOverlay);
        console.log('Emergency Overlay:', !!emergencyOverlay);
        
        if (vrBtn) {
            console.log('VR Button visibility:', window.getComputedStyle(vrBtn).visibility);
            console.log('VR Button display:', window.getComputedStyle(vrBtn).display);
            console.log('VR Button z-index:', window.getComputedStyle(vrBtn).zIndex);
        }
        
        if (exitBtn) {
            console.log('Exit Button visibility:', window.getComputedStyle(exitBtn).visibility);
            console.log('Exit Button display:', window.getComputedStyle(exitBtn).display);
            console.log('Exit Button z-index:', window.getComputedStyle(exitBtn).zIndex);
        }
        
        if (androidOverlay) {
            console.log('Android Overlay visibility:', window.getComputedStyle(androidOverlay).visibility);
            console.log('Android Overlay display:', window.getComputedStyle(androidOverlay).display);
            console.log('Android Overlay z-index:', window.getComputedStyle(androidOverlay).zIndex);
        }
        
        console.log('=== Fine Test ===');
    }, 500);
}

// Make debug functions available globally
window.debugApp = debugApp;
window.testAndroidXButtons = testAndroidXButtons;

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

// Load monument data from monuments.json and generate monument cards dynamically
async function loadMonumentsFromJSON() {
    try {
        const response = await fetch('data/monuments.json');
        const monumentsData = await response.json();
        
        // Get the monuments container
        const monumentsContainer = document.getElementById('monuments-container');
        if (!monumentsContainer) {
            console.error('Monuments container not found');
            return;
        }
        
        // Clear any existing content
        monumentsContainer.innerHTML = '';
        
        // Group monuments by category for better organization
        const categoryMapping = {
            'church': 'Chiese',
            'convent': 'Conventi', 
            'palace': 'Palazzi',
            'civic': 'Architettura Civile',
            'theater': 'Cultura e Spettacolo',
            'educational': 'Educazione',
            'financial': 'Istituzioni Finanziarie',
            'technology': 'Tecnologia',
            'monument': 'Monumenti',
            'nature': 'Natura e Paesaggio'
        };
        
        // Create monument cards for each monument in JSON
        monumentsData.forEach(monument => {
            const monumentCard = createMonumentCard(monument);
            monumentsContainer.appendChild(monumentCard);
        });
        
        // Update results count
        const resultsText = document.getElementById('results-text');
        if (resultsText) {
            resultsText.textContent = `${monumentsData.length} monumenti trovati`;
        }
        
        // Reinitialize Feather icons for the dynamically generated content
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        
        console.log('Monuments loaded successfully from monuments.json');
    } catch (error) {
        console.error('Error loading monuments from JSON:', error);
        const monumentsContainer = document.getElementById('monuments-container');
        if (monumentsContainer) {
            monumentsContainer.innerHTML = '<p>Errore nel caricamento dei monumenti. Riprova più tardi.</p>';
        }
    }
}

// Create a monument card element from monument data
function createMonumentCard(monument) {
    // Get thumbnail image
    let thumbnailImage = null;
    if (monument.images && monument.images.length > 0) {
        // Look for image with role thumbnail first
        thumbnailImage = monument.images.find(img => img.role === 'thumbnail');
        // If no thumbnail role, use first standard format image  
        if (!thumbnailImage) {
            thumbnailImage = monument.images.find(img => img.format === 'standard');
        }
        // If still no image, use first available
        if (!thumbnailImage) {
            thumbnailImage = monument.images[0];
        }
    }
    
    // Default image if none found
    const imagePath = thumbnailImage ? thumbnailImage.path : 'src/imgs/flat/regalbuto-plaza.jpg';
    const imageAlt = thumbnailImage ? (thumbnailImage.alt || monument.name) : monument.name;
    
    // Map category to display name
    const categoryDisplay = getCategoryDisplayName(monument.category);
    
    // Create the monument card HTML
    const cardHTML = `
        <div class="monument-card" data-category="${monument.category}" data-monument-id="${monument.id}">
            <div class="monument-image">
                <img src="${imagePath}" alt="${imageAlt}">
                <div class="monument-category-badge">${categoryDisplay}</div>
            </div>
            <div class="monument-info">
                <h4>${monument.name}</h4>
                <p class="monument-description">${monument.short_description || 'Monumento storico di Regalbuto'}</p>
                <div class="monument-details">
                    <span class="distance">
                        <i data-feather="map-pin"></i>
                        ${monument.address ? '0.5 km' : 'Posizione da definire'}
                    </span>
                    <button class="expand-btn" onclick="toggleMonument('${monument.id}')">
                        <i data-feather="chevron-right"></i>
                    </button>
                </div>
            </div>
            <div class="monument-content" id="content-${monument.id}">
                <div class="monument-description">
                    ${generateMonumentDescription(monument)}
                </div>
                <div class="monument-actions">
                    ${generateMonumentActions(monument)}
                </div>
            </div>
        </div>
    `;
    
    // Create a temporary container to parse the HTML
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = cardHTML;
    
    // Return the first child element
    return tempContainer.firstElementChild;
}

// Get display name for category
function getCategoryDisplayName(category) {
    const categoryNames = {
        'church': 'Chiesa',
        'convent': 'Convento', 
        'palace': 'Palazzo',
        'civic': 'Civico',
        'theater': 'Teatro',
        'educational': 'Educativo',
        'financial': 'Finanziario',
        'technology': 'Tecnologia',
        'monument': 'Monumento',
        'nature': 'Natura'
    };
    return categoryNames[category] || 'Monumento';
}

// Generate monument description from JSON data
function generateMonumentDescription(monument) {
    let description = '';
    
    if (monument.history && monument.history.length > 0) {
        monument.history.forEach(period => {
            description += `<p><strong>${period.title}:</strong> ${period.description}</p>`;
        });
    } else {
        description = `<p>${monument.short_description || 'Informazioni dettagliate in fase di aggiornamento.'}</p>`;
    }
    
    return description;
}

// Generate monument actions based on available features
function generateMonumentActions(monument) {
    let actions = '';
    
    // Audio guide button if available
    if (monument.audio) {
        actions += `
            <button class="btn btn-primary" onclick="playAudioGuide('${monument.id}')">
                <i data-feather="headphones"></i>
                Ascolta Audio Guida
            </button>
        `;
    }
    
    // Map location button if coordinates available
    if (monument.lat && monument.lon) {
        actions += `
            <button class="btn btn-secondary" onclick="openMapLocation('${monument.id}')">
                <i data-feather="map-pin"></i>
                Portami lì
            </button>
        `;
    }
    
    // Virtual tour button if 360° images available
    if (monument.images && monument.images.some(img => img.format === '360')) {
        actions += `
            <button class="btn btn-secondary" onclick="openVirtualTour('${monument.id}')">
                <i data-feather="eye"></i>
                Tour Virtuale 360°
            </button>
        `;
    }
    
    return actions || '<p>Ulteriori funzionalità disponibili a breve</p>';
}

// Backup initialization for monument loading
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Feather icons for the modal
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Controlla e gestisci la visibilità del pulsante VR
    manageVRButtonVisibility();
    
    // Load monuments from JSON data (backup call)
    setTimeout(() => {
        if (document.getElementById('monuments-container').children.length === 0) {
            loadMonumentsFromJSON();
        }
    }, 1000);
});

// GPS Navigation Variables
let gpsMap = null; // MapLibre GL JS map instance
let userLocation = null;
let navigationActive = false;
let routeData = null;
let currentCheckpointIndex = 0;
let checkpoints = [];
let watchId = null;

// GPS Navigation Functions
async function initializeGPSMap() {
    if (gpsMap) return;
    
    try {
        // Initialize MapLibre GL JS map with CartoDB Positron style
        gpsMap = new maplibregl.Map({
            container: 'gps-map',
            style: {
                version: 8,
                sources: {
                    'carto-positron': {
                        type: 'raster',
                        tiles: [
                            'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                            'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                            'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                            'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
                        ],
                        tileSize: 256,
                        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
                    }
                },
                layers: [{
                    id: 'carto-positron',
                    type: 'raster',
                    source: 'carto-positron'
                }]
            },
            center: [14.641, 37.650], // Regalbuto center
            zoom: 14,
            pitch: 0,
            bearing: 0
        });
        
        // Add navigation controls
        gpsMap.addControl(new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true
        }), 'top-right');
        
        // Add geolocate control
        const geolocateControl = new maplibregl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        });
        
        gpsMap.addControl(geolocateControl, 'top-right');
        
        // Wait for map to load
        gpsMap.on('load', async () => {
            console.log('GPS Map loaded');
            await loadRouteData();
            setupRouteVisualization();
            updateCheckpointsList();
        });
        
        // Handle geolocation events
        geolocateControl.on('geolocate', (e) => {
            userLocation = [e.coords.longitude, e.coords.latitude];
            if (navigationActive) {
                updateNavigationInstructions();
            }
        });
        
    } catch (error) {
        console.error('Error initializing GPS map:', error);
        alert('Errore nell\'inizializzazione della mappa GPS. Riprova più tardi.');
    }
}

// Helper function to ensure popup is properly positioned and visible
function createOptimallyPositionedPopup(coordinates, content, map) {
    // Always use bottom anchor for consistency
    const popup = new maplibregl.Popup({
        maxWidth: '300px',
        className: 'gps-monument-popup',
        closeButton: true,
        anchor: 'bottom',
        offset: [0, 250]
    })
        .setLngLat(coordinates)
        .setHTML(content)
        .addTo(map);
    
    // Simple pan to ensure popup is visible
    // Move the map so the pin is in the bottom half, popup in top half
    setTimeout(() => {
        const mapContainer = map.getContainer();
        const mapHeight = mapContainer.offsetHeight;
        
        // Calculate a point slightly below center to show popup above
        const bounds = map.getBounds();
        const latRange = bounds.getNorth() - bounds.getSouth();
        const offsetLat = latRange * 0.15; // Move pin down 15% of visible area
        
        const newCenter = [
            coordinates[0], // Keep same longitude
            coordinates[1] - offsetLat // Move latitude down
        ];
        
        map.easeTo({
            center: newCenter,
            zoom: Math.max(map.getZoom(), 16),
            duration: 500,
            essential: true
        });
    }, 150);
    
    return popup;
}

async function loadRouteData() {
    try {
        const response = await fetch('data/test_itinerario_turistico.geojson');
        const data = await response.json();
        routeData = data;
        
        // Extract checkpoints from GeoJSON
        checkpoints = [];
        data.features.forEach(feature => {
            if (feature.geometry.type === 'Point' && feature.properties.name) {
                checkpoints.push({
                    name: feature.properties.name,
                    coordinates: feature.geometry.coordinates,
                    monument_id: feature.properties.monument_id || null,
                    visited: false
                });
            }
        });
        
        console.log('Route data loaded:', checkpoints.length, 'checkpoints');
        
        // Update total count
        document.getElementById('total-count').textContent = checkpoints.length;
        
    } catch (error) {
        console.error('Error loading route data:', error);
    }
}

function setupRouteVisualization() {
    if (!gpsMap || !routeData) return;
    
    // Add route source
    gpsMap.addSource('route', {
        type: 'geojson',
        data: routeData
    });
    
    // Add route line layer
    gpsMap.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        filter: ['==', '$type', 'LineString'],
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#4a5568',
            'line-width': 4,
            'line-opacity': 0.8
        }
    });
    
    // Add checkpoints layer
    gpsMap.addLayer({
        id: 'checkpoints',
        type: 'circle',
        source: 'route',
        filter: ['==', '$type', 'Point'],
        paint: {
            'circle-radius': 12,
            'circle-color': '#ffd700',
            'circle-stroke-color': '#4a5568',
            'circle-stroke-width': 3
        }
    });
    
    // Add checkpoint labels
    gpsMap.addLayer({
        id: 'checkpoint-labels',
        type: 'symbol',
        source: 'route',
        filter: ['==', '$type', 'Point'],
        layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Regular'],
            'text-offset': [0, 2],
            'text-anchor': 'top',
            'text-size': 12
        },
        paint: {
            'text-color': '#2c2c2c',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2
        }
    });
    
    // Add click events for checkpoints
    gpsMap.on('click', 'checkpoints', async (e) => {
        console.log('Checkpoint clicked, creating popup...');
        
        // Close any existing popups first
        const existingPopups = document.querySelectorAll('.maplibregl-popup');
        existingPopups.forEach(popup => popup.remove());
        
        const coordinates = e.features[0].geometry.coordinates.slice();
        const name = e.features[0].properties.name;
        const monumentId = e.features[0].properties.monument_id;
        
        console.log('Popup coordinates:', coordinates);
        console.log('Monument ID:', monumentId);
        
        // Try to get monument data if monument_id is available
        let popupContent = '';
        if (monumentId) {
            try {
                const response = await fetch('data/monuments.json');
                const monumentsData = await response.json();
                const monument = monumentsData.find(m => m.id === monumentId);
                
                if (monument) {
                    // Check if monument has virtual tour and audio guide
                    const hasVirtualTour = monument.images && monument.images.some(img => img.format === '360');
                    const hasAudioGuide = monument.audio && monument.audio.path;
                    
                    // Use the same enhanced tooltip as the OpenStreetMap
                    popupContent = createEnhancedTooltip(monument, hasVirtualTour, hasAudioGuide);
                    console.log('Created enhanced popup for:', monument.name);
                } else {
                    // Fallback if monument not found
                    popupContent = createCheckpointTooltip(name, coordinates);
                    console.log('Monument not found, using simple tooltip');
                }
            } catch (error) {
                console.error('Error loading monument data for popup:', error);
                popupContent = createCheckpointTooltip(name, coordinates);
            }
        } else {
            // No monument_id, create simple checkpoint tooltip
            popupContent = createCheckpointTooltip(name, coordinates);
            console.log('No monument ID, using simple tooltip');
        }
        
        // Create popup
        const popup = createOptimallyPositionedPopup(coordinates, popupContent, gpsMap);
        console.log('Popup created:', popup);
        
        // Force visibility after a delay
        setTimeout(() => {
            const popupElement = popup.getElement();
            console.log('Popup element:', popupElement);
            if (popupElement) {
                popupElement.style.display = 'block';
                popupElement.style.visibility = 'visible';
                popupElement.style.opacity = '1';
                popupElement.style.zIndex = '1000';
                console.log('Popup forced visible');
            }
        }, 200);
    });
    
    // Fit map to route bounds
    const routeFeature = routeData.features.find(f => f.geometry.type === 'LineString');
    if (routeFeature) {
        const coordinates = routeFeature.geometry.coordinates;
        const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
        }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
        
        gpsMap.fitBounds(bounds, { padding: 50 });
    }
}

function startNavigation() {
    if (!checkpoints.length || !gpsMap) {
        alert('Dati del percorso non disponibili. Riprova tra qualche istante.');
        return;
    }
    
    navigationActive = true;
    currentCheckpointIndex = 0;
    
    // Update UI
    document.getElementById('start-navigation-btn').style.display = 'none';
    document.getElementById('stop-navigation-btn').style.display = 'inline-flex';
    document.getElementById('navigation-info').style.display = 'block';
    
    // Start geolocation tracking
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                userLocation = [position.coords.longitude, position.coords.latitude];
                updateUserLocationOnMap();
                updateNavigationInstructions();
                checkCheckpointProximity();
            },
            (error) => {
                console.error('Geolocation error:', error);
                document.getElementById('instruction-text').textContent = 
                    'Errore GPS. Verifica le impostazioni di localizzazione.';
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 1000
            }
        );
    } else {
        alert('GPS non supportato su questo dispositivo.');
        stopNavigation();
        return;
    }
    
    document.getElementById('instruction-text').textContent = 'Acquisizione posizione GPS...';
    updateNextDestination();
    updateCheckpointsList();
    
    console.log('Navigation started');
}

function stopNavigation() {
    navigationActive = false;
    
    // Stop geolocation tracking
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    
    // Update UI
    document.getElementById('start-navigation-btn').style.display = 'inline-flex';
    document.getElementById('stop-navigation-btn').style.display = 'none';
    document.getElementById('navigation-info').style.display = 'none';
    
    // Remove user location marker
    if (gpsMap && gpsMap.getSource('user-location')) {
        gpsMap.removeLayer('user-location');
        gpsMap.removeSource('user-location');
    }
    
    console.log('Navigation stopped');
}

function updateUserLocationOnMap() {
    if (!gpsMap || !userLocation) return;
    
    const userLocationGeoJSON = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: userLocation
        }
    };
    
    if (gpsMap.getSource('user-location')) {
        gpsMap.getSource('user-location').setData(userLocationGeoJSON);
    } else {
        gpsMap.addSource('user-location', {
            type: 'geojson',
            data: userLocationGeoJSON
        });
        
        gpsMap.addLayer({
            id: 'user-location',
            type: 'circle',
            source: 'user-location',
            paint: {
                'circle-radius': 8,
                'circle-color': '#007cbf',
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2
            }
        });
    }
    
    // Center map on user location if navigation is active
    if (navigationActive) {
        gpsMap.easeTo({
            center: userLocation,
            zoom: 16,
            duration: 1000
        });
    }
}

function updateNavigationInstructions() {
    if (!navigationActive || !userLocation || !checkpoints.length) return;
    
    const currentCheckpoint = checkpoints[currentCheckpointIndex];
    if (!currentCheckpoint) return;
    
    const distance = calculateDistance(
        userLocation[1], userLocation[0],
        currentCheckpoint.coordinates[1], currentCheckpoint.coordinates[0]
    );
    
    let instruction = '';
    if (distance < 0.05) { // Less than 50 meters
        instruction = `Sei arrivato a: ${currentCheckpoint.name}`;
    } else if (distance < 0.1) { // Less than 100 meters
        instruction = `${currentCheckpoint.name} è a ${Math.round(distance * 1000)} metri`;
    } else {
        instruction = `Dirigiti verso: ${currentCheckpoint.name} (${distance.toFixed(2)} km)`;
    }
    
    document.getElementById('instruction-text').textContent = instruction;
    
    // Update remaining distance
    const totalRemaining = calculateRemainingDistance();
    document.getElementById('remaining-distance').textContent = `${totalRemaining.toFixed(2)} km`;
}

function checkCheckpointProximity() {
    if (!navigationActive || !userLocation || !checkpoints.length) return;
    
    const currentCheckpoint = checkpoints[currentCheckpointIndex];
    if (!currentCheckpoint || currentCheckpoint.visited) return;
    
    const distance = calculateDistance(
        userLocation[1], userLocation[0],
        currentCheckpoint.coordinates[1], currentCheckpoint.coordinates[0]
    );
    
    // Mark as visited if within 50 meters
    if (distance < 0.05) {
        currentCheckpoint.visited = true;
        currentCheckpointIndex++;
        
        // Update visited count
        const visitedCount = checkpoints.filter(cp => cp.visited).length;
        document.getElementById('visited-count').textContent = visitedCount;
        
        // Check if route completed
        if (currentCheckpointIndex >= checkpoints.length) {
            document.getElementById('instruction-text').textContent = 'Itinerario completato! Congratulazioni!';
            document.getElementById('next-destination-text').textContent = 'Percorso terminato';
        } else {
            updateNextDestination();
        }
        
        updateCheckpointsList();
        
        // Show completion notification
        if (visitedCount === checkpoints.length) {
            setTimeout(() => {
                alert('🎉 Complimenti! Hai completato l\'itinerario turistico di Regalbuto!');
            }, 1000);
        }
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function calculateRemainingDistance() {
    if (!userLocation || !checkpoints.length) return 0;
    
    let totalDistance = 0;
    
    // Distance to current checkpoint
    if (currentCheckpointIndex < checkpoints.length) {
        const currentCheckpoint = checkpoints[currentCheckpointIndex];
        totalDistance += calculateDistance(
            userLocation[1], userLocation[0],
            currentCheckpoint.coordinates[1], currentCheckpoint.coordinates[0]
        );
        
        // Distance between remaining checkpoints
        for (let i = currentCheckpointIndex; i < checkpoints.length - 1; i++) {
            totalDistance += calculateDistance(
                checkpoints[i].coordinates[1], checkpoints[i].coordinates[0],
                checkpoints[i + 1].coordinates[1], checkpoints[i + 1].coordinates[0]
            );
        }
    }
    
    return totalDistance;
}

function updateNextDestination() {
    if (currentCheckpointIndex < checkpoints.length) {
        const nextCheckpoint = checkpoints[currentCheckpointIndex];
        document.getElementById('next-destination-text').textContent = nextCheckpoint.name;
    } else {
        document.getElementById('next-destination-text').textContent = 'Percorso completato';
    }
}

function updateCheckpointsList() {
    const container = document.getElementById('route-checkpoints');
    container.innerHTML = '';
    
    checkpoints.forEach((checkpoint, index) => {
        const item = document.createElement('div');
        item.className = 'checkpoint-item';
        
        if (checkpoint.visited) {
            item.classList.add('visited');
        } else if (index === currentCheckpointIndex && navigationActive) {
            item.classList.add('current');
        }
        
        const distance = userLocation ? 
            calculateDistance(
                userLocation[1], userLocation[0],
                checkpoint.coordinates[1], checkpoint.coordinates[0]
            ).toFixed(2) + ' km' : '--';
        
        const statusIcon = checkpoint.visited ? 'check-circle' : 
                          (index === currentCheckpointIndex && navigationActive) ? 'navigation-2' : 'circle';
        
        const statusText = checkpoint.visited ? 'Visitato' : 
                          (index === currentCheckpointIndex && navigationActive) ? 'Destinazione attuale' : 'Da visitare';
        
        item.innerHTML = `
            <div class="checkpoint-icon">${index + 1}</div>
            <div class="checkpoint-info">
                <div class="checkpoint-name">${checkpoint.name}</div>
                <div class="checkpoint-distance">Distanza: ${distance}</div>
                <div class="checkpoint-status">
                    <i data-feather="${statusIcon}"></i>
                    <span>${statusText}</span>
                </div>
            </div>
        `;
        
        container.appendChild(item);
    });
    
    // Re-initialize feather icons
    feather.replace();
}

// Helper functions for GPS popup buttons
function centerGPSMapOnLocation(lat, lon) {
    if (gpsMap) {
        gpsMap.flyTo({
            center: [lon, lat],
            zoom: 17,
            duration: 1500
        });
    }
}

function startNavigationToPoint(name, lat, lon) {
    // Find the checkpoint index for this location
    const checkpointIndex = checkpoints.findIndex(cp => 
        Math.abs(cp.coordinates[1] - lat) < 0.0001 && 
        Math.abs(cp.coordinates[0] - lon) < 0.0001
    );
    
    if (checkpointIndex !== -1) {
        currentCheckpointIndex = checkpointIndex;
        
        if (!navigationActive) {
            startNavigation();
        } else {
            updateNextDestination();
            updateCheckpointsList();
            updateNavigationInstructions();
        }
        
        alert(`Navigazione impostata verso: ${name}`);
    } else {
        alert('Punto non trovato nell\'itinerario.');
    }
}

// Enhanced functions for map popup buttons (compatible with both OpenStreetMap and GPS popups)
function playAudioGuideFromMap(monumentId) {
    // Close any open popups first
    if (gpsMap) {
        const popups = document.querySelectorAll('.maplibregl-popup');
        popups.forEach(popup => popup.remove());
    }
    if (map) map.closePopup();
    
    // Switch to monuments tab and play audio
    switchTab('monumenti');
    setTimeout(() => {
        playAudioGuide(monumentId);
    }, 500);
}

function openVirtualTourFromMap(monumentId) {
    // Close any open popups first
    if (gpsMap) {
        const popups = document.querySelectorAll('.maplibregl-popup');
        popups.forEach(popup => popup.remove());
    }
    if (map) map.closePopup();
    
    // Get monument data to find 360° image
    fetch('data/monuments.json')
        .then(response => response.json())
        .then(monumentsData => {
            const monument = monumentsData.find(m => m.id === monumentId);
            if (monument && monument.images) {
                const image360 = monument.images.find(img => img.format === '360');
                if (image360) {
                    // Extract filename from path for panorama viewer
                    const filename = image360.path.split('/').pop();
                    openVirtualTour(filename);
                } else {
                    alert('Tour 360° non disponibile per questo monumento.');
                }
            } else {
                alert('Dati del monumento non trovati.');
            }
        })
        .catch(error => {
            console.error('Error loading monument data:', error);
            alert('Errore nel caricamento del tour virtuale.');
        });
}

function centerOnUserLocation() {
    if (!gpsMap) {
        alert('Mappa non inizializzata.');
        return;
    }
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = [position.coords.longitude, position.coords.latitude];
                userLocation = coords;
                
                gpsMap.flyTo({
                    center: coords,
                    zoom: 16,
                    duration: 2000
                });
                
                updateUserLocationOnMap();
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Impossibile ottenere la posizione. Verifica le impostazioni GPS.');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    } else {
        alert('Geolocalizzazione non supportata su questo dispositivo.');
    }
}

console.log('Regalbuto Heritage - Script loaded successfully');
