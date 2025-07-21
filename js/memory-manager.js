// Memory Management utilities for the Radio Player
import { DEBUG_CONFIG } from './config.js';

class MemoryManager {
    constructor() {
        this.cleanup = [];
        this.observers = [];
        this.intervals = [];
        this.timeouts = [];
        this.eventListeners = [];
        this.audioContexts = [];
    }

    // Register cleanup functions
    addCleanup(fn) {
        this.cleanup.push(fn);
    }

    // Register intervals for cleanup
    addInterval(intervalId) {
        this.intervals.push(intervalId);
    }

    // Register timeouts for cleanup
    addTimeout(timeoutId) {
        this.timeouts.push(timeoutId);
    }

    // Register event listeners for cleanup
    addEventListener(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
        this.eventListeners.push({
            element,
            event,
            handler,
            options
        });
    }

    // Register observers for cleanup
    addObserver(observer) {
        this.observers.push(observer);
    }

    // Register audio contexts for cleanup
    addAudioContext(context) {
        this.audioContexts.push(context);
    }

    // Clean up all registered resources
    cleanup() {
        console.log('Starting memory cleanup...');
        
        // Clear intervals
        this.intervals.forEach(id => {
            clearInterval(id);
        });
        this.intervals = [];

        // Clear timeouts
        this.timeouts.forEach(id => {
            clearTimeout(id);
        });
        this.timeouts = [];

        // Remove event listeners
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            try {
                element.removeEventListener(event, handler, options);
            } catch (e) {
                console.warn('Failed to remove event listener:', e);
            }
        });
        this.eventListeners = [];

        // Disconnect observers
        this.observers.forEach(observer => {
            try {
                observer.disconnect();
            } catch (e) {
                console.warn('Failed to disconnect observer:', e);
            }
        });
        this.observers = [];

        // Close audio contexts
        this.audioContexts.forEach(context => {
            try {
                if (context.state !== 'closed') {
                    context.close();
                }
            } catch (e) {
                console.warn('Failed to close audio context:', e);
            }
        });
        this.audioContexts = [];

        // Run custom cleanup functions
        this.cleanup.forEach(fn => {
            try {
                fn();
            } catch (e) {
                console.warn('Cleanup function failed:', e);
            }
        });
        this.cleanup = [];

        console.log('Memory cleanup completed');
    }

    // Get memory usage information
    getMemoryInfo() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }

    // Monitor memory usage
    startMemoryMonitoring(interval = DEBUG_CONFIG.MEMORY_MONITOR_INTERVAL) {
        const monitorId = setInterval(() => {
            const memInfo = this.getMemoryInfo();
            if (memInfo) {
                // Only log if memory usage is concerning
                const memoryThreshold = DEBUG_CONFIG.MEMORY_LOG_THRESHOLD;
                const percentageThreshold = 0.5; // 50% of limit
                
                if (memInfo.used > memoryThreshold || memInfo.used > memInfo.limit * percentageThreshold) {
                    console.log(`Memory: ${memInfo.used}MB / ${memInfo.total}MB (limit: ${memInfo.limit}MB)`);
                    
                    // Warn if memory usage is high
                    if (memInfo.used > memInfo.limit * 0.8) {
                        console.warn('High memory usage detected');
                        this.triggerGarbageCollection();
                    }
                }
            }
        }, interval);
        
        this.addInterval(monitorId);
        return monitorId;
    }

    // Trigger garbage collection if available
    triggerGarbageCollection() {
        if (window.gc) {
            console.log('Triggering garbage collection');
            window.gc();
        } else {
            console.log('Manual garbage collection not available');
        }
    }
}

// Create global memory manager instance
export const memoryManager = new MemoryManager();

// Three.js specific cleanup functions
export function cleanupThreeJSObjects(scene) {
    if (!scene) return;
    
    console.log('Cleaning up Three.js objects...');
    
    // Dispose of all geometries and materials
    scene.traverse((object) => {
        if (object.geometry) {
            object.geometry.dispose();
        }
        
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
            } else {
                object.material.dispose();
            }
        }
        
        // Dispose textures
        if (object.material && object.material.map) {
            object.material.map.dispose();
        }
    });
    
    // Clear the scene
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    
    console.log('Three.js cleanup completed');
}

// Audio context cleanup
export function cleanupAudioContext(context, analyser = null) {
    if (!context) return;
    
    console.log('Cleaning up audio context...');
    
    try {
        // Disconnect analyser if provided
        if (analyser) {
            analyser.disconnect();
        }
        
        // Close context if not already closed
        if (context.state !== 'closed') {
            context.close();
        }
        
        console.log('Audio context cleanup completed');
    } catch (error) {
        console.warn('Audio context cleanup error:', error);
    }
}

// Station list rendering optimization
export function optimizeStationListRendering() {
    // Implement virtual scrolling for large lists
    const stationList = document.getElementById('station-list');
    if (!stationList) return;
    
    // Add intersection observer for lazy loading
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Load station data when visible
                const stationElement = entry.target;
                if (stationElement.dataset.lazy === 'true') {
                    // Load station content
                    stationElement.dataset.lazy = 'false';
                }
            }
        });
    }, {
        rootMargin: '50px'
    });
    
    // Observe all station items
    document.querySelectorAll('.station-item[data-lazy="true"]').forEach(item => {
        observer.observe(item);
    });
    
    memoryManager.addObserver(observer);
}

// Initialize memory management
export function initMemoryManagement() {
    // Set up cleanup on page unload
    window.addEventListener('beforeunload', () => {
        memoryManager.cleanup();
    });
    
    // Set up cleanup on visibility change (mobile)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page is hidden, potential cleanup
            console.log('Page hidden, considering cleanup');
        }
    });
    
    // Start memory monitoring in development (less frequent logging)
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' || 
                         window.location.hostname === '';
    
    if (DEBUG_CONFIG.ENABLE_MEMORY_MONITORING || isDevelopment) {
        memoryManager.startMemoryMonitoring(DEBUG_CONFIG.MEMORY_MONITOR_INTERVAL);
    }
    
    // Filter out known deprecation warnings from external libraries
    if (DEBUG_CONFIG.SUPPRESS_EXTERNAL_WARNINGS) {
        suppressKnownWarnings();
    }
    
    console.log('Memory management initialized');
}

// Suppress known deprecation warnings from external libraries
function suppressKnownWarnings() {
    // Store original console.warn
    const originalWarn = console.warn;
    
    // Override console.warn to filter out known warnings
    console.warn = function(...args) {
        const message = args.join(' ');
        
        // Filter out ScriptProcessorNode deprecation warnings from IcecastMetadataPlayer
        if (message.includes('ScriptProcessorNode is deprecated') || 
            message.includes('AudioWorkletNode instead')) {
            // Only show this warning once every 10 minutes to avoid spam
            if (!window._scriptProcessorWarningShown || 
                Date.now() - window._scriptProcessorWarningShown > 600000) {
                originalWarn.call(console, '🔇 Note: Audio library uses deprecated API (does not affect functionality)');
                window._scriptProcessorWarningShown = Date.now();
            }
            return;
        }
        
        // Allow all other warnings through
        originalWarn.apply(console, args);
    };
}
