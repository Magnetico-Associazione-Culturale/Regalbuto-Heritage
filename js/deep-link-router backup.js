/**
 * Deep Link Router per Regalbuto Heritage App v2.1
 * Gestisce collegamenti diretti ai monumenti tramite QR codes
 * Supporta Android App Links e iOS Universal Links
 * Fix per integrazione con GitHub Pages e sistema di navigazione
 */
class DeepLinkRouter {
    constructor() {
        // URL base dell'applicazione web (GitHub Pages)
        this.baseWebURL = 'https://magnetico-associazione-culturale.github.io/Regalbuto-Heritage/';
        
        // Dominio per App Links (Android/iOS) - API endpoint
        this.appDomain = 'itinerarioregalbuto.magnetico.cloud';
        
        // Pattern per estrazione ID monumento
        this.monumentIdPattern = /\/([a-zA-Z0-9\-_]+)$/;
        
        // Flag per tracking dello stato
        this.isInitialized = false;
        this.lastDeepLinkId = null;
        this.pendingDeepLink = null;
        
        console.log('🔗 Deep Link Router v2.1 initialized');
        console.log('📍 Base Web URL:', this.baseWebURL);
        console.log('🌐 App Domain:', this.appDomain);
    }
    
    // Inizializza il router
    init() {
        if (this.isInitialized) {
            console.log('⚠️ Deep Link Router already initialized');
            return;
        }
        
        console.log('🚀 Initializing Deep Link Router...');
        
        // Gestisce deep link dal lancio app
        this.setupEventListeners();
        
        // Gestore per Android WebView
        if (window.Android) {
            console.log('📱 Android WebView detected');
            this.handleAndroidIntent();
        }
        
        // Gestore per iOS WebView
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.deepLink) {
            console.log('🍎 iOS WebView detected');
            this.handleiOSUniversalLink();
        }
        
        this.isInitialized = true;
        console.log('✅ Deep Link Router initialization complete');
    }
    
    // Configura event listeners per diversi stati di caricamento
    setupEventListeners() {
        // Aspetta che tutto sia caricato prima di processare deep links
        const initializeDeepLink = () => {
            setTimeout(() => {
                this.handleAppLaunch();
            }, 1000); // Aspetta 1 secondo per assicurare caricamento completo
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeDeepLink);
        } else {
            initializeDeepLink();
        }
    }
    
    // Gestisce lancio app da App Link/Universal Link
    handleAppLaunch() {
        const url = new URL(window.location.href);
        const monumentId = this.extractMonumentId(url);
        
        if (monumentId && monumentId !== this.lastDeepLinkId) {
            console.log('🎯 Deep link detected:', monumentId);
            this.lastDeepLinkId = monumentId;
            this.openMonumentInApp(monumentId);
        } else if (monumentId === this.lastDeepLinkId) {
            console.log('🔄 Deep link already processed:', monumentId);
        }
    }
    
    // Estrae monument ID dall'URL con supporto multi-formato
    extractMonumentId(url) {
        console.log('🔍 Extracting monument ID from URL:', url.href);
        
        // Format 1: ?monument=id (da redirect web)
        const monumentParam = url.searchParams.get('monument');
        if (monumentParam) {
            console.log('📋 Monument ID from monument param:', monumentParam);
            return monumentParam;
        }
        
        // Format 2: ?qr=id (da QR redirect)
        const qrParam = url.searchParams.get('qr');
        if (qrParam) {
            console.log('📱 Monument ID from qr param:', qrParam);
            return qrParam;
        }
        
        // Format 3: ?deep=id (da App Link/Universal Link)
        const deepParam = url.searchParams.get('deep');
        if (deepParam) {
            console.log('🔗 Monument ID from deep param:', deepParam);
            return deepParam;
        }
        
        // Format 4: Nel hash #monument-id
        if (url.hash && url.hash.length > 1) {
            const hashId = url.hash.substring(1);
            console.log('🏷️ Monument ID from hash:', hashId);
            return hashId;
        }
        
        // Format 5: Nel path /monument-id (da API redirect)
        const pathMatch = url.pathname.match(this.monumentIdPattern);
        if (pathMatch && pathMatch[1]) {
            console.log('🛣️ Monument ID from path:', pathMatch[1]);
            return pathMatch[1];
        }
        
        console.log('❌ No monument ID found in URL');
        return null;
    }
    
    // Gestisce intent Android (chiamata dal codice nativo Android)
    handleAndroidIntent() {
        if (window.Android && window.Android.getDeepLinkData) {
            const deepLinkData = window.Android.getDeepLinkData();
            if (deepLinkData) {
                const monumentId = this.parseDeepLinkData(deepLinkData);
                if (monumentId) {
                    this.openMonumentInApp(monumentId);
                }
            }
        }
    }
    
    // Gestisce Universal Link iOS
    handleiOSUniversalLink() {
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.deepLink) {
            window.webkit.messageHandlers.deepLink.postMessage({
                action: 'requestDeepLinkData'
            });
        }
    }
    
    // Callback per iOS (chiamata dal codice nativo iOS)
    handleiOSDeepLinkCallback(deepLinkData) {
        const monumentId = this.parseDeepLinkData(deepLinkData);
        if (monumentId) {
            this.openMonumentInApp(monumentId);
        }
    }
    
    // Parse dei dati deep link dal nativo
    parseDeepLinkData(deepLinkData) {
        try {
            const data = typeof deepLinkData === 'string' ? JSON.parse(deepLinkData) : deepLinkData;
            return data.monumentId || data.monument || data.id;
        } catch (e) {
            console.error('Error parsing deep link data:', e);
            return null;
        }
    }
    
    // Apre monumento nell'app - LOGICA PRINCIPALE
    async openMonumentInApp(monumentId) {
        try {
            console.log('🏛️ Opening monument in app:', monumentId);
            
            // Step 1: Carica dati monumenti
            await this.ensureMonumentData();
            
            // Step 2: Trova il monumento
            const monument = await this.findMonument(monumentId);
            if (!monument) {
                console.error('❌ Monument not found in data:', monumentId);
                this.handleMonumentNotFound(monumentId);
                return;
            }
            
            console.log('✅ Monument found:', monument.name);
            
            // Step 3: Naviga alla sezione tappe
            console.log('🧭 Navigating to tappe section...');
            if (window.switchTab && typeof window.switchTab === 'function') {
                window.switchTab('tappe');
                console.log('✅ Navigated to tappe section');
            } else {
                console.error('❌ switchTab function not available');
                throw new Error('Navigation function not available');
            }
            
            // Step 4: Aspetta rendering e cerca il monumento
            await this.waitForMonumentCards();
            
            // Step 5: Scrolla al monumento
            await this.scrollToMonument(monument);
            
            // Step 6: Mostra feedback di successo
            this.showSuccessFeedback(monument);
            
        } catch (error) {
            console.error('💥 Error in deep link flow:', error);
            this.showErrorFeedback('Errore nell\'apertura del monumento: ' + error.message);
        }
    }
    
    // Carica dati monumenti con fetch diretto
    ensureMonumentData() {
        return new Promise((resolve, reject) => {
            console.log('📦 Loading monument data...');
            
            // Se dati già presenti, usa quelli
            if (window.monumentsData && window.monumentsData.length > 0) {
                console.log('✅ Monument data already available:', window.monumentsData.length, 'monuments');
                resolve();
                return;
            }
            
            // Carica direttamente da JSON
            fetch('data/monuments.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    if (!data || !Array.isArray(data) || data.length === 0) {
                        throw new Error('Invalid or empty monument data');
                    }
                    
                    window.monumentsData = data;
                    console.log('✅ Monument data loaded successfully:', data.length, 'monuments');
                    resolve();
                })
                .catch(error => {
                    console.error('❌ Failed to load monument data:', error);
                    reject(error);
                });
        });
    }
    
    // Trova monumento nei dati
    findMonument(monumentId) {
        return new Promise((resolve) => {
            if (!window.monumentsData || !Array.isArray(window.monumentsData)) {
                console.error('❌ No monument data available');
                resolve(null);
                return;
            }
            
            const monument = window.monumentsData.find(m => m.id === monumentId);
            
            if (monument) {
                console.log('✅ Monument found in data:', monument.name);
            } else {
                console.error('❌ Monument not found in data:', monumentId);
                console.log('📋 Available monument IDs:', window.monumentsData.map(m => m.id).slice(0, 10).join(', '));
            }
            
            resolve(monument);
        });
    }
    
    // Aspetta che le card monumenti siano renderizzate
    waitForMonumentCards() {
        return new Promise((resolve) => {
            console.log('⏳ Waiting for monument cards to render...');
            
            let attempts = 0;
            const maxAttempts = 20; // 4 secondi max
            
            const checkCards = () => {
                attempts++;
                const tappeSection = document.getElementById('tappe');
                const monumentCards = tappeSection ? tappeSection.querySelectorAll('.monument-card') : [];
                
                console.log('🔍 Attempt ' + attempts + ': Section active: ' + (tappeSection ? tappeSection.classList.contains('active') : 'null') + ', Cards: ' + monumentCards.length);
                
                if (tappeSection && tappeSection.classList.contains('active') && monumentCards.length > 0) {
                    console.log('✅ Monument cards ready:', monumentCards.length);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.warn('⚠️ Timeout waiting for monument cards, proceeding anyway...');
                    resolve();
                } else {
                    setTimeout(checkCards, 200);
                }
            };
            
            checkCards();
        });
    }
    
    // Scrolla al monumento specifico
    scrollToMonument(monument) {
        return new Promise((resolve) => {
            console.log('🎯 Scrolling to monument:', monument.id);
            
            // Selettori per trovare la card
            const selectors = [
                '[data-monument-id="' + monument.id + '"]',
                '.monument-card[data-monument-id="' + monument.id + '"]'
            ];
            
            let monumentCard = null;
            let usedSelector = null;
            
            for (const selector of selectors) {
                monumentCard = document.querySelector(selector);
                if (monumentCard) {
                    console.log('🎯 Found monument card with selector:', selector);
                    usedSelector = selector;
                    break;
                }
            }
            
            // Debug: mostra tutte le card presenti
            const allCards = document.querySelectorAll('.monument-card');
            console.log('🗃️ Total monument cards in DOM:', allCards.length);
            
            if (allCards.length > 0) {
                console.log('📋 Available monument card IDs:');
                for (let i = 0; i < Math.min(allCards.length, 10); i++) {
                    const card = allCards[i];
                    const cardId = card.getAttribute('data-monument-id') || 'no-id';
                    console.log('  ' + (i + 1) + '. "' + cardId + '"');
                }
                if (allCards.length > 10) {
                    console.log('  ... and ' + (allCards.length - 10) + ' more');
                }
            }
            
            if (monumentCard) {
                // Scrolla alla card
                monumentCard.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
                
                // Evidenziazione
                this.highlightElement(monumentCard);
                
                // NUOVO: Apri automaticamente la card del monumento
                setTimeout(() => {
                    this.expandMonumentCard(monument.id);
                }, 500); // Aspetta che lo scroll sia completato
                
                console.log('📍 Successfully scrolled to monument card:', monument.id);
                resolve();
            } else {
                console.warn('⚠️ Monument card not found, trying fallback search...');
                this.fallbackScrollSearch(monument.id);
                resolve();
            }
        });
    }
    
    // Espande automaticamente la card del monumento
    expandMonumentCard(monumentId) {
        console.log('📂 Expanding monument card:', monumentId);
        
        // Usa la funzione toggleMonument esistente se disponibile
        if (window.toggleMonument && typeof window.toggleMonument === 'function') {
            // Controlla se la card è già espansa
            const content = document.getElementById('content-' + monumentId);
            const isExpanded = content ? content.classList.contains('expanded') : false;
            
            if (!isExpanded) {
                console.log('🔧 Using toggleMonument function to expand card');
                window.toggleMonument(monumentId);
            } else {
                console.log('ℹ️ Monument card already expanded');
            }
        } else {
            // Fallback: simula click sulla freccetta
            console.log('🔧 Fallback: simulating arrow click');
            const expandBtn = document.querySelector('[data-monument-id="' + monumentId + '"] .expand-btn');
            
            if (expandBtn) {
                expandBtn.click();
                console.log('✅ Simulated click on expand button');
            } else {
                console.warn('⚠️ Expand button not found for monument:', monumentId);
            }
        }
    }
    
    // Evidenziazione temporanea dell'elemento
    highlightElement(element) {
        // Aggiungi classe per evidenziazione
        element.classList.add('deep-link-highlight');
        
        // Rimuovi dopo 3 secondi
        setTimeout(() => {
            element.classList.remove('deep-link-highlight');
        }, 3000);
        
        // Aggiungi stili CSS se non presenti
        if (!document.getElementById('deep-link-styles')) {
            const style = document.createElement('style');
            style.id = 'deep-link-styles';
            style.textContent = `
                .deep-link-highlight {
                    animation: deepLinkPulse 2s ease-in-out;
                    box-shadow: 0 0 20px rgba(255, 165, 0, 0.8) !important;
                    border: 2px solid #FFA500 !important;
                    border-radius: 8px !important;
                    transform: scale(1.02);
                }
                
                @keyframes deepLinkPulse {
                    0% { transform: scale(1.02); box-shadow: 0 0 20px rgba(255, 165, 0, 0.8); }
                    50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(255, 165, 0, 1); }
                    100% { transform: scale(1.02); box-shadow: 0 0 20px rgba(255, 165, 0, 0.8); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Ricerca fallback per monumento
    fallbackScrollSearch(monumentId) {
        console.log('🔍 Fallback search for monument:', monumentId);
        
        // Cerca elementi che contengono l'ID del monumento nel testo o attributi
        const allCards = document.querySelectorAll('.monument-card, .featured-card');
        
        for (const card of allCards) {
            // Controlla attributi
            const cardId = card.getAttribute('data-monument-id') || card.getAttribute('data-id') || '';
            if (cardId.toLowerCase().includes(monumentId.toLowerCase())) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                this.highlightElement(card);
                console.log('🔍 Fallback found card by attribute:', cardId);
                return;
            }
            
            // Controlla contenuto testuale
            if (card.textContent && card.textContent.toLowerCase().includes(monumentId.toLowerCase())) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                this.highlightElement(card);
                console.log('🔍 Fallback found card by text content');
                return;
            }
        }
        
        console.warn('❌ No fallback element found for:', monumentId);
    }
    
    // Mostra feedback di successo
    showSuccessFeedback(monument) {
        const message = '🏛️ ' + monument.name;
        
        if (window.showNotification && typeof window.showNotification === 'function') {
            window.showNotification(message, 'success');
        } else {
            this.showCustomAlert(message, 'success');
        }
        
        console.log('✅ Deep link completed successfully for:', monument.name);
    }
    
    // Mostra feedback di errore
    showErrorFeedback(message) {
        console.error('💥 Deep link error:', message);
        
        if (window.showNotification && typeof window.showNotification === 'function') {
            window.showNotification(message, 'error');
        } else {
            this.showCustomAlert(message, 'error');
        }
    }
    
    // Alert personalizzato se showNotification non disponibile
    showCustomAlert(message, type) {
        const alertDiv = document.createElement('div');
        const bgColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3';
        
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            font-size: 14px;
            max-width: 300px;
            text-align: center;
            animation: slideInDown 0.3s ease-out;
            background-color: ${bgColor};
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        alertDiv.textContent = message;
        document.body.appendChild(alertDiv);
        
        // Rimuovi dopo 4 secondi
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.style.animation = 'slideOutUp 0.3s ease-in forwards';
                setTimeout(() => {
                    if (alertDiv.parentNode) {
                        document.body.removeChild(alertDiv);
                    }
                }, 300);
            }
        }, 4000);
        
        // Aggiungi CSS per animazioni se non presente
        if (!document.getElementById('custom-alert-styles')) {
            const style = document.createElement('style');
            style.id = 'custom-alert-styles';
            style.textContent = `
                @keyframes slideInDown {
                    from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
                @keyframes slideOutUp {
                    from { transform: translateX(-50%) translateY(0); opacity: 1; }
                    to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Gestisce monumento non trovato
    handleMonumentNotFound(monumentId) {
        console.error('❌ Monument not found:', monumentId);
        
        // Naviga alla sezione tappe comunque per mostrare i monumenti disponibili
        if (window.switchTab && typeof window.switchTab === 'function') {
            window.switchTab('tappe');
        }
        
        // Mostra errore
        this.showErrorFeedback('Monumento "' + monumentId + '" non trovato');
        
        // Suggerisci monumenti alternativi dopo 2 secondi
        setTimeout(() => {
            this.suggestAlternativeMonuments();
        }, 2000);
    }
    
    // Suggerisce monumenti alternativi
    suggestAlternativeMonuments() {
        if (!window.monumentsData || window.monumentsData.length === 0) return;
        
        const featuredMonuments = window.monumentsData
            .filter(m => m.audio || (m.images && m.images.some(img => img.format === '360')))
            .slice(0, 3)
            .map(m => m.name)
            .join(', ');
        
        if (featuredMonuments) {
            const message = 'Monumenti disponibili: ' + featuredMonuments;
            
            if (window.showNotification && typeof window.showNotification === 'function') {
                window.showNotification(message, 'info');
            } else {
                this.showCustomAlert(message, 'info');
            }
        }
    }
    
    // Generazione URL per QR codes
    generateQRUrls() {
        if (!window.monumentsData) return [];
        
        return window.monumentsData
            .filter(monument => monument.lat && monument.lon)
            .map(monument => ({
                monumentId: monument.id,
                monumentName: monument.name,
                category: monument.category,
                qrCodeUrl: 'https://' + this.appDomain + '/' + monument.id,
                webFallbackUrl: this.baseWebURL + '?deep=' + monument.id
            }));
    }
}

// Inizializza router globale
const deepLinkRouter = new DeepLinkRouter();

// Auto-inizializzazione con delay per assicurare caricamento script.js
setTimeout(() => {
    deepLinkRouter.init();
}, 100);

// Esponi funzione per callback iOS
window.handleiOSDeepLink = (deepLinkData) => {
    deepLinkRouter.handleiOSDeepLinkCallback(deepLinkData);
};

// Funzioni di utilità per testing e generazione QR
window.deepLinkUtils = {
    // Test deep link
    testDeepLink: (monumentId) => {
        const testUrl = window.location.origin + window.location.pathname + '?deep=' + monumentId;
        console.log('🧪 Testing deep link:', testUrl);
        window.location.href = testUrl;
    },
    
    // Forza apertura monumento
    forceOpenMonument: (monumentId) => {
        console.log('🔧 Force opening monument:', monumentId);
        deepLinkRouter.openMonumentInApp(monumentId);
    },
    
    // Debug: mostra stato sistema
    debugStatus: () => {
        console.group('🔧 Deep Link System Status');
        console.log('Router initialized:', deepLinkRouter.isInitialized);
        console.log('Monument data loaded:', !!window.monumentsData);
        console.log('Monument data count:', window.monumentsData ? window.monumentsData.length : 0);
        console.log('switchTab available:', typeof window.switchTab);
        console.log('Current URL:', window.location.href);
        console.log('Monument ID in URL:', deepLinkRouter.extractMonumentId(new URL(window.location.href)));
        console.groupEnd();
    },
    
    // Genera CSV per QR codes
    generateQRCodeCSV: () => {
        const urls = deepLinkRouter.generateQRUrls();
        
        if (urls.length === 0) {
            console.error('❌ No monument data available');
            return;
        }
        
        const csvHeaders = 'Monument ID,Monument Name,Category,QR Code URL,Web Fallback URL';
        const csvRows = urls.map(item => 
            '"' + item.monumentId + '","' + item.monumentName + '","' + item.category + '","' + item.qrCodeUrl + '","' + item.webFallbackUrl + '"'
        );
        
        const csvContent = [csvHeaders].concat(csvRows).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'regalbuto_qr_app_links.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.table(urls);
        return urls;
    },
    
    // Mostra tutti gli URL per QR codes
    showAllQRUrls: () => {
        const urls = deepLinkRouter.generateQRUrls();
        console.group('🏛️ QR Code URLs for Monuments');
        urls.forEach(item => {
            console.log(item.monumentName + ': ' + item.qrCodeUrl);
        });
        console.groupEnd();
        return urls;
    },
    
    // Test espansione card monumento
    testExpansion: (monumentId) => {
        console.log('🧪 Testing monument card expansion for:', monumentId);
        deepLinkRouter.expandMonumentCard(monumentId);
    },
    
    // Test completo: naviga e espandi
    testFullFlow: (monumentId) => {
        console.log('🧪 Testing complete deep link flow for:', monumentId);
        
        // Naviga alla sezione tappe
        if (window.switchTab) {
            window.switchTab('tappe');
        }
        
        // Aspetta e poi espandi
        setTimeout(() => {
            deepLinkRouter.expandMonumentCard(monumentId);
        }, 1000);
    }
};

// Debug automatico se presente parametro deep nell'URL
if (window.location.search.includes('deep=') || window.location.search.includes('monument=') || window.location.search.includes('qr=')) {
    setTimeout(() => {
        console.log('🔍 Deep link detected in URL, debugging...');
        window.deepLinkUtils.debugStatus();
    }, 2000);
}

// Log di inizializzazione
console.log('🏛️ Deep Link Router v2.1 loaded and ready');
console.log('🔧 Available utils: window.deepLinkUtils');
console.log('🧪 Test command: window.deepLinkUtils.testDeepLink("chiesa-santa-maria-croce")');
