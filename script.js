// Global Variables
let currentQuizQuestion = 1;
let quizAnswers = {};
let qrScanner = null;
let currentFilter = 'all';
let previousOrientation = null; // Store previous orientation for VR mode

// WebView Orientation Control Functions for VR Mode
function activateLandscapeForVR() {
    console.log('Activating landscape mode for VR...');
    
    // Store current orientation if available
    if (typeof window.Android !== 'undefined' && window.Android.getCurrentOrientation) {
        try {
            previousOrientation = window.Android.getCurrentOrientation();
            console.log('Stored previous orientation:', previousOrientation);
        } catch (e) {
            console.log('Could not get current orientation:', e);
            previousOrientation = 'portrait'; // Default fallback
        }
    }
    
    // Activate landscape orientation for Android WebView
    if (typeof window.Android !== 'undefined' && window.Android.setOrientation) {
        try {
            console.log('Setting landscape orientation via Android interface...');
            window.Android.setOrientation('landscape');
            console.log('✅ Android landscape orientation activated');
        } catch (e) {
            console.error('❌ Error setting landscape orientation:', e);
        }
    } else {
        console.log('⚠️ Android WebView interface not available');
    }
    
    // Activate landscape orientation for iOS WebView
    if (typeof window.webkit !== 'undefined' && 
        window.webkit.messageHandlers && 
        window.webkit.messageHandlers.setOrientation) {
        try {
            console.log('Setting landscape orientation via iOS interface...');
            window.webkit.messageHandlers.setOrientation.postMessage({
                orientation: 'landscape'
            });
            console.log('✅ iOS landscape orientation activated');
        } catch (e) {
            console.error('❌ Error setting landscape orientation on iOS:', e);
        }
    } else {
        console.log('⚠️ iOS WebView interface not available');
    }
    
    // Fallback: Use CSS orientation lock if available (modern browsers)
    if (screen.orientation && screen.orientation.lock) {
        try {
            console.log('Attempting CSS orientation lock...');
            screen.orientation.lock('landscape').then(() => {
                console.log('✅ CSS landscape lock successful');
            }).catch(e => {
                console.log('❌ CSS landscape lock failed:', e);
            });
        } catch (e) {
            console.log('⚠️ CSS orientation lock not available:', e);
        }
    } else {
        console.log('⚠️ CSS orientation lock not supported');
    }
    
    // Debug: Check what WebView interfaces are available
    console.log('🔍 WebView Debug Info:');
    console.log('- Android interface available:', typeof window.Android !== 'undefined');
    console.log('- iOS webkit available:', typeof window.webkit !== 'undefined');
    console.log('- Screen orientation API available:', typeof screen.orientation !== 'undefined');
    console.log('- User agent:', navigator.userAgent);
}

function restorePreviousOrientation() {
    console.log('Restoring previous orientation after VR exit...');
    
    // Restore orientation for Android WebView
    if (typeof window.Android !== 'undefined' && window.Android.setOrientation) {
        try {
            const orientationToRestore = previousOrientation || 'portrait';
            console.log('Restoring orientation via Android interface:', orientationToRestore);
            window.Android.setOrientation(orientationToRestore);
            console.log('✅ Android orientation restored');
        } catch (e) {
            console.error('❌ Error restoring orientation:', e);
        }
    } else {
        console.log('⚠️ Android WebView interface not available for restore');
    }
    
    // Restore orientation for iOS WebView
    if (typeof window.webkit !== 'undefined' && 
        window.webkit.messageHandlers && 
        window.webkit.messageHandlers.setOrientation) {
        try {
            const orientationToRestore = previousOrientation || 'portrait';
            console.log('Restoring orientation via iOS interface:', orientationToRestore);
            window.webkit.messageHandlers.setOrientation.postMessage({
                orientation: orientationToRestore
            });
            console.log('✅ iOS orientation restored');
        } catch (e) {
            console.error('❌ Error restoring orientation on iOS:', e);
        }
    } else {
        console.log('⚠️ iOS WebView interface not available for restore');
    }
    
    // Fallback: Unlock orientation if available
    if (screen.orientation && screen.orientation.unlock) {
        try {
            console.log('Unlocking CSS orientation...');
            screen.orientation.unlock();
            console.log('✅ CSS orientation unlocked');
        } catch (e) {
            console.log('❌ CSS orientation unlock failed:', e);
        }
    } else {
        console.log('⚠️ CSS orientation unlock not available');
    }
    
    // Clear stored orientation
    console.log('🔄 Clearing stored orientation state');
    previousOrientation = null;
}

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
    
    // Load monuments from JSON data
    loadMonumentsFromJSON();
    
    // Populate virtual tour locations dynamically
    populateVirtualTourLocations();
    
    // Ottimizzazioni specifiche per iOS WebView touch events
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
        console.log('Applicando correzioni touch iOS...');
        
        // Disabilita il comportamento touch predefinito per prevenire flickering
        document.addEventListener('touchstart', function(e) {
            // Non impedire il touch sui form elements
            if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                const targetElement = e.target.closest('button, .btn, .nav-item, .monument-card');
                if (targetElement) {
                    // Aggiungi classe active per feedback visivo immediato
                    targetElement.classList.add('ios-touch-active');
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchend', function(e) {
            // Rimuovi classe active con delay per evitare flickering
            const activeElements = document.querySelectorAll('.ios-touch-active');
            activeElements.forEach(element => {
                setTimeout(() => {
                    element.classList.remove('ios-touch-active');
                }, 150);
            });
        }, { passive: true });
        
        document.addEventListener('touchcancel', function(e) {
            // Pulisci active states su cancel
            const activeElements = document.querySelectorAll('.ios-touch-active');
            activeElements.forEach(element => {
                element.classList.remove('ios-touch-active');
            });
        }, { passive: true });
        
        // Previeni il zoom doppio tap che può causare flickering
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(e) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Ottimizzazione per il viewport meta tag
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
            viewportMeta.setAttribute('content', 
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, ' +
                'user-scalable=no, viewport-fit=cover, shrink-to-fit=no'
            );
        }
        
        // Aggiungi classe CSS per iOS-specific styling
        document.documentElement.classList.add('ios-webview');
        
        console.log('Correzioni touch iOS applicate');
    }
    
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
    resultsText.textContent = `${count} tappe trovate`;
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
    
    // Manage fullscreen navigation section
    const footer = document.querySelector('.footer');
    if (tabName === 'navigazione') {
        document.body.classList.add('navigation-active');
        document.body.style.overflow = 'hidden'; // Prevent body scroll
        if (footer) footer.style.display = 'none'; // Hide footer
    } else {
        document.body.classList.remove('navigation-active');
        document.body.style.overflow = ''; // Restore scroll
        if (footer) footer.style.display = ''; // Show footer
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
        
        // Initialize GPS map if switching to navigation tab
        if (tabName === 'navigazione') {
            initializeGPSMap();
            // Fix specifico iOS per mappa itinerario
            if (typeof forceShowItinerarioMap === 'function') {
                forceShowItinerarioMap();
            }
        } else {
            // Nascondi mappa quando si esce dalla sezione navigazione (fix iOS)
            if (typeof hideItinerarioMap === 'function') {
                hideItinerarioMap();
            }
        }
        
        // Manage VR button visibility when switching to virtual tour
        if (tabName === 'virtual-tour') {
            manageVRButtonVisibility();
        }
        
        // Initialize monument counter when switching to monuments tab
        if (tabName === 'tappe') {
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
    const resultDiv = document.getElementById('qr-result');
    
    if (!modal || !qrReaderDiv) {
        console.error('QR modal elements not found');
        return;
    }
    
    // Pulisci i risultati precedenti
    if (resultDiv) {
        resultDiv.innerHTML = '';
        resultDiv.style.display = 'none'; // Nascondi anche il div
        console.log('QR risultati precedenti puliti e nascosti');
    }
    
    // Reset dello stato dello scanner
    qrScanner = null;
    console.log('Scanner QR stato resettato');
    
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
    
    console.log('QR Code scansionato:', qrText);
    
    // Pulisci completamente il risultato precedente
    if (resultDiv) {
        resultDiv.innerHTML = '';
        resultDiv.style.display = 'block'; // Assicurati che sia visibile per i nuovi risultati
        console.log('Contenuto QR precedente rimosso completamente');
    }
    
    // 1. GESTIONE DEEP LINKS MONUMENTI - Priorità massima
    if (qrText.includes('itinerarioregalbuto.magnetico.cloud/')) {
        console.log('Deep link monumento rilevato:', qrText);
        
        // Estrai l'ID del monumento dall'URL
        let monumentId = '';
        
        // Supporta diversi formati di URL
        const urlPatterns = [
            /itinerarioregalbuto\.magnetico\.cloud\/([a-zA-Z0-9\-]+)\/?$/,
            /itinerarioregalbuto\.magnetico\.cloud\/([a-zA-Z0-9\-]+)\?/,
            /monument:([a-zA-Z0-9\-]+)$/
        ];
        
        for (const pattern of urlPatterns) {
            const match = qrText.match(pattern);
            if (match) {
                monumentId = match[1];
                break;
            }
        }
        
        if (monumentId) {
            console.log('Monument ID estratto:', monumentId);
            
            // Verifica che il monumento esista nei dati
            verifyAndOpenMonument(monumentId, qrText);
            return;
        } else {
            console.warn('Impossibile estrarre ID monumento da:', qrText);
            showQRError('Link monumento non valido');
            return;
        }
    }
    
    // 2. GESTIONE FORMATO monument:id (legacy)
    if (qrText.startsWith('monument:')) {
        const monumentId = qrText.replace('monument:', '');
        console.log('QR monumento legacy rilevato:', monumentId);
        verifyAndOpenMonument(monumentId, qrText);
        return;
    }
    
    // 3. GESTIONE LINK HTTP GENERICI
    if (qrText.startsWith('http://') || qrText.startsWith('https://')) {
        console.log('Link HTTP rilevato:', qrText);
        
        resultDiv.innerHTML = `
            <div class="qr-result-card success">
                <div class="qr-result-header">
                    <i data-feather="link"></i>
                    <h4>Link Rilevato</h4>
                </div>
                <div class="qr-result-content">
                    <p class="qr-url">${qrText}</p>
                    <div class="qr-actions">
                        <button class="btn btn-primary" onclick="openQRLink('${qrText}')">
                            <i data-feather="external-link"></i>
                            Apri Link
                        </button>
                        <button class="btn btn-secondary" onclick="copyQRText('${qrText}')">
                            <i data-feather="copy"></i>
                            Copia
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        showNotification('Link QR Code scansionato con successo!', 'success');
        feather.replace();
        return;
    }
    
    // 4. GESTIONE TESTO GENERICO
    console.log('QR testo generico rilevato');
    resultDiv.innerHTML = `
        <div class="qr-result-card info">
            <div class="qr-result-header">
                <i data-feather="file-text"></i>
                <h4>Testo QR Code</h4>
            </div>
            <div class="qr-result-content">
                <p class="qr-text">${escapeHtml(qrText)}</p>
                <div class="qr-actions">
                    <button class="btn btn-primary" onclick="copyQRText('${escapeHtml(qrText)}')">
                        <i data-feather="copy"></i>
                        Copia Testo
                    </button>
                </div>
            </div>
        </div>
    `;
    
    showNotification('QR Code scansionato!', 'info');
    feather.replace();
}

// Funzione per verificare e aprire un monumento
async function verifyAndOpenMonument(monumentId, originalUrl) {
    try {
        console.log('Verifica monumento:', monumentId);
        
        // Carica i dati dei monumenti
        const response = await fetch('data/monuments.json');
        const monuments = await response.json();
        
        // Cerca il monumento per ID
        const monument = monuments.find(m => m.id === monumentId);
        
        if (monument) {
            console.log('Monumento trovato:', monument.name);
            
            // Mostra risultato di successo
            showMonumentQRResult(monument, originalUrl);
            
            // Pulisci i risultati prima di chiudere lo scanner
            setTimeout(() => {
                const resultDiv = document.getElementById('qr-result');
                if (resultDiv) {
                    resultDiv.innerHTML = '';
                    console.log('QR risultati puliti prima della chiusura');
                }
                
                // Chiudi il scanner QR
                closeQRScanner();
            }, 2000); // Mostra il risultato per 2 secondi prima di pulire
            
            // Aspetta un momento per permettere al modal di chiudersi
            setTimeout(() => {
                // Vai alla sezione monumenti
                switchTab('tappe');
                
                // Aspetta che la tab si carichi completamente
                setTimeout(() => {
                    // Espandi il monumento specifico
                    expandMonumentFromQR(monumentId);
                    
                    // Avvia automaticamente l'audioguida se disponibile
                    if (monument.audio && monument.audio.path) {
                        setTimeout(() => {
                            playAudioGuide(monumentId);
                        }, 1000);
                    }
                }, 500);
            }, 300);
            
        } else {
            console.warn('Monumento non trovato:', monumentId);
            
            // Controlla ID alternativi comuni
            const alternativeIds = generateAlternativeIds(monumentId);
            let foundAlternative = false;
            
            for (const altId of alternativeIds) {
                const altMonument = monuments.find(m => m.id === altId);
                if (altMonument) {
                    console.log('Monumento trovato con ID alternativo:', altId, altMonument.name);
                    verifyAndOpenMonument(altId, originalUrl);
                    foundAlternative = true;
                    break;
                }
            }
            
            if (!foundAlternative) {
                showQRError(`Monumento "${monumentId}" non trovato nell'itinerario`);
            }
        }
        
    } catch (error) {
        console.error('Errore verifica monumento:', error);
        showQRError('Errore nel caricamento dei dati del monumento');
    }
}

// Genera ID alternativi per compatibilità
function generateAlternativeIds(monumentId) {
    const alternatives = [
        monumentId.replace(/-/g, '_'),      // trattini -> underscore
        monumentId.replace(/_/g, '-'),      // underscore -> trattini
        monumentId.toLowerCase(),           // tutto minuscolo
        monumentId.toUpperCase(),           // tutto maiuscolo
    ];
    
    // ID mapping specifici per Regalbuto
    const specificMappings = {
        'san-basilio': ['chiesa-san-basilio', 'chiesa-madre-san-basilio', 'san_basilio'],
        'chiesa-san-basilio': ['san-basilio', 'chiesa-madre-san-basilio'],
        'santantonio': ['convento-sant-antonio', 'sant-antonio', 'convento-santantonio'],
        'convento-sant-antonio': ['santantonio', 'sant-antonio'],
        'santa-maria-croce': ['chiesa-santa-maria-croce', 'chiesa-maria-ss-della-croce'],
        'purgatorio': ['chiesa-purgatorio', 'chiesa-del-purgatorio'],
        'teatro-urania': ['cine-teatro-urania', 'urania'],
        'lago-pozzillo': ['pozzillo', 'lago_pozzillo']
    };
    
    if (specificMappings[monumentId]) {
        alternatives.push(...specificMappings[monumentId]);
    }
    
    // Rimuovi duplicati
    return [...new Set(alternatives)];
}

// Mostra il risultato per un monumento trovato
function showMonumentQRResult(monument, originalUrl) {
    const resultDiv = document.getElementById('qr-result');
    
    // Trova l'immagine thumbnail per il monumento
    let thumbnailImage = 'src/imgs/flat/regalbuto-plaza.jpg'; // default
    if (monument.images && monument.images.length > 0) {
        const thumb = monument.images.find(img => img.role === 'thumbnail') ||
                     monument.images.find(img => img.format === 'standard') ||
                     monument.images[0];
        if (thumb) thumbnailImage = thumb.path;
    }
    
    // Determina le funzionalità disponibili
    const hasAudio = monument.audio && monument.audio.path;
    const hasVirtualTour = monument.images && monument.images.some(img => img.format === '360');
    const hasCoordinates = monument.lat && monument.lon;
    
    resultDiv.innerHTML = `
        <div class="qr-result-card monument-found">
            <div class="qr-result-header success">
                <i data-feather="map-pin"></i>
                <h4>Monumento Trovato!</h4>
            </div>
            <div class="monument-qr-content">
                <div class="monument-qr-image">
                    <img src="${thumbnailImage}" alt="${monument.name}">
                    <div class="monument-qr-category">${getCategoryDisplayName(monument.category)}</div>
                </div>
                <div class="monument-qr-info">
                    <h5>${monument.name}</h5>
                    <p>${monument.short_description || 'Monumento dell\'itinerario turistico di Regalbuto'}</p>
                    <div class="monument-qr-features">
                        ${hasAudio ? '<span class="feature-badge audio"><i data-feather="headphones"></i>Audioguida</span>' : ''}
                        ${hasVirtualTour ? '<span class="feature-badge vr"><i data-feather="eye"></i>Tour 360°</span>' : ''}
                        ${hasCoordinates ? '<span class="feature-badge gps"><i data-feather="navigation"></i>GPS</span>' : ''}
                    </div>
                    <div class="qr-url-info">
                        <small>QR: ${originalUrl}</small>
                    </div>
                </div>
            </div>
            <div class="qr-monument-actions">
                <p class="qr-opening-text">
                    <i data-feather="arrow-right"></i>
                    Apertura automatica del monumento...
                    ${hasAudio ? ' Audioguida in avvio!' : ''}
                </p>
            </div>
        </div>
    `;
    
    showNotification(`${monument.name} trovato! Apertura in corso...`, 'success');
    feather.replace();
}

// Funzione per espandere un monumento specifico da QR
function expandMonumentFromQR(monumentId) {
    console.log('Espansione monumento da QR:', monumentId);
    
    // Trova la card del monumento
    const monumentCard = document.querySelector(`[data-monument-id="${monumentId}"]`);
    
    if (monumentCard) {
        console.log('Card monumento trovata:', monumentCard);
        
        // Scrolla alla card del monumento
        monumentCard.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // Espandi la card dopo lo scroll
        setTimeout(() => {
            // Trigger dell'espansione
            toggleMonument(monumentId);
            
            // Evidenzia la card temporaneamente
            monumentCard.classList.add('qr-highlighted');
            setTimeout(() => {
                monumentCard.classList.remove('qr-highlighted');
            }, 3000);
            
        }, 800);
        
    } else {
        console.warn('Card monumento non trovata per ID:', monumentId);
        
        // Fallback: mostra notifica
        showNotification('Monumento trovato ma non ancora caricato. Riprova tra qualche istante.', 'warning');
    }
}

// Mostra errore QR
function showQRError(message) {
    const resultDiv = document.getElementById('qr-result');
    
    resultDiv.innerHTML = `
        <div class="qr-result-card error">
            <div class="qr-result-header">
                <i data-feather="alert-circle"></i>
                <h4>QR Code non riconosciuto</h4>
            </div>
            <div class="qr-result-content">
                <p>${message}</p>
                <div class="qr-help">
                    <p><strong>QR Code supportati:</strong></p>
                    <ul>
                        <li>📍 Link monumenti: itinerarioregalbuto.magnetico.cloud/id-monumento</li>
                        <li>🔗 Link web generici</li>
                        <li>📝 Testo semplice</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    showNotification(message, 'error');
    feather.replace();
}

// Funzioni di utilità per i risultati QR
window.openQRLink = function(url) {
    console.log('Apertura link QR:', url);
    window.open(url, '_blank', 'noopener,noreferrer');
    closeQRScanner();
};

window.copyQRText = function(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Testo copiato negli appunti!', 'success');
        }).catch(err => {
            console.error('Errore copia clipboard:', err);
            fallbackCopyText(text);
        });
    } else {
        fallbackCopyText(text);
    }
};

// Fallback per la copia del testo
function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showNotification('Testo copiato negli appunti!', 'success');
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showNotification('Impossibile copiare il testo', 'error');
    }
    document.body.removeChild(textArea);
}

// Escape HTML per sicurezza
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
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
                    Ascolta audioguida
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
        console.log('QR reader content cleared');
    }
    if (qrResultDiv) {
        qrResultDiv.innerHTML = '';
        console.log('QR result content cleared');
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
        'chiesa-maria-ss-della-croce': 'Chiesa di Santa Maria della Croce',
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
                'santa-maria-croce': 'chiesa-maria-ss-della-croce',
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
                    'chiesa-maria-ss-della-croce': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
                };
                
                const audioUrl = defaultAudioGuides[monumentId];
                
                if (audioUrl) {
                    initializeAudioWithUrl(audioUrl, playerContainer, { 
                        description: `audioguida per ${monumentId}`,
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
        Ascolta audioguida
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

// Quiz Functions
function initializeQuiz() {
    currentQuizQuestion = 1;
    quizAnswers = {};
    updateQuizDisplay();
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
                    <span>Ascolta audioguida</span>
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
                    <span>Ascolta audioguida</span>
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
        'civic': 'Amministrativo',
        'educational': 'Educativo',
        'financial': 'Finanza',
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


// Helper functions for map tooltip actions
window.openVirtualTourFromMap = async function(monumentId) {
    console.log('Opening virtual tour from map for:', monumentId);
    
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
    
    // Switch to tappe tab and trigger audio guide
    switchTab('tappe');
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

// Map Location Functions

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

async function openMapLocation(monumentId) {
    console.log('Opening map location for:', monumentId);
    
    try {
        // Carica i dati dal file monuments.json
        const response = await fetch('data/monuments.json');
        const monuments = await response.json();
        
        // Trova il monumento con l'ID corrispondente
        const monument = monuments.find(m => m.id === monumentId);
        
        let url;
        if (monument && monument.lat && monument.lon) {
            // Genera URL Google Maps con formato directions API
            url = `https://www.google.com/maps/dir/?api=1&destination=${monument.lat},${monument.lon}`;
            console.log(`Generated directions URL for ${monument.name}: ${url}`);
        } else {
            // Fallback al centro di Regalbuto se il monumento non viene trovato
            url = 'https://www.google.com/maps/dir/?api=1&destination=37.650573,14.640587';
            console.log(`Monument not found or missing coordinates, using fallback URL: ${url}`);
        }
        
        // Apri l'URL generato
        openInMapsApp(url);
        
    } catch (error) {
        console.error('Error loading monument data:', error);
        // Fallback in caso di errore
        const fallbackUrl = 'https://www.google.com/maps/dir/?api=1&destination=37.650573,14.640587';
        console.log(`Using fallback URL due to error: ${fallbackUrl}`);
        openInMapsApp(fallbackUrl);
    }
}

// Nuova funzione per gestire l'apertura dell'app Maps nativa
function openInMapsApp(mapsUrl) {
    console.log('Opening Maps with URL:', mapsUrl);
    
    // Rilevamento più specifico per iOS e Android
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroidDevice = /Android/i.test(navigator.userAgent);
    
    if (isIOSDevice) {
        console.log('iOS device detected, converting to Apple Maps');
        
        // Estrai coordinate dall'URL Google Maps
        const coordinatesMatch = mapsUrl.match(/destination=([0-9.-]+),([0-9.-]+)/);
        if (coordinatesMatch) {
            const lat = coordinatesMatch[1];
            const lon = coordinatesMatch[2];
            const appleMapURL = `http://maps.apple.com/?daddr=${lat},${lon}&dirflg=d`;
            
            console.log('Opening Apple Maps with URL:', appleMapURL);
            
            // Torniamo al metodo originale che funzionava
            // SOLO aggiungiamo la gestione dello stato per il loading infinito
            try {
                // Segna che stiamo aprendo Maps (per gestire il loading infinito)
                sessionStorage.setItem('mapsOpeningState', 'opening');
                sessionStorage.setItem('mapsOpeningTime', Date.now().toString());
                
                // Usa il metodo originale: window.location.href
                window.location.href = appleMapURL;
                
            } catch (error) {
                console.log('Fallback to window.open for Apple Maps');
                window.open(appleMapURL, '_system');
            }
            
            showNotification('Apertura Apple Maps...', 'info');
            return;
        } else {
            console.log('Could not extract coordinates from URL, using fallback');
        }
    }
    
    // Android - comportamento Google Maps INVARIATO
    if (isAndroidDevice) {
        console.log('Android device detected, using Google Maps normally');
        
        // Crea URL Google Maps standard HTTPS
        let googleMapsUrl = mapsUrl;
        
        // Assicurati che sia un URL Google Maps HTTPS completo
        if (!googleMapsUrl.startsWith('https://')) {
            if (googleMapsUrl.startsWith('www.google.com/maps')) {
                googleMapsUrl = 'https://' + googleMapsUrl;
            }
        }
        
        console.log('Final Google Maps URL for Android:', googleMapsUrl);
        window.open(googleMapsUrl, '_system');
        showNotification('Apertura Google Maps...', 'info');
        return;
    }
    
    // Desktop - comportamento INVARIATO
    if (!isIOSDevice && !isAndroidDevice) {
        console.log('Desktop device detected, opening in new tab');
        
        // Crea URL Google Maps standard HTTPS
        let googleMapsUrl = mapsUrl;
        
        // Assicurati che sia un URL Google Maps HTTPS completo
        if (!googleMapsUrl.startsWith('https://')) {
            if (googleMapsUrl.startsWith('www.google.com/maps')) {
                googleMapsUrl = 'https://' + googleMapsUrl;
            }
        }
        
        console.log('Final Google Maps URL for Desktop:', googleMapsUrl);
        window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
        showNotification('Apertura mappa in corso...', 'info');
    }
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
    
    // Quiz data structure with questions, options and correct answers
    const quizData = {
        q1: {
            question: "In quale provincia si trova Regalbuto?",
            category: "🏛️ Geografia",
            options: { a: "Palermo", b: "Enna", c: "Catania" },
            correct: "b"
        },
        q2: {
            question: "Qual è il nome del lago artificiale vicino a Regalbuto?",
            category: "🌊 Natura",
            options: { a: "Lago di Pergusa", b: "Lago Pozzillo", c: "Lago Arancio" },
            correct: "b"
        },
        q3: {
            question: "Quale importante edificio religioso si trova nel centro di Regalbuto?",
            category: "⛪ Religione",
            options: { a: "Duomo di San Giorgio", b: "Chiesa Madre di San Basilio Magno", c: "Santuario di Tindari" },
            correct: "b"
        },
        q4: {
            question: "In quale secolo fu fondato Regalbuto?",
            category: "📜 Storia",
            options: { a: "XI secolo", b: "XIV secolo", c: "XVII secolo" },
            correct: "b"
        },
        q5: {
            question: "Qual è la caratteristica principale del Convento di Sant'Antonio?",
            category: "🏛️ Architettura",
            options: { a: "È costruito interamente in marmo", b: "È inaccessibile e si trova in una zona rurale", c: "Ospita un museo d'arte moderna" },
            correct: "b"
        },
        q6: {
            question: "Qual è la principale festa religiosa celebrata a Regalbuto?",
            category: "🎉 Tradizioni",
            options: { a: "Festa di San Sebastiano", b: "Festa del Patrono San Vito", c: "Festa della Madonna del Carmelo" },
            correct: "b"
        },
        q7: {
            question: "Cosa significa il nome \"Regalbuto\"?",
            category: "📖 Etimologia",
            options: { a: "Paese reale", b: "Campo del re", c: "Fortezza del re" },
            correct: "c"
        },
        q8: {
            question: "Quale importante struttura medievale sorgeva sulla collina di Regalbuto?",
            category: "🏰 Medievale",
            options: { a: "Una torre normanna", b: "Un castello", c: "Un monastero templare" },
            correct: "b"
        },
        q9: {
            question: "Regalbuto è situata lungo quale importante fiume siciliano?",
            category: "🌊 Geografia",
            options: { a: "Fiume Alcantara", b: "Fiume Simeto", c: "Fiume Belice" },
            correct: "b"
        },
        q10: {
            question: "Quale prodotto tipico è legato alla tradizione agricola di Regalbuto?",
            category: "🌾 Agricoltura",
            options: { a: "Lenticchie", b: "Mandorle", c: "Olive" },
            correct: "c"
        }
    };
    
    // Calculate score
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    
    for (let q in quizData) {
        if (quizAnswers[q] === quizData[q].correct) {
            score++;
            correctCount++;
        } else {
            incorrectCount++;
        }
    }
    
    // Hide quiz container
    document.getElementById('quiz-container').style.display = 'none';
    
    // Get result container
    const resultDiv = document.getElementById('quiz-result');
    const scoreText = document.getElementById('quiz-score');
    
    // Generate message based on score
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
    
    // Create detailed results HTML
    let detailedResultsHTML = `
        <div class="quiz-detailed-results">
            <div class="result-summary">
                <h4>Risultato Quiz</h4>
                <p>Hai risposto correttamente a ${score} su 10 domande. ${message}</p>
                <div class="score-breakdown">
                    <div class="score-item">
                        <span class="score-number" style="color: #22c55e;">${correctCount}</span>
                        <span class="score-label">Corrette</span>
                    </div>
                    <div class="score-item">
                        <span class="score-number" style="color: #ef4444;">${incorrectCount}</span>
                        <span class="score-label">Errate</span>
                    </div>
                    <div class="score-item">
                        <span class="score-number" style="color: #ffd700;">${Math.round((score/10)*100)}%</span>
                        <span class="score-label">Punteggio</span>
                    </div>
                </div>
            </div>
            
            <h3>Revisione delle Risposte</h3>
    `;
    
    // Add detailed results for each question
    for (let i = 1; i <= 10; i++) {
        const qKey = `q${i}`;
        const questionData = quizData[qKey];
        const userAnswer = quizAnswers[qKey];
        const isCorrect = userAnswer === questionData.correct;
        
        detailedResultsHTML += `
            <div class="result-question ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="result-question-title">
                    ${questionData.category} Domanda ${i}: ${questionData.question}
                </div>
        `;
        
        // Show user's answer
        if (userAnswer) {
            detailedResultsHTML += `
                <div class="result-answer user-answer ${isCorrect ? 'correct' : 'incorrect'}">
                    <span class="result-answer-icon">${isCorrect ? '✅' : '❌'}</span>
                    <span class="result-answer-text">
                        <strong>La tua risposta:</strong> ${questionData.options[userAnswer]}
                    </span>
                </div>
            `;
        }
        
        // Show correct answer if user was wrong
        if (!isCorrect) {
            detailedResultsHTML += `
                <div class="result-answer correct-answer">
                    <span class="result-answer-icon">✅</span>
                    <span class="result-answer-text">
                        <strong>Risposta corretta:</strong> ${questionData.options[questionData.correct]}
                    </span>
                </div>
            `;
        }
        
        detailedResultsHTML += `</div>`;
    }
    
    detailedResultsHTML += `</div>`;
    
    // Update the result display
    scoreText.innerHTML = detailedResultsHTML;
    resultDiv.style.display = 'block';
    
    // Scroll to top of results
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

// New function to load location using JSON data dynamically
function loadLocationFromJSON(monumentId, imagePath) {
    console.log('Loading location from JSON for monument:', monumentId, 'with image:', imagePath);
    
    // Determine rotation based on image path and specific rules
    let rotation = -90; // Default: rotate 90 degrees left (counterclockwise)
    
    // Special case: external view of Sant'Antonio convent should rotate 90 degrees right
    if (imagePath.includes('vista-convento-sant-antonio.JPG')) {
        rotation = 90; // Rotate 90 degrees right (clockwise)
        console.log('Special rotation for vista-convento-sant-antonio.JPG: +90°');
    } else {
        console.log('Default rotation applied: -90°');
    }
    
    // Build the panorama URL using the image path from JSON with rotation
    const panoramaUrl = `panoramas/panorama.html?img=${imagePath}&rotation=${rotation}`;
    
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
    
    // Load and display the view selector dropdown if multiple 360° images are available
    loadViewSelector(monumentId, imagePath);
    
    console.log(`Loading virtual tour from JSON for monument: ${monumentId} with rotation: ${rotation}°`);
}

// Function to create and manage the view selector dropdown for monuments with multiple 360° images
async function loadViewSelector(monumentId, currentImagePath) {
    try {
        // Load monuments data
        const response = await fetch('data/monuments.json');
        const monuments = await response.json();
        
        // Find the current monument
        const monument = monuments.find(m => m.id === monumentId);
        if (!monument) return;
        
        // Get all 360° images for this monument
        const images360 = monument.images ? monument.images.filter(img => img.format === '360') : [];
        
        // Get or create the view selector container
        let viewSelector = document.getElementById('view-selector');
        if (!viewSelector) {
            viewSelector = document.createElement('div');
            viewSelector.id = 'view-selector';
            viewSelector.className = 'view-selector';
            
            // Insert after the pano-viewer
            const panoViewer = document.getElementById('pano-viewer');
            if (panoViewer && panoViewer.parentNode) {
                panoViewer.parentNode.insertBefore(viewSelector, panoViewer.nextSibling);
            }
        }
        
        // Clear existing content
        viewSelector.innerHTML = '';
        
        if (images360.length > 1) {
            // Create dropdown for multiple views
            const selectorHTML = `
                <div class="view-selector-content">
                    <label for="view-dropdown">
                        <i data-feather="eye"></i>
                        Seleziona Vista:
                    </label>
                    <select id="view-dropdown" class="view-dropdown" onchange="changeView(this.value, '${monumentId}')">
                        ${images360.map((img, index) => `
                            <option value="${img.path}" ${img.path === currentImagePath ? 'selected' : ''}>
                                ${img.title || `Vista ${index + 1}`}
                            </option>
                        `).join('')}
                    </select>
                </div>
            `;
            
            viewSelector.innerHTML = selectorHTML;
            viewSelector.style.display = 'block';
            
            // Initialize feather icons for the new element
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        } else {
            // Hide selector if only one or no 360° images
            viewSelector.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error loading view selector:', error);
    }
}

// Function to change the current view in the 360° viewer
window.changeView = function(imagePath, monumentId) {
    console.log('Changing view to:', imagePath);
    
    // Determine rotation based on image path and specific rules
    let rotation = -90; // Default: rotate 90 degrees left (counterclockwise)
    
    // Special case: external view of Sant'Antonio convent should rotate 90 degrees right
    if (imagePath.includes('vista-convento-sant-antonio.JPG')) {
        rotation = 90; // Rotate 90 degrees right (clockwise)
        console.log('Special rotation for vista-convento-sant-antonio.JPG: +90°');
    } else {
        console.log('Default rotation applied: -90°');
    }
    
    // Update the iframe src with rotation
    const iframe = document.querySelector('#pano-viewer iframe');
    if (iframe) {
        const panoramaUrl = `panoramas/panorama.html?img=${imagePath}&rotation=${rotation}`;
        iframe.src = panoramaUrl;
        
        console.log(`View changed to: ${imagePath} with rotation: ${rotation}°`);
    }
};

// Function to populate virtual tour locations dynamically from monuments.json
async function populateVirtualTourLocations() {
    try {
        console.log('Populating virtual tour locations...');
        
        // Load monuments data
        const response = await fetch('data/monuments.json');
        const monuments = await response.json();
        
        // Filter monuments that have 360° images
        const monumentsWithVR = monuments.filter(monument => 
            monument.images && monument.images.some(img => img.format === '360')
        );
        
        console.log(`Found ${monumentsWithVR.length} monuments with 360° images`);
        
        // Get the location grid container
        const locationGrid = document.querySelector('.location-grid');
        if (!locationGrid) {
            console.error('Location grid not found');
            return;
        }
        
        // Clear existing hardcoded locations
        locationGrid.innerHTML = '';
        
        // Populate virtual tour locations dynamically
        monumentsWithVR.forEach((monument, index) => {
            const firstImage360 = monument.images.find(img => img.format === '360');
            const imageCount = monument.images.filter(img => img.format === '360').length;
            
            // Determine emoji based on category
            let emoji = '🏛️'; // default
            switch(monument.category) {
                case 'church':
                    emoji = '⛪';
                    break;
                case 'convent':
                    emoji = '🏛️';
                    break;
                case 'palace':
                    emoji = '🏰';
                    break;
                case 'monument':
                case 'civic':
                    emoji = '🗿';
                    break;
                case 'theater':
                    emoji = '🎭';
                    break;
                case 'educational':
                    emoji = '🎓';
                    break;
                case 'financial':
                    emoji = '🏦';
                    break;
                case 'technology':
                    emoji = '💻';
                    break;
                case 'nature':
                    emoji = '🏔️';
                    break;
                case 'historic':
                    emoji = '🏛️';
                    break;
                default:
                    console.warn(`Categoria non riconosciuta: "${monument.category}" per monumento: ${monument.name}`);
                    emoji = '📍';
            }
            
            const locationCard = document.createElement('div');
            locationCard.className = `location-card ${index === 0 ? 'active' : ''}`;
            locationCard.dataset.monumentId = monument.id;
            locationCard.onclick = () => {
                // Remove active from all cards
                document.querySelectorAll('.location-card').forEach(card => 
                    card.classList.remove('active')
                );
                // Add active to clicked card
                locationCard.classList.add('active');
                // Load the location
                loadLocationAndScrollFromJSON(monument.id, firstImage360.path);
            };
            
            locationCard.innerHTML = `
                <div class="location-thumb">${emoji}</div>
                <h5>${monument.name}</h5>
                <p>${imageCount > 1 ? `${imageCount} viste disponibili` : 'Vista panoramica'}</p>
            `;
            
            locationGrid.appendChild(locationCard);
            
            // Auto-load first monument when page loads
            if (index === 0) {
                setTimeout(() => {
                    loadLocationFromJSON(monument.id, firstImage360.path);
                }, 500);
            }
        });
        
        console.log('Virtual tour locations populated successfully');
        
    } catch (error) {
        console.error('Error populating virtual tour locations:', error);
    }
}

// Function similar to loadLocationAndScroll but works with JSON data
function loadLocationAndScrollFromJSON(monumentId, imagePath) {
    console.log('Loading location from JSON:', monumentId, imagePath);
    
    // Load the location
    loadLocationFromJSON(monumentId, imagePath);
    
    // Scroll to iframe
    const iframe = document.querySelector('#pano-viewer');
    if (iframe) {
        iframe.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

function loadLocationAndScroll(locationId) {
    console.log('loadLocationAndScroll called for:', locationId);
    
    // Find the location card with this locationId and trigger its click event
    const locationCard = document.querySelector(`.location-card[data-monument-id="${locationId}"]`);
    if (locationCard && locationCard.onclick) {
        locationCard.onclick();
    } else {
        console.warn('Location card not found for:', locationId);
        // Fallback: try to load from JSON directly
        loadFromJSONFallback(locationId);
    }
}

// Fallback function to load location from JSON when card is not found
async function loadFromJSONFallback(locationId) {
    try {
        const response = await fetch('data/monuments.json');
        const monuments = await response.json();
        
        const monument = monuments.find(m => m.id === locationId);
        if (monument && monument.images) {
            const firstImage360 = monument.images.find(img => img.format === '360');
            if (firstImage360) {
                loadLocationAndScrollFromJSON(monument.id, firstImage360.path);
            }
        }
    } catch (error) {
        console.error('Error in loadFromJSONFallback:', error);
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
            // Rimosso showAndroidEmergencyOverlay() per evitare il messaggio di countdown
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
        // Su Android, NON creare più la X nativa con testo, solo il cerchio rosso già gestito da createExitButton()
        console.log('Android detected - usando solo il pulsante nel cerchio rosso');
        return;
    }
    
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
        console.log('Uscito dalla modalità VR - ripristinando orientamento e uscendo dal fullscreen');
        
        // Ripristina l'orientamento precedente
        restorePreviousOrientation();
        
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
    const vrBtn = document.getElementById('vr-mode-btn');
    const panoViewer = document.getElementById('pano-viewer');
    const iframe = panoViewer ? panoViewer.querySelector('iframe') : null;

    console.log('toggleVRMode chiamata');
    console.log('VR Button:', vrBtn);
    console.log('Pano Viewer:', panoViewer);
    console.log('Iframe src:', iframe ? iframe.src : 'no iframe');

    if (!iframe) {
        console.error('Iframe non trovato');
        showNotification('Visualizzatore non disponibile', 'error');
        return;
    }

    const currentSrc = iframe.src;
    
    // Verifica se siamo in una WebView Android
    const isInWebView = typeof window.AndroidBridge !== 'undefined';
    
    console.log('WebView rilevata:', isInWebView);

    // Verifica se è un panorama A-Frame (tutti i panorami ora sono A-Frame)
    if (currentSrc.includes('panorama.html')) {
        console.log('Panorama A-Frame rilevato');
        
        // Verifica se siamo su iPhone
        if (isIPhone()) {
            console.log('iPhone rilevato - VR non supportato');
            showNotification('VR non supportato su iPhone', 'warning');
            return;
        }
        
        // Controlla se siamo su dispositivo mobile
        if (!isMobileDevice()) {
            console.log('Dispositivo desktop rilevato - VR non supportato');
            showNotification('VR disponibile solo su dispositivi mobili', 'warning');
            return;
        }

        if (!vrBtn.classList.contains('vr-active')) {
            // ATTIVAZIONE VR
            console.log('Attivando modalità VR...');
            
            if (isInWebView) {
                // WEBVIEW: Apri in Custom Tab
                const standaloneURL = currentSrc.includes('&vr=1') ? currentSrc : currentSrc + '&vr=1';
                console.log('Aprendo VR in Custom Tab:', standaloneURL);
                
                try {
                    window.AndroidBridge.openInCustomTab(standaloneURL);
                    showNotification('Apertura VR in corso...', 'info');
                } catch (error) {
                    console.error('Errore apertura Custom Tab:', error);
                    showNotification('Errore apertura VR', 'error');
                }
                return; // Fermati qui per WebView
            }

            // WEB BROWSER: Modalità VR normale
            vrBtn.innerHTML = '<i data-feather="eye-off"></i> Esci da VR';
            vrBtn.classList.add('vr-active');
            panoViewer.classList.add('vr-mode');
            
            // Attiva orientamento landscape per VR
            activateLandscapeForVR();

            // Aggiungi parametro VR all'iframe se necessario
            if (!currentSrc.includes('&vr=1')) {
                iframe.src = currentSrc + '&vr=1';
            }

            // Invia comando VR all'iframe
            iframe.contentWindow.postMessage({ action: 'enterVR' }, '*');
            
            // Segna che il VR è attivo
            panoViewer.setAttribute('data-vr-active', 'true');

            showNotification('Ruota il dispositivo per la modalità VR', 'info');

        } else {
            // DISATTIVAZIONE VR
            console.log('Disattivando modalità VR...');
            
            vrBtn.innerHTML = '<i data-feather="eye"></i> Modalità VR';
            vrBtn.classList.remove('vr-active');
            panoViewer.classList.remove('vr-mode');
            
            // Ripristina orientamento precedente
            restorePreviousOrientation();

            // Rimuovi parametro VR dall'iframe
            iframe.src = currentSrc.replace('&vr=1', '');
            
            // Rimuovi flag VR attivo
            panoViewer.removeAttribute('data-vr-active');

            showNotification('Modalità VR disattivata', 'info');
        }

        // Re-initialize feather icons for the updated button
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    } else {
        console.warn('URL non riconosciuto come panorama A-Frame:', currentSrc);
        showNotification('Formato panorama non supportato', 'error');
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
        const monumentsDataLocal = await response.json();
        
        // Store in global variable
        monumentsData = monumentsDataLocal;
        
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
        monumentsDataLocal.forEach(monument => {
            const monumentCard = createMonumentCard(monument);
            monumentsContainer.appendChild(monumentCard);
        });
        
        // Update results count
        const resultsText = document.getElementById('results-text');
        if (resultsText) {
            resultsText.textContent = `${monumentsDataLocal.length} monumenti trovati`;
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
    
    // Check if this monument is part of the navigation route
    const checkpointIndex = checkpoints.findIndex(cp => cp.monument_id === monument.id);
    const isNavigationStop = checkpointIndex !== -1;
    const isVisited = visitedCheckpoints.includes(checkpointIndex);
    const isCurrent = checkpointIndex === currentCheckpointIndex && navigationActive;
    
    // Generate navigation status indicators
    let navigationBadge = '';
    let navigationClass = '';
    
    if (navigationActive && isNavigationStop) {
        navigationClass = 'navigation-active';
        if (isVisited) {
            navigationBadge = `<div class="navigation-badge visited">
                <i data-feather="check-circle"></i>
                <span>Visitata</span>
            </div>`;
        } else if (isCurrent) {
            navigationBadge = `<div class="navigation-badge current">
                <div class="step-number">${checkpointIndex + 1}</div>
                <span>Attuale</span>
            </div>`;
        } else {
            navigationBadge = `<div class="navigation-badge upcoming">
                <div class="step-number">${checkpointIndex + 1}</div>
                <span>Da visitare</span>
            </div>`;
        }
    }
    
    // Create the monument card HTML
    const cardHTML = `
        <div class="monument-card ${navigationClass}" data-category="${monument.category}" data-monument-id="${monument.id}" data-checkpoint-index="${checkpointIndex}">
            <div class="monument-image">
                <img src="${imagePath}" alt="${imageAlt}">
                <div class="monument-category-badge">${categoryDisplay}</div>
                ${navigationBadge}
            </div>
            <div class="monument-info">
                <h4>${monument.name}</h4>
                <p class="monument-description">${monument.short_description || 'Monumento storico di Regalbuto'}</p>
                <div class="monument-details">
                    ${generateDistanceInfo(monument)}
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
    
    // Add historical period if available
    const historicalPeriod = getHistoricalPeriod(monument);
    if (historicalPeriod) {
        description += `<div class="monument-period">${historicalPeriod}</div>`;
    }
    
    if (monument.history && monument.history.length > 0) {
        monument.history.forEach(period => {
            description += `<p><strong>${period.title}:</strong> ${period.description}</p>`;
        });
    } else {
        description = `<p>${monument.short_description || 'Informazioni dettagliate in fase di aggiornamento.'}</p>`;
    }
    
    return description;
}

// Helper function to extract historical period from monument data
function getHistoricalPeriod(monument) {
    if (!monument.history || monument.history.length === 0) {
        return null;
    }
    
    // Get the earliest start and latest end dates
    let earliestStart = null;
    let latestEnd = null;
    
    monument.history.forEach(period => {
        if (period.period) {
            const start = parseInt(period.period.start);
            const end = parseInt(period.period.end);
            
            if (!isNaN(start)) {
                if (!earliestStart || start < earliestStart) {
                    earliestStart = start;
                }
            }
            
            if (!isNaN(end)) {
                if (!latestEnd || end > latestEnd) {
                    latestEnd = end;
                }
            }
        }
    });
    
    // Format the period display
    if (earliestStart && latestEnd) {
        if (earliestStart === latestEnd) {
            return `📅 Anno di costruzione: ${earliestStart}`;
        } else {
            return `📅 Periodo di costruzione: ${earliestStart} - ${latestEnd}`;
        }
    } else if (earliestStart) {
        return `📅 Costruzione dal: ${earliestStart}`;
    } else if (latestEnd) {
        return `📅 Costruzione fino al: ${latestEnd}`;
    }
    
    return null;
}

// Generate monument actions based on available features
function generateMonumentActions(monument) {
    let actions = '';
    
    // Audio guide button if available
    if (monument.audio) {
        actions += `
            <button class="btn btn-primary" onclick="playAudioGuide('${monument.id}')">
                <i data-feather="headphones"></i>
                Ascolta audioguida
            </button>
        `;
    }
    
    // Map location button if coordinates available (only when navigation is not active)
    if (monument.lat && monument.lon && !navigationActive) {
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
let visitedCheckpoints = [];
let watchId = null;
let monumentsData = []; // Global variable to store monument data

// GPS Navigation Functions
async function initializeGPSMap() {
    if (gpsMap) return;
    
    try {
        // Initialize MapLibre GL JS map with CartoDB Positron style
        gpsMap = new maplibregl.Map({
            container: 'gps-map',
            style: {
                version: 8,
                glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
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
            await loadMonumentsOnMap();
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
    // Use bottom anchor but with positive offset to position popup lower
    const popup = new maplibregl.Popup({
        maxWidth: '300px',
        className: 'gps-monument-popup',
        closeButton: true,
        anchor: 'bottom',
        offset: [0, 50] // Positive offset to move popup down from marker
    })
        .setLngLat(coordinates)
        .setHTML(content)
        .addTo(map);
    
    // Center the map directly on the clicked point
    setTimeout(() => {
        map.easeTo({
            center: coordinates, // Center directly on the original coordinates
            zoom: Math.max(map.getZoom(), 16),
            duration: 400,
            essential: true
        });
    }, 100);
    
    return popup;
}

async function loadRouteData() {
    try {
        const response = await fetch('data/test_itinerario_turistico.geojson');
        const data = await response.json();
        routeData = data;
        
        // Load monuments data for checkpoints (since Points are no longer in GeoJSON)
        const monumentsResponse = await fetch('data/monuments.json');
        const monumentsData = await monumentsResponse.json();
        
        // Create checkpoints from monuments.json instead of GeoJSON Points
        checkpoints = [];
        monumentsData.forEach(monument => {
            if (monument.lat && monument.lon && 
                !isNaN(parseFloat(monument.lat)) && 
                !isNaN(parseFloat(monument.lon))) {
                checkpoints.push({
                    name: monument.name,
                    coordinates: [parseFloat(monument.lon), parseFloat(monument.lat)],
                    monument_id: monument.id,
                    visited: false
                });
            }
        });
        
        console.log('Route data loaded:', checkpoints.length, 'checkpoints from monuments.json');
        
        // Update total count
        document.getElementById('total-count').textContent = checkpoints.length;
        
        // Update total count in tappe section
        const totalMini = document.getElementById('total-count-mini');
        if (totalMini) {
            totalMini.textContent = checkpoints.length;
        }
        
    } catch (error) {
        console.error('Error loading route data:', error);
    }
}

function setupRouteVisualization() {
    if (!gpsMap || !routeData) {
        console.warn('GPS map or route data not available for route visualization');
        return;
    }
    
    try {
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
        
        console.log('Route visualization setup completed successfully');
        
    } catch (error) {
        console.error('Error setting up route visualization:', error);
        alert('Errore nella visualizzazione del percorso. La mappa funzionerà senza le etichette.');
        return;
    }
    
    // Fit map to route bounds (only LineString, no Points)
    const routeFeature = routeData.features.find(f => f.geometry.type === 'LineString');
    if (routeFeature) {
        const coordinates = routeFeature.geometry.coordinates;
        const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
        }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
        
        gpsMap.fitBounds(bounds, { padding: 50 });
    }
}

async function loadMonumentsOnMap() {
    if (!gpsMap) {
        console.warn('GPS map not available for monuments loading');
        return;
    }
    
    try {
        console.log('Loading monuments on map...');
        
        // Load monuments data from JSON
        const response = await fetch('data/monuments.json');
        const monumentsData = await response.json();
        
        // Filter monuments that have valid coordinates
        const validMonuments = monumentsData.filter(monument => 
            monument.lat && monument.lon && 
            !isNaN(parseFloat(monument.lat)) && 
            !isNaN(parseFloat(monument.lon))
        );
        
        console.log(`Found ${validMonuments.length} monuments with valid coordinates`);
        
        if (validMonuments.length === 0) {
            console.warn('No monuments with valid coordinates found');
            return;
        }
        
        // Create GeoJSON data for monuments
        const monumentsGeoJSON = {
            type: 'FeatureCollection',
            features: validMonuments.map(monument => ({
                type: 'Feature',
                properties: {
                    id: monument.id,
                    name: monument.name,
                    category: monument.category,
                    short_description: monument.short_description
                },
                geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(monument.lon), parseFloat(monument.lat)]
                }
            }))
        };
        
        // Add monuments source to map
        gpsMap.addSource('monuments', {
            type: 'geojson',
            data: monumentsGeoJSON
        });
        
        // Add monuments markers layer (same style as old checkpoints)
        gpsMap.addLayer({
            id: 'monuments-markers',
            type: 'circle',
            source: 'monuments',
            paint: {
                'circle-radius': 12,
                'circle-color': '#ffd700', // Same yellow color as old checkpoints
                'circle-stroke-color': '#4a5568', // Same dark stroke as old checkpoints
                'circle-stroke-width': 3
            }
        });
        
        // Add monuments labels (same style as old checkpoints)
        try {
            gpsMap.addLayer({
                id: 'monuments-labels',
                type: 'symbol',
                source: 'monuments',
                layout: {
                    'text-field': ['get', 'name'],
                    'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                    'text-offset': [0, 2],
                    'text-anchor': 'top',
                    'text-size': 12 // Same size as old checkpoints
                },
                paint: {
                    'text-color': '#2c2c2c', // Same color as old checkpoints
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 2
                }
            });
        } catch (error) {
            console.warn('Could not add monument text labels to map:', error.message);
        }
        
        // Add click events for monuments
        gpsMap.on('click', 'monuments-markers', async (e) => {
            console.log('Monument marker clicked, creating popup...');
            
            // Close any existing popups first
            const existingPopups = document.querySelectorAll('.maplibregl-popup');
            existingPopups.forEach(popup => popup.remove());
            
            const coordinates = e.features[0].geometry.coordinates.slice();
            const monumentId = e.features[0].properties.id;
            
            console.log('Monument popup coordinates:', coordinates);
            console.log('Monument ID:', monumentId);
            
            try {
                // Find the monument data
                const monument = monumentsData.find(m => m.id === monumentId);
                
                if (monument) {
                    // Check if monument has virtual tour and audio guide
                    const hasVirtualTour = monument.images && monument.images.some(img => img.format === '360');
                    const hasAudioGuide = monument.audio && monument.audio.path;
                    
                    // Use the same enhanced tooltip as the checkpoints
                    const popupContent = createEnhancedTooltip(monument, hasVirtualTour, hasAudioGuide);
                    console.log('Created enhanced popup for monument:', monument.name);
                    
                    // Create popup with the same positioning as checkpoints
                    const popup = createOptimallyPositionedPopup(coordinates, popupContent, gpsMap);
                    console.log('Monument popup created:', popup);
                    
                    // Force visibility after a delay
                    setTimeout(() => {
                        const popupElement = popup.getElement();
                        console.log('Monument popup element:', popupElement);
                        if (popupElement) {
                            popupElement.style.display = 'block';
                            popupElement.style.visibility = 'visible';
                            popupElement.style.opacity = '1';
                            popupElement.style.zIndex = '1000';
                            console.log('Monument popup forced visible');
                        }
                    }, 200);
                    
                } else {
                    console.error('Monument not found for ID:', monumentId);
                }
            } catch (error) {
                console.error('Error creating monument popup:', error);
            }
        });
        
        // Add cursor pointer for monuments
        gpsMap.on('mouseenter', 'monuments-markers', () => {
            gpsMap.getCanvas().style.cursor = 'pointer';
        });
        
        gpsMap.on('mouseleave', 'monuments-markers', () => {
            gpsMap.getCanvas().style.cursor = '';
        });
        
        // Fit map to include both route and monuments
        const routeFeature = routeData?.features.find(f => f.geometry.type === 'LineString');
        let bounds = new maplibregl.LngLatBounds();
        
        // Include route coordinates if available
        if (routeFeature) {
            routeFeature.geometry.coordinates.forEach(coord => {
                bounds.extend(coord);
            });
        }
        
        // Include all monument coordinates
        validMonuments.forEach(monument => {
            bounds.extend([parseFloat(monument.lon), parseFloat(monument.lat)]);
        });
        
        // Fit map to combined bounds
        if (!bounds.isEmpty()) {
            gpsMap.fitBounds(bounds, { padding: 50 });
        }
        
        console.log('Monuments loaded successfully on map');
        
    } catch (error) {
        console.error('Error loading monuments on map:', error);
    }
}

function startNavigation() {
    if (!checkpoints.length || !gpsMap) {
        alert('Dati del percorso non disponibili. Riprova tra qualche istante.');
        return;
    }
    
    navigationActive = true;
    currentCheckpointIndex = 0;
    visitedCheckpoints = []; // Reset visited checkpoints
    
    // Update UI
    document.getElementById('start-navigation-btn').style.display = 'none';
    document.getElementById('stop-navigation-btn').style.display = 'inline-flex';
    document.getElementById('navigation-info').style.display = 'block';
    
    // Show navigation status panel in tappe section
    const navigationPanel = document.getElementById('navigation-status-panel');
    if (navigationPanel) {
        navigationPanel.style.display = 'block';
    }
    
    // Hide search and filter container during navigation
    const searchFilterContainer = document.getElementById('search-filter-container');
    if (searchFilterContainer) {
        searchFilterContainer.style.display = 'none';
    }
    
    // Initialize counts in tappe section
    const totalMini = document.getElementById('total-count-mini');
    if (totalMini) {
        totalMini.textContent = checkpoints.length;
    }
    
    const visitedMini = document.getElementById('visited-count-mini');
    if (visitedMini) {
        visitedMini.textContent = '0';
    }
    
    // Update monument cards to show navigation status
    updateMonumentCardsForNavigation();
    
    // Start geolocation tracking
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                userLocation = [position.coords.longitude, position.coords.latitude];
                updateUserLocationOnMap();
                updateNavigationInstructions();
                checkCheckpointProximity();
                
                // Update monument cards with new distance calculations
                updateMonumentCardsForNavigation();
            },
            (error) => {
                console.warn('Geolocation error:', error);
                let errorMessage = 'Errore GPS';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'GPS negato. Abilita localizzazione.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Posizione non disponibile.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'GPS timeout. Riprovo...';
                        // Don't stop navigation on timeout, just continue trying
                        return;
                    default:
                        errorMessage = 'Errore GPS sconosciuto.';
                        break;
                }
                
                const instructionElement = document.getElementById('instruction-text');
                if (instructionElement) {
                    instructionElement.textContent = errorMessage;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,  // Increased timeout to 15 seconds
                maximumAge: 5000  // Increased maximum age to 5 seconds
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
    
    // Reset navigation state
    visitedCheckpoints = [];
    currentCheckpointIndex = 0;
    
    // Stop geolocation tracking
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    
    // Update UI
    document.getElementById('start-navigation-btn').style.display = 'inline-flex';
    document.getElementById('stop-navigation-btn').style.display = 'none';
    document.getElementById('navigation-info').style.display = 'none';
    
    // Hide navigation status panel in tappe section
    const navigationPanel = document.getElementById('navigation-status-panel');
    if (navigationPanel) {
        navigationPanel.style.display = 'none';
    }
    
    // Show search and filter container when navigation stops
    const searchFilterContainer = document.getElementById('search-filter-container');
    if (searchFilterContainer) {
        searchFilterContainer.style.display = 'block';
    }
    
    // Update monument cards to remove navigation status
    updateMonumentCardsForNavigation();
    
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
    
    // Update mini navigation info in tappe section
    const remainingMini = document.getElementById('remaining-distance-mini');
    if (remainingMini) {
        remainingMini.textContent = `${totalRemaining.toFixed(2)} km`;
    }
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
        visitedCheckpoints.push(currentCheckpointIndex);
        currentCheckpointIndex++;
        
        // Update visited count
        const visitedCount = checkpoints.filter(cp => cp.visited).length;
        document.getElementById('visited-count').textContent = visitedCount;
        
        // Update mini navigation info in tappe section
        const visitedMini = document.getElementById('visited-count-mini');
        if (visitedMini) {
            visitedMini.textContent = visitedCount;
        }
        
        // Update monument cards to reflect new status
        updateMonumentCardsForNavigation();
        
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

// Generate distance information for monument cards
function generateDistanceInfo(monument) {
    // If navigation is not active, don't show distance
    if (!navigationActive) {
        return '';
    }
    
    // If navigation is active but no user location available yet
    if (!userLocation) {
        return `<span class="distance">
            <i data-feather="map-pin"></i>
            Localizzazione in corso...
        </span>`;
    }
    
    // If monument doesn't have coordinates, can't calculate distance
    if (!monument.lat || !monument.lon) {
        return `<span class="distance">
            <i data-feather="map-pin"></i>
            Posizione non disponibile
        </span>`;
    }
    
    // Calculate distance from user location to monument
    const distance = calculateDistance(
        userLocation[1], userLocation[0], // user lat, lon
        parseFloat(monument.lat), parseFloat(monument.lon) // monument lat, lon
    );
    
    // Format distance appropriately
    let distanceText;
    if (distance < 1) {
        distanceText = `${Math.round(distance * 1000)} m`;
    } else {
        distanceText = `${distance.toFixed(1)} km`;
    }
    
    return `<span class="distance">
        <i data-feather="map-pin"></i>
        ${distanceText}
    </span>`;
}

function updateNextDestination() {
    if (currentCheckpointIndex < checkpoints.length) {
        const nextCheckpoint = checkpoints[currentCheckpointIndex];
        document.getElementById('next-destination-text').textContent = nextCheckpoint.name;
        
        // Update mini navigation info in tappe section
        const nextMini = document.getElementById('next-destination-mini');
        if (nextMini) {
            nextMini.textContent = nextCheckpoint.name;
        }
    } else {
        document.getElementById('next-destination-text').textContent = 'Percorso completato';
        
        const nextMini = document.getElementById('next-destination-mini');
        if (nextMini) {
            nextMini.textContent = 'Percorso completato';
        }
    }
}

function updateCheckpointsList() {
    const container = document.getElementById('route-checkpoints');
    if (!container) {
        // If the checkpoints container doesn't exist, skip the update
        console.log('Route checkpoints container not found, skipping update');
        return;
    }
    
    container.innerHTML = '';
    
    // Show the route checkpoints section when navigation is available
    const routeSection = document.getElementById('route-checkpoints-section');
    if (routeSection) {
        routeSection.style.display = checkpoints.length > 0 ? 'block' : 'none';
    }
    
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
        
        if (container) {
            container.appendChild(item);
        }
    });
    
    // Re-initialize feather icons only if we have elements to update
    if (container && container.children.length > 0) {
        feather.replace();
    }
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

// Enhanced functions for GPS map popup buttons (MapLibre GL JS)
function playAudioGuideFromMap(monumentId) {
    // Close any open popups first
    if (gpsMap) {
        const popups = document.querySelectorAll('.maplibregl-popup');
        popups.forEach(popup => popup.remove());
    }
    
    // Switch to tappe tab and play audio
    switchTab('tappe');
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
                console.warn('Geolocation error in centerOnUserLocation:', error);
                let errorMessage = 'Errore GPS';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Permesso GPS negato. Abilita la localizzazione nelle impostazioni del browser.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Posizione GPS non disponibile. Riprova più tardi.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Timeout GPS. Riprova o controlla la connessione.';
                        break;
                    default:
                        errorMessage = 'Errore GPS sconosciuto. Verifica le impostazioni.';
                        break;
                }
                
                alert(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,  // Increased timeout
                maximumAge: 5000 // Reduced maximum age for fresher location
            }
        );
    } else {
        alert('Geolocalizzazione non supportata su questo dispositivo.');
    }
}

// Update monument cards to show/hide navigation status
function updateMonumentCardsForNavigation() {
    const monumentCards = document.querySelectorAll('.monument-card');
    
    monumentCards.forEach(card => {
        const monumentId = card.getAttribute('data-monument-id');
        const checkpointIndex = checkpoints.findIndex(cp => cp.monument_id === monumentId);
        const isNavigationStop = checkpointIndex !== -1;
        const isVisited = visitedCheckpoints.includes(checkpointIndex);
        const isCurrent = checkpointIndex === currentCheckpointIndex && navigationActive;
        
        // Remove existing navigation classes and badges
        card.classList.remove('navigation-active');
        const existingBadge = card.querySelector('.navigation-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // Add navigation status if active
        if (navigationActive && isNavigationStop) {
            card.classList.add('navigation-active');
            card.setAttribute('data-checkpoint-index', checkpointIndex);
            
            const imageContainer = card.querySelector('.monument-image');
            let navigationBadge = '';
            
            if (isVisited) {
                navigationBadge = `<div class="navigation-badge visited">
                    <i data-feather="check-circle"></i>
                    <span>Visitata</span>
                </div>`;
            } else if (isCurrent) {
                navigationBadge = `<div class="navigation-badge current">
                    <div class="step-number">${checkpointIndex + 1}</div>
                    <span>Attuale</span>
                </div>`;
            } else {
                navigationBadge = `<div class="navigation-badge upcoming">
                    <div class="step-number">${checkpointIndex + 1}</div>
                    <span>Da visitare</span>
                </div>`;
            }
            
            if (navigationBadge && imageContainer) {
                imageContainer.insertAdjacentHTML('beforeend', navigationBadge);
            }
        } else {
            card.removeAttribute('data-checkpoint-index');
        }
        
        // Update monument actions to hide/show "Portami lì" button
        const monumentActionsContainer = card.querySelector('.monument-actions');
        if (monumentActionsContainer) {
            // Find the monument data to regenerate actions
            const monument = monumentsData.find(m => m.id === monumentId);
            if (monument) {
                monumentActionsContainer.innerHTML = generateMonumentActions(monument);
            }
        }
        
        // Update distance information in monument details
        const monumentDetailsContainer = card.querySelector('.monument-details');
        if (monumentDetailsContainer) {
            // Find the monument data to regenerate distance info
            const monument = monumentsData.find(m => m.id === monumentId);
            if (monument) {
                // Find existing distance span or create container for it
                let distanceContainer = monumentDetailsContainer.querySelector('.distance');
                const expandBtn = monumentDetailsContainer.querySelector('.expand-btn');
                
                // Remove existing distance span
                if (distanceContainer) {
                    distanceContainer.remove();
                }
                
                // Generate new distance info
                const newDistanceInfo = generateDistanceInfo(monument);
                
                // Insert new distance info before the expand button
                if (newDistanceInfo && expandBtn) {
                    expandBtn.insertAdjacentHTML('beforebegin', newDistanceInfo);
                }
            }
        }
    });
    
    // Refresh Feather icons
    feather.replace();
}

// Privacy Policy Functions
async function showPrivacyPolicy() {
    const popup = document.getElementById('privacy-popup');
    const body = document.getElementById('privacy-popup-body');
    
    try {
        // Load privacy policy content
        const response = await fetch('src/docs/privacy-policy.md');
        const markdownText = await response.text();
        
        // Convert markdown to HTML (simple conversion)
        const htmlContent = convertMarkdownToHTML(markdownText);
        body.innerHTML = htmlContent;
        
        // Show popup
        popup.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Refresh feather icons
        setTimeout(() => {
            feather.replace();
        }, 100);
        
    } catch (error) {
        console.error('Error loading privacy policy:', error);
        body.innerHTML = '<p>Errore nel caricamento dell\'informativa privacy.</p>';
        popup.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closePrivacyPolicy() {
    const popup = document.getElementById('privacy-popup');
    popup.classList.remove('active');
    document.body.style.overflow = '';
}

// Simple markdown to HTML converter for privacy policy
function convertMarkdownToHTML(markdown) {
    let html = markdown;
    
    // Convert headers
    html = html.replace(/^### (.*$)/gim, '<h3><i data-feather="info"></i>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h3><i data-feather="shield"></i>$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2><i data-feather="file-text"></i>$1</h2>');
    
    // Convert bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert checkmarks
    html = html.replace(/✅/g, '<span class="checkmark">✅</span>');
    
    // Convert permission sections with icons
    html = html.replace(/\*\*📍 POSIZIONE\*\*/g, '<div class="permission-section"><h4><i data-feather="map-pin"></i>POSIZIONE</h4>');
    html = html.replace(/\*\*📷 FOTOCAMERA\*\*/g, '<div class="permission-section"><h4><i data-feather="camera"></i>FOTOCAMERA</h4>');
    html = html.replace(/\*\*🔄 GIROSCOPIO\*\*/g, '<div class="permission-section"><h4><i data-feather="smartphone"></i>GIROSCOPIO</h4>');
    
    // Close permission sections (look for the pattern where next permission starts or section ends)
    html = html.replace(/(<div class="permission-section">[\s\S]*?)\n\n(?=(\*\*📍|\*\*📷|\*\*🔄|\*\*Tali dati|## ))/g, '$1</div>\n\n');
    html = html.replace(/(<div class="permission-section">[\s\S]*?)(\*\*Tali dati)/g, '$1</div>\n\n$2');
    
    // Convert bullet points
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Convert paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    
    // Clean up empty paragraphs and fix formatting
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[2-3])/g, '$1');
    html = html.replace(/(<\/h[2-3]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<div)/g, '$1');
    html = html.replace(/(<\/div>)<\/p>/g, '$1');
    
    // Add contact info styling
    html = html.replace(/(Email:|PEC:)/g, '<strong>$1</strong>');
    
    return html;
}

// Close popup when clicking outside
document.addEventListener('click', function(event) {
    const popup = document.getElementById('privacy-popup');
    if (event.target === popup) {
        closePrivacyPolicy();
    }
});

// Close popup with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const popup = document.getElementById('privacy-popup');
        if (popup.classList.contains('active')) {
            closePrivacyPolicy();
        }
    }
});

// Gestione ritorno dall'app Apple Maps SOLO su iOS
const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

if (isIOSDevice) {
    console.log('iOS device detected - setting up Maps app return handlers');
    
    // Funzione per forzare il reset dello stato di loading SOLO iOS
    function forceResetIOSLoadingState() {
        // Doppio controllo per assicurarsi che siamo su iOS
        if (!isIOSDevice) {
            console.log('Not iOS device, skipping reset');
            return;
        }
        
        console.log('Forcing iOS WebView loading state reset');
        
        // Nascondi eventuali indicatori di caricamento
        const loadingElements = document.querySelectorAll('.loading, .spinner, .loader');
        loadingElements.forEach(el => {
            el.style.display = 'none';
        });
        
        // Nascondi notifiche di apertura mappe SOLO quelle di Apple Maps
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            if (notification.textContent.includes('Apple Maps')) {
                notification.remove();
            }
            // NON rimuovere notifiche generiche o di Google Maps per Android
        });
        
        // Riattiva le interazioni dell'interfaccia
        document.body.style.pointerEvents = 'auto';
        document.body.style.opacity = '1';
        
        // Ferma eventuali animazioni di caricamento
        const spinners = document.querySelectorAll('[class*="spin"], [class*="rotate"]');
        spinners.forEach(spinner => {
            spinner.style.animation = 'none';
            spinner.style.display = 'none';
        });
        
        // Re-inizializza Feather icons se necessario
        if (typeof feather !== 'undefined') {
            setTimeout(() => {
                feather.replace();
            }, 100);
        }
        
        // Forza un reflow del DOM SOLO per iOS WebView
        const isIOSWebView = window.webkit && window.webkit.messageHandlers;
        if (isIOSWebView) {
            document.body.style.display = 'none';
            document.body.offsetHeight; // Force reflow
            document.body.style.display = '';
        }
        
        console.log('iOS loading state reset completed');
    }
    
    // Timer di sicurezza SOLO per iOS
    let resetTimer;
    
    function startSafetyTimer() {
        // Non avviare il timer se non siamo su iOS
        if (!isIOSDevice) return;
        
        if (resetTimer) clearInterval(resetTimer);
        
        resetTimer = setInterval(() => {
            // Doppio controllo iOS
            if (!isIOSDevice) {
                clearInterval(resetTimer);
                return;
            }
            
            // Controlla se siamo in uno stato di loading infinito SOLO per iOS
            const hasAppleMapsNotification = Array.from(document.querySelectorAll('.notification'))
                .some(notification => notification.textContent.includes('Apple Maps'));
            
            if (hasAppleMapsNotification && document.visibilityState === 'visible') {
                console.log('Detected iOS Apple Maps loading state, forcing reset');
                forceResetIOSLoadingState();
            }
        }, 3000); // Controlla ogni 3 secondi
    }
    
    function stopSafetyTimer() {
        if (resetTimer) {
            clearInterval(resetTimer);
            resetTimer = null;
        }
    }
    
    // Event listeners SOLO per iOS
    document.addEventListener('visibilitychange', function() {
        // Verifica che siamo ancora su iOS
        if (!isIOSDevice) return;
        
        if (document.visibilityState === 'visible') {
            console.log('iOS app tornata in primo piano dopo app esterna');
            
            // Controlla se stavamo aprendo Maps
            const wasOpeningMaps = sessionStorage.getItem('mapsOpeningState');
            const openingTime = sessionStorage.getItem('mapsOpeningTime');
            
            if (wasOpeningMaps) {
                console.log('Returning from Maps opening attempt');
                
                // Pulisci lo stato immediatamente
                sessionStorage.removeItem('mapsOpeningState');
                sessionStorage.removeItem('mapsOpeningTime');
                
                // Reset aggressivo per evitare loading infinito
                setTimeout(() => {
                    forceResetIOSLoadingState();
                    
                    // Forza refresh della pagina se è passato poco tempo (probabile loading infinito)
                    if (openingTime) {
                        const timeDiff = Date.now() - parseInt(openingTime);
                        if (timeDiff < 5000) { // Se sono passati meno di 5 secondi
                            console.log('Quick return detected, forcing page refresh to clear loading state');
                            // Usa un approccio meno invasivo: ricarica solo il contenuto
                            window.location.hash = window.location.hash; // Trigger refresh senza perdere posizione
                        }
                    }
                }, 200);
                
                // Reset aggiuntivo dopo un po'
                setTimeout(() => {
                    forceResetIOSLoadingState();
                }, 1000);
            }
            
            // Reset standard con delay specifici per iOS
            setTimeout(() => {
                forceResetIOSLoadingState();
            }, 500);
            
            startSafetyTimer();
            
        } else {
            stopSafetyTimer();
        }
    });
    
    // PageShow specifico per iOS
    window.addEventListener('pageshow', function(event) {
        if (!isIOSDevice) return;
        
        console.log('iOS pageshow event - persisted:', event.persisted);
        
        forceResetIOSLoadingState();
        startSafetyTimer();
    });
    
    // Focus specifico per iOS
    window.addEventListener('focus', function() {
        if (!isIOSDevice) return;
        
        console.log('iOS finestra tornata in focus');
        
        setTimeout(() => {
            forceResetIOSLoadingState();
        }, 200);
    });
    
    // PageHide specifico per iOS
    window.addEventListener('pagehide', function() {
        if (!isIOSDevice) return;
        
        console.log('iOS page hiding - opening external app');
        stopSafetyTimer();
    });
    
    // Reset iniziale SOLO per iOS
    startSafetyTimer();
    
} else {
    console.log('Non-iOS device detected - skipping iOS-specific Maps return handlers');
}

console.log('Regalbuto Heritage - Script loaded successfully');
