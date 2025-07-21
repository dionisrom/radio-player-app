// Volume control functionality for the Radio Player
import { memoryManager } from './memory-manager.js';

class VolumeController {
    constructor() {
        this.audioElement = null;
        this.volumeSlider = null;
        this.muteButton = null;
        this.volumeDisplay = null;
        this.currentVolume = 0.7; // Default to 70%
        this.previousVolume = 0.7; // For unmute functionality
        this.isMuted = false;
        this.isInitialized = false;
        
        // Volume change callback for external components
        this.onVolumeChangeCallback = null;
    }

    initialize(audioElement) {
        if (this.isInitialized) {
            console.warn('Volume controller already initialized');
            return;
        }

        this.audioElement = audioElement;
        
        // Load saved volume settings
        this.loadVolumeSettings();
        
        // Apply initial volume to audio element
        if (this.audioElement) {
            this.audioElement.volume = this.isMuted ? 0 : this.currentVolume;
            this.audioElement.muted = this.isMuted;
        }

        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();

        this.isInitialized = true;
        console.log('Volume controller initialized');
    }

    createVolumeUI(container) {
        if (!container) {
            console.error('Container element not provided for volume UI');
            return null;
        }

        const volumeContainer = document.createElement('div');
        volumeContainer.className = 'volume-container flex items-center gap-3 bg-white/10 dark:bg-slate-800/50 rounded-lg p-3 mt-3';
        volumeContainer.innerHTML = `
            <div class="flex items-center gap-3 w-full">
                <button id="mute-button" class="mute-btn flex-shrink-0 p-2 rounded-lg hover:bg-white/20 dark:hover:bg-slate-600/30 transition-colors" 
                        aria-label="Toggle mute" title="Mute/Unmute (M)">
                    <i class="fas fa-volume-up text-slate-600 dark:text-slate-400" aria-hidden="true"></i>
                </button>
                
                <div class="flex-1 flex items-center gap-2">
                    <span class="text-xs text-slate-600 dark:text-slate-400 w-8 text-right">0%</span>
                    <div class="flex-1 relative">
                        <input type="range" id="volume-slider" min="0" max="100" value="${Math.round(this.currentVolume * 100)}" 
                               class="volume-slider w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                               aria-label="Volume control" title="Volume: ${Math.round(this.currentVolume * 100)}%">
                        <div class="volume-track absolute top-1/2 left-0 h-1 bg-indigo-500 dark:bg-indigo-400 rounded-lg transform -translate-y-1/2 pointer-events-none transition-all duration-150" 
                             style="width: ${Math.round(this.currentVolume * 100)}%"></div>
                    </div>
                    <span class="text-xs text-slate-600 dark:text-slate-400 w-10">100%</span>
                </div>
                
                <div id="volume-display" class="volume-display text-sm font-medium text-slate-700 dark:text-slate-300 w-10 text-center">
                    ${this.isMuted ? '🔇' : Math.round(this.currentVolume * 100) + '%'}
                </div>
            </div>
        `;

        // Store references to UI elements
        this.volumeSlider = volumeContainer.querySelector('#volume-slider');
        this.muteButton = volumeContainer.querySelector('#mute-button');
        this.volumeDisplay = volumeContainer.querySelector('#volume-display');
        this.volumeTrack = volumeContainer.querySelector('.volume-track');

        // Set up event listeners
        this.setupVolumeSliderEvents();
        this.setupMuteButtonEvents();

        // Update UI to reflect current state
        this.updateVolumeUI();

        container.appendChild(volumeContainer);
        return volumeContainer;
    }

    setupVolumeSliderEvents() {
        if (!this.volumeSlider) return;

        // Volume slider change
        const handleVolumeChange = (e) => {
            const volume = parseFloat(e.target.value) / 100;
            this.setVolume(volume, false); // Don't save immediately for smooth dragging
        };

        // Save volume when slider interaction ends
        const handleVolumeChangeEnd = (e) => {
            const volume = parseFloat(e.target.value) / 100;
            this.setVolume(volume, true); // Save to localStorage
        };

        // Input event for real-time updates while dragging
        this.volumeSlider.addEventListener('input', handleVolumeChange);
        
        // Change event for when dragging ends
        this.volumeSlider.addEventListener('change', handleVolumeChangeEnd);

        // Register with memory manager
        memoryManager.addEventListener(this.volumeSlider, 'input', handleVolumeChange);
        memoryManager.addEventListener(this.volumeSlider, 'change', handleVolumeChangeEnd);
    }

    setupMuteButtonEvents() {
        if (!this.muteButton) return;

        const handleMuteToggle = (e) => {
            e.preventDefault();
            this.toggleMute();
        };

        this.muteButton.addEventListener('click', handleMuteToggle);
        memoryManager.addEventListener(this.muteButton, 'click', handleMuteToggle);
    }

    setupKeyboardShortcuts() {
        const handleKeyPress = (e) => {
            // Only handle when not typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'm':
                    e.preventDefault();
                    this.toggleMute();
                    break;
                case 'arrowup':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.increaseVolume();
                    }
                    break;
                case 'arrowdown':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.decreaseVolume();
                    }
                    break;
                case '+':
                case '=':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.increaseVolume();
                    }
                    break;
                case '-':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.decreaseVolume();
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        memoryManager.addEventListener(document, 'keydown', handleKeyPress);
    }

    setVolume(volume, save = true) {
        // Clamp volume between 0 and 1
        volume = Math.max(0, Math.min(1, volume));
        
        this.currentVolume = volume;
        
        // If volume is set to something > 0, unmute
        if (volume > 0 && this.isMuted) {
            this.isMuted = false;
        }
        
        // Apply to audio element
        if (this.audioElement) {
            this.audioElement.volume = this.isMuted ? 0 : volume;
            this.audioElement.muted = this.isMuted;
        }

        // Update UI
        this.updateVolumeUI();

        // Save settings
        if (save) {
            this.saveVolumeSettings();
        }

        // Notify external components
        if (this.onVolumeChangeCallback) {
            this.onVolumeChangeCallback(volume, this.isMuted);
        }

        console.log(`Volume set to ${Math.round(volume * 100)}%${this.isMuted ? ' (muted)' : ''}`);
    }

    toggleMute() {
        if (this.isMuted) {
            // Unmute: restore previous volume
            this.isMuted = false;
            this.setVolume(this.previousVolume);
        } else {
            // Mute: save current volume and set to 0
            this.previousVolume = this.currentVolume;
            this.isMuted = true;
            if (this.audioElement) {
                this.audioElement.muted = true;
            }
            this.updateVolumeUI();
            this.saveVolumeSettings();
        }
    }

    increaseVolume(step = 0.1) {
        const newVolume = Math.min(1, this.currentVolume + step);
        this.setVolume(newVolume);
    }

    decreaseVolume(step = 0.1) {
        const newVolume = Math.max(0, this.currentVolume - step);
        this.setVolume(newVolume);
    }

    updateVolumeUI() {
        if (!this.volumeSlider || !this.muteButton || !this.volumeDisplay) return;

        const volumePercent = Math.round(this.currentVolume * 100);
        
        // Update slider
        this.volumeSlider.value = volumePercent;
        this.volumeSlider.title = `Volume: ${volumePercent}%`;
        
        // Update volume track
        if (this.volumeTrack) {
            this.volumeTrack.style.width = `${this.isMuted ? 0 : volumePercent}%`;
        }

        // Update mute button icon
        const muteIcon = this.muteButton.querySelector('i');
        if (muteIcon) {
            muteIcon.className = this.isMuted || this.currentVolume === 0 
                ? 'fas fa-volume-mute text-slate-600 dark:text-slate-400'
                : this.currentVolume < 0.5 
                    ? 'fas fa-volume-down text-slate-600 dark:text-slate-400'
                    : 'fas fa-volume-up text-slate-600 dark:text-slate-400';
        }

        // Update mute button aria-label
        this.muteButton.setAttribute('aria-label', 
            this.isMuted ? 'Unmute audio' : 'Mute audio'
        );

        // Update volume display
        this.volumeDisplay.textContent = this.isMuted ? '🔇' : `${volumePercent}%`;
    }

    saveVolumeSettings() {
        try {
            const settings = {
                volume: this.currentVolume,
                previousVolume: this.previousVolume,
                isMuted: this.isMuted
            };
            localStorage.setItem('radioPlayerVolume', JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save volume settings:', error);
        }
    }

    loadVolumeSettings() {
        try {
            const saved = localStorage.getItem('radioPlayerVolume');
            if (saved) {
                const settings = JSON.parse(saved);
                this.currentVolume = settings.volume || 0.7;
                this.previousVolume = settings.previousVolume || 0.7;
                this.isMuted = settings.isMuted || false;
                console.log('Volume settings loaded from localStorage');
            }
        } catch (error) {
            console.warn('Failed to load volume settings:', error);
            // Use defaults
            this.currentVolume = 0.7;
            this.previousVolume = 0.7;
            this.isMuted = false;
        }
    }

    // Public methods for external use
    getVolume() {
        return this.currentVolume;
    }

    getMuted() {
        return this.isMuted;
    }

    onVolumeChange(callback) {
        this.onVolumeChangeCallback = callback;
    }

    // Cleanup
    cleanup() {
        this.audioElement = null;
        this.volumeSlider = null;
        this.muteButton = null;
        this.volumeDisplay = null;
        this.onVolumeChangeCallback = null;
        this.isInitialized = false;
        console.log('Volume controller cleanup completed');
    }
}

// Create and export singleton instance
export const volumeController = new VolumeController();

// Helper functions for easy integration
export function initializeVolumeControl(audioElement) {
    volumeController.initialize(audioElement);
}

export function createVolumeControlUI(container) {
    return volumeController.createVolumeUI(container);
}
