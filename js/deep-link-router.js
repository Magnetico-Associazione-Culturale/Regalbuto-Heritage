/**
 * Deep Link Router per QR Code Monumenti
 * Gestisce App Links Android e Universal Links iOS in background
 */
class DeepLinkRouter {
    constructor() {
        this.baseWebURL = 'https://magnetico-associazione-culturale.github.io/Regalbuto-Heritage/';
        this.appDomain = 'itinerarioregalbuto.magnetico.cloud';
        this.init();
    }
    
    init() {
        // Gestisce URL al caricamento (da App Link/Universal Link)
        window.addEventListener('load', () => {
            this.handleAppLaunch();
        });
        
        // Gestisce intenti Android (se in WebView Android)
        if (window.Android) {
            this.handleAndroidIntent();
        }
        
        // Gestisce Universal Link iOS (se in WebView iOS)
        if (window.webkit && window.webkit.messageHandlers) {
            this.handleiOSUniversalLink();
        }
    }
    
    // Gestisce lancio app da App Link/Universal Link
    handleAppLaunch() {
        const url = new URL(window.location.href);
        const monumentId = this.extractMonumentId(url);
        
        if (monumentId) {
            console.log('Deep link detected:', monumentId);
            this.openMonumentInApp(monumentId);
        }
    }
    
    // Estrae monument ID dall'URL
    extractMonumentId(url) {
        // Format 1: ?monument=id (da redirect web)
        const monumentParam = url.searchParams.get('monument');
        if (monumentParam) return monumentParam;
        
        // Format 2: ?qr=id (da QR redirect)
        const qrParam = url.searchParams.get('qr');
        if (qrParam) return qrParam;
        
        // Format 3: ?deep=id (da App Link/Universal Link)
        const deepParam = url.searchParams.get('deep');
        if (deepParam) return deepParam;
        
        // Format 4: Nel hash #monument-id
        if (url.hash && url.hash.length > 1) {
            return url.hash.substring(1);
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
        if (window.webkit.messageHandlers.deepLink) {
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
            console.log('Opening monument:', monumentId);
            
            // Assicura caricamento dati
            if (!window.monumentsData || window.monumentsData.length === 0) {
                if (window.loadMonumentsFromJSON) {
                    await window.loadMonumentsFromJSON();
                } else {
                    console.error('loadMonumentsFromJSON function not available');
                    return;
                }
            }
            
            // Trova monumento
            const monument = window.monumentsData.find(m => m.id === monumentId);
            
            if (!monument) {
                console.error('Monument not found:', monumentId);
                this.handleMonumentNotFound(monumentId);
                return;
            }
            
            // Naviga alla sezione tappe
            if (window.switchTab) {
                window.switchTab('tappe');
            }
            
            // Aspetta rendering sezione
            await this.waitForTabRender('tappe');
            
            // Scrolla al monumento (senza evidenziazione)
            this.scrollToMonument(monument.id);
            
            // Notifica successo
            if (window.showNotification) {
                window.showNotification(`${monument.name}`, 'success');
            }
            
            console.log('Monument opened successfully:', monument.name);
            
        } catch (error) {
            console.error('Error opening monument from deep link:', error);
            if (window.showNotification) {
                window.showNotification('Errore nell\'apertura del monumento', 'error');
            }
        }
    }
    
    // Aspetta rendering tab
    waitForTabRender(tabName) {
        return new Promise((resolve) => {
            const checkTab = () => {
                const tabElement = document.getElementById(tabName);
                const monumentCards = tabElement?.querySelectorAll('.monument-card');
                
                if (monumentCards && monumentCards.length > 0) {
                    resolve();
                } else {
                    setTimeout(checkTab, 100);
                }
            };
            setTimeout(checkTab, 200);
        });
    }
    
    // Scrolla al monumento (senza evidenziazione speciale)
    scrollToMonument(monumentId) {
        // Aspetta un momento per assicurarsi che il DOM sia pronto
        setTimeout(() => {
            const monumentCard = document.querySelector(`[data-monument-id="${monumentId}"]`);
            
            if (monumentCard) {
                monumentCard.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
                console.log('Scrolled to monument:', monumentId);
            } else {
                console.warn('Monument card not found in DOM:', monumentId);
            }
        }, 300);
    }
    
    // Gestisce monumento non trovato
    handleMonumentNotFound(monumentId) {
        if (window.switchTab) {
            window.switchTab('home');
        }
        
        if (window.showNotification) {
            window.showNotification(`Monumento "${monumentId}" non trovato`, 'error');
        }
        
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
        
        if (featuredMonuments && window.showNotification) {
            window.showNotification(`Monumenti disponibili: ${featuredMonuments}`, 'info');
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

// Esponi funzione per callback iOS
window.handleiOSDeepLink = (deepLinkData) => {
    deepLinkRouter.handleiOSDeepLinkCallback(deepLinkData);
};

// Funzioni di utilità per testing e generazione QR
window.deepLinkUtils = {
    // Test deep link (solo per development)
    testDeepLink: (monumentId) => {
        const testUrl = `${window.location.origin}${window.location.pathname}?deep=${monumentId}`;
        console.log('Testing deep link:', testUrl);
        window.location.href = testUrl;
    },
    
    // Genera CSV per QR codes
    generateQRCodeCSV: () => {
        const urls = deepLinkRouter.generateQRUrls();
        
        if (urls.length === 0) {
            console.error('No monument data available');
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
    }
};
