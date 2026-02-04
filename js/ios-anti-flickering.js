/**
 * iOS Anti-Flickering Script - Soluzione Chirurgica
 * Applica compositing layer solo agli elementi che lampeggiava
 * NON tocca mai la navbar o elementi di navigazione
 */

(function() {
    'use strict';
    
    // Detect iOS WebView
    function isIOSWebView() {
        const userAgent = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isWebView = window.ReactNativeWebView !== undefined || 
                         window.webkit?.messageHandlers !== undefined ||
                         userAgent.includes('Version/') === false; // Safari ha Version/, WebView no
        
        return isIOS && isWebView;
    }
    
    // Apply anti-flickering only to content elements
    function applyAntiFlickering() {
        if (!isIOSWebView()) {
            console.log('📱 Not iOS WebView - anti-flickering not needed');
            return;
        }
        
        console.log('🍎 iOS WebView detected - applying anti-flickering...');
        
        // Target only content elements that were flickering
        const flickeringSelectors = [
            '.monument-card',
            '.featured-card', 
            '.location-card',
            '.hero-section',
            '.content-section',
            '.info-grid',
            '.educational-block',
            '.filter-container',
            '.quiz-container',
            '.results-container',
            '.search-container',
            '.timeline-container',
            '.section > .container',  // Main content containers
            'main .container'
        ];
        
        // Apply anti-flickering class to each element
        flickeringSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // Skip if element is inside navbar, header, or excluded elements
                if (element.closest('.bottom-nav') || 
                    element.closest('.top-header') || 
                    element.closest('nav') ||
                    element.closest('.maplibregl-control-container') ||
                    element.closest('.mapboxgl-control-container') ||
                    element.matches('.btn, button, .info-close-btn') ||
                    element.matches('.maplibregl-ctrl, .mapboxgl-ctrl') ||
                    element.matches('.maplibregl-ctrl-group, .mapboxgl-ctrl-group') ||
                    element.matches('.maplibregl-ctrl-zoom-in, .mapboxgl-ctrl-zoom-in') ||
                    element.matches('.maplibregl-ctrl-zoom-out, .mapboxgl-ctrl-zoom-out') ||
                    element.matches('.maplibregl-ctrl-compass, .mapboxgl-ctrl-compass') ||
                    element.matches('.maplibregl-ctrl-geolocate, .mapboxgl-ctrl-geolocate') ||
                    element.matches('.maplibregl-user-location-dot, .mapboxgl-user-location-dot') ||
                    element.matches('.maplibregl-user-location-accuracy-circle, .mapboxgl-user-location-accuracy-circle')) {
                    return;
                }
                
                // Apply anti-flickering class
                element.classList.add('ios-anti-flicker');
            });
            
            if (elements.length > 0) {
                console.log(`✅ Applied anti-flickering to ${elements.length} ${selector} elements`);
            }
        });
        
        // Verify navbar is not affected
        const navbar = document.querySelector('.bottom-nav');
        if (navbar && !navbar.classList.contains('ios-anti-flicker')) {
            console.log('✅ Navbar preserved - no anti-flickering applied');
        } else if (navbar?.classList.contains('ios-anti-flicker')) {
            console.warn('⚠️ Navbar accidentally affected - removing class');
            navbar.classList.remove('ios-anti-flicker');
            // Remove from all navbar children too
            navbar.querySelectorAll('.ios-anti-flicker').forEach(child => {
                child.classList.remove('ios-anti-flicker');
            });
        }
        
        console.log('🎯 Anti-flickering applied successfully!');
    }
    
    // Apply when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyAntiFlickering);
    } else {
        applyAntiFlickering();
    }
    
    // Re-apply when new content is dynamically added (for sections that switch)
    const observer = new MutationObserver(function(mutations) {
        let needsReapplication = false;
        
        mutations.forEach(mutation => {
            // Check if new nodes were added
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // Check if it's a content element or contains content elements
                        if (node.classList?.contains('monument-card') ||
                            node.classList?.contains('section') ||
                            node.querySelector?.('.monument-card, .hero-section, .content-section')) {
                            needsReapplication = true;
                        }
                    }
                });
            }
        });
        
        if (needsReapplication) {
            setTimeout(applyAntiFlickering, 100); // Small delay to let DOM settle
        }
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Debug function for testing
    window.debugAntiFlickering = function() {
        console.log('🔍 Anti-Flickering Debug Info:');
        console.log('iOS WebView:', isIOSWebView());
        
        const elementsWithClass = document.querySelectorAll('.ios-anti-flicker');
        console.log(`Elements with anti-flickering: ${elementsWithClass.length}`);
        
        elementsWithClass.forEach((el, i) => {
            console.log(`  ${i + 1}. ${el.tagName}.${el.className}`);
        });
        
        const navbar = document.querySelector('.bottom-nav');
        console.log('Navbar affected:', navbar?.classList.contains('ios-anti-flicker') ? 'YES (BAD)' : 'NO (GOOD)');
        
        return {
            isIOSWebView: isIOSWebView(),
            elementsCount: elementsWithClass.length,
            navbarAffected: navbar?.classList.contains('ios-anti-flicker')
        };
    };
    
})();