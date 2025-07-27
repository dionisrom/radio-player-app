/**
 * Visual Feedback Module
 * Enhances active/playing state indicators and provides visual feedback for user interactions
 */

// Store references to UI elements
let stationList, activeStationItem, playPauseBtn, volumeBar, visualizerContainer;

/**
 * Initialize visual feedback enhancements
 */
export function initVisualFeedback() {
    // Get reference to UI elements
    stationList = document.getElementById('station-list');
    playPauseBtn = document.getElementById('play-pause-btn');
    volumeBar = document.getElementById('volume-bar');
    visualizerContainer = document.getElementById('visualizer-container');
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize volume bar visual indicator
    updateVolumeProgressIndicator();
    
    // Add visual feedback to existing UI elements
    enhanceExistingUI();
    
    console.log('✅ Visual feedback enhancements initialized');
}

/**
 * Set up event listeners for visual feedback
 */
function setupEventListeners() {
    // Listen for station selection to update active state
    document.addEventListener('stationSelected', (e) => {
        updateActiveStation(e.detail.stationName);
    });
    
    // Update play/pause button state
    const audioPlayer = document.getElementById('audio-player');
    if (audioPlayer) {
        audioPlayer.addEventListener('play', () => {
            updatePlayingState(true);
        });
        
        audioPlayer.addEventListener('pause', () => {
            updatePlayingState(false);
        });
        
        audioPlayer.addEventListener('waiting', () => {
            setLoadingState(true);
        });
        
        audioPlayer.addEventListener('playing', () => {
            setLoadingState(false);
        });
        
        audioPlayer.addEventListener('error', () => {
            setErrorState(true);
        });
    }
    
    // Listen for station list changes
    document.addEventListener('refreshStationList', () => {
        setTimeout(() => {
            // Re-apply active state to current station if needed
            if (activeStationItem) {
                const stationName = activeStationItem.dataset.stationName;
                updateActiveStation(stationName);
            }
        }, 100);
    });
    
    // Volume changes
    if (volumeBar) {
        volumeBar.addEventListener('input', updateVolumeProgressIndicator);
    }
    
    // Keyboard focus change
    document.addEventListener('stationFocused', (e) => {
        updateKeyboardFocusIndicator(e.detail.stationElement);
    });
    
    // View mode changes
    document.addEventListener('viewModeChanged', (e) => {
        updateViewModeIndicators(e.detail.mode);
    });
}

/**
 * Update the active station visual indicators
 * @param {string} stationName - The name of the active station
 */
export function updateActiveStation(stationName) {
    // Remove active class from all stations
    const stations = document.querySelectorAll('.station-item');
    stations.forEach(station => {
        station.classList.remove('active-station');
        
        // Remove any existing playing wave animation
        const existingWave = station.querySelector('.now-playing-wave');
        if (existingWave) {
            existingWave.remove();
        }
    });
    
    // Find and mark the active station
    const activeStation = Array.from(stations).find(
        station => station.dataset.stationName === stationName
    );
    
    if (activeStation) {
        activeStation.classList.add('active-station');
        activeStationItem = activeStation;
        
        // Add the playing wave animation to station name
        const stationNameEl = activeStation.querySelector('.station-name');
        if (stationNameEl) {
            const waveEl = document.createElement('span');
            waveEl.className = 'now-playing-wave';
            waveEl.innerHTML = '<span></span><span></span><span></span><span></span>';
            stationNameEl.prepend(waveEl);
        }
        
        // Scroll the active station into view if it's out of view
        if (isElementOutOfView(activeStation)) {
            activeStation.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        activeStationItem = null;
    }
}

/**
 * Check if an element is outside the visible viewport
 * @param {HTMLElement} el - The element to check
 * @returns {boolean} - True if the element is out of view
 */
function isElementOutOfView(el) {
    if (!el || !el.parentElement) return false;
    
    const container = el.parentElement;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;
    const elTop = el.offsetTop;
    const elBottom = elTop + el.clientHeight;
    
    return (elTop < containerTop || elBottom > containerBottom);
}

/**
 * Update the playing state of the player controls
 * @param {boolean} isPlaying - Whether audio is currently playing
 */
export function updatePlayingState(isPlaying) {
    if (playPauseBtn) {
        if (isPlaying) {
            playPauseBtn.classList.add('playing');
        } else {
            playPauseBtn.classList.remove('playing');
        }
    }
    
    // If we have an active station, update its visual state
    if (activeStationItem) {
        const waveEl = activeStationItem.querySelector('.now-playing-wave');
        
        if (waveEl) {
            if (isPlaying) {
                waveEl.style.display = 'inline-flex';
            } else {
                waveEl.style.display = 'none';
            }
        }
    }
}

/**
 * Update the loading state visually
 * @param {boolean} isLoading - Whether content is loading
 */
export function setLoadingState(isLoading) {
    const infoGenre = document.getElementById('info-genre');
    const customPlayer = document.getElementById('custom-audio-player');
    
    if (customPlayer) {
        if (isLoading) {
            customPlayer.classList.add('loading-state');
            
            // Also add loading state to active station if any
            if (activeStationItem) {
                activeStationItem.classList.add('loading-state');
            }
            
            // Add loading state to info genre
            if (infoGenre) {
                infoGenre.classList.add('loading-state');
            }
        } else {
            customPlayer.classList.remove('loading-state');
            
            // Remove loading state from active station
            if (activeStationItem) {
                activeStationItem.classList.remove('loading-state');
            }
            
            // Remove loading state from info genre
            if (infoGenre) {
                infoGenre.classList.remove('loading-state');
            }
        }
    }
}

/**
 * Set error state visually
 * @param {boolean} hasError - Whether there is an error
 */
export function setErrorState(hasError) {
    const customPlayer = document.getElementById('custom-audio-player');
    
    if (customPlayer) {
        if (hasError) {
            customPlayer.classList.add('error-state');
            customPlayer.classList.remove('loading-state');
            
            // Also add error state to active station if any
            if (activeStationItem) {
                activeStationItem.classList.add('error-state');
                activeStationItem.classList.remove('loading-state');
            }
        } else {
            customPlayer.classList.remove('error-state');
            
            // Remove error state from active station
            if (activeStationItem) {
                activeStationItem.classList.remove('error-state');
            }
        }
    }
}

/**
 * Update the volume progress indicator
 */
function updateVolumeProgressIndicator() {
    if (!volumeBar) return;
    
    const percent = volumeBar.value;
    volumeBar.style.setProperty('--range-progress', `${percent}%`);
}

/**
 * Update the keyboard focus indicator
 * @param {HTMLElement} focusedElement - The element with keyboard focus
 */
export function updateKeyboardFocusIndicator(focusedElement) {
    // Remove focus class from all stations
    const stations = document.querySelectorAll('.station-item');
    stations.forEach(station => {
        station.classList.remove('keyboard-focused');
    });
    
    // Add focus class to the focused element
    if (focusedElement && focusedElement.classList.contains('station-item')) {
        focusedElement.classList.add('keyboard-focused');
    }
}

/**
 * Update view mode indicators
 * @param {string} mode - The active view mode (list, grid, compact)
 */
export function updateViewModeIndicators(mode) {
    const listBtn = document.getElementById('list-view-btn');
    const gridBtn = document.getElementById('grid-view-btn');
    const compactBtn = document.getElementById('compact-view-btn');
    
    // Remove active class from all buttons
    [listBtn, gridBtn, compactBtn].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
    
    // Add active class to the current mode button
    if (mode === 'list' && listBtn) {
        listBtn.classList.add('active');
    } else if (mode === 'grid' && gridBtn) {
        gridBtn.classList.add('active');
    } else if (mode === 'compact' && compactBtn) {
        compactBtn.classList.add('active');
    }
}

/**
 * Apply a success flash effect to an element
 * @param {HTMLElement} element - The element to apply the effect to
 */
export function applySuccessFlash(element) {
    if (!element) return;
    
    element.classList.add('success-flash');
    
    // Remove the class after animation completes
    setTimeout(() => {
        element.classList.remove('success-flash');
    }, 500);
}

/**
 * Show stream quality indicator (REMOVED - quality information no longer displayed)
 * @param {string} quality - The quality level (excellent, good, fair, poor)
 */
export function showStreamQuality(quality) {
    // Function kept for compatibility, but implementation removed
    return;
}

/**
 * Toggle equalizer active state
 * @param {boolean} isActive - Whether equalizer is active
 */
export function toggleEqualizerActive(isActive) {
    const eqButton = document.getElementById('mobile-equalizer-btn');
    if (!eqButton) return;
    
    if (isActive) {
        eqButton.classList.add('eq-active');
    } else {
        eqButton.classList.remove('eq-active');
    }
}

/**
 * Enhance existing UI elements with visual feedback
 */
function enhanceExistingUI() {
    // Add classes to existing active elements if needed
    const audioPlayer = document.getElementById('audio-player');
    if (audioPlayer && !audioPlayer.paused) {
        updatePlayingState(true);
    }
    
    // Apply any stored view mode
    const currentViewMode = localStorage.getItem('stationViewMode') || 'list';
    updateViewModeIndicators(currentViewMode);
    
    // Update volume indicator initial state
    updateVolumeProgressIndicator();
}
