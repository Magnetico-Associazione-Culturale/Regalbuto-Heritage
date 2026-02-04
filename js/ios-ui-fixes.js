/**
 * iOS UI Fixes - Risolve problemi specifici iOS
 * Forza border-radius sui pulsanti e corregge posizionamento elementi
 */

(function() {
    'use strict';
    
    // Detect iOS
    function isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }
    
    // Fix per pulsanti quadrati su iOS
    function fixButtonBorderRadius() {
        if (!isIOS()) return;
        
        console.log('🍎 iOS detected - applying button border-radius fixes...');
        
        // Seleziona tutti i pulsanti
        const buttons = document.querySelectorAll('button, .btn, input[type="button"], input[type="submit"]');
        
        buttons.forEach(button => {
            // Forza border-radius
            button.style.setProperty('border-radius', '12px', 'important');
            button.style.setProperty('-webkit-border-radius', '12px', 'important');
            button.style.setProperty('-webkit-appearance', 'none', 'important');
            button.style.setProperty('appearance', 'none', 'important');
            button.style.setProperty('overflow', 'hidden', 'important');
        });
        
        // Fix specifico per pulsante chiusura
        const closeBtn = document.querySelector('.info-close-btn');
        if (closeBtn) {
            closeBtn.style.setProperty('border-radius', '50%', 'important');
            closeBtn.style.setProperty('-webkit-border-radius', '50%', 'important');
            closeBtn.style.setProperty('position', 'fixed', 'important');
            closeBtn.style.setProperty('top', '20px', 'important');
            closeBtn.style.setProperty('right', '20px', 'important');
            closeBtn.style.setProperty('left', 'unset', 'important');
            closeBtn.style.setProperty('transform', 'none', 'important');
            closeBtn.style.setProperty('-webkit-transform', 'none', 'important');
            console.log('✅ Fixed close button positioning for iOS');
        }
        
        console.log(`✅ Applied border-radius fixes to ${buttons.length} buttons`);
    }
    
    // Fix per mappa invisibile su iOS
    function fixMapVisibility() {
        if (!isIOS()) return;
        
        console.log('🗺️ iOS detected - fixing map visibility...');
        
        const mapContainer = document.querySelector('.map-container');
        const gpsMap = document.querySelector('#gps-map');
        const fullscreenMapContainer = document.querySelector('.fullscreen-map-container');
        const fullscreenMap = document.querySelector('.fullscreen-map');
        const navigazioneSection = document.querySelector('#navigazione.section');
        
        // Fix per mappa normale
        if (mapContainer) {
            mapContainer.style.setProperty('opacity', '1', 'important');
            mapContainer.style.setProperty('visibility', 'visible', 'important');
            mapContainer.style.setProperty('display', 'block', 'important');
            mapContainer.style.setProperty('height', '400px', 'important');
        }
        
        // Fix per GPS map normale
        if (gpsMap) {
            gpsMap.style.setProperty('opacity', '1', 'important');
            gpsMap.style.setProperty('visibility', 'visible', 'important');
            gpsMap.style.setProperty('display', 'block', 'important');
            gpsMap.style.setProperty('height', '400px', 'important');
            gpsMap.style.setProperty('width', '100%', 'important');
        }
        
        // Fix specifici per mappa fullscreen (sezione itinerario)
        if (fullscreenMapContainer) {
            fullscreenMapContainer.style.setProperty('opacity', '1', 'important');
            fullscreenMapContainer.style.setProperty('visibility', 'visible', 'important');
            fullscreenMapContainer.style.setProperty('display', 'block', 'important');
            fullscreenMapContainer.style.setProperty('height', '100vh', 'important');
            fullscreenMapContainer.style.setProperty('width', '100vw', 'important');
            fullscreenMapContainer.style.setProperty('min-height', '100vh', 'important');
            console.log('✅ Fixed fullscreen map container for iOS');
        }
        
        // Fix per fullscreen map
        if (fullscreenMap || (gpsMap && gpsMap.classList.contains('fullscreen-map'))) {
            const targetMap = fullscreenMap || gpsMap;
            targetMap.style.setProperty('opacity', '1', 'important');
            targetMap.style.setProperty('visibility', 'visible', 'important');
            targetMap.style.setProperty('display', 'block', 'important');
            targetMap.style.setProperty('height', '100vh', 'important');
            targetMap.style.setProperty('width', '100vw', 'important');
            targetMap.style.setProperty('min-height', '100vh', 'important');
            // Forza layer rendering
            targetMap.style.setProperty('-webkit-transform', 'translateZ(0)', 'important');
            targetMap.style.setProperty('transform', 'translateZ(0)', 'important');
            targetMap.style.setProperty('isolation', 'isolate', 'important');
            console.log('✅ Fixed fullscreen map for iOS');
        }
        
        // Fix per sezione navigazione
        if (navigazioneSection) {
            navigazioneSection.style.setProperty('opacity', '1', 'important');
            navigazioneSection.style.setProperty('visibility', 'visible', 'important');
            navigazioneSection.style.setProperty('display', 'block', 'important');
            console.log('✅ Fixed navigation section for iOS');
        }
        
        // Fix per canvas mappa
        const canvases = document.querySelectorAll('.mapboxgl-canvas, .maplibregl-canvas');
        canvases.forEach(canvas => {
            canvas.style.setProperty('opacity', '1', 'important');
            canvas.style.setProperty('visibility', 'visible', 'important');
            canvas.style.setProperty('display', 'block', 'important');
        });
        
        console.log('✅ Applied map visibility fixes for iOS');
    }
    
    // Applica fix quando DOM è ready
    function applyFixes() {
        fixButtonBorderRadius();
        fixMapVisibility();
    }
    
    // Osserva cambiamenti DOM per ri-applicare i fix
    function observeDOMChanges() {
        if (!isIOS()) return;
        
        const observer = new MutationObserver(function(mutations) {
            let needsButtonFix = false;
            let needsMapFix = false;
            
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            // Check per nuovi pulsanti
                            if (node.matches?.('button, .btn') || 
                                node.querySelector?.('button, .btn')) {
                                needsButtonFix = true;
                            }
                            
                            // Check per elementi mappa (incluso fullscreen)
                            if (node.matches?.('.map-container, #gps-map, .fullscreen-map-container, .fullscreen-map') || 
                                node.querySelector?.('.map-container, #gps-map, .fullscreen-map-container, .fullscreen-map')) {
                                needsMapFix = true;
                            }
                            
                            // Check per sezione navigazione
                            if (node.matches?.('#navigazione') || 
                                node.querySelector?.('#navigazione')) {
                                needsMapFix = true;
                            }
                        }
                    });
                }
            });
            
            if (needsButtonFix) {
                setTimeout(fixButtonBorderRadius, 100);
            }
            if (needsMapFix) {
                setTimeout(fixMapVisibility, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Inizializza
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            applyFixes();
            observeDOMChanges();
        });
    } else {
        applyFixes();
        observeDOMChanges();
    }
    
    // Ri-applica fix quando si cambia sezione
    window.addEventListener('beforeunload', function() {
        // Cleanup observer se necessario
    });
    
    // Debug function
    window.debugiOSFixes = function() {
        console.log('🔍 iOS UI Fixes Debug Info:');
        console.log('iOS detected:', isIOS());
        
        const buttons = document.querySelectorAll('button, .btn');
        console.log(`Found ${buttons.length} buttons`);
        
        buttons.forEach((btn, i) => {
            const borderRadius = getComputedStyle(btn).borderRadius;
            console.log(`Button ${i + 1}: border-radius = ${borderRadius}`);
        });
        
        const mapContainer = document.querySelector('.map-container');
        const gpsMap = document.querySelector('#gps-map');
        const fullscreenMapContainer = document.querySelector('.fullscreen-map-container');
        const fullscreenMap = document.querySelector('.fullscreen-map');
        
        if (mapContainer) {
            console.log('Map container opacity:', getComputedStyle(mapContainer).opacity);
            console.log('Map container display:', getComputedStyle(mapContainer).display);
        }
        
        if (gpsMap) {
            console.log('GPS map opacity:', getComputedStyle(gpsMap).opacity);
            console.log('GPS map display:', getComputedStyle(gpsMap).display);
            console.log('GPS map height:', getComputedStyle(gpsMap).height);
        }
        
        if (fullscreenMapContainer) {
            console.log('Fullscreen map container opacity:', getComputedStyle(fullscreenMapContainer).opacity);
            console.log('Fullscreen map container display:', getComputedStyle(fullscreenMapContainer).display);
            console.log('Fullscreen map container height:', getComputedStyle(fullscreenMapContainer).height);
        }
        
        if (fullscreenMap || (gpsMap && gpsMap.classList.contains('fullscreen-map'))) {
            const targetMap = fullscreenMap || gpsMap;
            console.log('Fullscreen map opacity:', getComputedStyle(targetMap).opacity);
            console.log('Fullscreen map display:', getComputedStyle(targetMap).display);
            console.log('Fullscreen map height:', getComputedStyle(targetMap).height);
        }
        
        return {
            isIOS: isIOS(),
            buttonsCount: buttons.length,
            mapContainerVisible: mapContainer ? getComputedStyle(mapContainer).display !== 'none' : false,
            gpsMapVisible: gpsMap ? getComputedStyle(gpsMap).display !== 'none' : false,
            fullscreenMapContainerVisible: fullscreenMapContainer ? getComputedStyle(fullscreenMapContainer).display !== 'none' : false,
            fullscreenMapVisible: (fullscreenMap || (gpsMap && gpsMap.classList.contains('fullscreen-map'))) ? 
                getComputedStyle(fullscreenMap || gpsMap).display !== 'none' : false
        };
    };
    
    // Funzione specifica per forzare la mappa della sezione itinerario
    window.forceShowItinerarioMap = function() {
        if (!isIOS()) {
            console.log('Not iOS - itinerario map force not needed');
            return;
        }
        
        console.log('🔧 Forcing itinerario map visibility on iOS...');
        
        // Forza tutti gli elementi della mappa
        setTimeout(() => {
            fixMapVisibility();
            
            // Double-check specifico per sezione navigazione
            const navigazioneSection = document.querySelector('#navigazione');
            if (navigazioneSection) {
                navigazioneSection.style.display = 'block';
                navigazioneSection.style.visibility = 'visible';
                navigazioneSection.style.opacity = '1';
            }
            
            // Trigger resize event per MapLibre
            if (window.gpsMap) {
                try {
                    window.gpsMap.resize();
                    console.log('✅ Triggered map resize');
                } catch (e) {
                    console.warn('Map resize failed:', e);
                }
            }
            
            console.log('✅ Forced itinerario map visibility');
        }, 100);
    };
    
})();