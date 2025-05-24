/**
 * Multiplayer functionality for Fish Eat Fish game
 */
class MultiplayerManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.connected = false;
        this.players = {}; // Other players in the game
        this.lastUpdateTime = 0;
        this.updateInterval = 50; // Send updates every 50ms
        // Connection status element removed from UI
    }

    /**
     * Connect to the multiplayer server
     */
    connect() {
        // Check if Socket.IO is available
        if (typeof io === 'undefined') {
            console.error('Socket.IO client not available. Make sure you are running the game through the Node.js server.');
            this.updateConnectionStatus('Error: Socket.IO not available');
            return;
        }

        // Connect to the server
        this.socket = io();

        // Set up event listeners
        this.setupEventListeners();

        // Update connection status
        this.updateConnectionStatus('Connecting...');
    }

    /**
     * Set up Socket.IO event listeners
     */
    setupEventListeners() {
        // Connection established
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.connected = true;
            this.updateConnectionStatus('Connected');

            // Send player data to server
            this.joinGame();
        });

        // Connection lost
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.connected = false;
            this.updateConnectionStatus('Disconnected');
        });

        // Connection error
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.connected = false;
            this.updateConnectionStatus('Connection error');
        });

        // Connection timeout
        this.socket.on('connect_timeout', () => {
            console.error('Connection timeout');
            this.connected = false;
            this.updateConnectionStatus('Connection timeout');
        });

        // Receive initial game state
        this.socket.on('gameState', (gameState) => {
            console.log('Received game state:', gameState);

            // Initialize other players
            this.players = {};
            for (const playerId in gameState.players) {
                if (playerId !== this.socket.id) {
                    this.players[playerId] = this.createRemotePlayer(gameState.players[playerId]);

                    // Add to leaderboard
                    this.game.leaderboard.addPlayer(this.players[playerId]);
                }
            }

            // Initialize food
            this.game.foods = [];
            for (const food of gameState.foods) {
                this.game.foods.push(this.createFoodFromServer(food));
            }


        });

        // New player joined
        this.socket.on('playerJoined', (playerData) => {
            console.log('Player joined:', playerData);

            // Create remote player
            this.players[playerData.id] = this.createRemotePlayer(playerData);

            // Calculate radius if not provided
            if (!playerData.radius) {
                this.players[playerData.id].calculateRadiusFromSizeLevel();
            }

            // Add to leaderboard
            this.game.leaderboard.addPlayer(this.players[playerData.id]);

            // Show floating text
            this.game.showFloatingText(`${playerData.name} joined!`, this.game.canvas.width / 2, 50, '#FFFFFF', 20);
        });

        // Player left
        this.socket.on('playerLeft', (playerId) => {
            if (this.players[playerId]) {
                console.log('Player left:', this.players[playerId].name);

                // Show floating text
                this.game.showFloatingText(`${this.players[playerId].name} left!`, this.game.canvas.width / 2, 50, '#FFFFFF', 20);

                // Get player reference before removing
                const player = this.players[playerId];

                // Remove from players list
                delete this.players[playerId];

                // Remove from leaderboard
                this.game.leaderboard.removePlayer(player);


            }
        });

        // Player moved
        this.socket.on('playerMoved', (playerData) => {
            if (this.players[playerData.id]) {
                // Update player position and properties
                const player = this.players[playerData.id];
                player.x = playerData.x;
                player.y = playerData.y;
                player.angle = playerData.angle;
                player.score = playerData.score;
                player.sizeLevel = playerData.sizeLevel;
                player.isAlive = playerData.isAlive;

                // If radius is not provided, calculate it from size level
                if (!playerData.radius && player.sizeLevel) {
                    player.calculateRadiusFromSizeLevel();
                } else {
                    player.radius = playerData.radius;
                }
            }
        });

        // Player died
        this.socket.on('playerDied', (playerId) => {
            if (this.players[playerId]) {
                this.players[playerId].isAlive = false;
            }
        });

        // Player respawned
        this.socket.on('playerRespawned', (playerData) => {
            if (this.players[playerData.id]) {
                const player = this.players[playerData.id];
                player.x = playerData.x;
                player.y = playerData.y;
                player.score = playerData.score;
                player.sizeLevel = playerData.sizeLevel;
                player.isAlive = true;

                // If radius is not provided, calculate it from size level
                if (!playerData.radius && player.sizeLevel) {
                    player.calculateRadiusFromSizeLevel();
                } else {
                    player.radius = playerData.radius;
                }
            }
        });

        // Food spawned
        this.socket.on('foodSpawned', (foodData) => {
            this.game.foods.push(this.createFoodFromServer(foodData));
        });

        // Food removed
        this.socket.on('foodRemoved', (foodId) => {
            const foodIndex = this.game.foods.findIndex(food => food.id === foodId);
            if (foodIndex !== -1) {
                this.game.foods.splice(foodIndex, 1);
            }
        });
    }

    /**
     * Join the game by sending player data to the server
     */
    joinGame() {
        if (!this.connected || !this.game.player) return;

        // Send player data to server
        this.socket.emit('playerJoin', {
            name: this.game.player.name,
            x: this.game.player.x,
            y: this.game.player.y,
            radius: this.game.player.radius,
            color: this.game.player.color,
            eyeColor: this.game.player.eyeColor,
            pupilColor: this.game.player.pupilColor,
            angle: this.game.player.angle,
            worldWidth: this.game.worldWidth,
            worldHeight: this.game.worldHeight
        });
    }

    /**
     * Send player update to the server
     */
    sendPlayerUpdate() {
        if (!this.connected || !this.game.player || !this.game.player.isAlive) return;

        // Limit update frequency
        const now = Date.now();
        if (now - this.lastUpdateTime < this.updateInterval) return;
        this.lastUpdateTime = now;

        // Ensure player score is synced with game score
        if (this.game.player.score !== this.game.score) {
            this.game.player.score = this.game.score;
        }

        // Send player data to server
        this.socket.emit('playerUpdate', {
            x: this.game.player.x,
            y: this.game.player.y,
            radius: this.game.player.radius,
            angle: this.game.player.angle,
            score: this.game.player.score,
            sizeLevel: this.game.player.sizeLevel,
            isAlive: this.game.player.isAlive
        });
    }

    /**
     * Notify server that player has eaten food
     * @param {Object} food - The food that was eaten
     */
    sendFoodEaten(food) {
        if (!this.connected) return;

        this.socket.emit('foodEaten', food.id);
    }

    /**
     * Notify server that player has eaten another player
     * @param {Object} player - The player that was eaten
     */
    sendPlayerEaten(player) {
        if (!this.connected) return;

        this.socket.emit('playerEaten', player.id);
    }

    /**
     * Notify server that player has respawned
     */
    sendPlayerRespawn() {
        if (!this.connected || !this.game.player) return;

        this.socket.emit('playerRespawn', {
            x: this.game.player.x,
            y: this.game.player.y,
            radius: this.game.player.radius,
            score: this.game.player.score,
            sizeLevel: this.game.player.sizeLevel
        });
    }

    /**
     * Create a remote player object from server data
     * @param {Object} playerData - Player data from server
     * @returns {Object} - Remote player object
     */
    createRemotePlayer(playerData) {
        // Create a player object similar to PlayerFish but simpler
        const player = {
            id: playerData.id,
            name: playerData.name,
            x: playerData.x,
            y: playerData.y,
            radius: playerData.radius,
            color: playerData.color || '#FF6633',
            eyeColor: playerData.eyeColor || 'white',
            pupilColor: playerData.pupilColor || 'black',
            angle: playerData.angle || 0,
            score: playerData.score || 0,
            sizeLevel: playerData.sizeLevel || 1,
            isAlive: playerData.isAlive !== undefined ? playerData.isAlive : true,
            isCurrentPlayer: false,

            // Calculate radius based on size level if not provided
            calculateRadiusFromSizeLevel: function() {
                if (!this.radius && this.sizeLevel) {
                    // Base radius for level 1
                    this.radius = 15;

                    // Add growth for each level above 1
                    for (let i = 1; i < this.sizeLevel; i++) {
                        this.radius += 5 + Math.floor(i / 2) * 2;
                    }
                }
            },

            // Simplified draw method
            draw: function(ctx) {
                if (!this.isAlive) return;

                ctx.save();

                // Draw fish body
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.closePath();

                // Draw fish direction (simple triangle)
                const directionX = this.x + Math.cos(this.angle) * this.radius;
                const directionY = this.y + Math.sin(this.angle) * this.radius;

                ctx.beginPath();
                ctx.moveTo(directionX, directionY);
                ctx.lineTo(
                    directionX - Math.cos(this.angle - Math.PI/6) * (this.radius * 0.5),
                    directionY - Math.sin(this.angle - Math.PI/6) * (this.radius * 0.5)
                );
                ctx.lineTo(
                    directionX - Math.cos(this.angle + Math.PI/6) * (this.radius * 0.5),
                    directionY - Math.sin(this.angle + Math.PI/6) * (this.radius * 0.5)
                );
                ctx.closePath();
                ctx.fillStyle = this.color;
                ctx.fill();

                // Draw eye
                const eyeRadius = this.radius * 0.25;
                const eyeDistance = this.radius * 0.5;
                const eyeAngle = this.angle + Math.PI / 6; // Slightly to the side

                const eyeX = this.x + Math.cos(eyeAngle) * eyeDistance;
                const eyeY = this.y + Math.sin(eyeAngle) * eyeDistance;

                ctx.beginPath();
                ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
                ctx.fillStyle = this.eyeColor;
                ctx.fill();
                ctx.closePath();

                // Draw pupil
                const pupilRadius = eyeRadius * 0.5;
                const pupilX = eyeX + Math.cos(this.angle) * (eyeRadius * 0.3);
                const pupilY = eyeY + Math.sin(this.angle) * (eyeRadius * 0.3);

                ctx.beginPath();
                ctx.arc(pupilX, pupilY, pupilRadius, 0, Math.PI * 2);
                ctx.fillStyle = this.pupilColor;
                ctx.fill();
                ctx.closePath();

                // Draw name above fish
                ctx.font = '12px Arial';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.fillText(this.name, this.x, this.y - this.radius - 5);

                ctx.restore();
            },

            // Simplified methods for collision detection
            canEat: function(otherFish) {
                return this.radius > otherFish.radius * 0.99;
            },

            canBeEatenBy: function(otherFish) {
                return otherFish.radius > this.radius * 0.99;
            }
        };

        // Calculate radius if not provided
        if (!player.radius && player.sizeLevel) {
            player.calculateRadiusFromSizeLevel();
        }

        return player;
    }

    /**
     * Create a food object from server data
     * @param {Object} foodData - Food data from server
     * @returns {Object} - Food object
     */
    createFoodFromServer(foodData) {
        return {
            id: foodData.id,
            x: foodData.x,
            y: foodData.y,
            radius: foodData.radius || 5,
            value: foodData.value || 1,
            color: foodData.color || '#AAFFAA',

            // Simplified update method
            update: function() {
                // Food doesn't move in this implementation
                return false;
            },

            // Simplified draw method
            draw: function(ctx) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.closePath();
            }
        };
    }

    /**
     * Update the connection status (logging only)
     * @param {string} status - Connection status message
     */
    updateConnectionStatus(status) {
        // Log connection status to console
        console.log(`Connection status: ${status}`);
    }



    /**
     * Draw all remote players
     */
    drawPlayers(ctx) {
        for (const playerId in this.players) {
            const player = this.players[playerId];
            if (player.isAlive) {
                // Check if remote player is within elliptical vision area
                const dx = player.x - this.game.player.x;
                const dy = player.y - this.game.player.y;

                // Use the ellipse formula: (x/a)² + (y/b)² <= 1
                const visionRadiusX = this.game.canvas.width * 0.7; // 70% of screen width
                const visionRadiusY = this.game.canvas.height * 0.7; // 70% of screen height
                const normalizedDistance = Math.pow(dx / visionRadiusX, 2) + Math.pow(dy / visionRadiusY, 2);
                const isInVision = normalizedDistance <= 1;

                // Add visual indicator for fish within vision
                if (isInVision && this.game.player.isAlive) {
                    ctx.save();

                    // Add subtle outline based on size comparison
                    if (player.radius > this.game.player.radius * 1.2) {
                        // Dangerous fish - red outline
                        ctx.strokeStyle = 'rgba(255, 80, 80, 0.3)';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(player.x, player.y, player.radius + 5, 0, Math.PI * 2);
                        ctx.stroke();
                    } else if (player.radius < this.game.player.radius * 0.8) {
                        // Edible fish - green outline
                        ctx.strokeStyle = 'rgba(80, 255, 80, 0.3)';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(player.x, player.y, player.radius + 5, 0, Math.PI * 2);
                        ctx.stroke();
                    } else {
                        // Similar size fish - yellow outline
                        ctx.strokeStyle = 'rgba(255, 255, 80, 0.3)';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(player.x, player.y, player.radius + 5, 0, Math.PI * 2);
                        ctx.stroke();
                    }

                    ctx.restore();
                }

                // Draw the remote player
                player.draw(ctx);
            }
        }
    }

    /**
     * Check collisions between local player and remote players
     */
    checkPlayerCollisions() {
        if (!this.game.player || !this.game.player.isAlive) return;

        for (const playerId in this.players) {
            const remotePlayer = this.players[playerId];
            if (!remotePlayer.isAlive) continue;

            // Check collision
            const dx = this.game.player.x - remotePlayer.x;
            const dy = this.game.player.y - remotePlayer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.game.player.radius + remotePlayer.radius) {
                // Collision detected
                if (this.game.player.canEat(remotePlayer)) {
                    // Local player eats remote player
                    const points = remotePlayer.sizeLevel * 50;
                    this.game.updateScore(points);
                    this.game.player.eatFish(remotePlayer.sizeLevel * 0.5);
                    remotePlayer.isAlive = false;

                    // Notify server
                    this.sendPlayerEaten(remotePlayer);

                    // Show floating text
                    this.game.showFloatingText(`+${points}`, remotePlayer.x, remotePlayer.y, '#FFFF00', 18);
                    this.game.showFloatingText(`Ate ${remotePlayer.name}!`, this.game.player.x, this.game.player.y - this.game.player.radius - 30, '#00FF00', 16);
                } else if (this.game.player.canBeEatenBy(remotePlayer)) {
                    // Remote player eats local player
                    this.game.player.die();

                    // No need to show floating text here as handlePlayerDeath will handle it
                }
            }
        }
    }
}
