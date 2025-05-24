/**
 * PerformanceMonitor class for tracking and optimizing game performance
 * @class
 */
class PerformanceMonitor {
    /**
     * Creates a new performance monitor
     * @param {number} sampleSize - Number of frames to average for FPS calculation
     * @param {boolean} showStats - Whether to display performance stats on screen
     */
    constructor(sampleSize = 60, showStats = false) {
        this.sampleSize = sampleSize;
        this.showStats = showStats;
        this.frameTimes = [];
        this.lastFrameTime = 0;
        this.fps = 0;
        this.averageFps = 0;
        this.minFps = Infinity;
        this.maxFps = 0;
        this.frameCount = 0;
        
        // Create stats display if enabled
        if (this.showStats) {
            this.createStatsDisplay();
        }
    }
    
    /**
     * Creates a DOM element to display performance stats
     * @private
     */
    createStatsDisplay() {
        this.statsElement = document.createElement('div');
        this.statsElement.id = 'performance-stats';
        this.statsElement.style.position = 'fixed';
        this.statsElement.style.top = '10px';
        this.statsElement.style.right = '10px';
        this.statsElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.statsElement.style.color = 'white';
        this.statsElement.style.padding = '5px';
        this.statsElement.style.borderRadius = '5px';
        this.statsElement.style.fontFamily = 'monospace';
        this.statsElement.style.fontSize = '12px';
        this.statsElement.style.zIndex = '1000';
        document.body.appendChild(this.statsElement);
    }
    
    /**
     * Begins a new frame, should be called at the start of each frame
     */
    beginFrame() {
        this.lastFrameTime = performance.now();
    }
    
    /**
     * Ends the current frame, calculates FPS, and updates stats
     * Should be called at the end of each frame
     */
    endFrame() {
        const now = performance.now();
        const frameDuration = now - this.lastFrameTime;
        
        // Calculate current FPS
        this.fps = 1000 / frameDuration;
        
        // Add to sample for averaging
        this.frameTimes.push(frameDuration);
        if (this.frameTimes.length > this.sampleSize) {
            this.frameTimes.shift();
        }
        
        // Calculate average FPS
        const averageFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
        this.averageFps = 1000 / averageFrameTime;
        
        // Update min/max FPS
        this.minFps = Math.min(this.minFps, this.fps);
        this.maxFps = Math.max(this.maxFps, this.fps);
        
        // Increment frame counter
        this.frameCount++;
        
        // Update stats display if enabled
        if (this.showStats && this.frameCount % 10 === 0) {
            this.updateStatsDisplay();
        }
    }
    
    /**
     * Updates the stats display with current performance metrics
     * @private
     */
    updateStatsDisplay() {
        if (!this.statsElement) return;
        
        this.statsElement.innerHTML = `
            FPS: ${this.fps.toFixed(1)}<br>
            Avg: ${this.averageFps.toFixed(1)}<br>
            Min: ${this.minFps.toFixed(1)}<br>
            Max: ${this.maxFps.toFixed(1)}<br>
            Frame: ${this.frameCount}
        `;
    }
    
    /**
     * Toggles the visibility of the stats display
     */
    toggleStats() {
        this.showStats = !this.showStats;
        
        if (this.showStats && !this.statsElement) {
            this.createStatsDisplay();
        } else if (!this.showStats && this.statsElement) {
            document.body.removeChild(this.statsElement);
            this.statsElement = null;
        }
    }
    
    /**
     * Resets all performance metrics
     */
    reset() {
        this.frameTimes = [];
        this.fps = 0;
        this.averageFps = 0;
        this.minFps = Infinity;
        this.maxFps = 0;
        this.frameCount = 0;
    }
    
    /**
     * Gets the current performance metrics
     * @returns {Object} Object containing current performance metrics
     */
    getMetrics() {
        return {
            fps: this.fps,
            averageFps: this.averageFps,
            minFps: this.minFps,
            maxFps: this.maxFps,
            frameCount: this.frameCount
        };
    }
}
