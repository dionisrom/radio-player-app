// Audio equalizer functionality
import { memoryManager } from './memory-manager.js';

class AudioEqualizer {
    constructor() {
        this.audioContext = null;
        this.source = null;
        this.filters = {
            bass: null,      // Low frequencies (60Hz)
            mid: null,       // Mid frequencies (1kHz)  
            treble: null     // High frequencies (8kHz)
        };
        this.masterGain = null;
        this.isInitialized = false;
        this.settings = {
            bass: 0,    // -12dB to +12dB
            mid: 0,
            treble: 0
        };
        this.presets = {
            flat: { bass: 0, mid: 0, treble: 0 },
            rock: { bass: 4, mid: 2, treble: 6 },
            pop: { bass: 2, mid: 0, treble: 4 },
            jazz: { bass: 3, mid: -1, treble: 2 },
            classical: { bass: 1, mid: -2, treble: 3 },
            electronic: { bass: 6, mid: -2, treble: 5 },
            vocal: { bass: -2, mid: 4, treble: 1 }
        };
    }

    initialize(audioContext, sourceNode) {
        if (this.isInitialized) {
            console.warn('Equalizer already initialized');
            return;
        }

        try {
            this.audioContext = audioContext;
            
            // Create filters
            this.filters.bass = audioContext.createBiquadFilter();
            this.filters.mid = audioContext.createBiquadFilter();
            this.filters.treble = audioContext.createBiquadFilter();
            this.masterGain = audioContext.createGain();

            // Configure bass filter (low-shelf)
            this.filters.bass.type = 'lowshelf';
            this.filters.bass.frequency.value = 320; // 320Hz crossover
            this.filters.bass.gain.value = this.settings.bass;

            // Configure mid filter (peaking)
            this.filters.mid.type = 'peaking';
            this.filters.mid.frequency.value = 1000; // 1kHz center
            this.filters.mid.Q.value = 1; // Bandwidth
            this.filters.mid.gain.value = this.settings.mid;

            // Configure treble filter (high-shelf)
            this.filters.treble.type = 'highshelf';
            this.filters.treble.frequency.value = 3200; // 3.2kHz crossover
            this.filters.treble.gain.value = this.settings.treble;

            // Set master gain to unity
            this.masterGain.gain.value = 1.0;

            // Connect the audio chain
            // sourceNode -> bass -> mid -> treble -> masterGain -> destination
            if (sourceNode) {
                sourceNode.disconnect(); // Disconnect from previous destination
                sourceNode.connect(this.filters.bass);
            }
            
            this.filters.bass.connect(this.filters.mid);
            this.filters.mid.connect(this.filters.treble);
            this.filters.treble.connect(this.masterGain);
            this.masterGain.connect(audioContext.destination);

            // Register with memory manager
            memoryManager.addCleanup(() => this.cleanup());

            this.isInitialized = true;
            console.log('Audio equalizer initialized successfully');

            // Load saved settings
            this.loadSettings();

        } catch (error) {
            console.error('Failed to initialize equalizer:', error);
            this.isInitialized = false;
        }
    }

    setBass(value) {
        if (!this.isInitialized || !this.filters.bass) return;
        
        // Clamp value between -12 and +12 dB
        value = Math.max(-12, Math.min(12, value));
        this.settings.bass = value;
        
        // Apply with smooth transition
        const now = this.audioContext.currentTime;
        this.filters.bass.gain.setTargetAtTime(value, now, 0.1);
        
        console.log(`Bass set to ${value}dB`);
        this.saveSettings();
    }

    setMid(value) {
        if (!this.isInitialized || !this.filters.mid) return;
        
        value = Math.max(-12, Math.min(12, value));
        this.settings.mid = value;
        
        const now = this.audioContext.currentTime;
        this.filters.mid.gain.setTargetAtTime(value, now, 0.1);
        
        console.log(`Mid set to ${value}dB`);
        this.saveSettings();
    }

    setTreble(value) {
        if (!this.isInitialized || !this.filters.treble) return;
        
        value = Math.max(-12, Math.min(12, value));
        this.settings.treble = value;
        
        const now = this.audioContext.currentTime;
        this.filters.treble.gain.setTargetAtTime(value, now, 0.1);
        
        console.log(`Treble set to ${value}dB`);
        this.saveSettings();
    }

    setPreset(presetName) {
        if (!this.presets[presetName]) {
            console.warn(`Unknown preset: ${presetName}`);
            return;
        }

        const preset = this.presets[presetName];
        console.log(`Applying preset: ${presetName}`);
        
        this.setBass(preset.bass);
        this.setMid(preset.mid);
        this.setTreble(preset.treble);
    }

    getSettings() {
        return { ...this.settings };
    }

    getPresets() {
        return Object.keys(this.presets);
    }

    getPresetSettings(presetName) {
        return this.presets[presetName] ? { ...this.presets[presetName] } : null;
    }

    reset() {
        console.log('Resetting equalizer to flat');
        this.setPreset('flat');
    }

    saveSettings() {
        try {
            localStorage.setItem('radioPlayerEQ', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save EQ settings:', error);
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('radioPlayerEQ');
            if (saved) {
                const settings = JSON.parse(saved);
                this.setBass(settings.bass || 0);
                this.setMid(settings.mid || 0);
                this.setTreble(settings.treble || 0);
                console.log('EQ settings loaded from localStorage');
            }
        } catch (error) {
            console.warn('Failed to load EQ settings:', error);
        }
    }

    cleanup() {
        if (!this.isInitialized) return;

        try {
            // Disconnect all nodes
            if (this.filters.bass) {
                this.filters.bass.disconnect();
                this.filters.bass = null;
            }
            if (this.filters.mid) {
                this.filters.mid.disconnect();
                this.filters.mid = null;
            }
            if (this.filters.treble) {
                this.filters.treble.disconnect();
                this.filters.treble = null;
            }
            if (this.masterGain) {
                this.masterGain.disconnect();
                this.masterGain = null;
            }

            this.audioContext = null;
            this.source = null;
            this.isInitialized = false;
            
            console.log('Equalizer cleanup completed');
        } catch (error) {
            console.warn('Error during equalizer cleanup:', error);
        }
    }
}

// Create and export singleton instance
export const equalizer = new AudioEqualizer();

// Helper functions for UI integration
export function initializeEqualizer(audioContext, sourceNode) {
    equalizer.initialize(audioContext, sourceNode);
}

export function createEqualizerUI(container) {
    const eqContainer = document.createElement('div');
    eqContainer.className = 'equalizer-container bg-white/10 dark:bg-slate-800/50 rounded-lg p-4 mt-4';
    eqContainer.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Equalizer</h3>
            <div class="flex gap-2">
                <select id="eq-preset" class="bg-white/20 dark:bg-slate-700 text-slate-900 dark:text-white rounded px-2 py-1 text-sm border border-white/20 dark:border-slate-600">
                    <option value="">Select Preset</option>
                    <option value="flat">Flat</option>
                    <option value="rock">Rock</option>
                    <option value="pop">Pop</option>
                    <option value="jazz">Jazz</option>
                    <option value="classical">Classical</option>
                    <option value="electronic">Electronic</option>
                    <option value="vocal">Vocal</option>
                </select>
                <button id="eq-reset" class="bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded text-sm transition-colors">
                    Reset
                </button>
            </div>
        </div>
        
        <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
                <label for="bass-slider" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Bass
                </label>
                <div class="slider-container">
                    <input type="range" id="bass-slider" min="-12" max="12" value="0" step="1" 
                           class="eq-slider w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer">
                    <div id="bass-value" class="text-sm text-slate-600 dark:text-slate-400 mt-1">0 dB</div>
                </div>
            </div>
            
            <div class="text-center">
                <label for="mid-slider" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Mid
                </label>
                <div class="slider-container">
                    <input type="range" id="mid-slider" min="-12" max="12" value="0" step="1" 
                           class="eq-slider w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer">
                    <div id="mid-value" class="text-sm text-slate-600 dark:text-slate-400 mt-1">0 dB</div>
                </div>
            </div>
            
            <div class="text-center">
                <label for="treble-slider" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Treble
                </label>
                <div class="slider-container">
                    <input type="range" id="treble-slider" min="-12" max="12" value="0" step="1" 
                           class="eq-slider w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer">
                    <div id="treble-value" class="text-sm text-slate-600 dark:text-slate-400 mt-1">0 dB</div>
                </div>
            </div>
        </div>
    `;

    // Add event listeners
    const bassSlider = eqContainer.querySelector('#bass-slider');
    const midSlider = eqContainer.querySelector('#mid-slider');
    const trebleSlider = eqContainer.querySelector('#treble-slider');
    const bassValue = eqContainer.querySelector('#bass-value');
    const midValue = eqContainer.querySelector('#mid-value');
    const trebleValue = eqContainer.querySelector('#treble-value');
    const presetSelect = eqContainer.querySelector('#eq-preset');
    const resetButton = eqContainer.querySelector('#eq-reset');

    // Slider event listeners
    bassSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        equalizer.setBass(value);
        bassValue.textContent = `${value > 0 ? '+' : ''}${value} dB`;
    });

    midSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        equalizer.setMid(value);
        midValue.textContent = `${value > 0 ? '+' : ''}${value} dB`;
    });

    trebleSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        equalizer.setTreble(value);
        trebleValue.textContent = `${value > 0 ? '+' : ''}${value} dB`;
    });

    // Preset selector
    presetSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            equalizer.setPreset(e.target.value);
            // Update UI to reflect preset values
            const settings = equalizer.getPresetSettings(e.target.value);
            if (settings) {
                bassSlider.value = settings.bass;
                midSlider.value = settings.mid;
                trebleSlider.value = settings.treble;
                bassValue.textContent = `${settings.bass > 0 ? '+' : ''}${settings.bass} dB`;
                midValue.textContent = `${settings.mid > 0 ? '+' : ''}${settings.mid} dB`;
                trebleValue.textContent = `${settings.treble > 0 ? '+' : ''}${settings.treble} dB`;
            }
        }
    });

    // Reset button
    resetButton.addEventListener('click', () => {
        equalizer.reset();
        bassSlider.value = 0;
        midSlider.value = 0;
        trebleSlider.value = 0;
        bassValue.textContent = '0 dB';
        midValue.textContent = '0 dB';
        trebleValue.textContent = '0 dB';
        presetSelect.value = '';
    });

    // Register event listeners with memory manager
    memoryManager.addEventListener(bassSlider, 'input', bassSlider._listener = (e) => {
        const value = parseInt(e.target.value);
        equalizer.setBass(value);
        bassValue.textContent = `${value > 0 ? '+' : ''}${value} dB`;
    });

    memoryManager.addEventListener(midSlider, 'input', midSlider._listener = (e) => {
        const value = parseInt(e.target.value);
        equalizer.setMid(value);
        midValue.textContent = `${value > 0 ? '+' : ''}${value} dB`;
    });

    memoryManager.addEventListener(trebleSlider, 'input', trebleSlider._listener = (e) => {
        const value = parseInt(e.target.value);
        equalizer.setTreble(value);
        trebleValue.textContent = `${value > 0 ? '+' : ''}${value} dB`;
    });

    container.appendChild(eqContainer);
    
    // Load current settings into UI
    const currentSettings = equalizer.getSettings();
    bassSlider.value = currentSettings.bass;
    midSlider.value = currentSettings.mid;
    trebleSlider.value = currentSettings.treble;
    bassValue.textContent = `${currentSettings.bass > 0 ? '+' : ''}${currentSettings.bass} dB`;
    midValue.textContent = `${currentSettings.mid > 0 ? '+' : ''}${currentSettings.mid} dB`;
    trebleValue.textContent = `${currentSettings.treble > 0 ? '+' : ''}${currentSettings.treble} dB`;

    return eqContainer;
}
