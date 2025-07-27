// Loading States for Icecast Player
// Manages visual indicators during stream buffering and loading

/**
 * Main loading states manager
 * Handles various loading states for the Icecast player
 */
let loadingTimeout = null;
let bufferingTimeout = null;
let successTimeout = null;

// Track current state
let isLoading = false;
let isBuffering = false;

/**
 * Initialize loading states module
 * @param {Object} options - Configuration options
 */
export function initLoadingStates(options = {}) {
    console.log('Loading states module initialized');
    createLoadingElements();
    setupEventListeners();
}

/**
 * Create necessary DOM elements for loading indicators
 */
function createLoadingElements() {
    // Main player loading overlay
    const playerContainer = document.querySelector('.player-container');
    if (playerContainer && !document.querySelector('.player-loading-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'player-loading-overlay';
        overlay.setAttribute('aria-live', 'polite');
        overlay.setAttribute('role', 'status');
        overlay.innerHTML = `
            <div class="text-center">
                <div class="loading-spinner mx-auto" aria-hidden="true"></div>
                <div class="loading-text">Loading stream</div>
            </div>
        `;
        playerContainer.appendChild(overlay);
    }

    // Buffering indicator
    if (!document.querySelector('.buffering-indicator')) {
        const bufferingIndicator = document.createElement('div');
        bufferingIndicator.className = 'buffering-indicator';
        bufferingIndicator.setAttribute('aria-live', 'polite');
        bufferingIndicator.setAttribute('role', 'status');
        bufferingIndicator.innerHTML = `
            <div class="buffer-wave" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>
            <span>Buffering</span>
        `;
        document.body.appendChild(bufferingIndicator);
    }

    // Success indicator (for successful connection)
    if (!document.querySelector('.success-indicator')) {
        const successIndicator = document.createElement('div');
        successIndicator.className = 'success-indicator';
        successIndicator.setAttribute('aria-live', 'polite');
        successIndicator.setAttribute('role', 'status');
        successIndicator.innerHTML = `
            <i class="fas fa-check-circle" aria-hidden="true"></i>
            <span>Connected successfully</span>
        `;
        document.body.appendChild(successIndicator);
    }
}

/**
 * Set up event listeners for audio events
 */
function setupEventListeners() {
    const audioElement = document.querySelector('audio');
    if (!audioElement) {
        console.warn('Audio element not found, loading states may not work properly');
        return;
    }

    // Loading events
    audioElement.addEventListener('loadstart', handleLoadStart);
    audioElement.addEventListener('waiting', handleWaiting);
    audioElement.addEventListener('playing', handlePlaying);
    audioElement.addEventListener('canplay', handleCanPlay);
    audioElement.addEventListener('progress', handleProgress);
    audioElement.addEventListener('stalled', handleStalled);
    audioElement.addEventListener('suspend', handleSuspend);
    
    // Custom events from player.js
    document.addEventListener('stationLoading', event => {
        if (event.detail && event.detail.stationName) {
            setLoadingState(true, `Loading ${event.detail.stationName}`);
        } else {
            setLoadingState(true);
        }
    });
    
    document.addEventListener('stationLoaded', event => {
        if (event.detail && event.detail.stationName) {
            showSuccessIndicator(`Connected to ${event.detail.stationName}`);
        }
        setLoadingState(false);
    });
    
    document.addEventListener('stationBuffering', event => {
        const bufferInfo = event.detail || {};
        setBufferingState(true, bufferInfo.reason);
    });
    
    document.addEventListener('stationResumed', () => {
        setBufferingState(false);
    });
}

// Event handlers for audio element
function handleLoadStart() {
    console.log('Audio loading started');
    setLoadingState(true);
    
    // If loading takes more than 5 seconds, show buffering indicator too
    clearTimeout(loadingTimeout);
    loadingTimeout = setTimeout(() => {
        if (isLoading) {
            setBufferingState(true, 'Still loading stream');
        }
    }, 5000);
}

function handleWaiting() {
    console.log('Audio waiting for data');
    // Only show buffering if we're not in the initial loading state
    if (!isLoading) {
        setBufferingState(true);
    }
}

function handlePlaying() {
    console.log('Audio playing');
    setLoadingState(false);
    
    // Wait a bit before clearing buffering to avoid flashing
    setTimeout(() => {
        setBufferingState(false);
    }, 500);
    
    showSuccessIndicator();
}

function handleCanPlay() {
    console.log('Audio can play');
    setLoadingState(false);
}

function handleProgress() {
    // Audio is downloading data, clear buffering after a short delay
    if (isBuffering) {
        clearTimeout(bufferingTimeout);
        bufferingTimeout = setTimeout(() => {
            setBufferingState(false);
        }, 1000);
    }
}

function handleStalled() {
    console.log('Audio stalled');
    if (!isLoading) {
        setBufferingState(true, 'Connection stalled');
    }
}

function handleSuspend() {
    // Suspend can mean either download paused or complete
    const audioElement = document.querySelector('audio');
    if (audioElement && !audioElement.paused && audioElement.readyState < 4) {
        console.log('Audio suspended but not enough data');
        setBufferingState(true, 'Waiting for more data');
    }
}

/**
 * Set loading state and update UI
 * @param {boolean} state - Whether loading is active
 * @param {string} message - Optional custom loading message
 */
export function setLoadingState(state, message = 'Loading stream') {
    isLoading = state;
    const overlay = document.querySelector('.player-loading-overlay');
    
    if (overlay) {
        const loadingText = overlay.querySelector('.loading-text');
        
        if (state) {
            if (loadingText) loadingText.textContent = message;
            overlay.classList.add('active');
            
            // Announce to screen readers
            const statusElement = document.getElementById('player-status');
            if (statusElement) {
                statusElement.textContent = message;
                statusElement.setAttribute('aria-live', 'polite');
            }
        } else {
            overlay.classList.remove('active');
        }
    }
    
    // Update UI elements that should react to loading state
    const playButton = document.querySelector('.play-button');
    if (playButton) {
        if (state) {
            playButton.classList.add('loading');
        } else {
            playButton.classList.remove('loading');
        }
    }
    
    // Also dispatch event for other modules
    document.dispatchEvent(new CustomEvent('loadingStateChanged', { 
        detail: { isLoading: state, message } 
    }));
}

/**
 * Set buffering state and update UI
 * @param {boolean} state - Whether buffering is active
 * @param {string} reason - Optional reason for buffering
 */
export function setBufferingState(state, reason = 'Buffering') {
    isBuffering = state;
    const indicator = document.querySelector('.buffering-indicator');
    
    if (indicator) {
        const messageElement = indicator.querySelector('span:not(.buffer-wave span)');
        
        if (state) {
            if (messageElement) messageElement.textContent = reason;
            indicator.classList.add('active');
            
            // Announce to screen readers but only once
            if (!indicator.dataset.announced) {
                const statusElement = document.getElementById('player-status');
                if (statusElement) {
                    statusElement.textContent = reason;
                    statusElement.setAttribute('aria-live', 'polite');
                    indicator.dataset.announced = 'true';
                }
            }
        } else {
            indicator.classList.remove('active');
            delete indicator.dataset.announced;
        }
    }
    
    // Also dispatch event for other modules
    document.dispatchEvent(new CustomEvent('bufferingStateChanged', { 
        detail: { isBuffering: state, reason } 
    }));
}

/**
 * Show success indicator briefly
 * @param {string} message - Optional custom success message
 */
export function showSuccessIndicator(message = 'Connected successfully') {
    const indicator = document.querySelector('.success-indicator');
    
    if (indicator) {
        const messageElement = indicator.querySelector('span');
        if (messageElement) messageElement.textContent = message;
        
        indicator.classList.add('active');
        
        // Clear previous timeout
        clearTimeout(successTimeout);
        
        // Hide after 3 seconds
        successTimeout = setTimeout(() => {
            indicator.classList.remove('active');
        }, 3000);
        
        // Announce to screen readers
        const statusElement = document.getElementById('player-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.setAttribute('aria-live', 'polite');
        }
    }
}

/**
 * Check if player is currently in loading state
 * @returns {boolean} - Current loading state
 */
export function isPlayerLoading() {
    return isLoading;
}

/**
 * Check if player is currently buffering
 * @returns {boolean} - Current buffering state
 */
export function isPlayerBuffering() {
    return isBuffering;
}
