// Station browsing functionality
// Manages grid and list view options for station selection

let currentView = 'list'; // Default view: 'list', 'grid', or 'compact'

/**
 * Initialize station browsing functionality
 * @param {HTMLElement} stationListContainer - The container element for the station list
 */
export function initStationBrowsing(stationListContainer) {
    // Create view toggle UI
    createViewToggleUI(stationListContainer);
    
    // Load saved view preference
    loadViewPreference();
    
    // Apply initial view
    applyView(currentView);
    
    // Set up keyboard shortcuts for view switching
    setupViewKeyboardShortcuts();
    
    // Handle resize to adjust view if needed
    window.addEventListener('resize', handleViewportResize);
    
    // Initial check
    handleViewportResize();
}

/**
 * Create view toggle UI elements
 * @param {HTMLElement} container - The parent container for the toggle UI
 */
function createViewToggleUI(container) {
    // Get the parent container that will contain the toggle
    const parentContainer = container.parentElement;
    if (!parentContainer) return;
    
    // Find the search input's parent
    const searchContainer = parentContainer.querySelector('div:has(#search-input)');
    
    if (searchContainer) {
        // Create the view toggle container
        const viewToggleContainer = document.createElement('div');
        viewToggleContainer.className = 'view-toggle-container desktop-only';
        viewToggleContainer.innerHTML = `
            <span class="view-toggle-label">View:</span>
            <button id="list-view-btn" class="view-toggle-button active" aria-label="List view" title="List view">
                <i class="fas fa-list" aria-hidden="true"></i>
            </button>
            <button id="compact-view-btn" class="view-toggle-button" aria-label="Compact view" title="Compact view">
                <i class="fas fa-list-ul" aria-hidden="true"></i>
            </button>
            <button id="grid-view-btn" class="view-toggle-button" aria-label="Grid view" title="Grid view">
                <i class="fas fa-th-large" aria-hidden="true"></i>
            </button>
        `;
        
        // Insert the view toggle after the search container
        searchContainer.after(viewToggleContainer);
        
        // Add event listeners to toggle buttons
        document.getElementById('list-view-btn').addEventListener('click', () => switchView('list'));
        document.getElementById('compact-view-btn').addEventListener('click', () => switchView('compact'));
        document.getElementById('grid-view-btn').addEventListener('click', () => switchView('grid'));
    }
}

/**
 * Switch between different view modes
 * @param {string} viewMode - The view mode to switch to ('list', 'grid', or 'compact')
 */
function switchView(viewMode) {
    // Update current view
    currentView = viewMode;
    
    // Save preference
    saveViewPreference(viewMode);
    
    // Apply the selected view
    applyView(viewMode);
    
    // Update button states
    updateViewToggleButtons(viewMode);
    
    // Announce to screen readers
    const statusEl = document.getElementById('player-status');
    if (statusEl) {
        statusEl.textContent = `Switched to ${viewMode} view`;
        statusEl.setAttribute('aria-live', 'polite');
    }
    
    // Dispatch event for other components to respond
    window.dispatchEvent(new CustomEvent('viewModeChange', { detail: { viewMode } }));
}

/**
 * Apply the selected view mode to the station list
 * @param {string} viewMode - The view mode to apply
 */
function applyView(viewMode) {
    const stationList = document.getElementById('station-list');
    if (!stationList) return;
    
    // Remove all view-related classes
    stationList.classList.remove('list-view', 'grid-view', 'compact-view');
    
    // Add the appropriate class for the selected view
    stationList.classList.add(`${viewMode}-view`);
    
    // For grid view, adjust sortable functionality
    if (viewMode === 'grid') {
        // Make drag handles visible but disable drag functionality temporarily
        const dragHandles = stationList.querySelectorAll('.drag-handle');
        dragHandles.forEach(handle => {
            handle.style.cursor = 'default';
            handle.style.visibility = 'hidden';
        });
    } else {
        // Restore drag functionality for list views
        const dragHandles = stationList.querySelectorAll('.drag-handle');
        dragHandles.forEach(handle => {
            handle.style.cursor = 'grab';
            handle.style.visibility = 'visible';
        });
    }
}

/**
 * Update the active state of view toggle buttons
 * @param {string} activeView - The currently active view mode
 */
function updateViewToggleButtons(activeView) {
    const viewButtons = {
        'list': document.getElementById('list-view-btn'),
        'compact': document.getElementById('compact-view-btn'),
        'grid': document.getElementById('grid-view-btn')
    };
    
    // Remove active class from all buttons
    Object.values(viewButtons).forEach(button => {
        if (button) button.classList.remove('active');
    });
    
    // Add active class to the selected button
    if (viewButtons[activeView]) {
        viewButtons[activeView].classList.add('active');
    }
}

/**
 * Save the user's view preference to local storage
 * @param {string} viewMode - The view mode to save
 */
function saveViewPreference(viewMode) {
    localStorage.setItem('station_view_preference', viewMode);
}

/**
 * Load the user's view preference from local storage
 */
function loadViewPreference() {
    const savedView = localStorage.getItem('station_view_preference');
    if (savedView) {
        currentView = savedView;
        updateViewToggleButtons(currentView);
    }
}

/**
 * Set up keyboard shortcuts for switching views
 */
function setupViewKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only handle if not typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Check for Alt + key combinations
        if (e.altKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    switchView('list');
                    break;
                case '2':
                    e.preventDefault();
                    switchView('compact');
                    break;
                case '3':
                    e.preventDefault();
                    switchView('grid');
                    break;
            }
        }
    });
}

/**
 * Handle viewport resize to adjust view if needed
 */
function handleViewportResize() {
    // Only show grid/compact views on desktop
    if (window.innerWidth < 768 && (currentView === 'grid' || currentView === 'compact')) {
        // Switch back to list view on mobile
        switchView('list');
        
        // Hide view toggle buttons
        const viewToggleContainer = document.querySelector('.view-toggle-container');
        if (viewToggleContainer) {
            viewToggleContainer.classList.add('hidden');
        }
    } else if (window.innerWidth >= 768) {
        // Show view toggle buttons on desktop
        const viewToggleContainer = document.querySelector('.view-toggle-container');
        if (viewToggleContainer) {
            viewToggleContainer.classList.remove('hidden');
        }
    }
}

/**
 * Get the current view mode
 * @returns {string} The current view mode
 */
export function getCurrentView() {
    return currentView;
}
