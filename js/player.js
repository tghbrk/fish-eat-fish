/**
 * PlayerFish class represents the player-controlled fish in the game.
 * It handles player movement, growth, collision detection, and visual appearance.
 * @class
 */
class PlayerFish {
    /**
     * Creates a new PlayerFish instance
     * @param {HTMLCanvasElement} canvas - The game canvas element
     * @param {string} name - The player's display name
     */
    constructor(canvas, name = 'Player') {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Player identity
        this.name = name;
        this.isCurrentPlayer = true; // Flag to identify the human player

        // Get world dimensions from window size
        this.worldWidth = window.innerWidth * 3;
        this.worldHeight = window.innerHeight * 3;

        // Initial position at the center of the world
        this.x = this.worldWidth / 2;
        this.y = this.worldHeight / 2;

        // Initial size and growth properties
        this.sizeLevel = 1;
        this.radius = 15; // Starting radius
        this.baseSpeed = 2.0; // Reduced speed for more relaxed gameplay
        this.speed = this.baseSpeed;

        // Boost properties
        this.boosting = false;
        this.boostMultiplier = 2.0; // Speed multiplier when boosting
        this.boostDrainRate = 0.001; // How much growth progress is consumed per frame when boosting (significantly reduced for much longer boost)

        // Add minimal inertia for responsive movement
        this.velocityX = 0;
        this.velocityY = 0;
        this.inertia = 0.7; // Lower value = less inertia, more responsive

        // Mouse/cursor tracking
        this.mouseX = 0;
        this.mouseY = 0;
        this.angle = 0; // Angle for fish direction

        // Scoring and status
        this.score = 0;
        this.isAlive = true;
        this.respawnTimer = 0;

        // Fish type properties for tutorial (simplified for this version)
        this.preferredPrey = 'small fish';
        this.weakness = 'large fish';

        // Growth tracking
        this.fishEaten = 0;
        this.fishNeededToGrow = 5; // Initial number of fish needed to grow
        this.growthProgress = 0; // Current progress toward next growth level (0-1)

        // Visual properties
        this.baseColor = '#3399FF';
        this.color = this.baseColor;
        this.eyeColor = 'white';
        this.pupilColor = 'black';

        // Growth animation properties
        this.growthAnimation = {
            active: false,
            timer: 0,
            duration: 60, // 1 second at 60fps
            targetRadius: this.radius,
            startRadius: this.radius,
            glowIntensity: 0,
            particles: []
        };

        // Power-up properties (disabled)
        this.powerUps = {
            speedBoost: {
                active: false,
                duration: 0,
                multiplier: 1.5
            },
            invincibility: {
                active: false,
                duration: 0
            },
            doublePoints: {
                active: false,
                duration: 0,
                multiplier: 2
            },
            magnetism: {
                active: false,
                duration: 0,
                range: 150
            }
        };

        // Target position (mouse/touch)
        this.targetX = this.x;
        this.targetY = this.y;

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Sets up mouse and touch event listeners for player control
     * @private
     */
    setupEventListeners() {
        // Mouse move event
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.targetX = e.clientX - rect.left;
            this.targetY = e.clientY - rect.top;

            // Store raw mouse coordinates for cursor indicator
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        // Touch move event for mobile
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.targetX = e.touches[0].clientX - rect.left;
            this.targetY = e.touches[0].clientY - rect.top;

            // Store raw touch coordinates for cursor indicator
            this.mouseX = e.touches[0].clientX - rect.left;
            this.mouseY = e.touches[0].clientY - rect.top;
        });

        // Mouse down event for boost
        this.canvas.addEventListener('mousedown', (e) => {
            // Left click (button 0) activates boost
            if (e.button === 0 && this.isAlive) {
                this.startBoost();
            }
        });

        // Mouse up event to stop boost
        this.canvas.addEventListener('mouseup', (e) => {
            // Left click (button 0) deactivates boost
            if (e.button === 0) {
                this.stopBoost();
            }
        });

        // Touch start event for boost on mobile
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.isAlive) {
                this.startBoost();
            }
        });

        // Touch end event to stop boost on mobile
        this.canvas.addEventListener('touchend', () => {
            this.stopBoost();
        });
    }

    /**
     * Updates the player's position, angle, and state each frame
     * Handles movement, boost, and boundary checking
     */
    update() {
        if (!this.isAlive) return;

        // Update boost state
        this.updateBoost();

        // Update growth animation if active
        if (this.growthAnimation.active) {
            this.updateGrowthAnimation();
        }

        // Get the current camera position from the game object
        // This ensures we're using the exact same camera position as the rendering system
        const game = window.gameInstance;
        if (!game) {
            console.warn('Game instance not available yet, using default camera position');
            return; // Skip update if game instance is not ready
        }
        const cameraX = game.cameraX || 0;
        const cameraY = game.cameraY || 0;

        // Convert mouse position to world coordinates with direct mapping
        const worldMouseX = this.mouseX + cameraX;
        const worldMouseY = this.mouseY + cameraY;

        // Calculate direction to mouse cursor
        const dx = worldMouseX - this.x;
        const dy = worldMouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate angle to cursor
        const targetAngle = Math.atan2(dy, dx);

        // Smooth angle transition for fish rotation only
        let angleDiff = targetAngle - this.angle;
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Apply rotation - faster turning for better responsiveness
        this.angle += angleDiff * 0.3;

        // Normalize angle
        if (this.angle > Math.PI) this.angle -= Math.PI * 2;
        if (this.angle < -Math.PI) this.angle += Math.PI * 2;

        // DIRECT MOVEMENT APPROACH
        // Calculate base speed - higher for better responsiveness
        let moveSpeed = this.speed * 1.3;

        // Apply boost if active
        if (this.boosting) {
            moveSpeed *= this.boostMultiplier;
        }

        // Calculate direct movement vector toward cursor
        // This is the key change - we move directly toward the cursor with no physics
        if (distance > 0) {
            // Normalize direction vector
            const dirX = dx / distance;
            const dirY = dy / distance;

            // Set velocity directly based on direction and speed
            // This completely eliminates any edge attraction effect
            this.velocityX = dirX * moveSpeed;
            this.velocityY = dirY * moveSpeed;

            // Add very slight randomness for natural movement
            if (Math.random() < 0.05) {
                const randomFactor = 0.1;
                this.velocityX += (Math.random() - 0.5) * randomFactor;
                this.velocityY += (Math.random() - 0.5) * randomFactor;
            }
        } else {
            // If cursor is exactly on fish, stop movement
            this.velocityX = 0;
            this.velocityY = 0;
        }

        // Apply velocity
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Keep player within world bounds using simple clamping
        const margin = this.radius;
        this.x = Math.max(margin, Math.min(this.worldWidth - margin, this.x));
        this.y = Math.max(margin, Math.min(this.worldHeight - margin, this.y));

        // Update power-ups
        this.updatePowerUps();
    }

    /**
     * Renders the player fish on the canvas
     * Handles visual effects for different states (boosting, growing, etc.)
     */
    draw() {
        if (!this.isAlive) return;

        // Add respawn effect (brief invincibility visual)
        const respawnEffect = this.respawnTimer < 120; // Show effect for 2 seconds after respawn
        if (respawnEffect) {
            this.respawnTimer++;
        }

        this.ctx.save();

        // Draw growth animation particles if active
        if (this.growthAnimation.active) {
            this.drawGrowthParticles();
        }

        // Draw fish body
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        // Apply special effects based on active power-ups, boost, respawn, or growth
        if (this.growthAnimation.active) {
            // Growth effect - pulsing glow with color transition
            const glowColor = this.getGlowColor();
            const gradient = this.ctx.createRadialGradient(
                this.x, this.y, this.radius * 0.5,
                this.x, this.y, this.radius
            );
            gradient.addColorStop(0, glowColor); // Bright core
            gradient.addColorStop(1, this.color); // Transition to fish color
            this.ctx.fillStyle = gradient;

            // Add glow effect
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = 15 * this.growthAnimation.glowIntensity;
        } else if (this.respawnTimer > 0 && this.respawnTimer < 120) {
            // Respawn effect - pulsing shield
            const pulseIntensity = 0.5 + Math.sin(this.respawnTimer * 0.1) * 0.5;
            this.ctx.fillStyle = this.color;
            this.ctx.shadowColor = `rgba(255, 255, 255, ${pulseIntensity})`;
            this.ctx.shadowBlur = 15;
        } else if (this.boosting) {
            // Create a gradient for boosting effect
            const gradient = this.ctx.createRadialGradient(
                this.x, this.y, this.radius * 0.5,
                this.x, this.y, this.radius
            );
            gradient.addColorStop(0, '#FF9900'); // Orange core
            gradient.addColorStop(1, this.color); // Original color at edge
            this.ctx.fillStyle = gradient;

            // Add glow effect (more subtle for longer boost duration)
            this.ctx.shadowColor = '#FF9900';
            this.ctx.shadowBlur = 8;

            // Draw speed lines
            const lineLength = this.radius * 2;
            const lineCount = 5;

            this.ctx.strokeStyle = 'rgba(255, 153, 0, 0.5)';
            this.ctx.lineWidth = 2;

            for (let i = 0; i < lineCount; i++) {
                const offset = (i - lineCount/2) * (this.radius * 0.4);
                const perpX = Math.sin(this.angle) * offset;
                const perpY = -Math.cos(this.angle) * offset;

                // Add some randomness to the lines
                const randomOffset = Math.random() * 5;

                this.ctx.beginPath();
                this.ctx.moveTo(
                    this.x - Math.cos(this.angle) * (this.radius + randomOffset) + perpX,
                    this.y - Math.sin(this.angle) * (this.radius + randomOffset) + perpY
                );
                this.ctx.lineTo(
                    this.x - Math.cos(this.angle) * (this.radius + lineLength + randomOffset) + perpX,
                    this.y - Math.sin(this.angle) * (this.radius + lineLength + randomOffset) + perpY
                );
                this.ctx.stroke();
                this.ctx.closePath();
            }
        } else if (this.powerUps.invincibility.active) {
            // Gold pulsing effect for invincibility
            this.ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(Date.now() * 0.01) * 0.5})`;
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 15;
        } else if (this.powerUps.doublePoints.active) {
            // Rainbow effect for double points
            const hue = (Date.now() * 0.1) % 360;
            this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        } else if (this.powerUps.magnetism.active) {
            // Electric blue effect for magnetism
            this.ctx.fillStyle = '#00BFFF';
            this.ctx.shadowColor = '#00BFFF';
            this.ctx.shadowBlur = 10;

            // Draw magnetism field
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.powerUps.magnetism.range, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(0, 191, 255, 0.2)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.closePath();
        } else if (this.powerUps.speedBoost.active) {
            // Yellow effect for speed boost
            this.ctx.fillStyle = '#FFFF00';

            // Draw speed lines
            const lineLength = this.radius * 1.5;
            const lineCount = 3;

            this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            this.ctx.lineWidth = 2;

            for (let i = 0; i < lineCount; i++) {
                const offset = (i - lineCount/2) * (this.radius * 0.4);
                const perpX = Math.sin(this.angle) * offset;
                const perpY = -Math.cos(this.angle) * offset;

                this.ctx.beginPath();
                this.ctx.moveTo(
                    this.x - Math.cos(this.angle) * this.radius + perpX,
                    this.y - Math.sin(this.angle) * this.radius + perpY
                );
                this.ctx.lineTo(
                    this.x - Math.cos(this.angle) * (this.radius + lineLength) + perpX,
                    this.y - Math.sin(this.angle) * (this.radius + lineLength) + perpY
                );
                this.ctx.stroke();
                this.ctx.closePath();
            }
        } else {
            this.ctx.fillStyle = this.color;
        }

        this.ctx.fill();
        this.ctx.closePath();

        // Draw tail
        this.ctx.beginPath();
        this.ctx.moveTo(
            this.x - Math.cos(this.angle) * this.radius,
            this.y - Math.sin(this.angle) * this.radius
        );
        this.ctx.lineTo(
            this.x - Math.cos(this.angle) * (this.radius + this.radius * 0.8),
            this.y - Math.sin(this.angle) * (this.radius + this.radius * 0.8)
        );
        this.ctx.lineTo(
            this.x - Math.cos(this.angle) * this.radius + Math.sin(this.angle) * this.radius * 0.5,
            this.y - Math.sin(this.angle) * this.radius - Math.cos(this.angle) * this.radius * 0.5
        );

        // Use the same color as the body
        if (this.powerUps.invincibility.active) {
            this.ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(Date.now() * 0.01) * 0.5})`;
        } else if (this.powerUps.doublePoints.active) {
            const hue = (Date.now() * 0.1) % 360;
            this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        } else if (this.powerUps.magnetism.active) {
            this.ctx.fillStyle = '#00BFFF';
        } else if (this.powerUps.speedBoost.active) {
            this.ctx.fillStyle = '#FFFF00';
        } else {
            this.ctx.fillStyle = this.color;
        }

        this.ctx.fill();
        this.ctx.closePath();

        // Draw fins that move with swimming motion
        const finSize = this.radius * 0.7;
        const finWave = Math.sin(Date.now() * 0.01) * 0.3; // Fin wave animation

        // Top fin
        this.ctx.beginPath();
        this.ctx.moveTo(this.x, this.y - this.radius * 0.2);
        this.ctx.quadraticCurveTo(
            this.x + Math.cos(this.angle + Math.PI/2) * finSize * (1 + finWave),
            this.y + Math.sin(this.angle + Math.PI/2) * finSize * (1 + finWave),
            this.x + Math.cos(this.angle) * this.radius * 0.5,
            this.y + Math.sin(this.angle) * this.radius * 0.5
        );
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
        this.ctx.closePath();

        // Bottom fin
        this.ctx.beginPath();
        this.ctx.moveTo(this.x, this.y + this.radius * 0.2);
        this.ctx.quadraticCurveTo(
            this.x + Math.cos(this.angle - Math.PI/2) * finSize * (1 - finWave),
            this.y + Math.sin(this.angle - Math.PI/2) * finSize * (1 - finWave),
            this.x + Math.cos(this.angle) * this.radius * 0.5,
            this.y + Math.sin(this.angle) * this.radius * 0.5
        );
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
        this.ctx.closePath();

        // Draw eye with more detail
        const eyeX = this.x + Math.cos(this.angle) * (this.radius * 0.5);
        const eyeY = this.y + Math.sin(this.angle) * (this.radius * 0.5);
        const eyeRadius = this.radius * 0.3;

        // Eye white with shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 2;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;

        this.ctx.beginPath();
        this.ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.eyeColor;
        this.ctx.fill();
        this.ctx.closePath();

        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        // Draw pupil with slight movement based on velocity
        const pupilOffset = Math.min(eyeRadius * 0.3, Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY) * 0.5);
        const pupilAngle = Math.atan2(this.velocityY, this.velocityX);

        const pupilX = eyeX + Math.cos(this.angle) * (eyeRadius * 0.3) + Math.cos(pupilAngle) * pupilOffset;
        const pupilY = eyeY + Math.sin(this.angle) * (eyeRadius * 0.3) + Math.sin(pupilAngle) * pupilOffset;
        const pupilRadius = eyeRadius * 0.5;

        this.ctx.beginPath();
        this.ctx.arc(pupilX, pupilY, pupilRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.pupilColor;
        this.ctx.fill();
        this.ctx.closePath();

        // Add eye highlight
        const highlightX = pupilX + pupilRadius * 0.3;
        const highlightY = pupilY - pupilRadius * 0.3;
        const highlightRadius = pupilRadius * 0.3;

        this.ctx.beginPath();
        this.ctx.arc(highlightX, highlightY, highlightRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fill();
        this.ctx.closePath();

        // Draw name above fish
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.name, this.x, this.y - this.radius - 5);

        // Draw boost trail when boosting
        if (this.boosting) {
            this.drawBoostTrail();
        }

        // Reset shadow effects
        this.ctx.shadowBlur = 0;

        this.ctx.restore();
    }

    /**
     * Draws a visual trail effect behind the fish when boosting
     * @private
     */
    drawBoostTrail() {
        const trailLength = 7; // Increased trail length for more visible boost effect
        const trailWidth = this.radius * 0.9; // Slightly wider trail

        // Calculate trail start position (opposite to movement direction)
        const trailStartX = this.x - Math.cos(this.angle) * this.radius;
        const trailStartY = this.y - Math.sin(this.angle) * this.radius;

        // Create gradient for trail
        const gradient = this.ctx.createLinearGradient(
            trailStartX, trailStartY,
            trailStartX - Math.cos(this.angle) * trailLength * this.radius,
            trailStartY - Math.sin(this.angle) * trailLength * this.radius
        );
        gradient.addColorStop(0, 'rgba(255, 153, 0, 0.9)'); // Brighter orange
        gradient.addColorStop(0.7, 'rgba(255, 153, 0, 0.5)'); // Mid-fade
        gradient.addColorStop(1, 'rgba(255, 153, 0, 0)'); // Transparent

        // Draw trail
        this.ctx.beginPath();
        this.ctx.moveTo(
            trailStartX - Math.sin(this.angle) * trailWidth,
            trailStartY + Math.cos(this.angle) * trailWidth
        );
        this.ctx.lineTo(
            trailStartX + Math.sin(this.angle) * trailWidth,
            trailStartY - Math.cos(this.angle) * trailWidth
        );
        this.ctx.lineTo(
            trailStartX - Math.cos(this.angle) * trailLength * this.radius,
            trailStartY - Math.sin(this.angle) * trailLength * this.radius
        );
        this.ctx.closePath();
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }

    /**
     * Activates the boost effect, increasing speed and consuming growth progress
     */
    startBoost() {
        // Only allow boost if player is alive
        if (!this.isAlive) return;

        this.boosting = true;

        // Add visual effect when boost starts
        const game = window.gameInstance;
        if (game) {
            // Create a small burst effect
            for (let i = 0; i < 8; i++) {
                const angle = Math.PI * 2 * (i / 8);
                const distance = this.radius * 1.5;
                const x = this.x - Math.cos(this.angle) * this.radius + Math.cos(angle) * distance;
                const y = this.y - Math.sin(this.angle) * this.radius + Math.sin(angle) * distance;

                game.showFloatingText('', x, y, '#FF9900', 5, 20, true); // Small particle effect
            }
        }
    }

    /**
     * Deactivates the boost effect
     */
    stopBoost() {
        this.boosting = false;
    }

    /**
     * Updates the boost state, handling growth progress consumption
     * and fish shrinking when necessary
     * @private
     */
    updateBoost() {
        if (!this.boosting) return;

        // Calculate how much to drain
        let drainAmount = this.boostDrainRate;

        // Check if we have growth progress in the current level
        if (this.fishEaten > 0) {
            // Drain current level's growth progress
            this.fishEaten = Math.max(0, this.fishEaten - drainAmount * this.fishNeededToGrow);
            this.growthProgress = this.fishEaten / this.fishNeededToGrow;

            // Update growth progress bar
            this.updateGrowthProgressBar();
        } else if (this.sizeLevel > 1) {
            // If current level progress is depleted but we have higher levels,
            // shrink the fish and set growth progress to almost full
            this.shrink();

            // Set growth progress to 90% of what's needed for the next level
            this.fishEaten = this.fishNeededToGrow * 0.9;
            this.growthProgress = 0.9;

            // Update growth progress bar
            this.updateGrowthProgressBar();

            // Show shrink effect
            const game = window.gameInstance;
            if (game) {
                game.showFloatingText(`Level ${this.sizeLevel}`, this.x, this.y - this.radius * 2, '#FF9900', 24);
            }
        } else {
            // If we're at level 1 with no growth progress, stop boosting
            this.stopBoost();
        }
    }

    /**
     * Shrinks the fish to the previous size level
     * Used when boost depletes current level's growth progress
     * @returns {boolean} True if shrink was successful, false otherwise
     */
    shrink() {
        if (this.sizeLevel <= 1) return false; // Can't shrink below size 1

        // Calculate the amount to shrink based on the current level
        const shrinkAmount = 5 + Math.floor((this.sizeLevel - 1) / 2) * 2;

        this.sizeLevel--;
        this.radius -= shrinkAmount;

        // Update speed (slightly increase as fish gets smaller)
        this.baseSpeed = Math.min(3.5, this.baseSpeed / 0.95);
        this.speed = this.baseSpeed;

        // Update fish color based on size level
        this.updateFishColor();

        // Start shrink animation
        this.growthAnimation.active = true;
        this.growthAnimation.timer = 0;
        this.growthAnimation.startRadius = this.radius + shrinkAmount; // Start from previous size
        this.growthAnimation.targetRadius = this.radius;

        // Recalculate fish needed to grow for the previous level
        this.fishNeededToGrow = Math.floor(this.fishNeededToGrow / 1.5);

        // Game HUD removed to avoid overlap with leaderboard

        return true; // Return true to indicate shrink occurred
    }

    /**
     * Updates the growth progress bar in the UI to reflect current growth progress
     * @private
     */
    updateGrowthProgressBar() {
        if (!this.isCurrentPlayer) return;

        const progressBar = document.getElementById('growth-progress-bar');
        if (!progressBar) return;

        // Calculate percentage (0-100)
        let percentage = Math.max(0, this.growthProgress * 100);
        progressBar.style.width = `${percentage}%`;

        // Change color based on boosting state
        if (this.boosting) {
            progressBar.style.backgroundColor = '#FF9900'; // Orange when boosting
        } else {
            progressBar.style.backgroundColor = '#33CC33'; // Green normally
        }

        // Update the level number in the progress bar
        const levelNumber = document.getElementById('level-number');
        if (levelNumber) {
            levelNumber.textContent = this.sizeLevel;
        }

        // Game HUD removed to avoid overlap with leaderboard
    }

    /**
     * Handles the player eating a fish or food item
     * Updates score, growth progress, and triggers growth when appropriate
     * @param {number} amount - The amount of growth to add (default: 1)
     */
    eatFish(amount = 1) {
        this.fishEaten += amount;
        this.score += amount * 10 * this.sizeLevel; // Score based on size and amount eaten

        // Update growth progress
        this.growthProgress = this.fishEaten / this.fishNeededToGrow;

        // Update growth progress bar in UI
        this.updateGrowthProgressBar();

        // Sync score with game instance if this is the current player
        if (this.isCurrentPlayer && window.gameInstance) {
            window.gameInstance.score = this.score;
        }

        // Check if player should grow
        if (this.fishEaten >= this.fishNeededToGrow) {
            this.grow();
        }
    }

    /**
     * Increases the player's size level and updates related properties
     * @param {number} amount - The number of levels to grow (default: 1)
     * @returns {boolean} True if growth was successful
     */
    grow(amount = 1) {
        this.sizeLevel += amount;
        this.fishEaten = 0;
        this.growthProgress = 0;
        this.fishNeededToGrow = Math.floor(this.fishNeededToGrow * 1.5); // Increase fish needed for next growth

        // Update speed (slightly decrease as fish gets bigger)
        this.baseSpeed = Math.max(1.5, this.baseSpeed * 0.95);
        this.speed = this.baseSpeed;

        // Calculate new radius with increasing growth per level
        // The formula makes each level's growth larger than the previous level
        const growthAmount = amount * (5 + Math.floor(this.sizeLevel / 2) * 2);

        // Start growth animation
        this.growthAnimation.active = true;
        this.growthAnimation.timer = 0;
        this.growthAnimation.startRadius = this.radius;
        this.growthAnimation.targetRadius = this.radius + growthAmount;
        this.growthAnimation.particles = this.createGrowthParticles();

        // Update fish color based on size level
        this.updateFishColor();

        // Show growth message with the game's floating text system
        const game = window.gameInstance;
        if (game) {
            // Show level up message
            game.showFloatingText(`Level ${this.sizeLevel}!`, this.x, this.y - this.radius * 2, this.getGlowColor(), 24);

            // Show ripple effect around the fish
            this.createGrowthRipple();
        }

        // Play growth sound (if we had sound)
        // playSound('growth');

        // Update UI if this is the current player
        if (this.isCurrentPlayer) {
            // Game HUD removed to avoid overlap with leaderboard
            this.updateGrowthProgressBar();
        }

        return true; // Return true to indicate growth occurred
    }

    die() {
        this.isAlive = false;
        this.respawnTimer = 0;
    }

    respawn() {
        // Reset position to a random location
        this.x = random(this.worldWidth * 0.1, this.worldWidth * 0.9);
        this.y = random(this.worldHeight * 0.1, this.worldHeight * 0.9);

        // Reset size but keep half the score
        const oldScore = this.score;
        this.sizeLevel = 1;
        this.radius = 15; // Initial radius for level 1
        this.score = Math.floor(oldScore / 2);

        // Reset speed
        this.baseSpeed = 2.0;
        this.speed = this.baseSpeed;

        // Reset movement
        this.velocityX = 0;
        this.velocityY = 0;

        // Reset state
        this.isAlive = true;
        this.fishEaten = 0;
        this.fishNeededToGrow = 5;
        this.growthProgress = 0;
        this.boosting = false;
        this.respawnTimer = 0; // Reset respawn timer

        // Reset color
        this.color = this.baseColor;

        // Reset growth animation
        this.growthAnimation.active = false;
        this.growthAnimation.timer = 0;

        // Update UI if this is the current player
        if (this.isCurrentPlayer) {
            document.getElementById('size-level').textContent = `Level: ${this.sizeLevel}`;
            this.updateGrowthProgressBar();
        }
    }

    activatePowerUp(type, duration) {
        // Power-ups disabled
        /*
        switch(type) {
            case 'speedBoost':
                this.powerUps.speedBoost.active = true;
                this.powerUps.speedBoost.duration = duration;
                this.speed = this.baseSpeed * this.powerUps.speedBoost.multiplier;
                break;
            case 'invincibility':
                this.powerUps.invincibility.active = true;
                this.powerUps.invincibility.duration = duration;
                break;
            case 'doublePoints':
                this.powerUps.doublePoints.active = true;
                this.powerUps.doublePoints.duration = duration;
                break;
            case 'magnetism':
                this.powerUps.magnetism.active = true;
                this.powerUps.magnetism.duration = duration;
                break;
        }
        */
    }

    updatePowerUps() {
        // Power-ups disabled
        /*
        // Update speed boost
        if (this.powerUps.speedBoost.active) {
            this.powerUps.speedBoost.duration--;
            if (this.powerUps.speedBoost.duration <= 0) {
                this.powerUps.speedBoost.active = false;
                this.speed = this.baseSpeed;
            }
        }

        // Update invincibility
        if (this.powerUps.invincibility.active) {
            this.powerUps.invincibility.duration--;
            if (this.powerUps.invincibility.duration <= 0) {
                this.powerUps.invincibility.active = false;
            }
        }

        // Update double points
        if (this.powerUps.doublePoints.active) {
            this.powerUps.doublePoints.duration--;
            if (this.powerUps.doublePoints.duration <= 0) {
                this.powerUps.doublePoints.active = false;
            }
        }

        // Update magnetism
        if (this.powerUps.magnetism.active) {
            this.powerUps.magnetism.duration--;
            if (this.powerUps.magnetism.duration <= 0) {
                this.powerUps.magnetism.active = false;
            }
        }
        */
    }

    canEat(otherFish) {
        // Simple size check - can eat fish that are smaller
        return this.radius > otherFish.radius * 0.99;
    }

    canBeEatenBy(otherFish) {
        // Simple size check - can be eaten by fish that are larger
        return otherFish.radius > this.radius * 0.99;
    }

    // Update growth animation
    updateGrowthAnimation() {
        // Increment timer
        this.growthAnimation.timer++;

        // Calculate progress (0 to 1)
        const progress = Math.min(1, this.growthAnimation.timer / this.growthAnimation.duration);

        // Apply easing for smooth animation
        const easedProgress = this.easeOutElastic(progress);

        // Update radius with smooth transition
        this.radius = this.growthAnimation.startRadius +
            (this.growthAnimation.targetRadius - this.growthAnimation.startRadius) * easedProgress;

        // Update glow intensity - peaks in the middle of the animation
        this.growthAnimation.glowIntensity = Math.sin(progress * Math.PI);

        // Update particles
        this.updateGrowthParticles(progress);

        // End animation when complete
        if (progress >= 1) {
            this.growthAnimation.active = false;
            this.radius = this.growthAnimation.targetRadius; // Ensure final radius is exact
        }
    }

    /**
     * Creates particles for growth animation with enhanced visual effects
     * @returns {Array} Array of particle objects
     * @private
     */
    createGrowthParticles() {
        const particles = [];
        const particleCount = 20 + this.sizeLevel * 3; // More particles for larger fish

        // Create particles in multiple rings for a more dynamic effect
        for (let ring = 0; ring < 2; ring++) {
            const ringDistance = this.radius * (1.1 + ring * 0.3);
            const ringParticles = Math.floor(particleCount * (ring === 0 ? 0.6 : 0.4));

            for (let i = 0; i < ringParticles; i++) {
                // Add some randomness to the angle for a more natural look
                const angle = (Math.PI * 2 / ringParticles) * i + (Math.random() * 0.2 - 0.1);
                const distance = ringDistance * (0.9 + Math.random() * 0.2);

                // Get base color and add some variation
                const baseColor = this.getGlowColor();
                const colorVariation = Math.random() > 0.7 ? this.color : baseColor;

                particles.push({
                    x: this.x + Math.cos(angle) * distance,
                    y: this.y + Math.sin(angle) * distance,
                    angle: angle,
                    speed: 0.5 + Math.random() * 2.0,
                    size: 2 + Math.random() * 4,
                    opacity: 1,
                    color: colorVariation,
                    // Add rotation for some particles
                    rotation: Math.random() > 0.5 ? (Math.random() * 0.1 - 0.05) : 0,
                    // Add pulsing effect
                    pulse: Math.random() > 0.5,
                    pulseSpeed: 0.03 + Math.random() * 0.05,
                    pulseAmount: 0
                });
            }
        }

        return particles;
    }

    /**
     * Draws growth particles with enhanced visual effects
     * @private
     */
    drawGrowthParticles() {
        for (const particle of this.growthAnimation.particles) {
            this.ctx.save();

            // Apply rotation if particle has it
            if (particle.rotation) {
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate(particle.angle + particle.rotation * this.growthAnimation.timer);
                this.ctx.translate(-particle.x, -particle.y);
            }

            // Calculate actual size with pulse effect if enabled
            const displaySize = particle.pulse
                ? particle.size + Math.sin(particle.pulseAmount) * (particle.size * 0.3)
                : particle.size;

            try {
                // Ensure particle has a valid color, or use a default
                const particleColor = particle.color || this.getGlowColor();
                const rgbColor = this.hexToRgb(particleColor);

                // Draw particle - use different shapes for variety
                if (Math.random() > 0.7 && particle.pulse) {
                    // Star shape for some particles
                    this.drawStar(particle.x, particle.y, 5, displaySize, displaySize/2,
                        `rgba(${rgbColor}, ${particle.opacity})`);
                } else {
                    // Circle shape for most particles
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, displaySize, 0, Math.PI * 2);
                    this.ctx.fillStyle = `rgba(${rgbColor}, ${particle.opacity})`;
                    this.ctx.fill();
                    this.ctx.closePath();
                }
            } catch (error) {
                console.error('Error drawing particle:', error);
                // Continue with the next particle
            }

            this.ctx.restore();
        }

        // Draw ripple effects if they exist
        if (this.growthAnimation.ripples && this.growthAnimation.ripples.length > 0) {
            this.drawGrowthRipple();
        }
    }

    /**
     * Draws a star shape
     * @param {number} cx - Center x coordinate
     * @param {number} cy - Center y coordinate
     * @param {number} spikes - Number of spikes
     * @param {number} outerRadius - Outer radius
     * @param {number} innerRadius - Inner radius
     * @param {string} color - Fill color
     * @private
     */
    drawStar(cx, cy, spikes, outerRadius, innerRadius, color) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }

        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    /**
     * Creates multiple ripple effects around the fish when growing
     * @private
     */
    createGrowthRipple() {
        try {
            // Create multiple ripples for a more dynamic effect
            this.growthAnimation.ripples = [];

            // Number of ripples based on size level
            const rippleCount = Math.min(3, 1 + Math.floor(this.sizeLevel / 3));

            // Get default colors to ensure they're valid
            const glowColor = this.getGlowColor();
            const fishColor = this.color && typeof this.color === 'string' ? this.color : '#3399FF';

            for (let i = 0; i < rippleCount; i++) {
                // Stagger the start times
                const delay = i * 5;

                this.growthAnimation.ripples.push({
                    radius: this.radius * 1.2,
                    maxRadius: this.radius * (3 + i * 0.5), // Larger max radius for each subsequent ripple
                    opacity: 0.8,
                    width: 3 + i * 0.5, // Slightly thicker for each subsequent ripple
                    delay: delay,
                    active: i === 0, // Only the first ripple starts active
                    // Color varies slightly for each ripple
                    color: i === 0 ? glowColor : fishColor
                });
            }
        } catch (error) {
            console.error('Error creating growth ripple:', error);
            // Create a simple fallback ripple with safe values
            this.growthAnimation.ripples = [{
                radius: this.radius * 1.2,
                maxRadius: this.radius * 3,
                opacity: 0.8,
                width: 3,
                delay: 0,
                active: true,
                color: '#FFFFFF' // White is always safe
            }];
        }
    }

    /**
     * Draws enhanced ripple effects with gradient and glow
     * @private
     */
    drawGrowthRipple() {
        if (!this.growthAnimation.ripples) return;

        // Process each ripple
        for (let i = this.growthAnimation.ripples.length - 1; i >= 0; i--) {
            const ripple = this.growthAnimation.ripples[i];

            // Skip if not active yet
            if (!ripple.active) {
                ripple.delay--;
                if (ripple.delay <= 0) {
                    ripple.active = true;
                }
                continue;
            }

            try {
                // Ensure ripple has a valid color, or use a default
                const rippleColor = ripple.color || this.getGlowColor();
                const rgbColor = this.hexToRgb(rippleColor);

                // Create gradient for more visually appealing ripple
                const gradient = this.ctx.createRadialGradient(
                    this.x, this.y, ripple.radius - ripple.width,
                    this.x, this.y, ripple.radius + ripple.width
                );

                gradient.addColorStop(0, `rgba(${rgbColor}, 0)`);
                gradient.addColorStop(0.5, `rgba(${rgbColor}, ${ripple.opacity})`);
                gradient.addColorStop(1, `rgba(${rgbColor}, 0)`);

                // Draw the ripple circle with gradient
                this.ctx.beginPath();
                this.ctx.arc(this.x, this.y, ripple.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = ripple.width * 2; // Wider for gradient effect
                this.ctx.stroke();
                this.ctx.closePath();

                // Add a subtle glow effect
                this.ctx.beginPath();
                this.ctx.arc(this.x, this.y, ripple.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(${rgbColor}, ${ripple.opacity * 0.3})`;
                this.ctx.lineWidth = ripple.width * 3; // Even wider for glow
                this.ctx.stroke();
                this.ctx.closePath();
            } catch (error) {
                console.error('Error drawing ripple:', error);
                // Continue with the next ripple
            }

            // Update ripple properties
            ripple.radius += 2 + (this.sizeLevel * 0.1); // Faster expansion for larger fish
            ripple.opacity -= 0.015;
            ripple.width -= 0.03;

            // Remove ripple when it's faded out or reached max size
            if (ripple.opacity <= 0 || ripple.radius >= ripple.maxRadius) {
                this.growthAnimation.ripples.splice(i, 1);
            }
        }
    }

    /**
     * Updates growth particles animation
     * @param {number} progress - Animation progress from 0 to 1
     * @private
     */
    updateGrowthParticles(progress) {
        for (const particle of this.growthAnimation.particles) {
            // Move particles outward
            particle.x += Math.cos(particle.angle) * particle.speed;
            particle.y += Math.sin(particle.angle) * particle.speed;

            // Fade out as animation progresses
            particle.opacity = Math.max(0, 1 - progress * 1.5);

            // Increase size slightly
            particle.size += 0.05;

            // Update pulse effect
            if (particle.pulse) {
                particle.pulseAmount += particle.pulseSpeed;
            }

            // Add slight drift to angle for more natural movement
            particle.angle += (Math.random() * 0.04 - 0.02) * particle.speed;
        }
    }

    // Get glow color based on size level
    getGlowColor() {
        // Different colors for different size levels
        const colors = [
            '#FFFFFF', // White (default)
            '#7DF9FF', // Electric Blue (level 2-3)
            '#00FF00', // Green (level 4-5)
            '#FFFF00', // Yellow (level 6-7)
            '#FFA500', // Orange (level 8-9)
            '#FF0000'  // Red (level 10+)
        ];

        const colorIndex = Math.min(colors.length - 1, Math.floor((this.sizeLevel - 1) / 2));
        return colors[colorIndex];
    }

    // Update fish color based on size level
    updateFishColor() {
        // Subtle color changes as fish grows
        const hue = 210; // Base blue hue
        const saturation = 70 + Math.min(30, this.sizeLevel * 3); // Increase saturation with size
        const lightness = Math.max(40, 60 - this.sizeLevel * 2); // Decrease lightness with size (darker)

        this.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    /**
     * Converts a color string (hex or hsl) to RGB format
     * @param {string} color - Color in hex or hsl format
     * @returns {string} RGB values as "r, g, b"
     * @private
     */
    hexToRgb(color) {
        try {
            // Handle null or undefined
            if (!color) {
                console.warn('Invalid color provided to hexToRgb:', color);
                return '255, 255, 255';
            }

            // Check if it's an HSL color
            if (typeof color === 'string' && color.startsWith('hsl')) {
                // Extract HSL values - handle both comma and space separators
                const hslMatch = color.match(/hsl\((\d+)[,\s]\s*(\d+)%[,\s]\s*(\d+)%\)/);
                if (hslMatch) {
                    // Convert HSL to RGB
                    return this.hslToRgb(
                        parseInt(hslMatch[1]),
                        parseInt(hslMatch[2]),
                        parseInt(hslMatch[3])
                    );
                }

                // Try another pattern for HSL
                const simplifiedMatch = color.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
                if (simplifiedMatch) {
                    return this.hslToRgb(
                        parseInt(simplifiedMatch[1]),
                        parseInt(simplifiedMatch[2]),
                        parseInt(simplifiedMatch[3])
                    );
                }

                console.warn('Failed to parse HSL color:', color);
                return '255, 255, 255';
            }

            // Handle hex colors
            // Remove # if present
            let hex = color.replace('#', '');

            // Convert 3-digit hex to 6-digit
            if (hex.length === 3) {
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            }

            // Parse the hex values
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);

            // Check if parsing was successful
            if (isNaN(r) || isNaN(g) || isNaN(b)) {
                console.warn('Failed to parse hex color:', color);
                // Return white as fallback
                return '255, 255, 255';
            }

            return `${r}, ${g}, ${b}`;
        } catch (error) {
            console.error('Error in hexToRgb:', error);
            return '255, 255, 255'; // Return white as fallback
        }
    }

    /**
     * Converts HSL color values to RGB string
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} l - Lightness (0-100)
     * @returns {string} RGB values as "r, g, b"
     * @private
     */
    hslToRgb(h, s, l) {
        // Convert HSL percentages to fractions
        s /= 100;
        l /= 100;

        // Algorithm to convert HSL to RGB
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

        // Calculate RGB values (0-255)
        const r = Math.round(255 * f(0));
        const g = Math.round(255 * f(8));
        const b = Math.round(255 * f(4));

        return `${r}, ${g}, ${b}`;
    }

    // Easing function for smooth animation
    easeOutElastic(x) {
        const c4 = (2 * Math.PI) / 3;

        return x === 0
            ? 0
            : x === 1
            ? 1
            : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }

    reset() {
        // Update world dimensions in case of resize
        this.worldWidth = window.innerWidth * 3;
        this.worldHeight = window.innerHeight * 3;

        // Reset position to center of world
        this.x = this.worldWidth / 2;
        this.y = this.worldHeight / 2;

        this.sizeLevel = 1;
        this.radius = 15; // Initial radius for level 1
        this.baseSpeed = 2.0;
        this.speed = this.baseSpeed;
        this.fishEaten = 0;
        this.fishNeededToGrow = 5;
        this.growthProgress = 0;
        this.score = 0;

        // Reset color
        this.color = this.baseColor;

        // Reset boost
        this.boosting = false;

        // Reset growth animation
        this.growthAnimation.active = false;
        this.growthAnimation.timer = 0;

        // Reset all power-ups
        this.powerUps.speedBoost.active = false;
        this.powerUps.invincibility.active = false;
        this.powerUps.doublePoints.active = false;
        this.powerUps.magnetism.active = false;

        this.velocityX = 0;
        this.velocityY = 0;

        // Reset state
        this.isAlive = true;

        // Update UI
        if (this.isCurrentPlayer) {
            // Score display and game HUD removed
        }
    }
}
