// Script to ensure station list scrolling works correctly

/**
 * Initialize station list scrolling functionality
 */
export function initStationListScrolling() {
    // Get the station list element
    const stationList = document.getElementById('station-list');
    if (!stationList) return;
    
    // Function to check if station list needs scrolling
    function checkScrollability() {
        // Small delay to ensure content is fully rendered
        setTimeout(() => {
            const hasOverflow = stationList.scrollHeight > stationList.clientHeight;
            
            // Add visual indicator class based on overflow status
            if (hasOverflow) {
                stationList.classList.add('is-scrollable');
                stationList.style.overflowY = 'auto';
            } else {
                stationList.classList.remove('is-scrollable');
                // Still keep auto for when content changes
                stationList.style.overflowY = 'auto';
            }
            
            // Set data attribute for potential CSS styling
            stationList.dataset.scrollable = hasOverflow;
            
            console.log(`Station list scrollability check: ${hasOverflow ? 'Scrollable' : 'Not Scrollable'}`);
            console.log(`Content height: ${stationList.scrollHeight}px, Container height: ${stationList.clientHeight}px`);
        }, 100);
    }
    
    // Run check initially and whenever content changes
    checkScrollability();
    
    // Run check after stations are loaded (via mutation observer)
    const observer = new MutationObserver((mutations) => {
        checkScrollability();
    });
    
    // Start observing the station list for DOM changes
    observer.observe(stationList, { 
        childList: true,
        subtree: true 
    });
    
    // Add a scroll indicator for first-time users
    addScrollIndicator(stationList);
    
    // Also check on window resize
    window.addEventListener('resize', checkScrollability);
    
    // Check after view mode changes
    window.addEventListener('viewModeChange', checkScrollability);
    
    // Add touch swipe event listeners for mobile
    addTouchScrolling(stationList);
}

/**
 * Add a visual scroll indicator for first-time users
 * @param {HTMLElement} stationList - The station list element
 */
function addScrollIndicator(stationList) {
    // Check if user has seen the indicator before
    const hasSeenIndicator = localStorage.getItem('seen_scroll_indicator') === 'true';
    
    if (!hasSeenIndicator) {
        // Create a visual indicator
        const indicator = document.createElement('div');
        indicator.className = 'scroll-indicator';
        indicator.innerHTML = `
            <div class="scroll-indicator-inner">
                <i class="fas fa-chevron-down"></i>
                <span>Scroll for more stations</span>
            </div>
        `;
        
        // Add styles for the indicator
        const style = document.createElement('style');
        style.textContent = `
            .scroll-indicator {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(99, 102, 241, 0.2);
                color: #6366f1;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                z-index: 10;
                animation: bounce 1.5s infinite;
                backdrop-filter: blur(4px);
                box-shadow: 0 2px 10px rgba(99, 102, 241, 0.2);
                pointer-events: none;
                opacity: 0.9;
            }
            
            .dark .scroll-indicator {
                background: rgba(139, 92, 246, 0.3);
                color: #a78bfa;
            }
            
            .scroll-indicator-inner {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateX(-50%) translateY(0); }
                50% { transform: translateX(-50%) translateY(-6px); }
            }
        `;
        
        document.head.appendChild(style);
        stationList.parentElement.appendChild(indicator);
        
        // Remove the indicator after scrolling or after a timeout
        const removeIndicator = () => {
            indicator.style.opacity = '0';
            indicator.style.transition = 'opacity 0.5s ease-out';
            setTimeout(() => {
                indicator.remove();
                localStorage.setItem('seen_scroll_indicator', 'true');
            }, 500);
        };
        
        stationList.addEventListener('scroll', removeIndicator, { once: true });
        setTimeout(removeIndicator, 10000); // Remove after 10 seconds
    }
}

/**
 * Add touch scrolling support for mobile devices
 * @param {HTMLElement} stationList - The station list element
 */
function addTouchScrolling(stationList) {
    let startY;
    let startScrollTop;
    let touchInProgress = false;
    
    stationList.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        startScrollTop = stationList.scrollTop;
        touchInProgress = true;
        
        // Add active class for visual feedback
        stationList.classList.add('touch-scrolling');
    }, { passive: true });
    
    stationList.addEventListener('touchmove', (e) => {
        if (!touchInProgress) return;
        
        const deltaY = startY - e.touches[0].clientY;
        stationList.scrollTop = startScrollTop + deltaY;
    }, { passive: true });
    
    stationList.addEventListener('touchend', () => {
        touchInProgress = false;
        
        // Remove active class
        stationList.classList.remove('touch-scrolling');
    });
}

// Auto-initialize when imported
document.addEventListener('DOMContentLoaded', initStationListScrolling);
