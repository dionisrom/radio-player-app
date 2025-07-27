// Mobile Navigation Module
// Provides mobile-friendly navigation for station selection and controls

/**
 * Mobile navigation handler for the radio player app
 * This module manages the mobile station drawer, touch gestures, and navigation interaction
 */

// Gesture handling variables
let startY = 0;
let startHeight = 0;
let initialTouchY = 0;
let isDragging = false;
let drawer = null;
let drawerContent = null;
let toggleButton = null;
let isDrawerOpen = false;
const DRAWER_SNAP_POINTS = [0, 0.5, 1]; // Fully closed, half-open, fully open
const MIN_SWIPE_DISTANCE = 50; // Minimum distance in pixels to consider a swipe
const DRAWER_MIN_HEIGHT = 100; // Minimum height when dragging

/**
 * Initialize the mobile navigation functionality
 */
export function initMobileNavigation() {
    // Create mobile navigation elements
    createMobileNavElements();
    
    // Get references to elements
    drawer = document.getElementById('mobile-station-drawer');
    drawerContent = document.getElementById('drawer-content');
    toggleButton = document.getElementById('station-nav-toggle');
    
    // Set up event listeners
    setupEventListeners();
    
    // Setup resize handling
    handleViewportChanges();
    
    console.log('Mobile navigation initialized');
}

/**
 * Create and insert mobile navigation elements into the DOM
 */
function createMobileNavElements() {
    // Create station drawer
    const drawerElement = document.createElement('div');
    drawerElement.id = 'mobile-station-drawer';
    drawerElement.className = 'mobile-station-drawer';
    
    // Add drawer HTML structure
    drawerElement.innerHTML = `
        <div class="drawer-handle" id="drawer-handle"></div>
        <div class="drawer-header">
            <h2 class="text-lg font-semibold">Radio Stations</h2>
            <button class="drawer-close touch-target-helper" aria-label="Close stations menu">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="drawer-search-container">
            <i class="fas fa-search drawer-search-icon"></i>
            <input type="search" class="drawer-search-input" id="drawer-search" placeholder="Search stations..." aria-label="Search radio stations">
        </div>
        <div class="drawer-content" id="drawer-content">
            <!-- Station list will be cloned here -->
        </div>
    `;
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.id = 'station-nav-toggle';
    toggleButton.className = 'station-nav-toggle';
    toggleButton.setAttribute('aria-label', 'Open station list');
    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.innerHTML = `
        <i class="fas fa-list"></i>
        <i class="fas fa-times"></i>
    `;
    
    // Create bottom navigation bar
    const bottomNav = document.createElement('div');
    bottomNav.id = 'bottom-nav-bar';
    bottomNav.className = 'bottom-nav-bar';
    bottomNav.innerHTML = `
        <div class="bottom-nav-items">
            <button class="bottom-nav-item" id="nav-play-toggle" aria-label="Play or pause">
                <i class="fas fa-play"></i>
                <span>Play</span>
            </button>
            <button class="bottom-nav-item" id="nav-stations" aria-label="Open stations">
                <i class="fas fa-list"></i>
                <span>Stations</span>
            </button>
            <button class="bottom-nav-item" id="nav-settings" aria-label="Settings">
                <i class="fas fa-sliders-h"></i>
                <span>Settings</span>
            </button>
        </div>
    `;
    
    // Insert elements into DOM
    document.body.appendChild(drawerElement);
    document.body.appendChild(toggleButton);
    document.body.appendChild(bottomNav);
}

/**
 * Set up event listeners for mobile navigation
 */
function setupEventListeners() {
    // Toggle button click event
    toggleButton.addEventListener('click', toggleDrawer);
    
    // Bottom navigation events
    const navStationsBtn = document.getElementById('nav-stations');
    navStationsBtn.addEventListener('click', openDrawer);
    
    const navPlayBtn = document.getElementById('nav-play-toggle');
    navPlayBtn.addEventListener('click', togglePlayback);
    
    // Drawer handle touch events
    const handle = document.getElementById('drawer-handle');
    
    handle.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        initialTouchY = startY;
        startHeight = drawer.getBoundingClientRect().height;
        isDragging = true;
        drawer.classList.add('user-dragging');
        e.preventDefault();
    });
    
    handle.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        
        // Calculate new height based on drag direction (dragging down decreases height)
        const newHeight = Math.max(DRAWER_MIN_HEIGHT, startHeight - deltaY);
        const maxHeight = window.innerHeight * 0.7; // 70vh
        const clampedHeight = Math.min(newHeight, maxHeight);
        
        // Update drawer height
        drawer.style.height = `${clampedHeight}px`;
        
        // Update content area height
        drawerContent.style.height = `${clampedHeight - 60}px`;
        
        e.preventDefault();
    });
    
    handle.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        
        const endY = e.changedTouches[0].clientY;
        const deltaY = endY - initialTouchY;
        
        // Determine if this was a swipe
        if (Math.abs(deltaY) > MIN_SWIPE_DISTANCE) {
            // Swipe down - close the drawer
            if (deltaY > 0) {
                closeDrawer();
            } 
            // Swipe up - open the drawer fully
            else {
                openDrawer();
            }
        } else {
            // Not a significant swipe - snap to nearest point
            snapDrawerToPoint();
        }
        
        isDragging = false;
        drawer.classList.remove('user-dragging');
        
        // Reset inline styles
        drawer.style.height = '';
        drawerContent.style.height = '';
        
        e.preventDefault();
    });
    
    // Close button in drawer
    const closeButton = drawer.querySelector('.drawer-close');
    closeButton.addEventListener('click', closeDrawer);
    
    // Close drawer when clicking outside
    document.addEventListener('click', (e) => {
        if (isDrawerOpen && 
            !drawer.contains(e.target) && 
            e.target !== toggleButton && 
            !toggleButton.contains(e.target)) {
            closeDrawer();
        }
    });
    
    // Sync drawer search with main search
    const drawerSearch = document.getElementById('drawer-search');
    const mainSearch = document.getElementById('search-input');
    
    if (drawerSearch && mainSearch) {
        drawerSearch.addEventListener('input', () => {
            mainSearch.value = drawerSearch.value;
            
            // Create and dispatch input event to trigger search
            const inputEvent = new Event('input', { bubbles: true });
            mainSearch.dispatchEvent(inputEvent);
        });
    }
    
    // Swipe to close for the entire drawer
    drawer.addEventListener('touchstart', handleDrawerSwipeStart);
    drawer.addEventListener('touchmove', handleDrawerSwipeMove);
    drawer.addEventListener('touchend', handleDrawerSwipeEnd);
}

// Swipe handling variables
let swipeStartY = 0;
let swipeCurrentY = 0;
let swipeThreshold = 50;
let isContentScrolling = false;

/**
 * Handle touchstart events for drawer swipe to close
 */
function handleDrawerSwipeStart(e) {
    // Don't handle swipes if we're interacting with the content
    if (e.target.closest('#drawer-content')) {
        // Check if we're at the top of the content (allows pull down to close)
        const content = document.getElementById('drawer-content');
        isContentScrolling = content.scrollTop > 0;
        
        // If we're scrolling content, don't interfere
        if (isContentScrolling) return;
    }
    
    swipeStartY = e.touches[0].clientY;
    swipeCurrentY = swipeStartY;
}

/**
 * Handle touchmove events for drawer swipe to close
 */
function handleDrawerSwipeMove(e) {
    // Skip if we're in content and scrolling
    if (isContentScrolling) return;
    
    // Skip if touching inside content but not at top
    if (e.target.closest('#drawer-content') && !isContentScrolling) {
        const content = document.getElementById('drawer-content');
        if (content.scrollTop > 0) {
            isContentScrolling = true;
            return;
        }
    }
    
    swipeCurrentY = e.touches[0].clientY;
    const swipeDelta = swipeCurrentY - swipeStartY;
    
    // Only allow downward swipe
    if (swipeDelta > 0) {
        // Apply a resistance factor to make the drawer follow finger but with resistance
        const resistance = 0.4;
        const translateY = swipeDelta * resistance;
        
        drawer.style.transform = `translateY(${translateY}px)`;
        e.preventDefault();
    }
}

/**
 * Handle touchend events for drawer swipe to close
 */
function handleDrawerSwipeEnd(e) {
    // Skip if we were scrolling content
    if (isContentScrolling) {
        isContentScrolling = false;
        return;
    }
    
    const swipeDelta = swipeCurrentY - swipeStartY;
    
    if (swipeDelta > swipeThreshold) {
        // Swipe down exceeded threshold - close the drawer
        closeDrawer();
    } else {
        // Reset drawer position with animation
        drawer.style.transition = 'transform 0.3s ease';
        drawer.style.transform = '';
        
        // Remove transition after animation completes
        setTimeout(() => {
            drawer.style.transition = '';
        }, 300);
    }
    
    // Reset values
    swipeStartY = 0;
    swipeCurrentY = 0;
}

/**
 * Toggle drawer open/closed state
 */
export function toggleDrawer() {
    if (isDrawerOpen) {
        closeDrawer();
    } else {
        openDrawer();
    }
}

/**
 * Open the station drawer
 */
export function openDrawer() {
    drawer.classList.add('open');
    toggleButton.classList.add('open');
    toggleButton.setAttribute('aria-expanded', 'true');
    isDrawerOpen = true;
    
    // Focus on search when drawer opens
    setTimeout(() => {
        const drawerSearch = document.getElementById('drawer-search');
        if (drawerSearch) drawerSearch.focus();
    }, 300);
    
    // Create a cloned list of stations if needed
    syncStationLists();
    
    // Announce to screen readers
    updateScreenReaderStatus('Station list opened');
}

/**
 * Close the station drawer
 */
export function closeDrawer() {
    drawer.classList.remove('open');
    toggleButton.classList.remove('open');
    toggleButton.setAttribute('aria-expanded', 'false');
    isDrawerOpen = false;
    
    // Announce to screen readers
    updateScreenReaderStatus('Station list closed');
}

/**
 * Snap the drawer to the nearest height point
 */
function snapDrawerToPoint() {
    // Calculate current position as percentage of max height
    const currentHeight = drawer.getBoundingClientRect().height;
    const maxHeight = window.innerHeight * 0.7; // 70vh
    const currentPercentage = currentHeight / maxHeight;
    
    // Find the closest snap point
    let closestPoint = DRAWER_SNAP_POINTS[0];
    let smallestDistance = Math.abs(currentPercentage - DRAWER_SNAP_POINTS[0]);
    
    for (let i = 1; i < DRAWER_SNAP_POINTS.length; i++) {
        const distance = Math.abs(currentPercentage - DRAWER_SNAP_POINTS[i]);
        if (distance < smallestDistance) {
            smallestDistance = distance;
            closestPoint = DRAWER_SNAP_POINTS[i];
        }
    }
    
    // Snap to the closest point
    if (closestPoint === 0) {
        closeDrawer();
    } else if (closestPoint === 1) {
        openDrawer();
    } else {
        // Half-open state (future enhancement)
        drawer.classList.add('half-open');
        isDrawerOpen = true;
    }
}

/**
 * Sync the main station list with the mobile drawer
 */
function syncStationLists() {
    const mainList = document.getElementById('station-list');
    const drawerContent = document.getElementById('drawer-content');
    
    // Clear previous content
    drawerContent.innerHTML = '';
    
    if (mainList) {
        // Create compact list from mainList elements
        const stationItems = mainList.querySelectorAll('.station-item');
        
        if (stationItems.length > 0) {
            const fragment = document.createDocumentFragment();
            
            stationItems.forEach(item => {
                // Create a more compact version for the mobile drawer
                const compactItem = document.createElement('div');
                compactItem.className = 'compact-station-card';
                compactItem.dataset.stationName = item.dataset.stationName;
                
                // Extract info from the original item
                const stationName = item.querySelector('.font-medium')?.textContent || 'Unknown Station';
                const stationGenre = item.querySelector('.text-slate-600')?.textContent || '';
                const isFavorite = item.querySelector('.fa-star')?.classList.contains('favorited') || false;
                
                // Get station image if available
                let stationImage = '';
                const originalImg = item.querySelector('.station-image-wrapper img');
                if (originalImg) {
                    stationImage = `<img src="${originalImg.src}" alt="${stationName} logo" class="w-full h-full object-contain">`;
                } else {
                    stationImage = `<i class="fas fa-broadcast-tower text-slate-400"></i>`;
                }
                
                compactItem.innerHTML = `
                    <div class="station-logo">
                        ${stationImage}
                    </div>
                    <div class="station-info">
                        <p class="station-name">${stationName}</p>
                        <p class="station-genre">${stationGenre}</p>
                    </div>
                    <div class="station-actions">
                        <button class="favorite-btn-mobile" data-station-name="${item.dataset.stationName}" aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}: ${stationName}">
                            <i class="fa-star ${isFavorite ? 'fas favorited' : 'far'}" aria-hidden="true"></i>
                        </button>
                    </div>
                `;
                
                // Add click handler
                compactItem.addEventListener('click', function(e) {
                    // Don't trigger if clicking favorite button
                    if (e.target.closest('.favorite-btn-mobile')) {
                        return;
                    }
                    
                    const stationName = this.dataset.stationName;
                    const originalItem = mainList.querySelector(`[data-station-name="${stationName}"]`);
                    
                    if (originalItem) {
                        // Trigger click on original element
                        originalItem.click();
                        
                        // Close drawer
                        closeDrawer();
                    }
                });
                
                // Add favorite button handler
                const favoriteBtn = compactItem.querySelector('.favorite-btn-mobile');
                favoriteBtn.addEventListener('click', function() {
                    const stationName = this.dataset.stationName;
                    const originalFavoriteBtn = mainList.querySelector(`[data-station-name="${stationName}"] .favorite-btn`);
                    
                    if (originalFavoriteBtn) {
                        // Trigger click on original favorite button
                        originalFavoriteBtn.click();
                        
                        // Update the icon in the mobile drawer
                        const isFavorite = originalFavoriteBtn.querySelector('.fa-star').classList.contains('favorited');
                        const mobileIcon = this.querySelector('.fa-star');
                        
                        if (isFavorite) {
                            mobileIcon.classList.remove('far');
                            mobileIcon.classList.add('fas', 'favorited');
                        } else {
                            mobileIcon.classList.remove('fas', 'favorited');
                            mobileIcon.classList.add('far');
                        }
                    }
                });
                
                fragment.appendChild(compactItem);
            });
            
            drawerContent.appendChild(fragment);
        } else {
            drawerContent.innerHTML = '<div class="p-4 text-center text-gray-500">No stations available</div>';
        }
    }
}

/**
 * Toggle play/pause from the mobile navigation
 */
function togglePlayback() {
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (playPauseBtn) {
        playPauseBtn.click();
        
        // Update nav button icon based on play state
        setTimeout(() => {
            const isPlaying = document.getElementById('pause-icon')?.style.display !== 'none';
            const navPlayBtn = document.getElementById('nav-play-toggle');
            
            if (navPlayBtn) {
                const icon = navPlayBtn.querySelector('i');
                const text = navPlayBtn.querySelector('span');
                
                if (isPlaying) {
                    icon.className = 'fas fa-pause';
                    text.textContent = 'Pause';
                } else {
                    icon.className = 'fas fa-play';
                    text.textContent = 'Play';
                }
            }
        }, 100);
    }
}

/**
 * Update screen reader status
 * @param {string} message - The message to announce
 * @param {string} priority - The priority level (polite or assertive)
 */
function updateScreenReaderStatus(message, priority = 'polite') {
    const statusElement = document.getElementById('player-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.setAttribute('aria-live', priority);
        
        // Clear after announcement
        setTimeout(() => {
            statusElement.textContent = '';
        }, 3000);
    }
}

/**
 * Handle viewport changes and responsive behavior
 */
function handleViewportChanges() {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    
    // Initial check
    handleMobileLayout(mediaQuery.matches);
    
    // Listen for changes
    mediaQuery.addEventListener('change', (e) => {
        handleMobileLayout(e.matches);
    });
    
    // Hide the station-nav-toggle button on desktop
    if (toggleButton) {
        toggleButton.style.display = mediaQuery.matches ? 'flex' : 'none';
    }
}

/**
 * Apply mobile-specific layout changes
 * @param {boolean} isMobile - Whether the viewport is in mobile mode
 */
function handleMobileLayout(isMobile) {
    const radioList = document.getElementById('radio-list');
    const mainContent = document.getElementById('main-content');
    
    if (isMobile) {
        // Apply mobile-specific classes
        radioList.classList.add('responsive-hidden');
        mainContent.classList.add('full-width');
        
        // Update mobile nav play button state
        const isPlaying = document.getElementById('pause-icon')?.style.display !== 'none';
        const navPlayBtn = document.getElementById('nav-play-toggle');
        
        if (navPlayBtn) {
            const icon = navPlayBtn.querySelector('i');
            const text = navPlayBtn.querySelector('span');
            
            if (isPlaying) {
                icon.className = 'fas fa-pause';
                text.textContent = 'Pause';
            }
        }
        
        // Make sure player is fixed for mobile view
        const player = document.getElementById('custom-audio-player');
        if (player) {
            player.classList.add('mobile-fixed');
        }
        
        // Sync station lists if drawer is open
        if (isDrawerOpen) {
            syncStationLists();
        }
    } else {
        // Remove mobile-specific classes
        radioList.classList.remove('responsive-hidden');
        mainContent.classList.remove('full-width');
        
        // Close drawer if open
        if (isDrawerOpen) {
            closeDrawer();
        }
        
        // Remove mobile-specific player class
        const player = document.getElementById('custom-audio-player');
        if (player) {
            player.classList.remove('mobile-fixed');
        }
    }
}

/**
 * Update mobile navigation when a station is played
 * @param {string} stationName - The name of the current playing station
 */
export function updateMobileNavForStation(stationName) {
    // Update mobile nav play button state
    const navPlayBtn = document.getElementById('nav-play-toggle');
    
    if (navPlayBtn) {
        const icon = navPlayBtn.querySelector('i');
        const text = navPlayBtn.querySelector('span');
        
        icon.className = 'fas fa-pause';
        text.textContent = 'Pause';
    }
    
    // Highlight active station in drawer
    const drawerStations = document.querySelectorAll('.compact-station-card');
    drawerStations.forEach(item => {
        item.classList.toggle('active', item.dataset.stationName === stationName);
    });
}

/**
 * Update mobile navigation UI when play state changes
 * @param {boolean} isPlaying - Whether audio is currently playing
 */
export function updateMobilePlayState(isPlaying) {
    const navPlayBtn = document.getElementById('nav-play-toggle');
    
    if (navPlayBtn) {
        const icon = navPlayBtn.querySelector('i');
        const text = navPlayBtn.querySelector('span');
        
        if (isPlaying) {
            icon.className = 'fas fa-pause';
            text.textContent = 'Pause';
        } else {
            icon.className = 'fas fa-play';
            text.textContent = 'Play';
        }
    }
}
