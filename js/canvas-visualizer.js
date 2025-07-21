// Modern 2D Canvas Audio Visualizer with enhanced bar styles
export class CanvasVisualizer {
    constructor(container) {
        this.container = container;
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.initialized = false;
        this.qualitySettings = null;
        this.barCount = 64; // Default bar count
        this.smoothingFactor = 0.8;
        this.previousBars = [];
    }

    init() {
        console.log('Initializing modern Canvas visualizer...');
        try {
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.container.clientWidth * (window.devicePixelRatio || 1);
            this.canvas.height = this.container.clientHeight * (window.devicePixelRatio || 1);
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            
            console.log('Canvas size:', this.canvas.width, 'x', this.canvas.height);
            
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                throw new Error('Canvas 2D context not available');
            }

            // Scale context for high DPI displays
            this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
            
            this.container.innerHTML = '';
            this.container.appendChild(this.canvas);
            
            // Initialize smoothing arrays
            this.previousBars = new Array(this.barCount).fill(0);
            
            this.initialized = true;
            console.log('Modern Canvas visualizer initialized successfully');
            return true;
        } catch (error) {
            console.error('Canvas visualizer initialization failed:', error);
            return false;
        }
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

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        // Clear canvas with slight transparency for trailing effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, width, height);

        if (!isPlaying) {
            this.drawStaticPattern(width, height);
            return;
        }

        switch (vizType) {
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
    }

    drawModernBars(analyser, width, height) {
        // Set FFT size based on quality
        analyser.fftSize = this.qualitySettings?.fftSizes?.bars || 512;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (width - (this.barCount - 1) * 2) / this.barCount; // 2px gap between bars
        const maxBarHeight = height * 0.85;

        // Create gradient for bars
        const gradient = this.ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)');    // Indigo base
        gradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.9)');  // Purple mid
        gradient.addColorStop(0.6, 'rgba(168, 85, 247, 0.9)');  // Purple high
        gradient.addColorStop(1, 'rgba(236, 72, 153, 1.0)');    // Pink top

        for (let i = 0; i < this.barCount; i++) {
            // Map bar index to frequency data
            const dataIndex = Math.floor((i / this.barCount) * bufferLength);
            let barHeight = (dataArray[dataIndex] / 255) * maxBarHeight;
            
            // Apply smoothing
            barHeight = this.previousBars[i] * this.smoothingFactor + barHeight * (1 - this.smoothingFactor);
            this.previousBars[i] = barHeight;
            
            const x = i * (barWidth + 2);
            const y = height - barHeight;
            
            // Draw bar with rounded corners
            this.ctx.fillStyle = gradient;
            this.drawRoundedRect(x, y, barWidth, barHeight, barWidth * 0.2);
            
            // Add glow effect for higher bars
            if (barHeight > maxBarHeight * 0.5) {
                this.ctx.shadowColor = 'rgba(99, 102, 241, 0.6)';
                this.ctx.shadowBlur = 10;
                this.drawRoundedRect(x, y, barWidth, barHeight, barWidth * 0.2);
                this.ctx.shadowBlur = 0;
            }
        }
    }

    drawSmoothWave(analyser, width, height) {
        analyser.fftSize = this.qualitySettings?.fftSizes?.wave || 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.9)';
        this.ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
        this.ctx.shadowBlur = 5;
        this.ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        // Create smoother curve
        this.ctx.moveTo(0, height / 2);
        
        for (let i = 0; i < bufferLength; i += 3) { // Skip some points for smoother curve
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                // Use quadratic curves for smoother lines
                const nextX = x + sliceWidth * 3;
                this.ctx.quadraticCurveTo(x, y, nextX, y);
            }

            x += sliceWidth * 3;
        }

        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // Add frequency bars overlay for more detail
        this.ctx.globalAlpha = 0.3;
        this.drawModernBars(analyser, width, height);
        this.ctx.globalAlpha = 1.0;
    }

    drawPulseCircle(analyser, width, height) {
        analyser.fftSize = this.qualitySettings?.fftSizes?.circle || 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.15;
        
        // Calculate average frequency for pulse effect
        const avgFrequency = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        const pulseRadius = baseRadius + (avgFrequency / 255) * baseRadius * 1.5;

        // Draw multiple concentric circles
        for (let ring = 0; ring < 3; ring++) {
            const radius = pulseRadius * (1 + ring * 0.3);
            const alpha = 0.6 - ring * 0.15;
            
            // Create radial gradient
            const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            gradient.addColorStop(0, `rgba(99, 102, 241, ${alpha})`);
            gradient.addColorStop(0.7, `rgba(139, 92, 246, ${alpha * 0.5})`);
            gradient.addColorStop(1, `rgba(99, 102, 241, 0)`);

            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }

        // Draw frequency bars in circular arrangement
        const angleStep = (2 * Math.PI) / this.barCount;
        
        for (let i = 0; i < this.barCount; i++) {
            const dataIndex = Math.floor((i / this.barCount) * bufferLength);
            const barHeight = (dataArray[dataIndex] / 255) * baseRadius * 1.2;
            const angle = i * angleStep;
            
            const innerRadius = pulseRadius + 10;
            const outerRadius = innerRadius + barHeight;
            
            // Calculate bar positions
            const x1 = centerX + Math.cos(angle) * innerRadius;
            const y1 = centerY + Math.sin(angle) * innerRadius;
            const x2 = centerX + Math.cos(angle) * outerRadius;
            const y2 = centerY + Math.sin(angle) * outerRadius;
            
            // Draw radial bar
            this.ctx.strokeStyle = `hsl(${240 + (barHeight / baseRadius) * 60}, 80%, 60%)`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
    }

    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawStaticPattern(width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.12;

        // Draw animated pulsing effect even when static
        const time = Date.now() * 0.001;
        const pulse = Math.sin(time) * 0.2 + 1;

        // Main circle
        const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * pulse);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.1)');

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, baseRadius * pulse, 0, 2 * Math.PI);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Outer rings
        for (let i = 1; i <= 2; i++) {
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, baseRadius * (1.2 + i * 0.4) * pulse, 0, 2 * Math.PI);
            this.ctx.strokeStyle = `rgba(148, 163, 184, ${0.3 / i / pulse})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }

        // Draw static bars around the circle
        const barCount = 16;
        const angleStep = (2 * Math.PI) / barCount;
        
        for (let i = 0; i < barCount; i++) {
            const angle = i * angleStep + time * 0.5;
            const barLength = 15 + Math.sin(time + i) * 5;
            
            const innerRadius = baseRadius * 1.8;
            const outerRadius = innerRadius + barLength;
            
            const x1 = centerX + Math.cos(angle) * innerRadius;
            const y1 = centerY + Math.sin(angle) * innerRadius;
            const x2 = centerX + Math.cos(angle) * outerRadius;
            const y2 = centerY + Math.sin(angle) * outerRadius;
            
            this.ctx.strokeStyle = `rgba(99, 102, 241, ${0.3 + Math.sin(time + i) * 0.2})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
        }
        this.initialized = false;
        console.log('Canvas visualizer destroyed');
    }

    resize() {
        if (this.canvas && this.container) {
            this.canvas.width = this.container.clientWidth * (window.devicePixelRatio || 1);
            this.canvas.height = this.container.clientHeight * (window.devicePixelRatio || 1);
            this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        }
    }
}
