/**
 * WaterEffect class for creating a subtle animated water background
 * @class
 */
class WaterEffect {
    /**
     * Creates a new water effect
     * @param {HTMLCanvasElement} canvas - The game canvas element
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Water properties
        this.waves = [];
        this.bubbles = [];
        
        // Create initial waves
        this.createWaves();
        
        // Create initial bubbles
        this.createBubbles();
    }
    
    /**
     * Creates wave objects for the water effect
     * @private
     */
    createWaves() {
        const waveCount = 3;
        
        for (let i = 0; i < waveCount; i++) {
            this.waves.push({
                amplitude: 5 + Math.random() * 10, // Height of the wave
                length: 0.005 + Math.random() * 0.01, // Length of the wave
                speed: 0.001 + Math.random() * 0.002, // Speed of the wave
                phase: Math.random() * Math.PI * 2, // Starting phase
                opacity: 0.03 + Math.random() * 0.04 // Opacity of the wave
            });
        }
    }
    
    /**
     * Creates bubble objects for the water effect
     * @private
     */
    createBubbles() {
        const bubbleCount = 15;
        
        for (let i = 0; i < bubbleCount; i++) {
            this.addBubble();
        }
    }
    
    /**
     * Adds a new bubble to the water effect
     * @private
     */
    addBubble() {
        this.bubbles.push({
            x: Math.random() * this.canvas.width,
            y: this.canvas.height + Math.random() * 50,
            size: 2 + Math.random() * 8,
            speed: 0.2 + Math.random() * 0.8,
            opacity: 0.1 + Math.random() * 0.3,
            wobble: {
                amplitude: 0.5 + Math.random() * 1.5,
                speed: 0.01 + Math.random() * 0.03,
                phase: Math.random() * Math.PI * 2
            }
        });
    }
    
    /**
     * Updates the water effect animation
     */
    update() {
        // Update waves
        for (const wave of this.waves) {
            wave.phase += wave.speed;
        }
        
        // Update bubbles
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            
            // Move bubble upward
            bubble.y -= bubble.speed;
            
            // Apply wobble effect
            bubble.wobble.phase += bubble.wobble.speed;
            bubble.x += Math.sin(bubble.wobble.phase) * bubble.wobble.amplitude;
            
            // Remove bubble if it's off-screen
            if (bubble.y < -bubble.size) {
                this.bubbles.splice(i, 1);
                this.addBubble(); // Add a new bubble to replace it
            }
        }
    }
    
    /**
     * Draws the water effect on the canvas
     * @param {number} cameraX - Camera X position
     * @param {number} cameraY - Camera Y position
     */
    draw(cameraX, cameraY) {
        // Draw subtle wave patterns
        this.drawWaves(cameraX, cameraY);
        
        // Draw bubbles
        this.drawBubbles(cameraX, cameraY);
    }
    
    /**
     * Draws wave patterns for the water effect
     * @param {number} cameraX - Camera X position
     * @param {number} cameraY - Camera Y position
     * @private
     */
    drawWaves(cameraX, cameraY) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        for (const wave of this.waves) {
            this.ctx.beginPath();
            
            // Start at the left edge
            this.ctx.moveTo(0, height / 2);
            
            // Draw the wave across the screen
            for (let x = 0; x < width; x += 10) {
                // Calculate y position based on sine wave
                const y = Math.sin((x + cameraX) * wave.length + wave.phase) * wave.amplitude;
                
                // Draw line to this point
                this.ctx.lineTo(x, height / 2 + y);
            }
            
            // Complete the path to the bottom-right and back to start
            this.ctx.lineTo(width, height);
            this.ctx.lineTo(0, height);
            this.ctx.closePath();
            
            // Fill with a subtle blue gradient
            const gradient = this.ctx.createLinearGradient(0, height / 2, 0, height);
            gradient.addColorStop(0, `rgba(100, 150, 255, ${wave.opacity})`);
            gradient.addColorStop(1, `rgba(50, 100, 200, ${wave.opacity / 2})`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }
    }
    
    /**
     * Draws bubbles for the water effect
     * @param {number} cameraX - Camera X position
     * @param {number} cameraY - Camera Y position
     * @private
     */
    drawBubbles(cameraX, cameraY) {
        for (const bubble of this.bubbles) {
            // Calculate screen position
            const screenX = bubble.x;
            const screenY = bubble.y;
            
            // Draw bubble
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, bubble.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity})`;
            this.ctx.fill();
            
            // Add highlight
            this.ctx.beginPath();
            this.ctx.arc(
                screenX - bubble.size * 0.3,
                screenY - bubble.size * 0.3,
                bubble.size * 0.3,
                0, Math.PI * 2
            );
            this.ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * 2})`;
            this.ctx.fill();
        }
    }
    
    /**
     * Resizes the water effect to match the canvas
     */
    resize() {
        // Recreate bubbles to match new canvas size
        this.bubbles = [];
        this.createBubbles();
    }
}
