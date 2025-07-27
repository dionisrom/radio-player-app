// Modern 2D Canvas Audio Visualizer with enhanced bar styles and optimized performance
export class CanvasVisualizer {
    constructor(container) {
        this.container = container;
        this.canvas = null;
        this.offscreenCanvas = null; // For optimized rendering
        this.ctx = null;
        this.offscreenCtx = null;
        this.animationId = null;
        this.initialized = false;
        this.qualitySettings = null;
        this.barCount = 64; // Default bar count
        this.smoothingFactor = 0.8;
        this.previousBars = [];
        this.lastFrameTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.frameSkipThreshold = 1000 / 30; // Skip frames if we fall below 30fps
        this.gradients = {}; // Cache for gradients
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.isLowPowerDevice = this.detectLowPowerDevice();
    }

    detectLowPowerDevice() {
        // Simple detection based on screen size and device pixel ratio
        const isMobile = window.innerWidth <= 768;
        const isLowRes = this.devicePixelRatio < 2;
        const hasLimitedCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
        
        return isMobile && (isLowRes || hasLimitedCores);
    }

    init() {
        console.log('Initializing optimized Canvas visualizer...');
        try {
            // Main visible canvas
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.container.clientWidth * this.devicePixelRatio;
            this.canvas.height = this.container.clientHeight * this.devicePixelRatio;
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            
            // Add hardware acceleration hint
            this.canvas.style.willChange = 'transform';
            this.canvas.style.transform = 'translateZ(0)';
            
            console.log('Canvas size:', this.canvas.width, 'x', this.canvas.height);
            
            // Create offscreen canvas for complex rendering to reduce main thread work
            this.offscreenCanvas = document.createElement('canvas');
            this.offscreenCanvas.width = this.canvas.width;
            this.offscreenCanvas.height = this.canvas.height;
            
            this.ctx = this.canvas.getContext('2d', { alpha: true, desynchronized: true });
            this.offscreenCtx = this.offscreenCanvas.getContext('2d', { alpha: true });
            
            if (!this.ctx || !this.offscreenCtx) {
                throw new Error('Canvas 2D context not available');
            }

            // Scale contexts for high DPI displays
            this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
            this.offscreenCtx.scale(this.devicePixelRatio, this.devicePixelRatio);
            
            this.container.innerHTML = '';
            this.container.appendChild(this.canvas);
            
            // Pre-allocate buffers
            this.previousBars = new Array(this.barCount).fill(0);
            
            // Pre-create gradients for different visualization types
            this.createGradients();
            
            this.initialized = true;
            this.lastFrameTime = performance.now();
            console.log('Modern Canvas visualizer initialized successfully');
            console.log('Low power device detection:', this.isLowPowerDevice ? 'Yes' : 'No');
            return true;
        } catch (error) {
            console.error('Canvas visualizer initialization failed:', error);
            return false;
        }
    }
    
    createGradients() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        // Bar visualization gradient
        const barGradient = this.offscreenCtx.createLinearGradient(0, height, 0, 0);
        barGradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)');    // Indigo base
        barGradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.9)');  // Purple mid
        barGradient.addColorStop(0.6, 'rgba(168, 85, 247, 0.9)');  // Purple high
        barGradient.addColorStop(1, 'rgba(236, 72, 153, 1.0)');    // Pink top
        
        this.gradients.bars = barGradient;
        
        // Wave visualization gradient
        const waveGradient = this.offscreenCtx.createLinearGradient(0, height/2 - 50, 0, height/2 + 50);
        waveGradient.addColorStop(0, 'rgba(99, 102, 241, 0.9)');
        waveGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.9)');
        waveGradient.addColorStop(1, 'rgba(99, 102, 241, 0.9)');
        
        this.gradients.wave = waveGradient;
    }

    updateQualitySettings(qualitySettings) {
        this.qualitySettings = qualitySettings;
        
        // Adjust bar count based on quality
        if (qualitySettings.name === 'High Quality') {
            this.barCount = 128;
        } else if (qualitySettings.name === 'Medium Quality') {
            this.barCount = 64;
        } else {
            this.barCount = 32;
        }
        
        // Resize smoothing array if needed
        if (this.previousBars.length !== this.barCount) {
            this.previousBars = new Array(this.barCount).fill(0);
        }
        
        console.log('Canvas visualizer quality updated:', qualitySettings.name, 'Bar count:', this.barCount);
    }

    animate(analyser, vizType, isPlaying) {
        if (!this.initialized || !analyser) {
            return;
        }

        // Time-based animation with frame skipping for performance
        const now = performance.now();
        const elapsed = now - this.lastFrameTime;
        
        // Skip frame if we're below performance threshold on low-power devices
        if (this.isLowPowerDevice && elapsed < this.frameInterval) {
            return;
        }
        
        // Skip frames if we're severely below frame rate target
        if (elapsed < this.frameInterval * 0.5) {
            return;
        }
        
        // Use frame dropping if we're way behind
        let framesDropped = 0;
        if (elapsed > this.frameSkipThreshold) {
            framesDropped = Math.floor(elapsed / this.frameInterval) - 1;
            if (framesDropped > 0) {
                console.debug(`Dropped ${framesDropped} animation frames to catch up`);
            }
        }
        
        this.lastFrameTime = now;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        // Clear offscreen canvas - more efficient than clearing main canvas repeatedly
        this.offscreenCtx.clearRect(0, 0, width, height);
        
        // Apply trailing effect with optimized transparency
        if (!this.isLowPowerDevice) {
            // Higher quality trailing effect on capable devices
            this.offscreenCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.offscreenCtx.fillRect(0, 0, width, height);
        }

        if (!isPlaying) {
            this.drawStaticPattern(width, height);
            // Copy to main canvas
            this.ctx.clearRect(0, 0, width, height);
            this.ctx.drawImage(this.offscreenCanvas, 0, 0);
            return;
        }

        // Adaptively reduce quality based on frames dropped
        const adaptiveVizType = this.isLowPowerDevice && framesDropped > 2 ? 'bars' : vizType;

        switch (adaptiveVizType) {
            case 'bars':
                this.drawModernBars(analyser, width, height);
                break;
            case 'wave':
                this.drawSmoothWave(analyser, width, height);
                break;
            case 'circle':
                this.drawPulseCircle(analyser, width, height);
                break;
            default:
                this.drawModernBars(analyser, width, height);
        }
        
        // Copy from offscreen to main canvas - single draw operation is most efficient
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }

    drawModernBars(analyser, width, height) {
        // Set FFT size based on quality - lower for mobile devices
        const fftSize = this.isLowPowerDevice 
            ? Math.min(this.qualitySettings?.fftSizes?.bars || 512, 256) // Cap at 256 for low power devices
            : this.qualitySettings?.fftSizes?.bars || 512;
            
        analyser.fftSize = fftSize;
        const bufferLength = analyser.frequencyBinCount;
        
        // Reuse array buffer instead of creating a new one each frame
        if (!this.freqDataArray || this.freqDataArray.length !== bufferLength) {
            this.freqDataArray = new Uint8Array(bufferLength);
        }
        
        analyser.getByteFrequencyData(this.freqDataArray);

        // Adaptive bar count based on device capabilities
        const effectiveBarCount = this.isLowPowerDevice ? Math.min(this.barCount, 32) : this.barCount;
        const barWidth = (width - (effectiveBarCount - 1) * 2) / effectiveBarCount; // 2px gap between bars
        const maxBarHeight = height * 0.85;

        // Use the cached gradient
        const gradient = this.gradients.bars;
        this.offscreenCtx.fillStyle = gradient;

        // Draw bars in batches - reduces the number of state changes
        for (let i = 0; i < effectiveBarCount; i++) {
            // Map bar index to frequency data - optimized to use fewer calculations
            const dataIndex = Math.floor((i * bufferLength) / effectiveBarCount);
            const rawHeight = this.freqDataArray[dataIndex] / 255;
            
            // Apply smoothing - optimized calculation
            const smoothedHeight = this.previousBars[i] * this.smoothingFactor + rawHeight * (1 - this.smoothingFactor);
            this.previousBars[i] = smoothedHeight; // Update for next frame
            
            const barHeight = smoothedHeight * maxBarHeight;
            const x = i * (barWidth + 2);
            const y = height - barHeight;
            
            // Draw optimized rounded bars - direct path drawing instead of helper function
            this.offscreenCtx.beginPath();
            
            // Only round the top corners - improves performance
            const radius = this.isLowPowerDevice ? 0 : barWidth * 0.2;
            
            if (radius > 0) {
                // Optimized rounded rect - only rounds top corners for performance
                this.offscreenCtx.moveTo(x, y + barHeight);
                this.offscreenCtx.lineTo(x, y + radius);
                this.offscreenCtx.quadraticCurveTo(x, y, x + radius, y);
                this.offscreenCtx.lineTo(x + barWidth - radius, y);
                this.offscreenCtx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
                this.offscreenCtx.lineTo(x + barWidth, y + barHeight);
            } else {
                // Simplified rectangle for low power devices
                this.offscreenCtx.rect(x, y, barWidth, barHeight);
            }
            
            this.offscreenCtx.fill();
            
            // Add glow effect only for high-end devices
            if (!this.isLowPowerDevice && barHeight > maxBarHeight * 0.5) {
                // Apply glow with a single shadow effect per batch
                if (i % 8 === 0) { // Only add shadows periodically to improve performance
                    this.offscreenCtx.shadowColor = 'rgba(99, 102, 241, 0.6)';
                    this.offscreenCtx.shadowBlur = 10;
                } else {
                    this.offscreenCtx.shadowBlur = 0;
                }
                
                this.offscreenCtx.fill();
                this.offscreenCtx.shadowBlur = 0;
            }
        }
    }

    drawSmoothWave(analyser, width, height) {
        // Adaptive FFT size based on device capabilities
        const fftSize = this.isLowPowerDevice 
            ? Math.min(this.qualitySettings?.fftSizes?.wave || 2048, 1024) // Lower for mobile
            : this.qualitySettings?.fftSizes?.wave || 2048;
            
        analyser.fftSize = fftSize;
        const bufferLength = analyser.frequencyBinCount;
        
        // Reuse array buffer instead of creating a new one each frame
        if (!this.timeDataArray || this.timeDataArray.length !== bufferLength) {
            this.timeDataArray = new Uint8Array(bufferLength);
        }
        
        analyser.getByteTimeDomainData(this.timeDataArray);

        // Performance optimization: Calculate points to skip based on device capability
        const pointsToSkip = this.isLowPowerDevice ? 6 : 3;
        
        // Use gradient from cache
        this.offscreenCtx.lineWidth = this.isLowPowerDevice ? 2 : 3;
        this.offscreenCtx.strokeStyle = this.gradients.wave || 'rgba(99, 102, 241, 0.9)';
        
        // Only add shadow effects on capable devices
        if (!this.isLowPowerDevice) {
            this.offscreenCtx.shadowColor = 'rgba(99, 102, 241, 0.5)';
            this.offscreenCtx.shadowBlur = 5;
        }
        
        this.offscreenCtx.beginPath();

        const sliceWidth = width / (bufferLength / pointsToSkip);
        let x = 0;

        // Optimized path generation with fewer points for better performance
        this.offscreenCtx.moveTo(0, height / 2);
        
        let lastY = height / 2;
        
        for (let i = 0; i < bufferLength; i += pointsToSkip) {
            const v = this.timeDataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
                this.offscreenCtx.moveTo(x, y);
                lastY = y;
            } else {
                // Use quadratic curves only when needed - reduces path complexity
                if (Math.abs(y - lastY) > 5) {
                    const nextX = x + sliceWidth;
                    this.offscreenCtx.quadraticCurveTo(x, y, nextX, y);
                } else {
                    // Simple line for smaller changes - better performance
                    this.offscreenCtx.lineTo(x, y);
                }
                lastY = y;
            }

            x += sliceWidth;
            
            // Early exit if we've gone beyond the canvas width
            if (x > width) break;
        }

        this.offscreenCtx.stroke();
        this.offscreenCtx.shadowBlur = 0;

        // Only add frequency bars overlay on high-end devices
        if (!this.isLowPowerDevice) {
            this.offscreenCtx.globalAlpha = 0.3;
            // Skip the bars overlay on mobile devices to improve performance
            this.drawModernBars(analyser, width, height);
            this.offscreenCtx.globalAlpha = 1.0;
        }
    }

    drawPulseCircle(analyser, width, height) {
        // Adaptive settings for low power devices
        const fftSize = this.isLowPowerDevice 
            ? 128 // Smaller FFT for mobile
            : this.qualitySettings?.fftSizes?.circle || 256;
            
        analyser.fftSize = fftSize;
        const bufferLength = analyser.frequencyBinCount;
        
        // Reuse array buffer for frequency data
        if (!this.circleDataArray || this.circleDataArray.length !== bufferLength) {
            this.circleDataArray = new Uint8Array(bufferLength);
        }
        
        analyser.getByteFrequencyData(this.circleDataArray);

        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.15;
        
        // Optimized average frequency calculation - sample only part of the array for performance
        let avgFrequency = 0;
        const sampleStep = this.isLowPowerDevice ? 4 : 1;
        let sampleCount = 0;
        
        for (let i = 0; i < bufferLength; i += sampleStep) {
            avgFrequency += this.circleDataArray[i];
            sampleCount++;
        }
        
        avgFrequency /= sampleCount;
        
        const pulseRadius = baseRadius + (avgFrequency / 255) * baseRadius * 1.5;

        // Draw optimized concentric circles - fewer rings on mobile
        const ringCount = this.isLowPowerDevice ? 2 : 3;
        
        // Cache for gradients to avoid recreation
        if (!this.circleGradients) {
            this.circleGradients = [];
        }
        
        for (let ring = 0; ring < ringCount; ring++) {
            const radius = pulseRadius * (1 + ring * 0.3);
            const alpha = 0.6 - ring * 0.15;
            
            // Use cached gradient if possible or create a new one
            let gradient;
            
            if (this.circleGradients[ring]) {
                gradient = this.circleGradients[ring];
                // Update gradient radius
                gradient = this.offscreenCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
                gradient.addColorStop(0, `rgba(99, 102, 241, ${alpha})`);
                gradient.addColorStop(0.7, `rgba(139, 92, 246, ${alpha * 0.5})`);
                gradient.addColorStop(1, `rgba(99, 102, 241, 0)`);
                this.circleGradients[ring] = gradient;
            } else {
                gradient = this.offscreenCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
                gradient.addColorStop(0, `rgba(99, 102, 241, ${alpha})`);
                gradient.addColorStop(0.7, `rgba(139, 92, 246, ${alpha * 0.5})`);
                gradient.addColorStop(1, `rgba(99, 102, 241, 0)`);
                this.circleGradients[ring] = gradient;
            }

            this.offscreenCtx.beginPath();
            this.offscreenCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            this.offscreenCtx.fillStyle = gradient;
            this.offscreenCtx.fill();
        }

        // Draw frequency bars in circular arrangement - fewer bars on mobile
        const effectiveBarCount = this.isLowPowerDevice ? 
            Math.min(this.barCount, 24) : // Fewer bars for mobile
            this.barCount;
            
        const angleStep = (2 * Math.PI) / effectiveBarCount;
        
        // Batch similar colors to reduce state changes
        let currentHue = -1;
        
        this.offscreenCtx.lineWidth = this.isLowPowerDevice ? 1 : 2;
        
        // Begin path once for all bars with similar colors
        this.offscreenCtx.beginPath();
        
        for (let i = 0; i < effectiveBarCount; i++) {
            // Sample frequency data with optimized index calculation
            const dataIndex = Math.floor((i * bufferLength) / effectiveBarCount);
            const value = this.circleDataArray[dataIndex] / 255;
            
            // Apply smoothing for the radial bars
            if (!this.radialBars) this.radialBars = new Array(effectiveBarCount).fill(0);
            const smoothedValue = this.radialBars[i] * 0.7 + value * 0.3;
            this.radialBars[i] = smoothedValue;
            
            const barHeight = smoothedValue * baseRadius * 1.2;
            const angle = i * angleStep;
            
            const innerRadius = pulseRadius + 10;
            const outerRadius = innerRadius + barHeight;
            
            // Calculate bar positions
            const x1 = centerX + Math.cos(angle) * innerRadius;
            const y1 = centerY + Math.sin(angle) * innerRadius;
            const x2 = centerX + Math.cos(angle) * outerRadius;
            const y2 = centerY + Math.sin(angle) * outerRadius;
            
            // Optimize by batching bars with similar colors
            const hue = Math.floor((240 + (barHeight / baseRadius) * 60) / 10) * 10;
            
            if (currentHue !== hue) {
                // If color changed, stroke the current path and start a new one
                if (currentHue !== -1) {
                    this.offscreenCtx.stroke();
                    this.offscreenCtx.beginPath();
                }
                this.offscreenCtx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
                currentHue = hue;
            }
            
            // Draw radial bar
            this.offscreenCtx.moveTo(x1, y1);
            this.offscreenCtx.lineTo(x2, y2);
            
            // Every few bars, stroke to avoid too long paths
            if (i % 8 === 7) {
                this.offscreenCtx.stroke();
                this.offscreenCtx.beginPath();
            }
        }
        
        // Stroke any remaining path
        this.offscreenCtx.stroke();
    }

    // Optimized rounded rect that avoids unnecessary path operations
    drawRoundedRect(x, y, width, height, radius) {
        if (radius <= 0 || this.isLowPowerDevice) {
            // Use simpler rectangle for better performance on low power devices
            this.offscreenCtx.fillRect(x, y, width, height);
            return;
        }
        
        // Only create complex path when needed
        this.offscreenCtx.beginPath();
        this.offscreenCtx.moveTo(x + radius, y);
        this.offscreenCtx.lineTo(x + width - radius, y);
        this.offscreenCtx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.offscreenCtx.lineTo(x + width, y + height);
        this.offscreenCtx.lineTo(x + radius, y + height);
        this.offscreenCtx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.offscreenCtx.lineTo(x, y + radius);
        this.offscreenCtx.quadraticCurveTo(x, y, x + radius, y);
        this.offscreenCtx.closePath();
        this.offscreenCtx.fill();
    }

    drawStaticPattern(width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.12;

        // Calculate time only once per frame
        if (!this.lastPulseTime) this.lastPulseTime = Date.now() * 0.001;
        
        // Use a slower time increment for mobile to reduce calculations
        const timeDelta = this.isLowPowerDevice ? 0.01 : 0.016; // Approx 60fps
        this.lastPulseTime += timeDelta;
        const time = this.lastPulseTime;
        
        // More efficient math for pulse calculation
        const pulse = 0.2 * Math.sin(time) + 1;

        // Cache gradient - only recreate when needed
        if (!this.staticGradient || this.lastStaticRadius !== baseRadius * pulse) {
            this.staticGradient = this.offscreenCtx.createRadialGradient(
                centerX, centerY, 0, 
                centerX, centerY, baseRadius * pulse
            );
            this.staticGradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
            this.staticGradient.addColorStop(1, 'rgba(99, 102, 241, 0.1)');
            this.lastStaticRadius = baseRadius * pulse;
        }

        // Draw main circle
        this.offscreenCtx.beginPath();
        this.offscreenCtx.arc(centerX, centerY, baseRadius * pulse, 0, 2 * Math.PI);
        this.offscreenCtx.fillStyle = this.staticGradient;
        this.offscreenCtx.fill();

        // Draw fewer outer rings on mobile
        const ringCount = this.isLowPowerDevice ? 1 : 2;
        
        // Batch draw outer rings to reduce state changes
        this.offscreenCtx.lineWidth = 1;
        
        for (let i = 1; i <= ringCount; i++) {
            this.offscreenCtx.beginPath();
            this.offscreenCtx.arc(
                centerX, centerY, 
                baseRadius * (1.2 + i * 0.4) * pulse, 
                0, 2 * Math.PI
            );
            this.offscreenCtx.strokeStyle = `rgba(148, 163, 184, ${0.3 / i / pulse})`;
            this.offscreenCtx.stroke();
        }

        // Draw static bars around the circle - fewer on mobile
        const barCount = this.isLowPowerDevice ? 8 : 16;
        const angleStep = (2 * Math.PI) / barCount;
        
        // Batch similar color bars to reduce state changes
        this.offscreenCtx.lineWidth = this.isLowPowerDevice ? 1 : 2;
        this.offscreenCtx.beginPath();
        
        let lastAlpha = -1;
        
        for (let i = 0; i < barCount; i++) {
            const angle = i * angleStep + time * 0.5;
            // Simplify sin calculation by pre-computing angle
            const sinVal = (i % 2 === 0) ? Math.sin(time) : Math.cos(time);
            const barLength = 15 + sinVal * 5;
            
            const innerRadius = baseRadius * 1.8;
            const outerRadius = innerRadius + barLength;
            
            const x1 = centerX + Math.cos(angle) * innerRadius;
            const y1 = centerY + Math.sin(angle) * innerRadius;
            const x2 = centerX + Math.cos(angle) * outerRadius;
            const y2 = centerY + Math.sin(angle) * outerRadius;
            
            // Group similar colors to reduce state changes
            const alpha = Math.floor((0.3 + sinVal * 0.2) * 10) / 10;
            
            if (lastAlpha !== alpha) {
                if (lastAlpha !== -1) {
                    this.offscreenCtx.stroke();
                    this.offscreenCtx.beginPath();
                }
                this.offscreenCtx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
                lastAlpha = alpha;
            }
            
            this.offscreenCtx.moveTo(x1, y1);
            this.offscreenCtx.lineTo(x2, y2);
            
            // Batch stroke to reduce draw calls
            if (i % 4 === 3) {
                this.offscreenCtx.stroke();
                this.offscreenCtx.beginPath();
            }
        }
        
        // Stroke any remaining path
        this.offscreenCtx.stroke();
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Clean up DOM elements
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
        }
        
        // Release references to free memory
        this.offscreenCanvas = null;
        this.ctx = null;
        this.offscreenCtx = null;
        
        // Clear cached data to free memory
        this.freqDataArray = null;
        this.timeDataArray = null;
        this.circleDataArray = null;
        this.previousBars = null;
        this.radialBars = null;
        this.gradients = {};
        this.circleGradients = null;
        this.staticGradient = null;
        
        this.initialized = false;
        console.log('Canvas visualizer destroyed and resources freed');
    }

    resize() {
        if (!this.canvas || !this.container) return;
        
        // Get the new dimensions
        const newWidth = this.container.clientWidth;
        const newHeight = this.container.clientHeight;
        
        // Update device pixel ratio in case of window changes
        this.devicePixelRatio = window.devicePixelRatio || 1;
        
        // Update canvas dimensions
        this.canvas.width = newWidth * this.devicePixelRatio;
        this.canvas.height = newHeight * this.devicePixelRatio;
        
        // Update offscreen canvas dimensions
        if (this.offscreenCanvas) {
            this.offscreenCanvas.width = this.canvas.width;
            this.offscreenCanvas.height = this.canvas.height;
        }
        
        // Reset scale transforms
        if (this.ctx) {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
            this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
        }
        
        if (this.offscreenCtx) {
            this.offscreenCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
            this.offscreenCtx.scale(this.devicePixelRatio, this.devicePixelRatio);
        }
        
        // Recreate gradients since they depend on canvas dimensions
        this.createGradients();
        
        // Clear cached items that depend on dimensions
        this.staticGradient = null;
        this.circleGradients = null;
        
        console.log('Visualizer resized to', newWidth, 'x', newHeight);
    }
}
