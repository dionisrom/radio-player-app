// Main application entry point
import { getStations, setStations, findStationByName } from './stations.js';
import { initStationListScrolling } from './station-list-fix.js';
import { 
    loadFavorites, 
    saveFavorites, 
    loadSortOrder, 
    loadTheme,
    saveTheme 
} from './storage.js';
import { 
    initAudioContext, 
    resumeAudioContext, 
    getAnalyser, 
    setupMetadata, 
    playStation,
    setErrorCallback,
    setRetryCallback,
    addConnectionTimeout,
    addOfflineDetection
} from './player.js';
import {
    initMobileNavigation,
    updateMobileNavForStation,
    updateMobilePlayState
} from './mobile-navigation.js';
import {
    initBottomControls,
    updateBottomControlsPlayState,
    updateBottomControlsStation
} from './bottom-controls.js';
import {
    initMobileFirstLayout
} from './mobile-first-layout.js';
import {
    initDesktopUI
} from './desktop-ui.js';
import {
    initStationBrowsing
} from './station-browsing.js';
import {
    initHoverStates
} from './hover-states.js';
import {
    initDesktopSpaceUtilization
} from './desktop-space-utilization.js';
import {
    initVisualFeedback,
    updateActiveStation,
    updatePlayingState,
    setLoadingState,
    setErrorState
} from './visual-feedback.js';
import {
    initLoadingStates,
    setLoadingState as setStreamLoadingState,
    setBufferingState,
    showSuccessIndicator
} from './loading-states.js';
import { 
    initVisualizer, 
    setupVisualization, 
    animate, 
    showInitialIcon, 
    isVisualizerInitialized,
    setVisualizerErrorCallback,
    getVisualizerType,
    resizeVisualizer,
    destroyVisualizer
} from './visualizer.js';
import { 
    populateStationList, 
    setActiveStation, 
    updatePlayerInfo, 
    updateNowPlaying, 
    updateThemeIcons, 
    initSortable, 
    setupLazyLoading, 
    handleSearch,
    showErrorMessage,
    showRetryMessage,
    clearErrorMessage,
    clearRetryMessage,
    showLoadingState,
    clearLoadingState,
    updateScreenReaderStatus,
    showCompatibilityStats,
    toggleCompatibilityFilter
} from './ui.js';

import { 
    optimizedHandleSearch,
    clearSearchCache
} from './ui-performance.js';
import { 
    memoryManager, 
    initMemoryManagement, 
    cleanupThreeJSObjects, 
    cleanupAudioContext 
} from './memory-manager.js';
import { createEqualizerUI } from './equalizer.js';
import { initializeVolumeControl, volumeController } from './volume-control.js';
import { APP_CONFIG } from './config.js';
import { initCodecManager, getCodecInfoSync } from './codec-manager.js';
// Performance monitoring imports removed
import { 
    performanceMonitor 
} from './performance.js';
import {
    animationPerformance,
    optimizedAnimationFrame,
    cancelOptimizedAnimationFrame,
    registerAnimation,
    getAnimationMetrics,
    optimizeUIAnimations
} from './animation-performance.js';

// Application state
let favorites = [];
let currentViz = 'bars'; // Fixed to bars visualization
let currentFocusedStationIndex = -1; // Track keyboard focus
let keyboardNavigationEnabled = false;

// DOM element references
let stationList, audioPlayer, infoName, infoGenre;
let visualizerContainer, themeToggleButton, searchInput;

function initializeApp() {
    // Get DOM elements
    stationList = document.getElementById('station-list');
    audioPlayer = document.getElementById('audio-player');
    infoName = document.getElementById('info-name');
    infoGenre = document.getElementById('info-genre');
    visualizerContainer = document.getElementById('visualizer-container');
    themeToggleButton = document.getElementById('theme-toggle');
    searchInput = document.getElementById('search-input');
    
    // Initialize animation performance optimizations first
    optimizeUIAnimations();
    
    // Initialize mobile navigation
    initMobileNavigation();
    
    // Initialize bottom controls for mobile
    initBottomControls(audioPlayer);
    
    // Initialize mobile-first layout features
    initMobileFirstLayout();
    
    // Initialize desktop UI refinements
    initDesktopUI();
    
    // Initialize station browsing views
    initStationBrowsing(stationList);
    
    // Initialize enhanced hover states
    initHoverStates();
    
    // Initialize desktop space utilization features
    initDesktopSpaceUtilization();
    
    // Initialize visual feedback enhancements
    initVisualFeedback();
    
    // Initialize loading states module
    initLoadingStates();

    // Setup error handling callbacks
    setErrorCallback((message, error, station) => {
        // Only show errors for critical audio issues, not metadata problems
        if (message.includes('IcecastMetadataPlayer')) {
            console.warn('Metadata error (non-critical):', message);
            return; // Don't show error UI for metadata issues
        }
        
        let enhancedMessage = message;
        
        // Check for CORS errors
        if (message.includes('CORS') || message.includes('Access-Control-Allow-Origin') || 
            (error && error.message && error.message.includes('CORS'))) {
            enhancedMessage = `🚫 CORS Error: ${station ? station.name : 'This station'} blocks web browser access. This is a server configuration issue, not a problem with your setup. Try:\n\n• Use a different browser or device\n• Try the station's mobile app instead\n• Select a different station with better web compatibility`;
        }
        // Provide format-specific troubleshooting for unsupported formats
        else if (error && error.name === 'NotSupportedError' && station) {
            try {
                const codecInfo = getCodecInfoSync(station);
                if (codecInfo) {
                    const formatName = codecInfo.qualityInfo.format || codecInfo.detectedFormat.toUpperCase();
                    enhancedMessage = `${station.name} uses ${formatName} format which is not supported by your browser. Try a different station or update your browser for better codec support.`;
                }
            } catch (e) {
                // If codec info fails, use original message
            }
        } else if (message.includes('Format not supported')) {
            enhancedMessage = `${message} Try selecting a station with MP3 format for better compatibility.`;
        }
        
        console.error('Audio error:', enhancedMessage, error);
        clearRetryMessage();
        showErrorMessage(enhancedMessage);
        updateNowPlaying(enhancedMessage, infoGenre);
        showInitialIcon(visualizerContainer);
    });

    setRetryCallback((currentRetry, maxRetries, station) => {
        console.log(`Retry attempt ${currentRetry}/${maxRetries} for ${station.name}`);
        showRetryMessage(currentRetry, maxRetries, station.name);
        showLoadingState(infoGenre);
    });

    setVisualizerErrorCallback((message, error) => {
        console.warn('Visualizer error:', message, error);
        const vizType = getVisualizerType();
        if (vizType === 'canvas') {
            showErrorMessage('3D visualization unavailable, using 2D fallback', visualizerContainer, 3000);
        } else if (vizType === 'icon') {
            showErrorMessage('Visualization unavailable on this device', visualizerContainer, 3000);
        }
    });

    // Add connection timeout and error event listeners to audio player
    addConnectionTimeout(audioPlayer);
    addAudioErrorListeners();

    // Add offline detection
    addOfflineDetection(
        () => {
            showErrorMessage('You are currently offline. Playback may be interrupted.');
            updateNowPlaying('Offline - No internet connection', infoGenre);
        },
        () => {
            clearErrorMessage();
            updateNowPlaying('Connection restored', infoGenre);
        }
    );

    // Stream quality monitoring removed as per user request
    audioPlayer.addEventListener('playing', () => {
        // Quality monitoring removed
    });

    audioPlayer.addEventListener('ended', () => {
        // Quality interval cleanup removed
    });

    // Load stored data and apply to stations
    loadStoredData();

    // Initialize codec manager
    initCodecManager().then(() => {
        console.log('✅ Codec manager ready');
    }).catch(error => {
        console.warn('⚠️ Codec manager initialization failed:', error);
    });

    // Initialize UI
    showInitialIcon(visualizerContainer);
    populateStationList(stationList, favorites);
    
    // Show compatibility stats
    setTimeout(() => {
        showCompatibilityStats(stationList);
    }, 500); // Small delay to let the initial list render first
    
    updateThemeIcons(themeToggleButton);
    
    // Initialize sortable functionality
    initSortable(stationList, () => {
        populateStationList(stationList, favorites, searchInput.value);
    });

    // Create and add equalizer UI
    const controlsContainer = document.getElementById('controls-container') || document.querySelector('.controls');
    if (controlsContainer) {
        createEqualizerUI(controlsContainer);
    } else {
        // Fallback: add to visualizer container
        createEqualizerUI(visualizerContainer);
    }

    // Setup lazy loading
    setupLazyLoading(stationList, searchInput, () => {
        populateStationList(stationList, favorites, searchInput.value);
    });

    // Setup event listeners
    setupEventListeners();
    
    // Add window resize handler for visualizer
    window.addEventListener('resize', () => {
        resizeVisualizer();
    });
    
    // Add cleanup on page unload
    window.addEventListener('beforeunload', () => {
        destroyVisualizer();
    });
}

function loadStoredData() {
    const stations = getStations();
    
    // Load favorites
    favorites = loadFavorites();
    stations.forEach(station => {
        station.isFavorite = favorites.includes(station.name);
    });

    // Load sort order
    const storedOrder = loadSortOrder();
    if (storedOrder) {
        const stationMap = new Map(stations.map(s => [s.name, s]));
        const orderedStations = storedOrder.map(name => stationMap.get(name)).filter(Boolean);
        const newStations = stations.filter(s => !storedOrder.includes(s.name));
        setStations([...orderedStations, ...newStations]);
    }

    // Initialize performance monitoring
    setupPerformanceMonitoring();
}

function setupPerformanceMonitoring() {
    // Performance monitoring removed as per user request
}

function updatePerformanceDisplay() {
    // Performance display removed as per user request
}

function togglePerformanceDisplay() {
    // Performance toggle removed as per user request
}

// Keyboard Navigation Functions
function getVisibleStations() {
    return Array.from(stationList.querySelectorAll('.station-item'));
}

function setFocusedStation(index) {
    const visibleStations = getVisibleStations();
    
    // Remove focus from all stations
    visibleStations.forEach((station, idx) => {
        station.classList.remove('keyboard-focused');
        station.setAttribute('tabindex', '-1');
    });
    
    // Set focus on the specified station
    if (index >= 0 && index < visibleStations.length) {
        currentFocusedStationIndex = index;
        const focusedStation = visibleStations[index];
        focusedStation.classList.add('keyboard-focused');
        focusedStation.setAttribute('tabindex', '0');
        focusedStation.focus();
        
        // Scroll into view if needed
        focusedStation.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Update screen reader
        const stationName = focusedStation.dataset.stationName;
        updateScreenReaderStatus(`Focused: ${stationName}`, 'polite');
        
        // Trigger a custom event for the visual feedback module
        const event = new CustomEvent('stationFocused', {
            detail: { stationElement: focusedStation }
        });
        document.dispatchEvent(event);
    } else {
        currentFocusedStationIndex = -1;
    }
}

function navigateStations(direction) {
    const visibleStations = getVisibleStations();
    if (visibleStations.length === 0) return;
    
    let newIndex;
    if (currentFocusedStationIndex === -1) {
        // No current focus, start at beginning or end
        newIndex = direction > 0 ? 0 : visibleStations.length - 1;
    } else {
        // Move from current position
        newIndex = currentFocusedStationIndex + direction;
        
        // Wrap around
        if (newIndex >= visibleStations.length) {
            newIndex = 0;
        } else if (newIndex < 0) {
            newIndex = visibleStations.length - 1;
        }
    }
    
    setFocusedStation(newIndex);
    keyboardNavigationEnabled = true;
}

function playFocusedStation() {
    const visibleStations = getVisibleStations();
    if (currentFocusedStationIndex >= 0 && currentFocusedStationIndex < visibleStations.length) {
        const focusedStation = visibleStations[currentFocusedStationIndex];
        const stationName = focusedStation.dataset.stationName;
        handleStationClick(stationName);
    }
}

function handleKeyboardNavigation(event) {
    // Only handle keyboard navigation when not typing in inputs
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            navigateStations(1);
            break;
            
        case 'ArrowUp':
            event.preventDefault();
            navigateStations(-1);
            break;
            
        case 'Enter':
        case ' ': // Space key
            event.preventDefault();
            if (currentFocusedStationIndex >= 0) {
                playFocusedStation();
            }
            break;
            
        case 'Home':
            event.preventDefault();
            setFocusedStation(0);
            keyboardNavigationEnabled = true;
            break;
            
        case 'End':
            event.preventDefault();
            const visibleStations = getVisibleStations();
            setFocusedStation(visibleStations.length - 1);
            keyboardNavigationEnabled = true;
            break;
            
        case 'Escape':
            // Clear keyboard focus and return to normal tab navigation
            setFocusedStation(-1);
            keyboardNavigationEnabled = false;
            searchInput.focus();
            break;
            
        case '?':
            // Show keyboard shortcuts help
            if (!event.target.matches('input, textarea')) {
                event.preventDefault();
                showKeyboardHelp();
            }
            break;
            
        case 'f':
        case 'F':
            // Toggle favorite for focused station
            if (!event.target.matches('input, textarea') && currentFocusedStationIndex >= 0) {
                event.preventDefault();
                const visibleStations = getVisibleStations();
                const focusedStation = visibleStations[currentFocusedStationIndex];
                if (focusedStation) {
                    const stationName = focusedStation.dataset.stationName;
                    toggleFavorite(stationName);
                    updateScreenReaderStatus(`Toggled favorite for ${stationName}`, 'assertive');
                }
            }
            break;
    }
}

function showKeyboardHelp() {
    const helpMessage = `
        Keyboard Shortcuts:
        ↑/↓ Arrow keys: Navigate stations
        Enter/Space: Play selected station
        F: Toggle favorite for focused station
        Home/End: Go to first/last station
        Escape: Return to search box
        ?: Show this help
        Tab: Navigate between controls
    `;
    updateScreenReaderStatus(helpMessage, 'polite');
    
    // Also show visual help
    alert(`Keyboard Shortcuts:\n\n↑/↓ Arrow keys - Navigate stations\nEnter/Space - Play selected station\nF - Toggle favorite for focused station\nHome/End - Go to first/last station\nEscape - Return to search box\n? - Show this help\nTab - Navigate between controls`);
}

function setupEventListeners() {
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Station list click handler
    stationList.addEventListener('click', handleStationListClick);
    
    // Station play custom event handler
    stationList.addEventListener('stationPlay', handleStationPlay);

    // Audio player events
    audioPlayer.addEventListener('playing', handleAudioPlaying);

    // Theme toggle
    themeToggleButton.addEventListener('click', handleThemeToggle);

    // Compatibility filter toggle
    const compatibilityFilterButton = document.getElementById('compatibility-filter');
    if (compatibilityFilterButton) {
        compatibilityFilterButton.addEventListener('click', () => {
            toggleCompatibilityFilter(stationList, favorites, searchInput.value);
        });
    }

    // Search input
    searchInput.addEventListener('input', handleSearchInput);
    
    // Custom event listener for refreshing station list
    document.addEventListener('refreshStationList', () => {
        const favorites = loadFavorites();
        populateStationList(stationList, favorites, searchInput.value);
    });
}

function handleStationListClick(event) {
    console.log('handleStationListClick called:', event.target); // Debug log
    
    const favoriteBtn = event.target.closest('.favorite-btn');
    if (favoriteBtn) {
        event.stopPropagation();
        toggleFavorite(favoriteBtn.dataset.stationName);
        return;
    }

    const stationItem = event.target.closest('.station-item');
    if (stationItem) {
        const stationName = stationItem.dataset.stationName;
        const selectedStation = findStationByName(stationName);

        if (!selectedStation) return;

        // Clear any previous error/retry messages
        clearErrorMessage();
        clearRetryMessage();

        // Clear keyboard navigation when using mouse
        currentFocusedStationIndex = -1;
        keyboardNavigationEnabled = false;
        
        // Remove keyboard focus styling from all stations
        document.querySelectorAll('.station-item').forEach(station => {
            station.classList.remove('keyboard-focused');
            station.setAttribute('tabindex', '-1');
        });

        setActiveStation(stationName);
        updatePlayerInfo(selectedStation, infoName);
        showLoadingState(infoGenre);
        
        playStation(selectedStation, audioPlayer)
            .then(() => {
                clearLoadingState(infoGenre, selectedStation.genre);
                updateScreenReaderStatus(`Now playing: ${selectedStation.name}`, 'polite');
                
                // Set up metadata with error handling - don't let it break audio playback
                try {
                    setupMetadata(selectedStation, audioPlayer, (title) => {
                        updateNowPlaying(title, infoGenre);
                    });
                } catch (error) {
                    console.warn('Metadata setup failed (audio continues):', error);
                    updateNowPlaying(selectedStation.genre, infoGenre);
                }
            })
            .catch(error => {
                // Error is already handled by the error callback
                // Just ensure loading state is cleared
                clearLoadingState(infoGenre, "Error loading stream");
            });
    }
}

function handleStationPlay(event) {
    console.log('handleStationPlay called:', event.detail); // Debug log
    const station = event.detail;
    if (!station) return;

    // Clear any previous error/retry messages
    clearErrorMessage();
    clearRetryMessage();

    // Clear keyboard navigation when using custom event
    currentFocusedStationIndex = -1;
    keyboardNavigationEnabled = false;
    
    // Remove keyboard focus styling from all stations
    document.querySelectorAll('.station-item').forEach(stationItem => {
        stationItem.classList.remove('keyboard-focused');
        stationItem.setAttribute('tabindex', '-1');
    });

    setActiveStation(station.name);
    updatePlayerInfo(station, infoName);
    showLoadingState(infoGenre);
    
    playStation(station, audioPlayer)
        .then(() => {
            clearLoadingState(infoGenre, station.genre);
            updateScreenReaderStatus(`Now playing: ${station.name}`, 'polite');
            
            // Update mobile navigation with current station
            updateMobileNavForStation(station.name);
            
            // Update bottom controls with current station
            updateBottomControlsStation(station.name);
            
            // Set up metadata with error handling - don't let it break audio playback
            try {
                setupMetadata(station, audioPlayer, (title) => {
                    updateNowPlaying(title, infoGenre);
                });
            } catch (error) {
                console.warn('Metadata setup failed (audio continues):', error);
                updateNowPlaying(station.genre, infoGenre);
            }
        })
        .catch(error => {
            // Error is already handled by the error callback
            // Just ensure loading state is cleared
            clearLoadingState(infoGenre, "Error loading stream");
        });
}

function handleAudioPlaying() {
    console.log('Audio started playing...');
    resumeAudioContext();
    
    if (!isVisualizerInitialized()) {
        console.log('Visualizer not initialized, attempting to initialize...');
        const audioContextData = initAudioContext(audioPlayer);
        if (audioContextData) {
            console.log('Audio context created, initializing visualizer...');
            
            // Initialize volume control with the audio element
            initializeVolumeControl(audioPlayer);
            
            const success = initVisualizer(visualizerContainer, audioContextData.audioContext, audioContextData.analyser);
            if (success) {
                console.log('Visualizer initialized successfully, setting up visualization...');
                setupVisualization(currentViz, audioContextData.analyser);
                console.log('Starting animation...');
                animate(audioContextData.analyser, currentViz, !audioPlayer.paused);
                
                // Log the visualizer type for debugging
                const vizType = getVisualizerType();
                console.log(`Visualizer initialized: ${vizType}`);
            } else {
                console.warn('Visualizer initialization failed, showing static icon');
                showInitialIcon(visualizerContainer);
            }
        } else {
            console.error('Failed to create audio context');
            showInitialIcon(visualizerContainer);
        }
    } else {
        console.log('Visualizer already initialized');
    }
}

function handleThemeToggle() {
    const isDark = document.documentElement.classList.toggle('dark');
    const theme = isDark ? 'dark' : 'light';
    saveTheme(theme);
    updateThemeIcons(themeToggleButton);
}



function handleSearchInput(e) {
    const searchValue = e.target.value;
    
    // Use optimized debounced search for performance
    optimizedHandleSearch(searchValue);
    
    // Run the original search functionality
    handleSearch(searchValue);
    populateStationList(stationList, favorites, searchValue);
    
    // Reset keyboard focus when list changes
    currentFocusedStationIndex = -1;
    keyboardNavigationEnabled = false;
}

function toggleFavorite(stationName) {
    const favIndex = favorites.indexOf(stationName);
    if (favIndex > -1) {
        favorites.splice(favIndex, 1);
    } else {
        favorites.push(stationName);
    }
    saveFavorites(favorites);
    loadStoredData();
    populateStationList(stationList, favorites, searchInput.value);
    
    // Reset keyboard focus when list changes
    currentFocusedStationIndex = -1;
    keyboardNavigationEnabled = false;
}

function addAudioErrorListeners() {
    // Handle HTML5 audio errors
    audioPlayer.addEventListener('error', (e) => {
        const error = audioPlayer.error;
        if (!error) return;
        
        const errorTypes = ['Unknown error', 'MEDIA_ERR_ABORTED', 'MEDIA_ERR_NETWORK', 'MEDIA_ERR_DECODE', 'MEDIA_ERR_SRC_NOT_SUPPORTED'];
        const errorMessage = errorTypes[error.code] || errorTypes[0];
        
        console.error('HTML5 Audio Error:', errorMessage, error);
        clearRetryMessage();
        
        const userMessage = getUserFriendlyAudioErrorMessage(error.code);
        showErrorMessage(userMessage);
        updateNowPlaying(userMessage, infoGenre);
    });

    // Handle loading states
    audioPlayer.addEventListener('loadstart', () => {
        console.log('Loading started');
    });

    audioPlayer.addEventListener('loadeddata', () => {
        console.log('Data loaded');
        clearRetryMessage();
    });

    audioPlayer.addEventListener('canplay', () => {
        console.log('Can start playing');
        clearRetryMessage();
    });

    audioPlayer.addEventListener('stalled', () => {
        console.warn('Loading stalled - network might be slow');
        // Don't immediately show error - give it some time
        setTimeout(() => {
            if (audioPlayer.readyState < 2 && audioPlayer.networkState === audioPlayer.NETWORK_LOADING) {
                updateNowPlaying('Connection seems slow...', infoGenre);
            }
        }, 3000);
    });

    audioPlayer.addEventListener('waiting', () => {
        console.log('Buffering...');
        showLoadingState(infoGenre);
    });

    audioPlayer.addEventListener('canplaythrough', () => {
        console.log('Can play through');
        clearLoadingState(infoGenre);
    });
    
    // Also clear loading state when playback resumes
    audioPlayer.addEventListener('playing', () => {
        console.log('Playback resumed/started');
        clearLoadingState(infoGenre);
    });
}

function getUserFriendlyAudioErrorMessage(errorCode) {
    const messages = {
        1: 'Playback was interrupted or cancelled.',
        2: 'Network error: Unable to load the audio stream. Please check your internet connection.',
        3: 'Audio decoding error: The stream format could not be decoded. Try a different station with better compatibility.',
        4: 'Audio format not supported: This station\'s format is not compatible with your browser. Look for stations with green compatibility indicators.'
    };
    
    return messages[errorCode] || 'An unknown audio error occurred. Try selecting a station with better compatibility.';
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initMemoryManagement();
});

// Comprehensive cleanup function for when the app is closed
function cleanup() {
    console.log('Starting comprehensive application cleanup...');
    
    // Stop audio playback first to prevent resource conflicts
    if (audioPlayer) {
        try {
            audioPlayer.pause();
            audioPlayer.src = '';
            audioPlayer.load();
        } catch (error) {
            console.warn('Error during audio cleanup:', error);
        }
    }
    
    // Clean up visualizer resources
    if (typeof isVisualizerInitialized === 'function' && isVisualizerInitialized()) {
        try {
            if (window.visualizerScene) {
                cleanupThreeJSObjects(window.visualizerScene);
            }
            destroyVisualizer();
            console.log('Visualizer cleanup completed');
        } catch (error) {
            console.warn('Error during visualizer cleanup:', error);
        }
    }
    
    // Clean up audio context
    try {
        const analyser = typeof getAnalyser === 'function' ? getAnalyser() : null;
        if (analyser && analyser.context) {
            cleanupAudioContext(analyser.context, analyser);
            console.log('Audio context cleanup completed');
        }
    } catch (error) {
        console.warn('Error during audio context cleanup:', error);
    }
    
    // Clean up volume controller
    try {
        if (volumeController && typeof volumeController.cleanup === 'function') {
            volumeController.cleanup();
            console.log('Volume controller cleanup completed');
        }
    } catch (error) {
        console.warn('Error during volume controller cleanup:', error);
    }
    
    // Clear search cache
    try {
        if (typeof clearSearchCache === 'function') {
            clearSearchCache();
            console.log('Search cache cleared');
        }
    } catch (error) {
        console.warn('Error during search cache cleanup:', error);
    }
    
    // Clear references to DOM elements
    stationList = null;
    audioPlayer = null;
    infoName = null;
    infoGenre = null;
    visualizerContainer = null;
    themeToggleButton = null;
    searchInput = null;
    
    // Clear global variables that may hold references
    currentFocusedStationIndex = -1;
    favorites = [];
    currentViz = null;
    
    // Clean up animation performance resources
    try {
        if (typeof animationPerformance === 'object' && 
            typeof animationPerformance.cleanupAllAnimations === 'function') {
            animationPerformance.cleanupAllAnimations();
            console.log('Animation performance cleanup completed');
        }
    } catch (error) {
        console.warn('Error during animation performance cleanup:', error);
    }
    
    // Run global memory manager cleanup
    try {
        memoryManager.cleanup();
        console.log('Memory manager cleanup completed');
    } catch (error) {
        console.warn('Error during memory manager cleanup:', error);
    }
    
    console.log('Application cleanup completed');
}

// Register cleanup on page unload using memory manager to ensure proper tracking
memoryManager.addEventListener(window, 'beforeunload', cleanup);

// Expose cleanup for manual testing and debugging
window.cleanup = cleanup;

// --- Custom Glassmorphism Audio Player UI Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Use try-catch for the entire initialization to prevent fatal errors
    try {
        const customPlayer = document.getElementById('custom-audio-player');
        if (!customPlayer) {
            console.warn('Custom audio player container not found');
            return;
        }

        // Get UI elements with null checks
        const playPauseBtn = customPlayer.querySelector('#play-pause-btn');
        const playIcon = playPauseBtn ? playPauseBtn.querySelector('#play-icon') : null;
        const pauseIcon = playPauseBtn ? playPauseBtn.querySelector('#pause-icon') : null;
        const muteBtn = customPlayer.querySelector('#mute-btn');
        const volumeUpIcon = muteBtn ? muteBtn.querySelector('#volume-up-icon') : null;
        const volumeMuteIcon = muteBtn ? muteBtn.querySelector('#volume-mute-icon') : null;
        const volumeBar = customPlayer.querySelector('#volume-bar');
        
        // These elements may be commented out or not exist
        const progressBar = customPlayer.querySelector('#progress-bar');
        const currentTimeEl = customPlayer.querySelector('#current-time');
        const durationEl = customPlayer.querySelector('#duration');
        
        // Map station-title and station-genre to the existing info elements if they don't exist
        const stationTitle = customPlayer.querySelector('#station-title') || document.getElementById('info-name');
        const stationGenre = customPlayer.querySelector('#station-genre') || document.getElementById('info-genre');

        // Reference to main audio element
        const audio = document.getElementById('audio-player');
        if (!audio) {
            console.warn('Audio player element not found');
            return;
        }

        // Play/Pause logic - use memory manager to track event listeners
        if (playPauseBtn) {
            const playPauseHandler = () => {
                try {
                    if (audio.paused) {
                        audio.play().catch(err => console.warn('Play failed:', err));
                    } else {
                        audio.pause();
                    }
                } catch (error) {
                    console.warn('Error toggling play state:', error);
                }
            };
            
            memoryManager.addEventListener(playPauseBtn, 'click', playPauseHandler);
        }
        
        // Play event handling
        const playHandler = () => {
            try {
                if (playIcon) playIcon.classList.add('hidden');
                if (pauseIcon) pauseIcon.classList.remove('hidden');
                
                // Update mobile play state - only if function exists
                if (typeof updateMobilePlayState === 'function') {
                    updateMobilePlayState(true);
                }
                
                // Update bottom controls - only if function exists
                if (typeof updateBottomControlsPlayState === 'function') {
                    updateBottomControlsPlayState(true);
                }
            } catch (error) {
                console.warn('Error handling play event:', error);
            }
        };
        
        memoryManager.addEventListener(audio, 'play', playHandler);
        
        // Pause event handling
        const pauseHandler = () => {
            try {
                if (playIcon) playIcon.classList.remove('hidden');
                if (pauseIcon) pauseIcon.classList.add('hidden');
                
                // Update mobile play state - only if function exists
                if (typeof updateMobilePlayState === 'function') {
                    updateMobilePlayState(false);
                }
                
                // Update bottom controls - only if function exists
                if (typeof updateBottomControlsPlayState === 'function') {
                    updateBottomControlsPlayState(false);
                }
            } catch (error) {
                console.warn('Error handling pause event:', error);
            }
        };
        
        memoryManager.addEventListener(audio, 'pause', pauseHandler);

        // Mute/Unmute logic
        if (muteBtn) {
            const muteClickHandler = () => {
                try {
                    audio.muted = !audio.muted;
                    updateMuteUI();
                } catch (error) {
                    console.warn('Error toggling mute state:', error);
                }
            };
            
            memoryManager.addEventListener(muteBtn, 'click', muteClickHandler);
        }
        
        function updateMuteUI() {
            if (!volumeUpIcon || !volumeMuteIcon) return;
            
            try {
                if (audio.muted) {
                    volumeUpIcon.classList.add('hidden');
                    volumeMuteIcon.classList.remove('hidden');
                } else {
                    volumeUpIcon.classList.remove('hidden');
                    volumeMuteIcon.classList.add('hidden');
                }
            } catch (error) {
                console.warn('Error updating mute UI:', error);
            }
        }
        
        // Volume change event
        if (volumeUpIcon && volumeMuteIcon) {
            const volumeChangeHandler = () => {
                try {
                    updateMuteUI();
                } catch (error) {
                    console.warn('Error handling volume change:', error);
                }
            };
            
            memoryManager.addEventListener(audio, 'volumechange', volumeChangeHandler);
        }

        // Volume control
        if (volumeBar) {
            const volumeInputHandler = (e) => {
                try {
                    const newVolume = parseFloat(e.target.value) / 100;
                    if (!isNaN(newVolume) && newVolume >= 0 && newVolume <= 1) {
                        audio.volume = newVolume;
                    }
                } catch (error) {
                    console.warn('Error handling volume input:', error);
                }
            };
            
            memoryManager.addEventListener(volumeBar, 'input', volumeInputHandler);
            
            const volumeChangeHandler = () => {
                try {
                    volumeBar.value = Math.round(audio.volume * 100);
                } catch (error) {
                    console.warn('Error updating volume bar:', error);
                }
            };
            
            memoryManager.addEventListener(audio, 'volumechange', volumeChangeHandler);
        }

        // Progress bar logic - only add if the element exists
        if (progressBar) {
            const timeUpdateHandler = () => {
                try {
                    if (audio.duration && !isNaN(audio.duration)) {
                        progressBar.value = Math.round((audio.currentTime / audio.duration) * 100);
                        
                        if (currentTimeEl) {
                            currentTimeEl.textContent = formatTime(audio.currentTime);
                        }
                        
                        if (durationEl) {
                            durationEl.textContent = formatTime(audio.duration);
                        }
                    } else {
                        progressBar.value = 0;
                        
                        if (currentTimeEl) {
                            currentTimeEl.textContent = '0:00';
                        }
                        
                        if (durationEl) {
                            durationEl.textContent = '0:00';
                        }
                    }
                } catch (error) {
                    console.warn('Error updating progress bar:', error);
                }
            };
            
            memoryManager.addEventListener(audio, 'timeupdate', timeUpdateHandler);
            
            const progressInputHandler = (e) => {
                try {
                    if (audio.duration && !isNaN(audio.duration)) {
                        const newTime = (parseFloat(e.target.value) / 100) * audio.duration;
                        if (!isNaN(newTime) && newTime >= 0 && newTime <= audio.duration) {
                            audio.currentTime = newTime;
                        }
                    }
                } catch (error) {
                    console.warn('Error setting audio position:', error);
                }
            };
            
            memoryManager.addEventListener(progressBar, 'input', progressInputHandler);
        }

        // Update station info when station changes - with defensive programming
        function updateCustomPlayerInfo(station) {
            try {
                if (stationTitle && station && typeof station === 'object') {
                    stationTitle.textContent = station.name || 'Station Name';
                }
                
                if (stationGenre && station && typeof station === 'object') {
                    stationGenre.textContent = station.genre || 'Genre';
                }
            } catch (error) {
                console.warn('Error updating custom player info:', error);
            }
        }
        
        // Hook into your existing station change logic
        window.updateCustomPlayerInfo = updateCustomPlayerInfo;

        // Initial UI state - with defensive programming
        try {
            if (volumeUpIcon && volumeMuteIcon) updateMuteUI();
            
            if (volumeBar && audio && typeof audio.volume === 'number') {
                volumeBar.value = Math.round(audio.volume * 100);
            }
            
            if (currentTimeEl) currentTimeEl.textContent = '0:00';
            if (durationEl) durationEl.textContent = '0:00';
        } catch (error) {
            console.warn('Error setting initial UI state:', error);
        }
        
        console.log('Custom audio player initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize custom audio player:', error);
    }
});

function formatTime(seconds) {
    seconds = Math.floor(seconds);
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
}
// --- End Custom Audio Player UI Logic ---
