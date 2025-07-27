// 2D Canvas Audio Visualizer - Simplified and optimized for modern bar-style visualizations
import { CanvasVisualizer } from './canvas-visualizer.js';
import { ERROR_MESSAGES } from './config.js';
import { getCurrentQuality, getQualitySettings } from './performance.js';

let canvasVisualizer = null;
let visualizerInitialized = false;
let currentContainer = null;
let errorCallback = null;
let qualitySettings = null;

export function initVisualizer(container, audioContext, analyser) {
    console.log('Initializing 2D Canvas visualizer...');
    if (visualizerInitialized) {
        console.log('Visualizer already initialized');
        return true;
    }

    currentContainer = container;
    
    // Get current quality settings
    qualitySettings = getQualitySettings(getCurrentQuality());
    console.log('Using quality settings:', qualitySettings);

    // Validate quality settings
    if (!qualitySettings) {
        console.warn('Quality settings not available, using defaults');
        qualitySettings = {
            name: 'Default Quality',
            antiAliasing: false,
            fftSizes: { bars: 256, wave: 1024, circle: 256 }
        };
    }

    try {
        console.log('Initializing Canvas visualizer...');
        
        if (canvasVisualizer) {
            canvasVisualizer.destroy();
        }
        
        canvasVisualizer = new CanvasVisualizer(container);
        canvasVisualizer.updateQualitySettings(qualitySettings);
        const success = canvasVisualizer.init();
        
        if (success) {
            visualizerInitialized = true;
            console.log('Canvas visualizer initialized successfully');
            return true;
        } else {
            console.warn('Canvas visualizer failed, showing static icon');
            showInitialIcon(container);
            return false;
        }
        
    } catch (error) {
        console.error("Canvas visualizer initialization failed:", error);
        
        if (errorCallback) {
            errorCallback(ERROR_MESSAGES.VISUALIZER_INIT_FAILED, error);
        }
        
        showInitialIcon(container);
        return false;
    }
}

export function setupVisualization(vizType, analyser) {
    console.log('Setting up 2D visualization:', vizType);
    
    if (!visualizerInitialized || !canvasVisualizer) {
        console.warn('Setup visualization called but visualizer not initialized');
        return;
    }

    // Update quality settings in case they changed
    qualitySettings = getQualitySettings(getCurrentQuality());
    canvasVisualizer.updateQualitySettings(qualitySettings);
    console.log('Using quality settings for visualization:', qualitySettings.name);

    // Canvas visualizer handles setup internally during animation
    console.log('2D Canvas visualization ready for type:', vizType);
}

// Optimize animation loop with throttling and better error handling
let animationFrameId = null;
let lastAnimationTime = 0;
let animationThrottleInterval = 1000 / 60; // Default to 60fps
let errorCount = 0;
const MAX_ERROR_COUNT = 5;

export function animate(analyser, currentViz, isPlaying) {
    if (!visualizerInitialized || !canvasVisualizer) {
        return;
    }

    // Cancel any existing animation frame to prevent duplicate loops
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    // Schedule next frame
    animationFrameId = requestAnimationFrame(() => {
        const now = performance.now();
        const elapsed = now - lastAnimationTime;
        
        // Get device capabilities to adjust throttling
        const isMobile = window.innerWidth <= 768;
        
        // Set different frame rates for different devices
        if (isMobile) {
            animationThrottleInterval = 1000 / 30; // 30fps target for mobile
        } else {
            // Use device refresh rate if available, otherwise default to 60fps
            const refreshRate = window.screen.refreshRate || 60;
            animationThrottleInterval = 1000 / refreshRate;
        }
        
        // Only render if enough time has passed or first frame
        if (elapsed >= animationThrottleInterval || lastAnimationTime === 0) {
            lastAnimationTime = now;
            
            try {
                // Record frame for performance monitoring
                if (typeof window.recordFrame === 'function') {
                    window.recordFrame();
                }
                
                canvasVisualizer.animate(analyser, currentViz, isPlaying);
                
                // Reset error counter on successful render
                errorCount = 0;
            } catch (error) {
                errorCount++;
                console.error(`Animation error (${errorCount}/${MAX_ERROR_COUNT}):`, error);
                
                if (errorCount >= MAX_ERROR_COUNT) {
                    console.warn('Too many animation errors, stopping animation loop');
                    if (errorCallback) {
                        errorCallback('Visualization animation failed repeatedly, stopping', error);
                    }
                    return; // Stop animation loop after too many errors
                }
                
                if (errorCallback) {
                    errorCallback('Visualization animation error', error);
                }
            }
        }
        
        // Continue the animation loop if still playing
        animate(analyser, currentViz, isPlaying);
    });
}

export function showInitialIcon(container) {
    container.innerHTML = `
        <div class="w-32 h-32 bg-gradient-to-br from-indigo-100/50 to-purple-100/50 dark:from-slate-700/50 dark:to-slate-600/50 rounded-2xl flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/20">
            <div class="text-center">
                <i class="fas fa-music text-4xl text-indigo-500 dark:text-indigo-400 mb-2"></i>
                <p class="text-sm text-slate-600 dark:text-slate-300 font-medium">Audio Visualizer</p>
            </div>
        </div>`;
}

export function isVisualizerInitialized() {
    return visualizerInitialized;
}

export function setVisualizerErrorCallback(callback) {
    errorCallback = callback;
}

export function updateQualitySettings(newQuality) {
    if (!visualizerInitialized || !canvasVisualizer) return;
    
    const oldSettings = qualitySettings;
    qualitySettings = getQualitySettings(newQuality);
    
    console.log('Updating visualizer quality from', oldSettings?.name, 'to', qualitySettings?.name);
    
    canvasVisualizer.updateQualitySettings(qualitySettings);
}

export function getVisualizerType() {
    return canvasVisualizer ? 'canvas-2d' : 'icon';
}

export function resizeVisualizer() {
    if (!currentContainer || !canvasVisualizer) return;
    
    try {
        canvasVisualizer.resize();
    } catch (error) {
        console.error('Resize error:', error);
    }
}

export function destroyVisualizer() {
    try {
        // Cancel any pending animation frames
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        // Reset animation timers
        lastAnimationTime = 0;
        errorCount = 0;
        
        // Destroy canvas visualizer
        if (canvasVisualizer) {
            canvasVisualizer.destroy();
            canvasVisualizer = null;
        }
        
        // Reset state
        visualizerInitialized = false;
        currentContainer = null;
        
        console.log('2D Canvas visualizer destroyed and animation loop stopped');
        
    } catch (error) {
        console.error('Error destroying visualizer:', error);
        
        // Force cleanup even if there was an error
        canvasVisualizer = null;
        visualizerInitialized = false;
        animationFrameId = null;
    }
}
