// Desktop space utilization functionality
// Optimizes layout for larger screens and provides advanced layout controls

/**
 * Initialize desktop space utilization features
 */
export function initDesktopSpaceUtilization() {
    // Apply desktop layout class to main container
    applyDesktopLayout();
    
    // Set up collapsible sidebar
    setupCollapsibleSidebar();
    
    // Set up fullscreen mode for player
    setupFullscreenMode();
    
    // Add window resize handler
    window.addEventListener('resize', handleWindowResize);
    
    // Initialize with current window size
    handleWindowResize();
}

/**
 * Apply desktop-specific layout classes
 */
function applyDesktopLayout() {
    // Only apply on desktop screens
    if (window.innerWidth < 768) return;
    
    // Get main grid container
    const mainGrid = document.querySelector('.main-grid');
    if (mainGrid) {
        mainGrid.classList.add('desktop-space-layout');
    }
}

/**
 * Set up collapsible sidebar for the station list
 */
function setupCollapsibleSidebar() {
    // Get sidebar element
    const sidebar = document.getElementById('radio-list');
    if (!sidebar) return;
    
    // Add collapsible class
    sidebar.classList.add('collapsible-sidebar');
    sidebar.classList.add('relative'); // Ensure relative positioning
    
    // REMOVED: sidebar toggle button creation code - not needed anymore
    
    // Create a wrapper for content that will be hidden when collapsed
    const sidebarContent = document.createElement('div');
    sidebarContent.className = 'sidebar-content';
    
    // Move existing children into the wrapper
    while (sidebar.children.length > 0) {
        sidebarContent.appendChild(sidebar.firstChild);
    }
    
    // Add the wrapper back to the sidebar
    sidebar.appendChild(sidebarContent);
    
    // We no longer collapse the sidebar by default
    sidebar.classList.remove('sidebar-collapsed');
    localStorage.removeItem('sidebarCollapsed');
}

/**
 * Set up fullscreen mode for the player
 */
function setupFullscreenMode() {
    // Only apply on desktop screens
    if (window.innerWidth < 768) return;
    
    // Get the player container
    const playerContainer = document.getElementById('main-content');
    if (!playerContainer) return;
    
    // Create fullscreen button
    const fullscreenButton = document.createElement('button');
    fullscreenButton.className = 'fullscreen-toggle desktop-only icon-button absolute top-4 right-4 z-10 bg-white/30 dark:bg-slate-800/30 hover:bg-white/50 dark:hover:bg-slate-800/50 p-2 rounded-full';
    fullscreenButton.innerHTML = '<i class="fas fa-expand" aria-hidden="true"></i>';
    fullscreenButton.setAttribute('aria-label', 'Enter fullscreen mode');
    fullscreenButton.setAttribute('title', 'Fullscreen');
    
    // Add button to player container
    playerContainer.classList.add('relative'); // Ensure relative positioning
    playerContainer.appendChild(fullscreenButton);
    
    // Variable to track fullscreen state
    let isFullscreen = false;
    
    // Toggle fullscreen function
    fullscreenButton.addEventListener('click', () => {
        const mainGrid = document.querySelector('.main-grid');
        if (!mainGrid) return;
        
        isFullscreen = !isFullscreen;
        
        if (isFullscreen) {
            // Enter fullscreen mode
            mainGrid.classList.add('fullscreen-player');
            fullscreenButton.innerHTML = '<i class="fas fa-compress" aria-hidden="true"></i>';
            fullscreenButton.setAttribute('aria-label', 'Exit fullscreen mode');
            fullscreenButton.setAttribute('title', 'Exit fullscreen');
            
            // Add fullscreen class to body to allow custom styling
            document.body.classList.add('player-fullscreen-mode');
            
            // Create exit button
            const exitButton = document.createElement('button');
            exitButton.className = 'fullscreen-exit';
            exitButton.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
            exitButton.setAttribute('aria-label', 'Exit fullscreen mode');
            exitButton.setAttribute('title', 'Exit fullscreen');
            mainGrid.appendChild(exitButton);
            
            // Add exit functionality
            exitButton.addEventListener('click', () => {
                fullscreenButton.click(); // Simulate click on fullscreen button
            });
            
            // Handle Escape key
            document.addEventListener('keydown', handleEscKey);
        } else {
            // Exit fullscreen mode
            mainGrid.classList.remove('fullscreen-player');
            fullscreenButton.innerHTML = '<i class="fas fa-expand" aria-hidden="true"></i>';
            fullscreenButton.setAttribute('aria-label', 'Enter fullscreen mode');
            fullscreenButton.setAttribute('title', 'Fullscreen');
            
            // Remove fullscreen class from body
            document.body.classList.remove('player-fullscreen-mode');
            
            // Remove exit button
            const exitButton = mainGrid.querySelector('.fullscreen-exit');
            if (exitButton) exitButton.remove();
            
            // Remove escape key handler
            document.removeEventListener('keydown', handleEscKey);
        }
        
        // Trigger resize event for responsive elements
        window.dispatchEvent(new Event('resize'));
    });
    
    // Escape key handler
    function handleEscKey(e) {
        if (e.key === 'Escape' && isFullscreen) {
            fullscreenButton.click(); // Exit fullscreen
        }
    }
}

/**
 * Handle window resize to apply appropriate layout
 */
function handleWindowResize() {
    const isDesktop = window.innerWidth >= 768;
    
    // Apply or remove desktop-specific classes
    const mainGrid = document.querySelector('.main-grid');
    if (mainGrid) {
        mainGrid.classList.toggle('desktop-space-layout', isDesktop);
    }
    
    // Handle sidebar visibility
    const sidebar = document.getElementById('radio-list');
    if (sidebar) {
        // On mobile, always ensure sidebar is expanded
        if (!isDesktop && sidebar.classList.contains('sidebar-collapsed')) {
            // Find toggle button and click it to expand
            const toggleButton = sidebar.querySelector('.sidebar-toggle');
            if (toggleButton) {
                toggleButton.click();
            } else {
                // Fallback if toggle button is not found
                sidebar.classList.remove('sidebar-collapsed');
            }
        }
        
        // Toggle sidebar toggle button visibility
        const toggleButton = sidebar.querySelector('.sidebar-toggle');
        if (toggleButton) {
            toggleButton.classList.toggle('hidden', !isDesktop);
        }
    }
    
    // Toggle fullscreen button visibility
    const fullscreenButton = document.querySelector('.fullscreen-toggle');
    if (fullscreenButton) {
        fullscreenButton.classList.toggle('hidden', !isDesktop);
    }
}
