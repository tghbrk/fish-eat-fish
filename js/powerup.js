/**
 * Power-up class
 */
class PowerUp {
    constructor(canvas, worldWidth = null, worldHeight = null) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // World dimensions
        this.worldWidth = worldWidth || canvas.width;
        this.worldHeight = worldHeight || canvas.height;

        // Position randomly within the world, but avoid edges
        this.x = random(this.worldWidth * 0.1, this.worldWidth * 0.9);
        this.y = random(this.worldHeight * 0.1, this.worldHeight * 0.9);

        // Size and visual properties
        this.radius = 15;
        this.pulseAmount = 0;
        this.pulseDirection = 1;

        // Determine power-up type
        this.type = this.determineType();
        this.color = this.determineColor();
        this.duration = 1200; // 20 seconds at 60fps (doubled for 2x slower game)

        // Lifespan of the power-up
        this.lifespan = 1800; // 30 seconds at 60fps (doubled for 2x slower game)
    }

    determineType() {
        const types = ['speedBoost', 'invincibility', 'doublePoints', 'magnetism', 'frenzy'];
        const weights = [0.25, 0.2, 0.2, 0.15, 0.2]; // Probability weights

        // Weighted random selection
        const roll = Math.random();
        let cumulativeWeight = 0;

        for (let i = 0; i < types.length; i++) {
            cumulativeWeight += weights[i];
            if (roll < cumulativeWeight) {
                return types[i];
            }
        }

        return types[0]; // Fallback
    }

    determineColor() {
        switch(this.type) {
            case 'speedBoost':
                return '#FFFF00'; // Yellow
            case 'invincibility':
                return '#FFD700'; // Gold
            case 'doublePoints':
                return '#FF00FF'; // Magenta
            case 'magnetism':
                return '#00BFFF'; // Deep Sky Blue
            case 'frenzy':
                return '#00FF00'; // Green
            default:
                return '#FFFFFF'; // White
        }
    }

    update() {
        // Update pulse effect
        this.pulseAmount += 0.05 * this.pulseDirection;
        if (this.pulseAmount >= 1) {
            this.pulseDirection = -1;
        } else if (this.pulseAmount <= 0) {
            this.pulseDirection = 1;
        }

        // Decrease lifespan
        this.lifespan--;

        // Return true if power-up should be removed
        return this.lifespan <= 0;
    }

    draw() {
        this.ctx.save();

        // Draw power-up with pulsing effect
        const pulseRadius = this.radius * (1 + this.pulseAmount * 0.2);

        // Draw outer glow
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, pulseRadius * 1.5, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + this.pulseAmount * 0.2})`;
        this.ctx.fill();
        this.ctx.closePath();

        // Draw power-up
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, pulseRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
        this.ctx.closePath();

        // Draw icon based on type
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = `${this.radius}px Arial`;

        let icon = '';
        switch(this.type) {
            case 'speedBoost':
                icon = '⚡'; // Lightning bolt
                break;
            case 'invincibility':
                icon = '★'; // Star
                break;
            case 'doublePoints':
                icon = '×2'; // Multiply symbol
                break;
            case 'magnetism':
                icon = '⊕'; // Circled plus (magnet symbol)
                break;
            case 'frenzy':
                icon = '!'; // Exclamation mark
                break;
        }

        this.ctx.fillText(icon, this.x, this.y);

        this.ctx.restore();
    }

    getEffect() {
        return {
            type: this.type,
            duration: this.duration
        };
    }
}
