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
        
        if (mapContainer) {
            mapContainer.style.setProperty('opacity', '1', 'important');
            mapContainer.style.setProperty('visibility', 'visible', 'important');
            mapContainer.style.setProperty('display', 'block', 'important');
            mapContainer.style.setProperty('height', '400px', 'important');
        }
        
        if (gpsMap) {
            gpsMap.style.setProperty('opacity', '1', 'important');
            gpsMap.style.setProperty('visibility', 'visible', 'important');
            gpsMap.style.setProperty('display', 'block', 'important');
            gpsMap.style.setProperty('height', '400px', 'important');
            gpsMap.style.setProperty('width', '100%', 'important');
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
                            
                            // Check per elementi mappa
                            if (node.matches?.('.map-container, #gps-map') || 
                                node.querySelector?.('.map-container, #gps-map')) {
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
        
        if (mapContainer) {
            console.log('Map container opacity:', getComputedStyle(mapContainer).opacity);
            console.log('Map container display:', getComputedStyle(mapContainer).display);
        }
        
        if (gpsMap) {
            console.log('GPS map opacity:', getComputedStyle(gpsMap).opacity);
            console.log('GPS map display:', getComputedStyle(gpsMap).display);
        }
        
        return {
            isIOS: isIOS(),
            buttonsCount: buttons.length,
            mapContainerVisible: mapContainer ? getComputedStyle(mapContainer).display !== 'none' : false,
            gpsMapVisible: gpsMap ? getComputedStyle(gpsMap).display !== 'none' : false
        };
    };
    
})();