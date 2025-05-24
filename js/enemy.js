/**
 * EnemyFish class represents AI-controlled fish in the game
 * These fish have different behaviors based on their size relative to the player
 * @class
 */
class EnemyFish {
    /**
     * Creates a new enemy fish
     * @param {HTMLCanvasElement} canvas - The game canvas element
     * @param {number} playerSizeLevel - The player's current size level
     * @param {number} worldWidth - Width of the game world
     * @param {number} worldHeight - Height of the game world
     */
    constructor(canvas, playerSizeLevel, worldWidth = null, worldHeight = null) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // World dimensions
        this.worldWidth = worldWidth || canvas.width;
        this.worldHeight = worldHeight || canvas.height;

        // Determine size relative to player
        this.determineSizeRelativeToPlayer(playerSizeLevel);

        // Position outside the canvas (primarily from left or right sides)
        this.positionOutsideCanvas();

        // Movement properties
        this.speed = this.determineSpeed();
        this.angle = this.determineInitialAngle();
        this.targetX = this.determineTargetX();
        this.targetY = this.determineTargetY();
        this.changeDirectionCounter = 0;
        this.changeDirectionInterval = random(100, 200);

        // Visual properties
        this.color = this.determineColor();
        this.eyeColor = 'white';
        this.pupilColor = 'black';

        // Animation properties
        this.tailWaggle = 0;
        this.tailWaggleDirection = 1;
        this.tailWaggleSpeed = 0.1 + Math.random() * 0.1;
        this.finAnimation = 0;
        this.finAnimationSpeed = 0.05 + Math.random() * 0.03;

        // Fish shape properties
        this.bodyLength = this.radius * 1.8; // Longer body for more fish-like appearance
        this.bodyWidth = this.radius * 1.2;  // Slightly wider than tall
        this.tailLength = this.radius * 0.8;
        this.tailWidth = this.radius * 0.6;
        this.finSize = this.radius * 0.4;

        // Set default point value based on size
        this.pointValue = 10 * this.sizeLevel;

        // Slow down the game by 2x as requested
        this.speed *= 0.5;
    }

    determineColor() {
        // Generate a random fish color
        const colors = [
            '#3399FF', // Blue
            '#FF6633', // Orange
            '#33CC33', // Green
            '#CC33CC', // Purple
            '#FFCC33', // Yellow
            '#FF3366', // Pink
            '#33CCCC'  // Teal
        ];

        return colors[Math.floor(Math.random() * colors.length)];
    }

    positionOutsideCanvas() {
        // Determine spawn location (equal chance from all sides)
        const spawnSide = Math.random();

        if (spawnSide < 0.25) {
            // Spawn from left
            this.x = -this.radius;
            this.y = random(0, this.worldHeight);
        } else if (spawnSide < 0.5) {
            // Spawn from right
            this.x = this.worldWidth + this.radius;
            this.y = random(0, this.worldHeight);
        } else if (spawnSide < 0.75) {
            // Spawn from top
            this.x = random(0, this.worldWidth);
            this.y = -this.radius;
        } else {
            // Spawn from bottom
            this.x = random(0, this.worldWidth);
            this.y = this.worldHeight + this.radius;
        }
    }

    determineSizeRelativeToPlayer(playerSizeLevel) {
        // Determine if this fish should be smaller, same size, or larger than player
        const sizeRoll = Math.random();

        if (sizeRoll < 0.6) { // 60% chance of smaller fish
            this.sizeLevel = Math.max(1, playerSizeLevel - random(1, 2));
        } else if (sizeRoll < 0.9) { // 30% chance of larger fish
            this.sizeLevel = playerSizeLevel + random(1, 2);
        } else { // 10% chance of much larger fish
            this.sizeLevel = playerSizeLevel + random(3, 4);
        }

        // Calculate radius using the same formula as the player fish
        // This ensures enemy fish match the player's growth pattern
        this.radius = 10; // Base radius

        // Add growth for each level above 1
        for (let i = 1; i < this.sizeLevel; i++) {
            this.radius += 5 + Math.floor(i / 2) * 2;
        }
    }

    determineSpeed() {
        // Smaller fish are faster, larger fish are slower
        // Reduced overall speed for more relaxed gameplay
        return Math.max(0.5, 3 - (this.sizeLevel * 0.3));
    }

    determineInitialAngle() {
        // Calculate angle towards a random point in the world
        const targetX = random(this.worldWidth * 0.2, this.worldWidth * 0.8);
        const targetY = random(this.worldHeight * 0.2, this.worldHeight * 0.8);

        // Calculate angle to target
        let angle = Math.atan2(targetY - this.y, targetX - this.x);

        // Add some randomness to the angle
        angle += random(-Math.PI/4, Math.PI/4);

        return angle;
    }

    determineTargetX() {
        return this.worldWidth / 2 + random(-this.worldWidth / 3, this.worldWidth / 3);
    }

    determineTargetY() {
        return this.worldHeight / 2 + random(-this.worldHeight / 3, this.worldHeight / 3);
    }

    determineColor() {
        // Generate a random fish color
        const colors = [
            '#3399FF', // Blue
            '#FF6633', // Orange
            '#33CC33', // Green
            '#CC33CC', // Purple
            '#FFCC33', // Yellow
            '#FF3366', // Pink
            '#33CCCC'  // Teal
        ];

        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Updates the enemy fish's position and state
     * @param {number} playerX - Player's X position
     * @param {number} playerY - Player's Y position
     * @param {number} playerRadius - Player's radius
     * @returns {boolean} True if the fish should be removed
     */
    update(playerX, playerY, playerRadius) {
        // Move in current direction with equal horizontal and vertical movement
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Update animation values
        this.updateAnimations();

        // Keep fish within world bounds
        const margin = this.radius;

        if (this.x < margin) {
            this.x = margin;
            // Bounce off left wall
            this.angle = random(-Math.PI/3, Math.PI/3); // Angle towards right
        } else if (this.x > this.worldWidth - margin) {
            this.x = this.worldWidth - margin;
            // Bounce off right wall
            this.angle = Math.PI + random(-Math.PI/3, Math.PI/3); // Angle towards left
        }

        if (this.y < margin) {
            this.y = margin;
            // Bounce off top wall
            this.angle = random(0, Math.PI); // Angle downward
        } else if (this.y > this.worldHeight - margin) {
            this.y = this.worldHeight - margin;
            // Bounce off bottom wall
            this.angle = random(Math.PI, Math.PI * 2); // Angle upward
        }

        // Occasionally change direction
        this.changeDirectionCounter++;
        if (this.changeDirectionCounter >= this.changeDirectionInterval) {
            this.changeDirection(playerX, playerY, playerRadius);
            this.changeDirectionCounter = 0;
            this.changeDirectionInterval = random(150, 300); // Longer intervals for more natural movement
        }

        // Add slight random movement for more natural swimming
        if (Math.random() < 0.05) { // 5% chance each frame
            this.angle += random(-Math.PI/16, Math.PI/16); // Slight random angle change
        }

        // Check if fish is far outside the canvas and should be removed
        return this.isOutsideBounds();
    }

    changeDirection(playerX, playerY, playerRadius) {
        // Determine behavior based on size comparison
        const playerSize = playerRadius;

        // Calculate distance to player
        const distanceToPlayer = calculateDistance(this.x, this.y, playerX, playerY);
        const playerAware = distanceToPlayer < 250; // Awareness range

        if (this.radius < playerSize * 0.8) {
            // Smaller fish behavior
            if (playerAware) {
                // Flee from player if close
                const fleeAngle = calculateAngle(playerX, playerY, this.x, this.y);
                this.angle = fleeAngle;

                // Add some randomness to avoid predictable movement
                this.angle += random(-Math.PI/4, Math.PI/4);
            } else {
                // Fully random movement with no bias
                this.angle = random(0, Math.PI * 2);
            }
        } else if (this.radius > playerSize * 1.2) {
            // Larger fish behavior
            if (playerAware && Math.random() < 0.7) {
                // Chase player
                this.angle = calculateAngle(this.x, this.y, playerX, playerY);

                // Add slight randomness
                this.angle += random(-Math.PI/6, Math.PI/6);
            } else {
                // Fully random movement with no bias
                this.angle = random(0, Math.PI * 2);
            }
        } else {
            // Similar sized fish - completely random movement
            this.angle = random(0, Math.PI * 2);
        }
    }

    isOutsideBounds() {
        const margin = this.radius * 2;
        return (
            this.x < -margin ||
            this.x > this.worldWidth + margin ||
            this.y < -margin ||
            this.y > this.worldHeight + margin
        );
    }

    /**
     * Updates animation values for the fish
     * @private
     */
    updateAnimations() {
        // Update tail waggle animation
        this.tailWaggle += this.tailWaggleSpeed * this.tailWaggleDirection;
        if (Math.abs(this.tailWaggle) > 0.5) {
            this.tailWaggleDirection *= -1;
        }

        // Update fin animation
        this.finAnimation += this.finAnimationSpeed;
        if (this.finAnimation > Math.PI * 2) {
            this.finAnimation -= Math.PI * 2;
        }
    }

    /**
     * Draws the enemy fish with enhanced appearance
     */
    draw() {
        this.ctx.save();

        // Translate to fish position and rotate to face direction
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.angle);

        // Create gradient for fish body
        const bodyGradient = this.ctx.createLinearGradient(0, -this.bodyWidth/2, 0, this.bodyWidth/2);
        bodyGradient.addColorStop(0, this.lightenColor(this.color, 20));
        bodyGradient.addColorStop(0.5, this.color);
        bodyGradient.addColorStop(1, this.darkenColor(this.color, 20));

        // Draw fish body (oval shape)
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, this.bodyLength, this.bodyWidth, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = bodyGradient;
        this.ctx.fill();

        // Add subtle body pattern
        this.drawBodyPattern();

        // Draw tail with waggle animation
        const tailWaggleOffset = Math.sin(this.tailWaggle) * this.tailWidth * 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(-this.bodyLength * 0.8, 0);
        this.ctx.quadraticCurveTo(
            -this.bodyLength - this.tailLength * 0.5, tailWaggleOffset,
            -this.bodyLength - this.tailLength, 0
        );
        this.ctx.quadraticCurveTo(
            -this.bodyLength - this.tailLength * 0.5, -tailWaggleOffset,
            -this.bodyLength * 0.8, 0
        );
        this.ctx.fillStyle = this.darkenColor(this.color, 10);
        this.ctx.fill();

        // Draw top fin
        const finHeight = this.finSize * (0.8 + Math.sin(this.finAnimation) * 0.2);
        this.ctx.beginPath();
        this.ctx.moveTo(-this.bodyLength * 0.2, -this.bodyWidth * 0.5);
        this.ctx.quadraticCurveTo(
            -this.bodyLength * 0.1, -this.bodyWidth * 0.5 - finHeight,
            this.bodyLength * 0.2, -this.bodyWidth * 0.5
        );
        this.ctx.lineTo(-this.bodyLength * 0.2, -this.bodyWidth * 0.5);
        this.ctx.fillStyle = this.darkenColor(this.color, 5);
        this.ctx.fill();

        // Draw bottom fin
        this.ctx.beginPath();
        this.ctx.moveTo(-this.bodyLength * 0.1, this.bodyWidth * 0.5);
        this.ctx.quadraticCurveTo(
            0, this.bodyWidth * 0.5 + this.finSize * 0.7,
            this.bodyLength * 0.1, this.bodyWidth * 0.5
        );
        this.ctx.lineTo(-this.bodyLength * 0.1, this.bodyWidth * 0.5);
        this.ctx.fillStyle = this.darkenColor(this.color, 5);
        this.ctx.fill();

        // Draw eye
        const eyeX = this.bodyLength * 0.6;
        const eyeY = -this.bodyWidth * 0.1;
        const eyeRadius = this.radius * 0.25;

        this.ctx.beginPath();
        this.ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.eyeColor;
        this.ctx.fill();

        // Draw pupil
        const pupilX = eyeX + eyeRadius * 0.3;
        const pupilY = eyeY;
        const pupilRadius = eyeRadius * 0.6;

        this.ctx.beginPath();
        this.ctx.arc(pupilX, pupilY, pupilRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.pupilColor;
        this.ctx.fill();

        // Draw mouth
        this.ctx.beginPath();
        this.ctx.moveTo(this.bodyLength * 0.9, -this.bodyWidth * 0.1);
        this.ctx.quadraticCurveTo(
            this.bodyLength * 1.1, 0,
            this.bodyLength * 0.9, this.bodyWidth * 0.1
        );
        this.ctx.strokeStyle = this.darkenColor(this.color, 30);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.restore();
    }

    /**
     * Draws a subtle pattern on the fish body
     * @private
     */
    drawBodyPattern() {
        // Draw subtle scales or stripes based on fish size
        if (this.sizeLevel > 3) {
            // Larger fish get scales
            this.drawScales();
        } else {
            // Smaller fish get stripes
            this.drawStripes();
        }
    }

    /**
     * Draws scale pattern on the fish body
     * @private
     */
    drawScales() {
        const scaleSize = this.radius * 0.15;
        const scaleRows = 5;
        const scalesPerRow = 8;

        this.ctx.globalAlpha = 0.2;
        this.ctx.fillStyle = this.darkenColor(this.color, 20);

        for (let row = 0; row < scaleRows; row++) {
            for (let col = 0; col < scalesPerRow; col++) {
                const x = -this.bodyLength * 0.7 + (col * this.bodyLength * 1.4 / scalesPerRow);
                const y = -this.bodyWidth * 0.6 + (row * this.bodyWidth * 1.2 / scaleRows);

                this.ctx.beginPath();
                this.ctx.arc(x, y, scaleSize, 0, Math.PI);
                this.ctx.fill();
            }
        }

        this.ctx.globalAlpha = 1.0;
    }

    /**
     * Draws stripe pattern on the fish body
     * @private
     */
    drawStripes() {
        const stripeCount = 3 + Math.floor(this.sizeLevel);
        const stripeWidth = this.bodyLength * 0.1;

        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = this.darkenColor(this.color, 30);

        for (let i = 0; i < stripeCount; i++) {
            const x = -this.bodyLength * 0.5 + (i * this.bodyLength / stripeCount);

            this.ctx.beginPath();
            this.ctx.rect(x, -this.bodyWidth * 0.5, stripeWidth * 0.7, this.bodyWidth);
            this.ctx.fill();
        }

        this.ctx.globalAlpha = 1.0;
    }

    /**
     * Lightens a color by the specified amount
     * @param {string} color - Hex color string
     * @param {number} amount - Amount to lighten (0-100)
     * @returns {string} Lightened color
     * @private
     */
    lightenColor(color, amount) {
        return this.adjustColor(color, amount);
    }

    /**
     * Darkens a color by the specified amount
     * @param {string} color - Hex color string
     * @param {number} amount - Amount to darken (0-100)
     * @returns {string} Darkened color
     * @private
     */
    darkenColor(color, amount) {
        return this.adjustColor(color, -amount);
    }

    /**
     * Adjusts a color by the specified amount
     * @param {string} color - Hex color string
     * @param {number} amount - Amount to adjust (-100 to 100)
     * @returns {string} Adjusted color
     * @private
     */
    adjustColor(color, amount) {
        // Remove # if present
        color = color.replace('#', '');

        // Parse the color
        let r = parseInt(color.substring(0, 2), 16);
        let g = parseInt(color.substring(2, 4), 16);
        let b = parseInt(color.substring(4, 6), 16);

        // Adjust each component
        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));

        // Convert back to hex
        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    }
}
