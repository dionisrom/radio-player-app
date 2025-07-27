// Mobile-first layout functionality
// Manages mobile-specific UI elements and transitions

let mobileSearchOpen = false;
let mobileStationsOpen = false;

/**
 * Initialize mobile-first layout functionality
 */
export function initMobileFirstLayout() {
    // Get mobile UI elements
    const mobileSearchToggle = document.getElementById('mobile-search-toggle');
    const mobileSearchOverlay = document.getElementById('mobile-search-overlay');
    const mobileSearchClose = document.getElementById('mobile-search-close');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const mobileSearchResults = document.getElementById('mobile-search-results');
    const mobileStationsToggle = document.getElementById('mobile-stations-toggle');
    const mobileSidebar = document.getElementById('radio-list');
    const mobileThemeToggle = document.getElementById('mobile-theme-toggle');

    // Setup event listeners
    if (mobileSearchToggle) {
        mobileSearchToggle.addEventListener('click', toggleMobileSearch);
    }

    if (mobileSearchClose) {
        mobileSearchClose.addEventListener('click', toggleMobileSearch);
    }

    if (mobileStationsToggle) {
        mobileStationsToggle.addEventListener('click', toggleMobileStations);
    }

    if (mobileThemeToggle) {
        mobileThemeToggle.addEventListener('click', () => {
            // Trigger the main theme toggle
            const mainThemeToggle = document.getElementById('theme-toggle');
            if (mainThemeToggle) {
                mainThemeToggle.click();
                updateMobileThemeIcon();
            }
        });
        
        // Initialize mobile theme icon
        updateMobileThemeIcon();
    }

    // Close mobile UI elements when clicking outside
    document.addEventListener('click', (event) => {
        // Close search if clicking outside search area
        if (mobileSearchOpen && 
            !event.target.closest('#mobile-search-overlay') && 
            !event.target.closest('#mobile-search-toggle')) {
            toggleMobileSearch();
        }

        // Close stations if clicking outside stations area on mobile
        if (mobileStationsOpen &&
            window.innerWidth < 768 &&
            !event.target.closest('#radio-list') &&
            !event.target.closest('#mobile-stations-toggle')) {
            toggleMobileStations();
        }
    });

    // Sync search between mobile and desktop
    if (mobileSearchInput) {
        const desktopSearchInput = document.getElementById('search-input');
        
        // Sync from mobile to desktop
        mobileSearchInput.addEventListener('input', () => {
            if (desktopSearchInput) {
                desktopSearchInput.value = mobileSearchInput.value;
                // Trigger desktop search input event
                const event = new Event('input', { bubbles: true });
                desktopSearchInput.dispatchEvent(event);
            }
        });
        
        // Copy results from desktop to mobile
        const observer = new MutationObserver(() => {
            if (mobileSearchOpen) {
                updateMobileSearchResults();
            }
        });
        
        const stationList = document.getElementById('station-list');
        if (stationList) {
            observer.observe(stationList, { childList: true, subtree: true });
        }
    }

    // Update mobile layout based on window resize
    window.addEventListener('resize', handleWindowResize);
    
    // Initial setup
    handleWindowResize();
    
    // Display a welcome message on first visit
    if (!localStorage.getItem('mobile_first_welcome_shown')) {
        setTimeout(showWelcomeMessage, 1000);
        localStorage.setItem('mobile_first_welcome_shown', 'true');
    }
}

/**
 * Toggle mobile search overlay
 */
function toggleMobileSearch() {
    const mobileSearchOverlay = document.getElementById('mobile-search-overlay');
    if (!mobileSearchOverlay) return;
    
    mobileSearchOpen = !mobileSearchOpen;
    
    if (mobileSearchOpen) {
        mobileSearchOverlay.classList.remove('hidden');
        const mobileSearchInput = document.getElementById('mobile-search-input');
        if (mobileSearchInput) {
            mobileSearchInput.focus();
            
            // Copy value from desktop search input
            const desktopSearchInput = document.getElementById('search-input');
            if (desktopSearchInput) {
                mobileSearchInput.value = desktopSearchInput.value;
            }
            
            // Update search results
            updateMobileSearchResults();
        }
    } else {
        mobileSearchOverlay.classList.add('hidden');
    }
}

/**
 * Toggle mobile stations sidebar
 */
function toggleMobileStations() {
    const mobileSidebar = document.getElementById('radio-list');
    if (!mobileSidebar || window.innerWidth >= 768) return;
    
    mobileStationsOpen = !mobileStationsOpen;
    
    if (mobileStationsOpen) {
        mobileSidebar.classList.add('active', 'mobile-sidebar');
    } else {
        mobileSidebar.classList.remove('active', 'mobile-sidebar');
    }
}

/**
 * Update mobile theme icon based on current theme
 */
function updateMobileThemeIcon() {
    const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
    if (!mobileThemeToggle) return;
    
    const isDark = document.documentElement.classList.contains('dark');
    const sunIcon = mobileThemeToggle.querySelector('.fa-sun');
    const moonIcon = mobileThemeToggle.querySelector('.fa-moon');
    
    if (sunIcon && moonIcon) {
        sunIcon.classList.toggle('hidden', isDark);
        moonIcon.classList.toggle('hidden', !isDark);
    }
}

/**
 * Update mobile search results from desktop station list
 */
function updateMobileSearchResults() {
    const mobileSearchResults = document.getElementById('mobile-search-results');
    const desktopStationList = document.getElementById('station-list');
    
    if (!mobileSearchResults || !desktopStationList) return;
    
    // Clone all station items from desktop to mobile search results
    mobileSearchResults.innerHTML = '';
    const stationItems = desktopStationList.querySelectorAll('.station-item');
    
    stationItems.forEach(item => {
        const clone = item.cloneNode(true);
        clone.classList.add('mobile-station-item');
        mobileSearchResults.appendChild(clone);
    });
    
    // Add event listeners to the cloned station items
    const mobileStationItems = mobileSearchResults.querySelectorAll('.station-item');
    mobileStationItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const stationName = item.dataset.stationName;
            const originalItem = document.querySelector(`#station-list [data-station-name="${stationName}"]`);
            
            if (originalItem) {
                // Trigger click on the original item
                originalItem.click();
                
                // Close the mobile search overlay
                toggleMobileSearch();
            }
        });
    });
}

/**
 * Handle window resize to adjust mobile/desktop layout
 */
function handleWindowResize() {
    const isMobile = window.innerWidth < 768;
    const radioList = document.getElementById('radio-list');
    
    if (radioList) {
        if (isMobile) {
            // Mobile view: add mobile sidebar class but don't activate it yet
            radioList.classList.add('mobile-sidebar');
            if (!mobileStationsOpen) {
                radioList.classList.remove('active');
            }
        } else {
            // Desktop view: remove mobile sidebar classes
            radioList.classList.remove('mobile-sidebar', 'active');
            mobileStationsOpen = false;
        }
    }
}

/**
 * Show welcome message for first-time mobile users
 */
function showWelcomeMessage() {
    if (window.innerWidth >= 768) return; // Only show on mobile
    
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'fixed bottom-24 left-4 right-4 bg-indigo-600 text-white p-4 rounded-lg shadow-lg z-50';
    welcomeMessage.innerHTML = `
        <div class="flex justify-between items-center">
            <div>
                <h4 class="font-bold">Welcome to Hi-Fi Radio!</h4>
                <p class="text-sm mt-1">Tap the list icon to browse stations, and use the bottom controls for playback.</p>
            </div>
            <button class="ml-2 bg-white/20 hover:bg-white/30 p-2 rounded-full">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(welcomeMessage);
    
    // Add close button functionality
    const closeButton = welcomeMessage.querySelector('button');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            welcomeMessage.remove();
        });
    }
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (welcomeMessage.parentNode) {
            welcomeMessage.remove();
        }
    }, 8000);
}
