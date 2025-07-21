// Performance monitoring and optimization
import { APP_CONFIG } from './config.js';
import { saveToStorage, loadFromStorage } from './storage.js';

class PerformanceMonitor {
    constructor() {
        this.enabled = APP_CONFIG.PERFORMANCE.MONITORING.ENABLED;
        this.fpsHistory = [];
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.currentFPS = 0;
        this.memoryUsage = { used: 0, total: 0 };
        this.lastMemoryCheck = 0;
        this.qualityAdjustmentCooldown = 0;
        
        // Quality settings
        this.currentQuality = loadFromStorage('visualizer-quality') || APP_CONFIG.VISUALIZER.DEFAULT_QUALITY;
        this.autoQualityEnabled = true;
        this.qualityChangeCallbacks = [];
        
        // Device capabilities
        this.deviceCapabilities = this.detectDeviceCapabilities();
        
        // Auto-quality state
        this.benchmarkStartTime = 0;
        this.benchmarkActive = false;
        this.initialBenchmarkComplete = false;
        
        if (this.enabled) {
            this.startMonitoring();
        }
    }

    detectDeviceCapabilities() {
        const capabilities = {
            isMobile: window.innerWidth <= APP_CONFIG.PERFORMANCE.DEVICE_DETECTION.MOBILE_THRESHOLD,
            isTouch: 'ontouchstart' in window,
            webGLVersion: this.getWebGLVersion(),
            estimatedMemory: this.estimateDeviceMemory(),
            hardwareConcurrency: navigator.hardwareConcurrency || 4,
            connectionSpeed: this.getConnectionSpeed()
        };

        console.log('Device capabilities detected:', capabilities);
        return capabilities;
    }

    getWebGLVersion() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2');
            if (gl) return 2;
            
            const gl1 = canvas.getContext('webgl');
            if (gl1) return 1;
            
            return 0;
        } catch (e) {
            return 0;
        }
    }

    estimateDeviceMemory() {
        // Use navigator.deviceMemory if available (Chrome)
        if (navigator.deviceMemory) {
            return navigator.deviceMemory * 1024; // Convert GB to MB
        }
        
        // Fallback estimation based on device type
        if (this.deviceCapabilities?.isMobile) {
            return 2048; // Assume 2GB for mobile
        }
        
        return 4096; // Assume 4GB for desktop
    }

    getConnectionSpeed() {
        // Use navigator.connection if available
        if (navigator.connection) {
            return navigator.connection.effectiveType || 'unknown';
        }
        return 'unknown';
    }

    startMonitoring() {
        this.monitoringInterval = setInterval(() => {
            this.checkMemoryUsage();
            this.evaluateQualityAdjustment();
        }, APP_CONFIG.PERFORMANCE.MONITORING.MEMORY_CHECK_INTERVAL);
    }

    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
    }

    // Called on each animation frame
    recordFrame() {
        if (!this.enabled) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        
        if (deltaTime > 0) {
            const fps = 1000 / deltaTime;
            this.fpsHistory.push(fps);
            
            // Keep only recent samples
            if (this.fpsHistory.length > APP_CONFIG.PERFORMANCE.MONITORING.FPS_SAMPLE_SIZE) {
                this.fpsHistory.shift();
            }
            
            // Calculate average FPS
            this.currentFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        }
        
        this.lastFrameTime = currentTime;
        this.frameCount++;
        
        // Handle initial benchmark
        if (this.benchmarkActive && !this.initialBenchmarkComplete) {
            if (currentTime - this.benchmarkStartTime > APP_CONFIG.PERFORMANCE.AUTO_QUALITY.INITIAL_BENCHMARK_DURATION) {
                this.completeBenchmark();
            }
        }
    }

    startBenchmark() {
        if (this.currentQuality === 'auto') {
            this.benchmarkActive = true;
            this.benchmarkStartTime = performance.now();
            this.fpsHistory = []; // Clear history for clean benchmark
            console.log('Starting performance benchmark...');
        }
    }

    completeBenchmark() {
        this.benchmarkActive = false;
        this.initialBenchmarkComplete = true;
        
        const recommendedQuality = this.determineOptimalQuality();
        console.log(`Benchmark complete. Average FPS: ${this.currentFPS.toFixed(1)}, Recommended quality: ${recommendedQuality}`);
        
        if (this.currentQuality === 'auto') {
            this.setQuality(recommendedQuality, 'auto-detected');
        }
    }

    determineOptimalQuality() {
        const avgFPS = this.currentFPS;
        const { isMobile, webGLVersion, estimatedMemory } = this.deviceCapabilities;
        
        // Base decision on FPS and device capabilities
        if (avgFPS >= 50 && webGLVersion >= 2 && estimatedMemory >= 4096 && !isMobile) {
            return 'high';
        } else if (avgFPS >= 30 && webGLVersion >= 1 && estimatedMemory >= 2048) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    checkMemoryUsage() {
        const now = performance.now();
        if (now - this.lastMemoryCheck < APP_CONFIG.PERFORMANCE.MONITORING.MEMORY_CHECK_INTERVAL) {
            return;
        }

        // Use performance.memory if available (Chrome)
        if (performance.memory) {
            this.memoryUsage = {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
                total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
            };
        }
        
        this.lastMemoryCheck = now;
    }

    evaluateQualityAdjustment() {
        if (!this.autoQualityEnabled || this.currentQuality !== 'auto' || !this.initialBenchmarkComplete) {
            return;
        }

        const now = performance.now();
        if (now - this.qualityAdjustmentCooldown < APP_CONFIG.PERFORMANCE.AUTO_QUALITY.ADJUSTMENT_COOLDOWN) {
            return;
        }

        const currentFPS = this.currentFPS;
        const currentQualityLevel = this.getCurrentQualityLevel();
        
        // Check if we should reduce quality
        if (currentFPS < APP_CONFIG.PERFORMANCE.MONITORING.QUALITY_ADJUST_THRESHOLD) {
            if (currentQualityLevel === 'high') {
                this.setQuality('medium', 'auto-reduced');
            } else if (currentQualityLevel === 'medium') {
                this.setQuality('low', 'auto-reduced');
            }
        }
        // Check if we can increase quality
        else if (currentFPS > APP_CONFIG.PERFORMANCE.MONITORING.QUALITY_UPGRADE_THRESHOLD) {
            if (currentQualityLevel === 'low') {
                this.setQuality('medium', 'auto-increased');
            } else if (currentQualityLevel === 'medium') {
                this.setQuality('high', 'auto-increased');
            }
        }
    }

    setQuality(quality, reason = 'manual') {
        const oldQuality = this.currentQuality;
        this.currentQuality = quality;
        
        // Save to storage unless it's auto
        if (quality !== 'auto') {
            saveToStorage('visualizer-quality', quality);
        }
        
        console.log(`Quality changed from ${oldQuality} to ${quality} (${reason})`);
        
        // Notify callbacks
        this.qualityChangeCallbacks.forEach(callback => {
            try {
                callback(quality, reason, this.getQualitySettings(quality));
            } catch (error) {
                console.error('Error in quality change callback:', error);
            }
        });
        
        this.qualityAdjustmentCooldown = performance.now();
    }

    getCurrentQualityLevel() {
        if (this.currentQuality === 'auto') {
            return this.determineOptimalQuality();
        }
        return this.currentQuality;
    }

    getQualitySettings(quality = null) {
        const qualityLevel = quality || this.getCurrentQualityLevel();
        return APP_CONFIG.VISUALIZER.QUALITY_LEVELS[qualityLevel] || APP_CONFIG.VISUALIZER.QUALITY_LEVELS.medium;
    }

    onQualityChange(callback) {
        this.qualityChangeCallbacks.push(callback);
    }

    getPerformanceStats() {
        return {
            fps: Math.round(this.currentFPS * 10) / 10,
            memory: this.memoryUsage,
            quality: this.currentQuality,
            qualityLevel: this.getCurrentQualityLevel(),
            frameCount: this.frameCount,
            deviceCapabilities: this.deviceCapabilities,
            benchmarkComplete: this.initialBenchmarkComplete
        };
    }

    enableAutoQuality() {
        this.autoQualityEnabled = true;
        if (!this.initialBenchmarkComplete) {
            this.startBenchmark();
        }
    }

    disableAutoQuality() {
        this.autoQualityEnabled = false;
        this.benchmarkActive = false;
    }
}

// Create global instance
export const performanceMonitor = new PerformanceMonitor();

// Export convenience functions
export function getCurrentQuality() {
    return performanceMonitor.getCurrentQualityLevel();
}

export function getQualitySettings(quality = null) {
    return performanceMonitor.getQualitySettings(quality);
}

export function setQuality(quality) {
    performanceMonitor.setQuality(quality);
}

export function recordFrame() {
    performanceMonitor.recordFrame();
}

export function getPerformanceStats() {
    return performanceMonitor.getPerformanceStats();
}

export function onQualityChange(callback) {
    performanceMonitor.onQualityChange(callback);
}

export function startPerformanceBenchmark() {
    performanceMonitor.startBenchmark();
}

export function startPerformanceMonitoring() {
    performanceMonitor.startBenchmark();
    return performanceMonitor;
}

export function getDeviceCapabilities() {
    return performanceMonitor.deviceCapabilities;
}
