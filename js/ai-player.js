/**
 * AI Player class - simulates other players for PvP gameplay
 */
class AIPlayer {
    constructor(canvas, worldWidth, worldHeight, name, color, startSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // World dimensions
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;

        // Player identity
        this.name = name || this.generateRandomName();
        this.color = color || this.generateRandomColor();

        // Position randomly within the world, away from edges
        this.x = random(this.worldWidth * 0.2, this.worldWidth * 0.8);
        this.y = random(this.worldHeight * 0.2, this.worldHeight * 0.8);

        // Size and growth properties
        this.sizeLevel = startSize || random(1, 3);

        // Calculate radius using the same formula as the player fish
        this.radius = 15; // Base radius for level 1

        // Add growth for each level above 1
        for (let i = 1; i < this.sizeLevel; i++) {
            this.radius += 5 + Math.floor(i / 2) * 2;
        }
        this.baseSpeed = Math.max(1.5, 3 - (this.sizeLevel * 0.2)); // Bigger = slower
        this.speed = this.baseSpeed;

        // Movement properties
        this.velocityX = 0;
        this.velocityY = 0;
        this.angle = random(0, Math.PI * 2);
        this.targetX = this.x;
        this.targetY = this.y;
        this.inertia = 0.9;
        this.changeDirectionCounter = 0;
        this.changeDirectionInterval = random(100, 200);

        // Scoring and status
        this.score = this.sizeLevel * 100;
        this.isAlive = true;
        this.respawnTimer = 0;

        // AI behavior
        this.targetPlayer = null;
        this.fleeingFrom = null;
        this.state = 'wandering'; // wandering, hunting, fleeing
        this.stateTimer = 0;

        // Visual properties
        this.eyeColor = 'white';
        this.pupilColor = 'black';
    }

    generateRandomName() {
        const prefixes = ['Big', 'Fast', 'Hungry', 'Sneaky', 'Angry', 'Happy', 'Sleepy', 'Grumpy', 'Tiny', 'Giant'];
        const fishTypes = ['Shark', 'Tuna', 'Clown', 'Puffer', 'Angel', 'Sword', 'Jelly', 'Manta', 'Eel', 'Whale'];
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${fishTypes[Math.floor(Math.random() * fishTypes.length)]}`;
    }

    generateRandomColor() {
        const colors = [
            '#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
            '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
            '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
            '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update(players, foods) {
        if (!this.isAlive) {
            this.respawnTimer++;
            if (this.respawnTimer >= 300) { // 5 seconds at 60fps
                this.respawn();
            }
            return;
        }

        // Update AI state
        this.updateAIState(players);

        // Move based on current state
        this.moveBasedOnState(players, foods);

        // Apply movement with inertia
        this.velocityX = this.velocityX * this.inertia + (Math.cos(this.angle) * this.speed) * (1 - this.inertia);
        this.velocityY = this.velocityY * this.inertia + (Math.sin(this.angle) * this.speed) * (1 - this.inertia);

        this.x += this.velocityX;
        this.y += this.velocityY;

        // Keep within world bounds
        const margin = this.radius;
        if (this.x < margin) {
            this.x = margin;
            this.velocityX = 0;
            this.angle = random(-Math.PI/3, Math.PI/3); // Bounce right
        } else if (this.x > this.worldWidth - margin) {
            this.x = this.worldWidth - margin;
            this.velocityX = 0;
            this.angle = Math.PI + random(-Math.PI/3, Math.PI/3); // Bounce left
        }

        if (this.y < margin) {
            this.y = margin;
            this.velocityY = 0;
            this.angle = random(0, Math.PI); // Bounce down
        } else if (this.y > this.worldHeight - margin) {
            this.y = this.worldHeight - margin;
            this.velocityY = 0;
            this.angle = random(Math.PI, Math.PI * 2); // Bounce up
        }
    }

    updateAIState(players) {
        this.stateTimer--;
        if (this.stateTimer <= 0) {
            // Randomly change state
            const roll = Math.random();
            if (roll < 0.7) {
                this.state = 'wandering';
            } else {
                this.state = 'hunting';
            }
            this.stateTimer = random(150, 300);
        }

        // Find nearest player that can be eaten
        let nearestPrey = null;
        let nearestPreyDistance = Infinity;

        // Find nearest player that can eat this AI
        let nearestPredator = null;
        let nearestPredatorDistance = Infinity;

        for (const player of players) {
            if (player === this || !player.isAlive) continue;

            const distance = calculateDistance(this.x, this.y, player.x, player.y);

            // Can this AI eat the player? (Using 1.05 threshold)
            if (this.radius > player.radius * 1.05) {
                if (distance < nearestPreyDistance) {
                    nearestPrey = player;
                    nearestPreyDistance = distance;
                }
            }

            // Can the player eat this AI? (Using 1.05 threshold)
            if (player.radius > this.radius * 1.05) {
                if (distance < nearestPredatorDistance) {
                    nearestPredator = player;
                    nearestPredatorDistance = distance;
                }
            }
        }

        // If a predator is nearby, flee
        if (nearestPredator && nearestPredatorDistance < 200) {
            this.state = 'fleeing';
            this.fleeingFrom = nearestPredator;
            this.stateTimer = 60;
        }

        // If prey is nearby and no predator, hunt
        if (nearestPrey && nearestPreyDistance < 300 && this.state !== 'fleeing') {
            this.state = 'hunting';
            this.targetPlayer = nearestPrey;
            this.stateTimer = 120;
        }
    }

    moveBasedOnState(players, foods) {
        switch (this.state) {
            case 'wandering':
                this.wander();
                break;

            case 'hunting':
                if (this.targetPlayer && this.targetPlayer.isAlive) {
                    this.huntPlayer(this.targetPlayer);
                } else {
                    // Find food if no target player
                    this.findNearestFood(foods);
                }
                break;

            case 'fleeing':
                if (this.fleeingFrom && this.fleeingFrom.isAlive) {
                    this.fleeFromPlayer(this.fleeingFrom);
                } else {
                    this.state = 'wandering';
                }
                break;
        }
    }

    wander() {
        this.changeDirectionCounter++;
        if (this.changeDirectionCounter >= this.changeDirectionInterval) {
            // Random direction with slight horizontal bias
            if (Math.random() < 0.6) {
                this.angle = (Math.random() < 0.5 ? 0 : Math.PI) + random(-Math.PI/3, Math.PI/3);
            } else {
                this.angle = random(0, Math.PI * 2);
            }
            this.changeDirectionCounter = 0;
            this.changeDirectionInterval = random(100, 200);
        }
    }

    huntPlayer(player) {
        // Calculate angle to target
        this.angle = calculateAngle(this.x, this.y, player.x, player.y);

        // Add slight randomness
        this.angle += random(-Math.PI/8, Math.PI/8);
    }

    fleeFromPlayer(player) {
        // Calculate angle away from predator
        this.angle = calculateAngle(player.x, player.y, this.x, this.y);

        // Add randomness to make it harder to predict
        this.angle += random(-Math.PI/4, Math.PI/4);
    }

    findNearestFood(foods) {
        if (!foods || foods.length === 0) return;

        let nearestFood = null;
        let nearestDistance = Infinity;

        for (const food of foods) {
            const distance = calculateDistance(this.x, this.y, food.x, food.y);
            if (distance < nearestDistance) {
                nearestFood = food;
                nearestDistance = distance;
            }
        }

        if (nearestFood && nearestDistance < 200) {
            this.angle = calculateAngle(this.x, this.y, nearestFood.x, nearestFood.y);
        }
    }

    draw() {
        if (!this.isAlive) return;

        this.ctx.save();

        // Draw fish body
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.color;
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
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
        this.ctx.closePath();

        // Draw eye
        const eyeX = this.x + Math.cos(this.angle) * (this.radius * 0.5);
        const eyeY = this.y + Math.sin(this.angle) * (this.radius * 0.5);
        const eyeRadius = this.radius * 0.3;

        this.ctx.beginPath();
        this.ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.eyeColor;
        this.ctx.fill();
        this.ctx.closePath();

        // Draw pupil
        const pupilX = eyeX + Math.cos(this.angle) * (eyeRadius * 0.5);
        const pupilY = eyeY + Math.sin(this.angle) * (eyeRadius * 0.5);
        const pupilRadius = eyeRadius * 0.5;

        this.ctx.beginPath();
        this.ctx.arc(pupilX, pupilY, pupilRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.pupilColor;
        this.ctx.fill();
        this.ctx.closePath();

        // Draw name above fish
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.name, this.x, this.y - this.radius - 5);

        this.ctx.restore();
    }

    grow(amount) {
        this.sizeLevel += amount;

        // Calculate growth amount using the same formula as the player fish
        const growthAmount = amount * (5 + Math.floor(this.sizeLevel / 2) * 2);
        this.radius += growthAmount;
        this.score += amount * 100;

        // Update speed (slightly decrease as fish gets bigger)
        this.baseSpeed = Math.max(1.5, 3 - (this.sizeLevel * 0.2));
        this.speed = this.baseSpeed;

        return true;
    }

    die() {
        this.isAlive = false;
        this.respawnTimer = 0;
    }

    respawn() {
        // Reset position to a random location
        this.x = random(this.worldWidth * 0.1, this.worldWidth * 0.9);
        this.y = random(this.worldHeight * 0.1, this.worldHeight * 0.9);

        // Reset size and score
        this.sizeLevel = random(1, 3);

        // Calculate radius using the same formula as the player fish
        this.radius = 15; // Base radius for level 1

        // Add growth for each level above 1
        for (let i = 1; i < this.sizeLevel; i++) {
            this.radius += 5 + Math.floor(i / 2) * 2;
        }
        this.score = this.sizeLevel * 100;

        // Reset speed
        this.baseSpeed = Math.max(1.5, 3 - (this.sizeLevel * 0.2));
        this.speed = this.baseSpeed;

        // Reset movement
        this.velocityX = 0;
        this.velocityY = 0;
        this.angle = random(0, Math.PI * 2);

        // Reset state
        this.isAlive = true;
        this.state = 'wandering';
        this.stateTimer = 60;
    }

    canEat(otherPlayer) {
        return this.radius > otherPlayer.radius * 1.05;
    }

    canBeEatenBy(otherPlayer) {
        return otherPlayer.radius > this.radius * 1.05;
    }
}
