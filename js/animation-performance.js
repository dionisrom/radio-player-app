// Animation Performance Optimization
import { performanceMonitor, getDeviceCapabilities } from './performance.js';
import { memoryManager } from './memory-manager.js';

class AnimationPerformanceManager {
    constructor() {
        this.lowBatteryMode = false;
        this.animationFrameCallbacks = new Map(); // Store callbacks with their IDs
        this.nextCallbackId = 1;
        this.isReducedMotionPreferred = this.checkReducedMotion();
        this.deviceCapabilities = getDeviceCapabilities();
        this.lastFrameTime = 0;
        this.targetFrameTime = 1000 / 60; // Default to 60fps
        this.frameDrops = 0;
        this.framesRendered = 0;
        this.activeAnimations = new Set();
        
        // Initialize
        this.setupEventListeners();
        this.detectBatteryStatus();
        
        // Expose global helper for animation frames
        window.recordFrame = () => performanceMonitor.recordFrame();
    }
    
    setupEventListeners() {
        // Listen for reduced motion preference changes
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        motionQuery.addEventListener('change', () => {
            this.isReducedMotionPreferred = this.checkReducedMotion();
            this.applyMotionPreferences();
        });
        
        // Listen for visibility changes to pause animations when tab is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseNonEssentialAnimations();
            } else {
                this.resumeAnimations();
            }
        });
        
        // Listen for resize events to optimize animations during resizing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            this.pauseNonEssentialAnimations();
            
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resumeAnimations();
            }, 200); // Debounce resize events
        });
        
        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanupAllAnimations();
        });
    }
    
    checkReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    
    applyMotionPreferences() {
        const bodyEl = document.body;
        
        if (this.isReducedMotionPreferred) {
            bodyEl.classList.add('reduced-motion');
            console.log('Applying reduced motion preferences');
        } else {
            bodyEl.classList.remove('reduced-motion');
        }
        
        // Notify any listeners
        this.notifyAnimationStateChange();
    }
    
    async detectBatteryStatus() {
        try {
            // Check if Battery API is supported
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery();
                
                const updateBatteryStatus = () => {
                    // Enable low power mode if battery level is below 20% and not charging
                    this.lowBatteryMode = battery.level < 0.2 && !battery.charging;
                    this.applyBatteryOptimizations();
                };
                
                // Initial check
                updateBatteryStatus();
                
                // Listen for battery changes
                battery.addEventListener('levelchange', updateBatteryStatus);
                battery.addEventListener('chargingchange', updateBatteryStatus);
                
                console.log('Battery monitoring initialized');
            }
        } catch (error) {
            console.warn('Battery API not supported:', error);
        }
    }
    
    applyBatteryOptimizations() {
        const bodyEl = document.body;
        
        if (this.lowBatteryMode) {
            bodyEl.classList.add('low-power');
            console.log('Low battery mode enabled, reducing animations');
            
            // Reduce animation frame rate
            this.targetFrameTime = 1000 / 30; // 30fps in low power mode
        } else {
            bodyEl.classList.remove('low-power');
            
            // Restore animation frame rate
            this.targetFrameTime = 1000 / 60; // 60fps in normal mode
        }
        
        // Notify any listeners
        this.notifyAnimationStateChange();
    }
    
    // Optimized requestAnimationFrame with throttling based on device capabilities
    optimizedAnimationFrame(callback) {
        const id = this.nextCallbackId++;
        this.animationFrameCallbacks.set(id, callback);
        
        const wrappedCallback = (timestamp) => {
            // Check if callback is still registered
            if (!this.animationFrameCallbacks.has(id)) return;
            
            // Throttle based on device capabilities and battery status
            const elapsed = timestamp - this.lastFrameTime;
            
            if (elapsed >= this.targetFrameTime || this.lastFrameTime === 0) {
                this.lastFrameTime = timestamp;
                this.framesRendered++;
                
                try {
                    // Record frame for performance monitoring
                    performanceMonitor.recordFrame();
                    
                    // Execute callback
                    callback(timestamp);
                } catch (error) {
                    console.error('Animation frame callback error:', error);
                    // Automatically clean up failed callbacks
                    this.animationFrameCallbacks.delete(id);
                }
            } else {
                this.frameDrops++;
            }
            
            // Schedule next frame if still registered
            if (this.animationFrameCallbacks.has(id)) {
                requestAnimationFrame(wrappedCallback);
            }
        };
        
        requestAnimationFrame(wrappedCallback);
        return id;
    }
    
    // Cancel optimized animation frame
    cancelOptimizedAnimationFrame(id) {
        this.animationFrameCallbacks.delete(id);
    }
    
    // Register an active animation for management
    registerAnimation(name, element, startFn, stopFn) {
        const animation = { name, element, startFn, stopFn, active: true };
        this.activeAnimations.add(animation);
        
        // Return control functions
        return {
            pause: () => this.pauseAnimation(animation),
            resume: () => this.resumeAnimation(animation),
            stop: () => {
                this.stopAnimation(animation);
                this.activeAnimations.delete(animation);
            }
        };
    }
    
    pauseAnimation(animation) {
        if (animation.active && animation.stopFn) {
            animation.stopFn();
            animation.active = false;
        }
    }
    
    resumeAnimation(animation) {
        if (!animation.active && animation.startFn) {
            animation.startFn();
            animation.active = true;
        }
    }
    
    stopAnimation(animation) {
        if (animation.stopFn) {
            animation.stopFn();
        }
        animation.active = false;
    }
    
    pauseNonEssentialAnimations() {
        console.log('Pausing non-essential animations');
        this.activeAnimations.forEach(animation => {
            // Check if this is a non-essential animation (can be customized)
            if (animation.name.includes('background') || animation.name.includes('decoration')) {
                this.pauseAnimation(animation);
            }
        });
    }
    
    resumeAnimations() {
        console.log('Resuming animations');
        this.activeAnimations.forEach(animation => {
            this.resumeAnimation(animation);
        });
    }
    
    cleanupAllAnimations() {
        console.log('Cleaning up all animations');
        this.activeAnimations.forEach(animation => {
            this.stopAnimation(animation);
        });
        this.activeAnimations.clear();
        this.animationFrameCallbacks.clear();
    }
    
    notifyAnimationStateChange() {
        // Create and dispatch custom event
        const event = new CustomEvent('animationStateChange', {
            detail: {
                reducedMotion: this.isReducedMotionPreferred,
                lowPower: this.lowBatteryMode
            }
        });
        document.dispatchEvent(event);
    }
    
    // Apply hardware acceleration to an element
    accelerateElement(element, options = {}) {
        if (!element) return;
        
        const { transform = true, opacity = false, contain = false } = options;
        
        if (transform && opacity) {
            element.classList.add('hw-accelerate-transform-opacity');
        } else if (transform) {
            element.classList.add('hw-accelerate-transform');
        } else if (opacity) {
            element.classList.add('hw-accelerate-opacity');
        }
        
        if (contain) {
            element.classList.add('contain-paint');
        }
        
        return element;
    }
    
    // Get animation performance metrics
    getAnimationMetrics() {
        return {
            framesRendered: this.framesRendered,
            frameDrops: this.frameDrops,
            frameDropPercentage: this.framesRendered > 0 ? 
                (this.frameDrops / (this.framesRendered + this.frameDrops) * 100).toFixed(1) + '%' : '0%',
            targetFrameRate: Math.round(1000 / this.targetFrameTime),
            lowPowerMode: this.lowBatteryMode,
            reducedMotion: this.isReducedMotionPreferred,
            activeAnimations: this.activeAnimations.size
        };
    }
}

// Create singleton instance
export const animationPerformance = new AnimationPerformanceManager();

// Export convenience methods
export function optimizedAnimationFrame(callback) {
    return animationPerformance.optimizedAnimationFrame(callback);
}

export function cancelOptimizedAnimationFrame(id) {
    animationPerformance.cancelOptimizedAnimationFrame(id);
}

export function registerAnimation(name, element, startFn, stopFn) {
    return animationPerformance.registerAnimation(name, element, startFn, stopFn);
}

export function accelerateElement(element, options) {
    return animationPerformance.accelerateElement(element, options);
}

export function getAnimationMetrics() {
    return animationPerformance.getAnimationMetrics();
}

// Apply hardware acceleration to key UI elements
export function optimizeUIAnimations() {
    // Optimize player controls
    document.querySelectorAll('.control-btn, #play-pause-btn, #mute-btn').forEach(el => {
        accelerateElement(el, { transform: true });
    });
    
    // Optimize station list
    const stationList = document.getElementById('radio-list');
    if (stationList) {
        accelerateElement(stationList, { contain: true });
        
        // Optimize individual station items
        stationList.querySelectorAll('.station-item').forEach(el => {
            accelerateElement(el, { transform: true, opacity: true });
        });
    }
    
    // Optimize visualizer
    const visualizer = document.getElementById('visualizer');
    if (visualizer) {
        accelerateElement(visualizer, { transform: true });
    }
    
    // Optimize track info
    const trackInfo = document.getElementById('track-info');
    if (trackInfo) {
        accelerateElement(trackInfo, { transform: true, opacity: true });
    }
    
    console.log('Applied hardware acceleration to UI elements');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Optimize UI animations once DOM is ready
    optimizeUIAnimations();
    
    // Register for cleanup
    memoryManager.register('animationPerformance', () => {
        animationPerformance.cleanupAllAnimations();
    });
});
