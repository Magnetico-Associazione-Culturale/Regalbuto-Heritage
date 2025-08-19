/**
 * Deep Link Router per Regalbuto Heritage App v2.0
 * Gestisce collegamenti diretti ai monumenti tramite QR codes
 * Supporta Android App Links e iOS Universal Links
 * Integrazione migliorata con GitHub Pages e sistema di navigazione esistente
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
        
        console.log('🔗 Deep Link Router v2.0 initialized');
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
        
        // Gestisce deep link dal lancio app - usando multiple event listeners
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
        // Caso 1: DOM non ancora caricato
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.handleAppLaunchWithDelay();
            });
        }
        // Caso 2: DOM già caricato
        else if (document.readyState === 'interactive' || document.readyState === 'complete') {
            setTimeout(() => this.handleAppLaunchWithDelay(), 100);
        }
        
        // Backup: listener su window load
        window.addEventListener('load', () => {
            if (!this.lastDeepLinkId && !this.pendingDeepLink) {
                this.handleAppLaunchWithDelay();
            }
        });
    }
    
    // Gestisce lancio app con delay per assicurare caricamento
    handleAppLaunchWithDelay() {
        setTimeout(() => {
            this.handleAppLaunch();
        }, 500); // Delay per assicurare caricamento completo
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
    
    // Apre monumento nell'app - LOGICA PRINCIPALE MIGLIORATA
    async openMonumentInApp(monumentId) {
        try {
            console.log('🏛️ Opening monument in app:', monumentId);
            
            // Step 1: Verifica e carica dati monumenti se necessario
            await this.ensureMonumentData();
            
            // Step 2: Trova il monumento
            const monument = await this.findMonument(monumentId);
            if (!monument) {
                console.error('❌ Monument not found:', monumentId);
                this.handleMonumentNotFound(monumentId);
                return;
            }
            
            console.log('✅ Monument found:', monument.name);
            
            // Step 3: Naviga alla sezione corretta
            await this.navigateToMonumentSection(monument);
            
            // Step 4: Aspetta rendering e scrolla al monumento
            await this.scrollToMonumentWithFeedback(monument);
            
            // Step 5: Mostra feedback di successo
            this.showSuccessFeedback(monument);
            
        } catch (error) {
            console.error('💥 Error in deep link flow:', error);
            this.showErrorFeedback('Errore nell\'apertura del monumento');
        }
    }
    
    // Assicura che i dati dei monumenti siano caricati
    ensureMonumentData() {
        return new Promise((resolve, reject) => {
            // Caso 1: Dati già caricati
            if (window.monumentsData && window.monumentsData.length > 0) {
                resolve();
                return;
            }
            
            // Caso 2: Funzione di caricamento disponibile
            if (window.loadMonumentsFromJSON && typeof window.loadMonumentsFromJSON === 'function') {
                console.log('📦 Loading monument data...');
                window.loadMonumentsFromJSON()
                    .then(resolve)
                    .catch(reject);
            }
            // Caso 3: Dati non ancora disponibili, aspetta
            else {
                console.log('⏳ Waiting for monument data to load...');
                const checkData = () => {
                    if (window.monumentsData && window.monumentsData.length > 0) {
                        resolve();
                    } else {
                        setTimeout(checkData, 200);
                    }
                };
                setTimeout(checkData, 500);
            }
        });
    }
    
    // Trova monumento nei dati
    findMonument(monumentId) {
        return new Promise((resolve) => {
            if (!window.monumentsData) {
                resolve(null);
                return;
            }
            
            const monument = window.monumentsData.find(m => m.id === monumentId);
            resolve(monument);
        });
    }
    
    // Naviga alla sezione appropriata per il monumento
    navigateToMonumentSection(monument) {
        return new Promise((resolve) => {
            console.log('🧭 Navigating to monument section for:', monument.name);
            
            // Determina la sezione target (per ora usa sempre 'monumenti')
            const targetSection = 'monumenti';
            
            // Naviga usando la funzione esistente
            if (window.switchTab && typeof window.switchTab === 'function') {
                window.switchTab(targetSection);
                console.log('✅ Navigated to section:', targetSection);
            } else {
                console.warn('⚠️ switchTab function not available');
            }
            
            resolve(monument);
        });
    }
    
    // Scrolla al monumento con feedback visivo
    scrollToMonumentWithFeedback(monument) {
        return new Promise((resolve) => {
            // Aspetta rendering sezione
            setTimeout(() => {
                this.scrollToMonumentCard(monument.id);
                resolve(monument);
            }, 800);
        });
    }
    
    // Scrolla alla card del monumento
    scrollToMonumentCard(monumentId) {
        // Cerca la card del monumento con diversi selettori
        const selectors = [
            `[data-monument-id="${monumentId}"]`,
            `[data-id="${monumentId}"]`,
            `.monument-card[data-monument="${monumentId}"]`,
            `#monument-${monumentId}`
        ];
        
        let monumentCard = null;
        
        for (const selector of selectors) {
            monumentCard = document.querySelector(selector);
            if (monumentCard) {
                console.log('🎯 Found monument card with selector:', selector);
                break;
            }
        }
        
        if (monumentCard) {
            // Scrolla alla card
            monumentCard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
            
            // Aggiungi evidenziazione temporanea
            this.highlightElement(monumentCard);
            
            console.log('📍 Scrolled to monument:', monumentId);
        } else {
            console.warn('⚠️ Monument card not found in DOM:', monumentId);
            
            // Fallback: cerca per nome o descrizione
            this.fallbackScrollSearch(monumentId);
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
                }
                
                @keyframes deepLinkPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Ricerca fallback per monumento
    fallbackScrollSearch(monumentId) {
        // Cerca elementi che contengono l'ID del monumento nel testo
        const allElements = document.querySelectorAll('.monument-card, .featured-card, [class*="monument"]');
        
        for (const element of allElements) {
            if (element.textContent && element.textContent.toLowerCase().includes(monumentId.toLowerCase())) {
                element.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                this.highlightElement(element);
                console.log('🔍 Fallback scroll found element for:', monumentId);
                return;
            }
        }
        
        console.warn('❌ No fallback element found for:', monumentId);
    }
    
    // Mostra feedback di successo
    showSuccessFeedback(monument) {
        const message = `🏛️ ${monument.name}`;
        
        if (window.showNotification && typeof window.showNotification === 'function') {
            window.showNotification(message, 'success');
        } else {
            // Fallback: mostra alert personalizzato
            this.showCustomAlert(message, 'success');
        }
        
        console.log('✅ Monument opened successfully:', monument.name);
    }
    
    // Mostra feedback di errore
    showErrorFeedback(message) {
        if (window.showNotification && typeof window.showNotification === 'function') {
            window.showNotification(message, 'error');
        } else {
            this.showCustomAlert(message, 'error');
        }
    }
    
    // Alert personalizzato se showNotification non disponibile
    showCustomAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            font-size: 14px;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
            background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
        `;
        
        alertDiv.textContent = message;
        document.body.appendChild(alertDiv);
        
        // Rimuovi dopo 4 secondi
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.style.animation = 'slideOutRight 0.3s ease-in forwards';
                setTimeout(() => {
                    document.body.removeChild(alertDiv);
                }, 300);
            }
        }, 4000);
        
        // Aggiungi CSS per animazioni se non presente
        if (!document.getElementById('custom-alert-styles')) {
            const style = document.createElement('style');
            style.id = 'custom-alert-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Gestisce monumento non trovato
    handleMonumentNotFound(monumentId) {
        console.error('❌ Monument not found:', monumentId);
        
        // Naviga alla home
        if (window.switchTab && typeof window.switchTab === 'function') {
            window.switchTab('home');
        }
        
        // Mostra errore
        this.showErrorFeedback(`Monumento "${monumentId}" non trovato`);
        
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
            const message = `Monumenti disponibili: ${featuredMonuments}`;
            
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
                qrCodeUrl: `https://${this.appDomain}/${monument.id}`,
                webFallbackUrl: `${this.baseWebURL}?deep=${monument.id}`
            }));
    }
}

// Inizializza router globale
const deepLinkRouter = new DeepLinkRouter();

// Auto-inizializzazione
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        deepLinkRouter.init();
    });
} else {
    deepLinkRouter.init();
}

// Esponi funzione per callback iOS
window.handleiOSDeepLink = (deepLinkData) => {
    deepLinkRouter.handleiOSDeepLinkCallback(deepLinkData);
};

// Funzioni di utilità per testing e generazione QR
window.deepLinkUtils = {
    // Test deep link (solo per development)
    testDeepLink: (monumentId) => {
        const testUrl = `${window.location.origin}${window.location.pathname}?deep=${monumentId}`;
        console.log('🧪 Testing deep link:', testUrl);
        window.location.href = testUrl;
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
            `"${item.monumentId}","${item.monumentName}","${item.category}","${item.qrCodeUrl}","${item.webFallbackUrl}"`
        );
        
        const csvContent = [csvHeaders, ...csvRows].join('\n');
        
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
            console.log(`${item.monumentName}: ${item.qrCodeUrl}`);
        });
        console.groupEnd();
        return urls;
    },
    
    // Forza apertura monumento (per debug)
    forceOpenMonument: (monumentId) => {
        console.log('🔧 Force opening monument:', monumentId);
        deepLinkRouter.openMonumentInApp(monumentId);
    },
    
    // Test tutti i formati URL
    testAllUrlFormats: (monumentId) => {
        const baseUrl = `${window.location.origin}${window.location.pathname}`;
        const testUrls = [
            `${baseUrl}?monument=${monumentId}`,
            `${baseUrl}?qr=${monumentId}`,
            `${baseUrl}?deep=${monumentId}`,
            `${baseUrl}#${monumentId}`
        ];
        
        console.group('🧪 Testing all URL formats for monument:', monumentId);
        testUrls.forEach(url => {
            console.log('Test URL:', url);
        });
        console.groupEnd();
        
        return testUrls;
    }
};

// Log di inizializzazione
console.log('🏛️ Deep Link Router v2.0 loaded and ready');
console.log('🔧 Available utils: window.deepLinkUtils');
