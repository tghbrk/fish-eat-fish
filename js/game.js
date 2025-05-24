/**
 * Main game class
 */
class Game {
    constructor() {
        // Get DOM elements
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas dimensions to full window size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Set up minimap
        this.minimap = document.getElementById('minimap');
        this.minimapCtx = this.minimap.getContext('2d');
        this.minimap.width = 200;
        this.minimap.height = 150;

        // Game world dimensions (larger than screen)
        this.worldWidth = window.innerWidth * 3;
        this.worldHeight = window.innerHeight * 3;

        // Camera position (centered on player)
        this.cameraX = 0;
        this.cameraY = 0;

        // Game state
        this.isRunning = false;
        this.score = 0;
        this.scoreMultiplier = 1;
        this.difficultyLevel = 1;
        this.difficultyTimer = 0;
        this.difficultyInterval = 3600; // 60 seconds at 60fps (slower difficulty progression)
        this.gameMode = 'pvp'; // PvP mode
        this.gameOverTimer = 0;
        this.respawnDelay = 180; // 3 seconds at 60fps
        this.deathHandled = false; // Flag to prevent multiple death handling

        // Level system
        this.level = 1;
        this.levelGoal = 500; // Score needed to advance to next level
        this.levelTransitioning = false;
        this.levelTransitionTimer = 0;
        this.levelTransitionDuration = 120; // 2 seconds at 60fps

        // Game objects
        this.player = null; // Will be initialized with player name
        this.aiPlayers = []; // AI opponents (disabled)
        this.foodManager = null; // Will be initialized in startGame
        this.enemies = [];
        this.powerUps = []; // Power-ups (disabled)
        this.floatingTexts = [];

        // Water background effect
        this.waterEffect = new WaterEffect(this.canvas);

        // Leaderboard
        this.leaderboard = new Leaderboard();

        // Multiplayer
        this.multiplayer = new MultiplayerManager(this);

        // Spawn timers
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 120; // 2 seconds at 60fps (slower enemy spawning)
        this.powerUpSpawnTimer = 0;
        this.powerUpSpawnInterval = 900; // 15 seconds at 60fps (slower power-up spawning - disabled)
        this.aiSpawnTimer = 0;
        this.aiSpawnInterval = 300; // Spawn a new AI player every 300 frames (about 5 seconds - disabled)
        this.foodSpawnTimer = 0;
        this.foodSpawnInterval = 30; // Spawn food every 30 frames (about 0.5 seconds)

        // Game configuration
        this.maxAiPlayers = 0; // Maximum number of AI players (disabled)
        this.maxFoodItems = 100; // Maximum number of food items

        // Animation frame ID
        this.animationFrameId = null;

        // Performance monitoring
        this.performanceMonitor = new PerformanceMonitor(60, false); // 60 frame sample, stats hidden by default

        // Cursor fade properties
        this.cursorFadeTimer = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.cursorMaxOpacity = 0.3; // Maximum opacity for cursor (reduced for more subtle appearance)
        this.cursorFadeDelay = 15; // Frames to wait before starting to fade (0.25 seconds at 60fps)
        this.cursorFadeDuration = 60; // How long it takes to fade out (1 second at 60fps)
        this.cursorAlwaysFade = true; // Always fade cursor during gameplay

        // Tutorial state
        this.tutorialActive = false;
        this.tutorialStep = 1;
        this.tutorialTotalSteps = 6; // Reduced from 7 since power-ups are removed
        this.firstTimePlayer = !localStorage.getItem('fishEatFishTutorialComplete');

        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));

        // Bind event listeners
        this.bindEventListeners();

        // Initialize the game
        this.init();
    }

    /**
     * Initializes the game and shows the loading screen
     */
    init() {
        // Show loading screen first
        this.showLoadingScreen();
    }

    /**
     * Shows the loading screen and simulates asset loading
     */
    showLoadingScreen() {
        // Loading screen is already visible by default

        // Simulate asset loading with a timeout
        setTimeout(() => {
            // Hide loading screen
            hideElement('loading-screen');

            // Show game container and main menu
            showElement('game-container');
        showElement('main-menu');

            // Preload some game assets in the background
            this.preloadAssets();
        }, 3000); // 3 seconds for loading screen
    }

    /**
     * Preloads game assets in the background
     * @private
     */
    preloadAssets() {
        // Initialize water effect in the background
        if (!this.waterEffect) {
            this.waterEffect = new WaterEffect(this.canvas);
        }

        // Pre-initialize food manager
        if (!this.foodManager) {
            this.foodManager = new FoodManager(this.canvas, this.worldWidth, this.worldHeight, this.maxFoodItems);
        }
    }

    bindEventListeners() {
        // Start button
        document.getElementById('start-button').addEventListener('click', () => {
            if (this.firstTimePlayer) {
                this.startTutorial();
            } else {
                this.startGame();
            }
        });

        // Add keyboard shortcut for performance stats (F key)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'f' || e.key === 'F') {
                this.togglePerformanceStats();
            }
        });

        // How to play button
        document.getElementById('how-to-play-button').addEventListener('click', () => {
            hideElement('main-menu');
            showElement('how-to-play');
        });

        // Back button
        document.getElementById('back-button').addEventListener('click', () => {
            hideElement('how-to-play');
            showElement('main-menu');
        });

        // Restart button
        document.getElementById('restart-button').addEventListener('click', () => {
            hideElement('game-over');
            this.startGame();
        });

        // Menu button
        document.getElementById('menu-button').addEventListener('click', () => {
            hideElement('game-over');
            showElement('main-menu');
        });

        // Tutorial navigation buttons
        document.getElementById('tutorial-next').addEventListener('click', () => {
            this.nextTutorialStep();
        });

        document.getElementById('tutorial-prev').addEventListener('click', () => {
            this.prevTutorialStep();
        });
    }

    handleResize() {
        // Update canvas dimensions
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Update world dimensions
        this.worldWidth = window.innerWidth * 3;
        this.worldHeight = window.innerHeight * 3;
    }

    startGame() {
        // Get player name from input (if coming from main menu)
        let playerName = document.getElementById('player-name').value.trim() || 'Player';

        // If restarting from game over, use the existing player name
        if (this.player && this.player.name) {
            playerName = this.player.name;
        }

        // Hide all screens and show game
        hideElement('main-menu');
        hideElement('tutorial-overlay');
        hideElement('game-over');
        showElement('game-canvas');
        // Game HUD removed to avoid overlap with leaderboard
        showElement('minimap-container');
        showElement('progress-bar-container');

        // Initialize or reset player
        if (!this.player) {
            this.player = new PlayerFish(this.canvas, playerName);
            this.player.color = '#3399FF'; // Blue color for player
            this.player.eyeColor = 'white';
            this.player.pupilColor = 'black';
        } else {
            this.player.name = playerName;
            this.player.reset(); // Reset player state completely
        }

        // Reset death handling flag
        this.deathHandled = false;

        // Connect to multiplayer server if running from server
        if (window.location.protocol !== 'file:') {
            this.multiplayer.connect();
        } else {
            console.log('Running in single-player mode (file protocol detected)');
        }

        // Player name display removed

        // Reset game state
        this.isRunning = true;
        this.score = 0;
        this.scoreMultiplier = 1;
        this.difficultyLevel = 1;
        this.difficultyTimer = 0;
        this.tutorialActive = false;

        // Reset level system
        this.level = 1;
        this.levelTransitioning = false;
        this.enemySpawnPaused = false;
        this.floatingTexts = [];

        // Update UI
        this.updateScore(0);
        const levelDisplay = document.getElementById('level-display');
        if (levelDisplay) {
            levelDisplay.textContent = `Level: ${this.level}`;
        }
        this.updateProgressBar();

        // Initialize growth progress bar and level number
        this.player.updateGrowthProgressBar();

        // Set initial level number
        const levelNumber = document.getElementById('level-number');
        if (levelNumber) {
            levelNumber.textContent = this.player.sizeLevel;
        }

        // Reset player
        this.player.reset();

        // Add player to leaderboard
        this.leaderboard.addPlayer(this.player);

        // Clear enemies, AI players, food, and power-ups
        this.enemies = [];
        this.aiPlayers = [];

        // Initialize or reset food manager
        if (!this.foodManager) {
            this.foodManager = new FoodManager(this.canvas, this.worldWidth, this.worldHeight, this.maxFoodItems);
        } else {
            this.foodManager.clear();
        }

        this.powerUps = [];

        // Reset spawn timers
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 120; // 2 seconds at 60fps
        this.powerUpSpawnTimer = 0;
        this.aiSpawnTimer = 0;
        this.foodSpawnTimer = 0;

        // In multiplayer mode, food is managed by the server
        // Only spawn initial food in single player mode
        if (!this.multiplayer.connected) {
        this.spawnInitialFood();
        }

        // Start game loop
        this.gameLoop();

        // Mark tutorial as complete
        if (this.firstTimePlayer) {
            localStorage.setItem('fishEatFishTutorialComplete', 'true');
            this.firstTimePlayer = false;
        }
    }

    startTutorial() {
        // Hide menu and show game with tutorial overlay
        hideElement('main-menu');
        showElement('game-canvas');
        showElement('game-hud');
        showElement('minimap-container');
        showElement('tutorial-overlay');

        // Reset game state but pause normal gameplay
        this.isRunning = true;
        this.tutorialActive = true;
        this.tutorialStep = 1;
        this.score = 0;
        this.level = 1;

        // Reset player and position in center
        this.player.reset();

        // Clear enemies and power-ups
        this.enemies = [];
        this.powerUps = [];

        // Update UI
        this.updateScore(0);
        document.getElementById('level-display').textContent = `Level: ${this.level}`;
        this.updateProgressBar();

        // Set up tutorial content
        this.updateTutorialContent();

        // Start game loop (will be in tutorial mode)
        this.gameLoop();
    }

    updateTutorialContent() {
        const tutorialTitle = document.getElementById('tutorial-title');
        const tutorialText = document.getElementById('tutorial-text');
        const tutorialStep = document.getElementById('tutorial-step');
        const prevButton = document.getElementById('tutorial-prev');
        const nextButton = document.getElementById('tutorial-next');

        // Update step display
        tutorialStep.textContent = `${this.tutorialStep}/${this.tutorialTotalSteps}`;

        // Show/hide prev button
        if (this.tutorialStep > 1) {
            prevButton.classList.remove('hidden');
        } else {
            prevButton.classList.add('hidden');
        }

        // Update next button text on final step
        if (this.tutorialStep === this.tutorialTotalSteps) {
            nextButton.textContent = 'Start Game';
        } else {
            nextButton.textContent = 'Next';
        }

        // Update content based on current step
        switch (this.tutorialStep) {
            case 1:
                tutorialTitle.textContent = 'Welcome to Fish Eat Fish';
                tutorialText.textContent = `Welcome ${this.player.name}! Move your fish by moving your mouse cursor.`;
                break;

            case 2:
                tutorialTitle.textContent = 'Basics';
                tutorialText.textContent = 'Eat smaller fish to grow larger. Avoid larger fish or you\'ll be eaten!';
                break;

            case 3:
                tutorialTitle.textContent = 'Fish Types';
                tutorialText.textContent = 'There are different types of fish: Normal (most common), Golden (high points), Poisonous (dangerous), Speedy (fast), and Armored (tough).';

                // Spawn small fish of various types
                this.spawnTutorialFish('special', 5);
                break;

            case 4:
                tutorialTitle.textContent = 'Food Chain';
                tutorialText.textContent = `Each game, you have a preferred prey (${formatFishType(this.player.preferredPrey)}) that gives double points, and a weakness (${formatFishType(this.player.weakness)}) that can eat you even if smaller!`;
                break;

            case 5:
                tutorialTitle.textContent = 'Size Matters';
                tutorialText.textContent = 'You can only eat fish that are smaller than you. Try to grow by eating small fish first!';

                // Spawn fish of various sizes
                this.spawnTutorialFish('small', 3);
                this.spawnTutorialFish('large', 2);
                break;

            case 6:
                tutorialTitle.textContent = 'Ready to Play?';
                tutorialText.textContent = 'Now you know the basics! Eat smaller fish, avoid larger ones, and become the biggest fish in the sea!';
                break;
        }


    }

    spawnTutorialFish(type, count) {
        // Clear existing fish
        this.enemies = [];

        for (let i = 0; i < count; i++) {
            let enemy;

            if (type === 'small') {
                // Spawn fish smaller than player
                enemy = new EnemyFish(this.canvas, this.player.sizeLevel + 2);
                enemy.sizeLevel = this.player.sizeLevel - 1;
                enemy.radius = 10; // Smaller than player
            } else if (type === 'large') {
                // Spawn fish larger than player
                enemy = new EnemyFish(this.canvas, this.player.sizeLevel - 2);
                enemy.sizeLevel = this.player.sizeLevel + 2;
                enemy.radius = 25; // Larger than player
            }

            // Position fish at different sides of the screen
            const angle = (Math.PI * 2 * i) / count;
            const distance = 200;
            enemy.x = this.canvas.width / 2 + Math.cos(angle) * distance;
            enemy.y = this.canvas.height / 2 + Math.sin(angle) * distance;

            // Slow down fish for tutorial
            enemy.speed *= 0.5;

            this.enemies.push(enemy);
        }
    }

    spawnTutorialPowerUps() {
        // Clear existing power-ups
        this.powerUps = [];

        // Power-ups disabled
    }

    nextTutorialStep() {
        if (this.tutorialStep < this.tutorialTotalSteps) {
            this.tutorialStep++;
            this.updateTutorialContent();
        } else {
            // Last step, start the game
            this.startGame();
        }
    }

    prevTutorialStep() {
        if (this.tutorialStep > 1) {
            this.tutorialStep--;
            this.updateTutorialContent();
        }
    }

    updateProgressBar() {
        // In PvP mode, we don't use a progress bar
        const progressBar = document.getElementById('progress-bar');
        if (!progressBar) return; // Skip if element doesn't exist

        const currentLevelScore = this.score - ((this.level - 1) * this.levelGoal);
        const percentage = Math.min(100, (currentLevelScore / this.levelGoal) * 100);
        progressBar.style.width = `${percentage}%`;
    }

    gameLoop() {
        if (!this.isRunning) return;

        // Begin performance monitoring for this frame
        this.performanceMonitor.beginFrame();

        // Update water effect
        if (this.waterEffect) {
            this.waterEffect.update();
        }

        // Update camera position to follow player
        this.updateCamera();

        // Update cursor fade timer
        if (this.player && this.player.isAlive) {
            const currentMouseX = this.player.mouseX;
            const currentMouseY = this.player.mouseY;

            if (currentMouseX !== this.lastMouseX || currentMouseY !== this.lastMouseY) {
                // Mouse has moved, reset fade timer only if not in always-fade mode
                if (!this.cursorAlwaysFade) {
                    this.cursorFadeTimer = 0;
                } else {
                    // In always-fade mode, reset to a value that keeps the cursor partially faded
                    // This makes the cursor fade out a bit even while moving
                    this.cursorFadeTimer = Math.max(this.cursorFadeDelay / 2, Math.min(this.cursorFadeTimer, this.cursorFadeDelay + 20));
                }
                this.lastMouseX = currentMouseX;
                this.lastMouseY = currentMouseY;
            }

            // Always increment fade timer in gameplay
            this.cursorFadeTimer++;
        }

        // Send player update to server if connected
        if (this.multiplayer && this.multiplayer.connected) {
            this.multiplayer.sendPlayerUpdate();
        }

        // Clear main canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Save context state before applying camera transform
        this.ctx.save();

        // Apply camera transform
        this.ctx.translate(-this.cameraX, -this.cameraY);

        // Draw background
        this.drawBackground();

        // Update level transition if in progress and not in tutorial
        if (!this.tutorialActive) {
            this.updateLevelTransition();
        }

        // AI players are disabled in this version

        // Update enemies
        this.updateEnemies();

        // Spawn enemies if not in tutorial and not paused
        if (!this.tutorialActive && !this.enemySpawnPaused) {
            this.spawnEnemies();
        }

        // Update food
        this.updateFood();

        // Spawn food
        if (!this.tutorialActive) {
            this.spawnFoods();
        }

        // Power-ups are disabled in this version

        // Update floating texts
        this.updateFloatingTexts();

        // Update player if alive
        if (this.player.isAlive) {
            this.player.update();
        } else {
            this.handlePlayerDeath();
        }

        // Check collisions
        this.checkCollisions();

        // Draw everything
        this.drawEnemies();
        this.drawAIPlayers();
        this.drawFood();
        this.drawPowerUps();

        // Draw multiplayer players
        if (this.multiplayer && this.multiplayer.connected) {
            this.multiplayer.drawPlayers(this.ctx);
        }

        // Draw local player
        if (this.player.isAlive) {
            this.player.draw();
        }

        this.drawFloatingTexts();

        // Draw cursor indicator in world coordinates if player is alive
        if (this.player.isAlive) {
            this.drawCursorIndicator();
        }

        // Restore context state
        this.ctx.restore();

        // Draw minimap
        this.drawMinimap();

        // Draw leaderboard
        this.drawLeaderboard();

        // Update difficulty if not in tutorial
        if (!this.tutorialActive) {
            this.updateDifficulty();
        }

        // End performance monitoring for this frame
        this.performanceMonitor.endFrame();

        // Continue game loop
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Toggles the display of performance statistics
     */
    togglePerformanceStats() {
        if (this.performanceMonitor) {
            this.performanceMonitor.toggleStats();
        }
    }

    drawCursorIndicator() {
        // Calculate world coordinates for cursor
        const worldMouseX = this.player.mouseX + this.cameraX;
        const worldMouseY = this.player.mouseY + this.cameraY;

        // Get current time for animations
        const time = Date.now() * 0.001;

        // Calculate opacity based on cursor fade timer
        let opacity = this.cursorMaxOpacity; // Default opacity

        if (this.cursorFadeTimer > this.cursorFadeDelay) {
            // Start fading after delay
            const fadeProgress = Math.min(1, (this.cursorFadeTimer - this.cursorFadeDelay) / this.cursorFadeDuration);
            opacity = this.cursorMaxOpacity * (1 - fadeProgress);
        }

        // Don't draw if completely faded out
        if (opacity <= 0.01) return;

        // Draw cursor indicator
        this.ctx.save();

        // Draw animated outer circle
        const pulseSize = 1 + Math.sin(time * 3) * 0.1; // Pulse between 0.9 and 1.1 size
        const rotationAngle = time * 1.5; // Rotation angle based on time

        // Draw outer circle with pulsing effect
        this.ctx.beginPath();
        this.ctx.arc(worldMouseX, worldMouseY, 15 * pulseSize, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.7})`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw rotating segments around the cursor
        const segmentCount = 4;
        for (let i = 0; i < segmentCount; i++) {
            const angle = rotationAngle + (Math.PI * 2 / segmentCount) * i;
            const innerRadius = 15 * pulseSize;
            const outerRadius = innerRadius + 5;

            this.ctx.beginPath();
            this.ctx.moveTo(
                worldMouseX + Math.cos(angle) * innerRadius,
                worldMouseY + Math.sin(angle) * innerRadius
            );
            this.ctx.lineTo(
                worldMouseX + Math.cos(angle) * outerRadius,
                worldMouseY + Math.sin(angle) * outerRadius
            );
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // Draw inner circle with glow
        this.ctx.beginPath();
        this.ctx.arc(worldMouseX, worldMouseY, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.9})`;
        this.ctx.shadowColor = `rgba(255, 255, 255, ${opacity * 0.8})`;
        this.ctx.shadowBlur = 5;
        this.ctx.fill();

        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;

        // Calculate distance and angle between player and cursor
        const distance = calculateDistance(this.player.x, this.player.y, worldMouseX, worldMouseY);
        const angle = calculateAngle(this.player.x, this.player.y, worldMouseX, worldMouseY);

        // Enhanced directional indicator - Draw line with direction arrows
        if (distance > this.player.radius * 2) {
            // Create gradient for path
            const lineGradient = this.ctx.createLinearGradient(
                this.player.x, this.player.y,
                worldMouseX, worldMouseY
            );
            lineGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.7})`);
            lineGradient.addColorStop(1, `rgba(255, 255, 255, ${opacity * 0.2})`);

            // Draw path with dotted line
        this.ctx.beginPath();
            this.ctx.moveTo(
                this.player.x + Math.cos(angle) * this.player.radius,
                this.player.y + Math.sin(angle) * this.player.radius
            );
            this.ctx.lineTo(worldMouseX, worldMouseY);
            this.ctx.strokeStyle = lineGradient;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([4, 4]);
        this.ctx.stroke();
            this.ctx.setLineDash([]);

            // Draw small arrows along the path to indicate direction
            const arrowCount = Math.min(5, Math.floor(distance / 50));
            const arrowSize = Math.min(8, this.player.radius / 2);

            for (let i = 1; i <= arrowCount; i++) {
                const t = i / (arrowCount + 1); // Position along the path (0 to 1)
                const arrowX = this.player.x + (worldMouseX - this.player.x) * t;
                const arrowY = this.player.y + (worldMouseY - this.player.y) * t;

                // Draw arrow
                this.ctx.save();
                this.ctx.translate(arrowX, arrowY);
                this.ctx.rotate(angle);

                // Make arrows pulse and fade based on distance
                const arrowOpacity = (0.8 - (t * 0.3)) * opacity;
                const arrowPulse = 1 + Math.sin(time * 5 + i) * 0.2;

                this.ctx.fillStyle = `rgba(255, 255, 255, ${arrowOpacity})`;

                // Draw arrow triangle
            this.ctx.beginPath();
                this.ctx.moveTo(arrowSize * arrowPulse, 0);
                this.ctx.lineTo(-arrowSize/2 * arrowPulse, -arrowSize/2 * arrowPulse);
                this.ctx.lineTo(-arrowSize/2 * arrowPulse, arrowSize/2 * arrowPulse);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.restore();
            }

            // Add a small circular indicator at the fish's target angle
            const targetIndicatorX = this.player.x + Math.cos(this.player.angle) * (this.player.radius * 1.5);
            const targetIndicatorY = this.player.y + Math.sin(this.player.angle) * (this.player.radius * 1.5);

            this.ctx.beginPath();
            this.ctx.arc(targetIndicatorX, targetIndicatorY, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 255, 255, ${opacity * 0.7})`;
            this.ctx.fill();
            this.ctx.closePath();
        }

        this.ctx.restore();
    }

    updateCamera() {
        // Calculate target camera position (centered on player)
        const targetCameraX = this.player.x - this.canvas.width / 2;
        const targetCameraY = this.player.y - this.canvas.height / 2;

        // DIRECT CAMERA POSITIONING - no smoothing or lerp
        // This eliminates any edge attraction effect caused by camera lag
        this.cameraX = targetCameraX;
        this.cameraY = targetCameraY;

        // Clamp camera to world boundaries
        this.cameraX = Math.max(0, Math.min(this.worldWidth - this.canvas.width, this.cameraX));
        this.cameraY = Math.max(0, Math.min(this.worldHeight - this.canvas.height, this.cameraY));
    }

    drawMinimap() {
        // Clear minimap with transparent background
        this.minimapCtx.clearRect(0, 0, this.minimap.width, this.minimap.height);

        // Calculate scale factors
        const scaleX = this.minimap.width / this.worldWidth;
        const scaleY = this.minimap.height / this.worldHeight;

        // Define player's vision radius to match the player's screen view
        // Calculate based on the canvas dimensions to match what the player sees
        const visionRadiusX = this.canvas.width * 0.7; // 70% of screen width
        const visionRadiusY = this.canvas.height * 0.7; // 70% of screen height

        // Calculate which entities are within the player's vision
        const playerX = this.player.x;
        const playerY = this.player.y;

        // Draw a subtle grid for orientation
        this.minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.minimapCtx.lineWidth = 0.5;

        // Draw grid lines
        const gridSize = 200; // Grid cell size in world coordinates
        for (let x = 0; x < this.worldWidth; x += gridSize) {
            this.minimapCtx.beginPath();
            this.minimapCtx.moveTo(x * scaleX, 0);
            this.minimapCtx.lineTo(x * scaleX, this.minimap.height);
            this.minimapCtx.stroke();
        }

        for (let y = 0; y < this.worldHeight; y += gridSize) {
            this.minimapCtx.beginPath();
            this.minimapCtx.moveTo(0, y * scaleY);
            this.minimapCtx.lineTo(this.minimap.width, y * scaleY);
            this.minimapCtx.stroke();
        }

        // Draw world boundaries
        this.minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.minimapCtx.lineWidth = 1;
        this.minimapCtx.strokeRect(0, 0, this.minimap.width, this.minimap.height);

        // Function to check if an entity is within player's elliptical vision
        const isInVision = (x, y) => {
            // Calculate normalized distance for ellipse
            const dx = x - playerX;
            const dy = y - playerY;

            // Use the ellipse formula: (x/a)² + (y/b)² <= 1
            const normalizedDistance = Math.pow(dx / visionRadiusX, 2) + Math.pow(dy / visionRadiusY, 2);
            return normalizedDistance <= 1;
        };

        // Viewport rectangle removed for cleaner look

        // Draw food on minimap (only within vision)
        if (this.foods) {
            this.foods.forEach(food => {
                if (isInVision(food.x, food.y)) {
                    this.minimapCtx.fillStyle = 'rgba(170, 255, 170, 0.9)'; // Light green for food
                this.minimapCtx.beginPath();
                this.minimapCtx.arc(
                    food.x * scaleX,
                    food.y * scaleY,
                        1.5, // Slightly larger for better visibility
                    0,
                    Math.PI * 2
                );
                this.minimapCtx.fill();
                }
            });
        }

        // Draw player on minimap if alive
        if (this.player && this.player.isAlive) {
            // Draw player's vision as an ellipse to match screen aspect ratio
            this.minimapCtx.beginPath();

            // Save context for rotation
            this.minimapCtx.save();
            this.minimapCtx.translate(playerX * scaleX, playerY * scaleY);

            // Draw ellipse to match screen dimensions
            this.minimapCtx.ellipse(
                0, 0, // Center is at the translated position
                visionRadiusX * scaleX, // X radius
                visionRadiusY * scaleY, // Y radius
                0, // Rotation
                0, Math.PI * 2 // Full ellipse
            );

            // Fill with semi-transparent blue
            this.minimapCtx.fillStyle = 'rgba(0, 100, 255, 0.15)';
            this.minimapCtx.fill();

            // Add a subtle glow around the vision ellipse
            this.minimapCtx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
            this.minimapCtx.lineWidth = 1;
            this.minimapCtx.stroke();

            // Restore context
            this.minimapCtx.restore();

            // Draw player
            this.minimapCtx.fillStyle = 'rgba(51, 153, 255, 1.0)';
            this.minimapCtx.beginPath();
            this.minimapCtx.arc(
                playerX * scaleX,
                playerY * scaleY,
                4, // Fixed size for visibility
                0,
                Math.PI * 2
            );
            this.minimapCtx.fill();

            // Add a white outline to the player dot for better visibility
            this.minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.minimapCtx.lineWidth = 1;
            this.minimapCtx.stroke();
        }

        // Draw AI players on minimap (only within vision)
        if (this.aiPlayers) {
            this.aiPlayers.forEach(aiPlayer => {
                if (!aiPlayer.isAlive || !isInVision(aiPlayer.x, aiPlayer.y)) return;

                // Color based on size comparison with player
                if (this.player && this.player.isAlive) {
                    if (aiPlayer.radius > this.player.radius * 1.2) {
                        this.minimapCtx.fillStyle = 'rgba(255, 80, 80, 1.0)'; // Brighter red for dangerous
                    } else if (aiPlayer.radius < this.player.radius * 0.8) {
                        this.minimapCtx.fillStyle = 'rgba(80, 255, 80, 1.0)'; // Brighter green for edible
                    } else {
                        this.minimapCtx.fillStyle = 'rgba(255, 255, 80, 1.0)'; // Brighter yellow for similar size
                    }
                } else {
                    // If player is dead, use AI's color with full opacity
                    this.minimapCtx.fillStyle = aiPlayer.color;
                }

                this.minimapCtx.beginPath();
                this.minimapCtx.arc(
                    aiPlayer.x * scaleX,
                    aiPlayer.y * scaleY,
                    3, // Medium size
                    0,
                    Math.PI * 2
                );
                this.minimapCtx.fill();

                // Add a subtle outline for better visibility
                this.minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                this.minimapCtx.lineWidth = 0.5;
                this.minimapCtx.stroke();
            });
        }

        // Draw enemies on minimap (only within vision)
        if (this.enemies) {
            this.enemies.forEach(enemy => {
                if (!isInVision(enemy.x, enemy.y)) return;

                // Color based on size comparison with player
                if (this.player && this.player.isAlive) {
                    if (enemy.radius > this.player.radius * 1.2) {
                        this.minimapCtx.fillStyle = 'rgba(255, 80, 80, 1.0)'; // Brighter red for dangerous
                    } else if (enemy.radius < this.player.radius * 0.8) {
                        this.minimapCtx.fillStyle = 'rgba(80, 255, 80, 1.0)'; // Brighter green for edible
                    } else {
                        this.minimapCtx.fillStyle = 'rgba(255, 255, 80, 1.0)'; // Brighter yellow for similar size
                    }
                } else {
                    // Use enemy's color with full opacity
                    this.minimapCtx.fillStyle = enemy.color;
                }

                // Draw enemy dot
                this.minimapCtx.beginPath();
                this.minimapCtx.arc(
                    enemy.x * scaleX,
                    enemy.y * scaleY,
                    2.5, // Slightly larger for better visibility
                    0,
                    Math.PI * 2
                );
                this.minimapCtx.fill();

                // Add a subtle outline for better visibility
                this.minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                this.minimapCtx.lineWidth = 0.5;
                this.minimapCtx.stroke();
            });
        }

        // Draw power-ups on minimap (only within vision)
        if (this.powerUps) {
            this.powerUps.forEach(powerUp => {
                if (!isInVision(powerUp.x, powerUp.y)) return;

                // Use power-up's color with transparency
                this.minimapCtx.fillStyle = powerUp.color.replace('rgb', 'rgba').replace(')', ', 0.8)');

                this.minimapCtx.beginPath();
                this.minimapCtx.arc(
                    powerUp.x * scaleX,
                    powerUp.y * scaleY,
                    3, // Medium size
                    0,
                    Math.PI * 2
                );
                this.minimapCtx.fill();
            });
        }
    }

    drawBackground() {
        // Draw water background with enhanced gradient (lighter at top, darker at bottom)
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.worldHeight);
        gradient.addColorStop(0, '#4FACFE'); // Light blue at top
        gradient.addColorStop(0.7, '#0080DB'); // Mid blue
        gradient.addColorStop(1, '#005BBB'); // Darker blue at bottom

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

        // Draw water effect
        if (this.waterEffect) {
            this.waterEffect.draw(this.cameraX, this.cameraY);
        }

        // Draw subtle light rays from top
        this.drawLightRays();

        // Draw world boundaries with glow effect
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);

        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;

        // Draw static bubbles with subtle animation
        const bubbleCount = 150; // More bubbles for larger world
        const time = Date.now() * 0.001; // Current time in seconds

        // Use a fixed seed for consistent bubble positions
        const seed = 12345;

        for (let i = 0; i < bubbleCount; i++) {
            // Use semi-deterministic positions based on index
            let x = ((i * seed) % this.worldWidth);

            // Add very subtle horizontal drift based on time
            const drift = Math.sin(time * 0.2 + i * 0.1) * 5;
            x = (x + drift) % this.worldWidth;
            if (x < 0) x += this.worldWidth;

            // Vertical position with very slow upward movement
            let y = ((i * seed * 0.7) % this.worldHeight);
            y = (y - time * 0.5) % this.worldHeight;
            if (y < 0) y += this.worldHeight;

            // Size with subtle pulsing
            const baseRadius = 1 + (i % 3);
            const radius = baseRadius * (0.8 + Math.sin(time * 2 + i) * 0.2);

            // Opacity with subtle pulsing
            const opacity = 0.1 + Math.sin(time + i * 0.3) * 0.1;

            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            this.ctx.fill();
            this.ctx.closePath();
        }
    }

    /**
     * Draws enhanced light rays effect for underwater atmosphere
     * @private
     */
    drawLightRays() {
        // Draw subtle light rays from top of water
        const rayCount = 15; // More rays for better coverage
        const time = Date.now() * 0.0003; // Slower time for more subtle movement

        this.ctx.save();

        // Use screen-based clipping to only draw rays in the visible area
        this.ctx.beginPath();
        this.ctx.rect(this.cameraX, this.cameraY, this.canvas.width, this.canvas.height);
        this.ctx.clip();

        // Set blending mode for rays
        this.ctx.globalCompositeOperation = 'lighter';

        // Draw primary rays (larger, more spread out)
        for (let i = 0; i < rayCount; i++) {
            // Position rays across the width of the world with some randomness
            const xPos = (this.worldWidth / rayCount) * i + Math.sin(time + i * 0.7) * 150;

            // Vary ray length based on position and time
            const rayLength = this.worldHeight * (0.5 + Math.sin(time * 0.5 + i * 0.2) * 0.2);

            // Create gradient for each ray
            const rayGradient = this.ctx.createLinearGradient(xPos, 0, xPos, rayLength);
            rayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
            rayGradient.addColorStop(0.7, 'rgba(200, 240, 255, 0.05)');
            rayGradient.addColorStop(1, 'rgba(200, 240, 255, 0)');

            // Width varies with time and position
            const width = 80 + Math.sin(time * 1.5 + i) * 40;

            // Calculate control points for curved rays
            const controlX1 = xPos + Math.sin(time * 0.7 + i * 0.5) * 150;
            const controlY1 = this.worldHeight * 0.3;
            const endX = xPos + Math.sin(time * 0.5 + i * 0.3) * 200;
            const endY = rayLength;

            // Draw ray as a bezier curve for more natural look
            this.ctx.beginPath();
            this.ctx.moveTo(xPos, 0);
            this.ctx.quadraticCurveTo(controlX1, controlY1, endX, endY);
            this.ctx.lineTo(endX + width, endY);
            this.ctx.quadraticCurveTo(controlX1 + width, controlY1, xPos + width, 0);
            this.ctx.fillStyle = rayGradient;
            this.ctx.fill();
        }

        // Draw secondary rays (thinner, more numerous)
        const secondaryRayCount = rayCount * 2;
        for (let i = 0; i < secondaryRayCount; i++) {
            // Position rays across the width of the world with different pattern
            const xPos = (this.worldWidth / secondaryRayCount) * i + Math.cos(time * 1.2 + i * 0.3) * 80;

            // Shorter rays for secondary effect
            const rayLength = this.worldHeight * (0.3 + Math.cos(time * 0.7 + i * 0.4) * 0.1);

            // Create gradient for each ray
            const rayGradient = this.ctx.createLinearGradient(xPos, 0, xPos, rayLength);
            rayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
            rayGradient.addColorStop(1, 'rgba(200, 240, 255, 0)');

            // Thinner width for secondary rays
            const width = 30 + Math.sin(time * 2 + i * 1.5) * 15;

            // Straighter rays for secondary effect
            const controlX = xPos + Math.sin(time * 0.9 + i * 0.7) * 50;
            const controlY = rayLength * 0.5;

            // Draw ray
            this.ctx.beginPath();
            this.ctx.moveTo(xPos, 0);
            this.ctx.quadraticCurveTo(controlX, controlY, xPos + Math.sin(time + i) * 30, rayLength);
            this.ctx.lineTo(xPos + width + Math.sin(time + i) * 30, rayLength);
            this.ctx.quadraticCurveTo(controlX + width, controlY, xPos + width, 0);
            this.ctx.fillStyle = rayGradient;
            this.ctx.fill();
        }

        // Draw dust particles in the light rays
        this.drawLightParticles(time);

        // Reset composite operation
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.restore();
    }

    /**
     * Draws floating dust particles in light rays
     * @param {number} time - Current animation time
     * @private
     */
    drawLightParticles(time) {
        const particleCount = 100;

        // Only draw particles in the visible area
        const visibleArea = {
            x: this.cameraX,
            y: this.cameraY,
            width: this.canvas.width,
            height: this.canvas.height
        };

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';

        for (let i = 0; i < particleCount; i++) {
            // Use deterministic positions based on index for consistent particles
            const seed = i * 1000;

            // Calculate position with slow drift
            const x = (seed % this.worldWidth) + Math.sin(time * 0.2 + i * 0.1) * 20;
            const y = ((seed * 0.5) % this.worldHeight) + Math.cos(time * 0.3 + i * 0.1) * 10;

            // Only draw if in visible area
            if (x >= visibleArea.x && x <= visibleArea.x + visibleArea.width &&
                y >= visibleArea.y && y <= visibleArea.y + visibleArea.height) {

                // Size varies with time
                const size = 0.5 + Math.sin(time * 2 + i) * 0.5;

                // Opacity varies with position (more visible in light rays)
                const opacity = 0.1 + Math.sin(x / 100 + time) * 0.1;

                this.ctx.globalAlpha = opacity;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        this.ctx.globalAlpha = 1.0;
    }

    spawnEnemies() {
        this.enemySpawnTimer++;

        // Adjust spawn rate based on difficulty (more gradual progression)
        const adjustedSpawnInterval = Math.max(30, this.enemySpawnInterval - (this.difficultyLevel * 3));

        // Limit the number of enemies based on difficulty to prevent overcrowding
        const maxEnemies = 30 + (this.difficultyLevel * 3); // Increased for larger world

        if (this.enemySpawnTimer >= adjustedSpawnInterval && this.enemies.length < maxEnemies) {
            // Determine if we should spawn at edge or randomly in the world
            const spawnInWorld = Math.random() < 0.3; // 30% chance to spawn within the world

            // Create new enemy with world dimensions
            const enemy = new EnemyFish(this.canvas, this.player.sizeLevel, this.worldWidth, this.worldHeight);

            // If spawning within world, override the position
            if (spawnInWorld) {
                // Make sure fish don't spawn too close to the player
                const minDistanceFromPlayer = 300;
                let validPosition = false;
                let attempts = 0;

                while (!validPosition && attempts < 10) {
                    // Generate random position
                    enemy.x = random(this.worldWidth * 0.1, this.worldWidth * 0.9);
                    enemy.y = random(this.worldHeight * 0.1, this.worldHeight * 0.9);

                    // Check distance from player
                    const distanceToPlayer = calculateDistance(enemy.x, enemy.y, this.player.x, this.player.y);

                    if (distanceToPlayer > minDistanceFromPlayer) {
                        validPosition = true;
                    }

                    attempts++;
                }

                // Set a random angle for fish spawned within the world
                enemy.angle = random(0, Math.PI * 2);
            }

            this.enemies.push(enemy);

            // Reset timer
            this.enemySpawnTimer = 0;
        }
    }

    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            // Update enemy
            const shouldRemove = this.enemies[i].update(
                this.player.x,
                this.player.y,
                this.player.radius
            );

            // Remove if out of bounds
            if (shouldRemove) {
                this.enemies.splice(i, 1);
            }
        }
    }

    drawEnemies() {
        this.enemies.forEach(enemy => {
            // Check if enemy is within elliptical vision area
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;

            // Use the ellipse formula: (x/a)² + (y/b)² <= 1
            const visionRadiusX = this.canvas.width * 0.7; // 70% of screen width
            const visionRadiusY = this.canvas.height * 0.7; // 70% of screen height
            const normalizedDistance = Math.pow(dx / visionRadiusX, 2) + Math.pow(dy / visionRadiusY, 2);
            const isInVision = normalizedDistance <= 1;

            // Add visual indicator for fish within vision
            if (isInVision && this.player.isAlive) {
                this.ctx.save();

                // Add subtle outline based on size comparison
                if (enemy.radius > this.player.radius * 1.2) {
                    // Dangerous fish - red outline
                    this.ctx.strokeStyle = 'rgba(255, 80, 80, 0.3)';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(enemy.x, enemy.y, enemy.radius + 5, 0, Math.PI * 2);
                    this.ctx.stroke();
                } else if (enemy.radius < this.player.radius * 0.8) {
                    // Edible fish - green outline
                    this.ctx.strokeStyle = 'rgba(80, 255, 80, 0.3)';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(enemy.x, enemy.y, enemy.radius + 5, 0, Math.PI * 2);
                    this.ctx.stroke();
                } else {
                    // Similar size fish - yellow outline
                    this.ctx.strokeStyle = 'rgba(255, 255, 80, 0.3)';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(enemy.x, enemy.y, enemy.radius + 5, 0, Math.PI * 2);
                    this.ctx.stroke();
                }

                this.ctx.restore();
            }

            // Draw the enemy fish
            enemy.draw();
        });
    }

    // Power-up methods are stubs since power-ups are disabled in this version
    spawnPowerUps() {}
    updatePowerUps() {}
    drawPowerUps() {}

    checkCollisions() {
        if (!this.player.isAlive) return;

        // Check collisions with other players in multiplayer mode
        if (this.multiplayer && this.multiplayer.connected) {
            this.multiplayer.checkPlayerCollisions();
        }

        // Check collisions with AI players - disabled
        /*
        for (let i = this.aiPlayers.length - 1; i >= 0; i--) {
            const aiPlayer = this.aiPlayers[i];
            if (!aiPlayer.isAlive) continue;

            // Check if magnetism is active and pull smaller fish towards player
            if (this.player.powerUps.magnetism.active) {
                const distanceToPlayer = calculateDistance(aiPlayer.x, aiPlayer.y, this.player.x, this.player.y);
                if (distanceToPlayer < this.player.powerUps.magnetism.range && aiPlayer.radius < this.player.radius) {
                    // Calculate angle to player
                    const angleToPlayer = calculateAngle(aiPlayer.x, aiPlayer.y, this.player.x, this.player.y);

                    // Pull fish towards player
                    aiPlayer.x += Math.cos(angleToPlayer) * 1.5;
                    aiPlayer.y += Math.sin(angleToPlayer) * 0.6; // Reduced vertical pull to maintain horizontal movement
                }
            }

            if (checkCollision(this.player, aiPlayer)) {
                // Collision detected
                if (this.player.canEat(aiPlayer)) {
                    // Player eats AI player
                    const points = aiPlayer.sizeLevel * 50;
                    this.updateScore(points);
                    this.player.eatFish(aiPlayer.sizeLevel * 0.5);
                    aiPlayer.die();

                    // Show floating text
                    this.showFloatingText(`+${points}`, aiPlayer.x, aiPlayer.y, '#FFFF00', 18);
                    this.showFloatingText(`Ate ${aiPlayer.name}!`, this.player.x, this.player.y - this.player.radius - 30, '#00FF00', 16);
                } else if (this.player.canBeEatenBy(aiPlayer)) {
                    // AI player eats player
                    this.player.die();

                    // Show floating text
                    this.showFloatingText(`Eaten by ${aiPlayer.name}!`, this.player.x, this.player.y, '#FF6666', 24);

                    // Don't return, let the player respawn
                }
            }
        }
        */

        // Check collisions with enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            // Check if magnetism is active and pull smaller fish towards player - disabled
            /*
            if (this.player.powerUps.magnetism.active) {
                const distanceToPlayer = calculateDistance(enemy.x, enemy.y, this.player.x, this.player.y);
                if (distanceToPlayer < this.player.powerUps.magnetism.range && enemy.radius < this.player.radius) {
                    // Calculate angle to player
                    const angleToPlayer = calculateAngle(enemy.x, enemy.y, this.player.x, this.player.y);

                    // Pull fish towards player
                    enemy.x += Math.cos(angleToPlayer) * 1.5;
                    enemy.y += Math.sin(angleToPlayer) * 0.6; // Reduced vertical pull to maintain horizontal movement
                }
            }
            */

            if (checkCollision(this.player, enemy)) {
                if (this.player.canEat(enemy)) {
                    // Player eats enemy
                    this.enemies.splice(i, 1);
                    this.player.eatFish();

                    // Calculate points based on enemy size
                    let points = enemy.pointValue || (enemy.sizeLevel * 10);

                    // Update score
                    this.updateScore(points);

                } else if (this.player.canBeEatenBy(enemy)) {
                    // Player is eaten
                    // No need to show any floating text here as handlePlayerDeath will handle it

                    this.player.die();
                    // No need to show floating text here as handlePlayerDeath will handle it
                    return;
                }
                // If neither can eat the other, they just bounce off (no action needed)
            }
        }

        // Check collisions with food
        if (this.foodManager && this.foodManager.foods.length > 0) {
            const foods = this.foodManager.foods;
            for (let i = foods.length - 1; i >= 0; i--) {
                const food = foods[i];

                if (checkCollision(this.player, food)) {
                    // Player eats food
                    const points = food.value || 1;
                    this.updateScore(points);
                    this.player.eatFish(0.1); // Small growth

                    // In multiplayer mode, notify server about eaten food
                    if (this.multiplayer && this.multiplayer.connected && food.id) {
                        this.multiplayer.sendFoodEaten(food);
                    }

                    // Remove food and return it to the pool
                    this.foodManager.removeFood(i);

                    // Show floating text
                    this.showFloatingText(`+${points}`, food.x, food.y, '#AAFFAA', 12);
                }
            }
        } else if (this.foods) {
            // Legacy support for multiplayer food
            for (let i = this.foods.length - 1; i >= 0; i--) {
                const food = this.foods[i];

                if (checkCollision(this.player, food)) {
                    // Player eats food
                    const points = food.value || 1;
                    this.updateScore(points);
                    this.player.eatFish(0.1); // Small growth

                    // In multiplayer mode, notify server about eaten food
                    if (this.multiplayer && this.multiplayer.connected && food.id) {
                        this.multiplayer.sendFoodEaten(food);
                    }

                    this.foods.splice(i, 1);

                    // Show floating text
                    this.showFloatingText(`+${points}`, food.x, food.y, '#AAFFAA', 12);
                }
            }
        }

        // Check collisions with power-ups - disabled
        /*
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];

            if (checkCollision(this.player, powerUp)) {
                // Apply power-up effect
                const effect = powerUp.getEffect();
                this.applyPowerUpEffect(effect);

                // Show power-up message
                let message = '';
                switch(effect.type) {
                    case 'speedBoost':
                        message = 'Speed Boost!';
                        break;
                    case 'invincibility':
                        message = 'Invincibility!';
                        break;
                    case 'doublePoints':
                        message = 'Double Points!';
                        break;
                    case 'magnetism':
                        message = 'Fish Magnet!';
                        break;
                    case 'frenzy':
                        message = 'Feeding Frenzy!';
                        break;
                }

                this.showFloatingText(message, this.player.x, this.player.y - this.player.radius - 30, powerUp.color, 18);

                // Remove power-up
                this.powerUps.splice(i, 1);
            }
        }
        */

        // Check AI player collisions with each other - disabled
        /*
        if (this.aiPlayers) {
            for (let i = 0; i < this.aiPlayers.length; i++) {
                const aiPlayer1 = this.aiPlayers[i];
                if (!aiPlayer1.isAlive) continue;

                // Check against other AI players
                for (let j = i + 1; j < this.aiPlayers.length; j++) {
                    const aiPlayer2 = this.aiPlayers[j];
                    if (!aiPlayer2.isAlive) continue;

                    if (checkCollision(aiPlayer1, aiPlayer2)) {
                        // Collision detected
                        if (aiPlayer1.canEat(aiPlayer2)) {
                            // AI player 1 eats AI player 2
                            aiPlayer1.grow(aiPlayer2.sizeLevel * 0.5);
                            aiPlayer2.die();

                            // Show floating text
                            this.showFloatingText('Eaten!', aiPlayer2.x, aiPlayer2.y, '#FF6666', 16);
                        } else if (aiPlayer2.canEat(aiPlayer1)) {
                            // AI player 2 eats AI player 1
                            aiPlayer2.grow(aiPlayer1.sizeLevel * 0.5);
                            aiPlayer1.die();

                            // Show floating text
                            this.showFloatingText('Eaten!', aiPlayer1.x, aiPlayer1.y, '#FF6666', 16);
                        }
                    }
                }

                // Check AI against food
                if (this.foods) {
                    for (let j = this.foods.length - 1; j >= 0; j--) {
                        const food = this.foods[j];

                        if (checkCollision(aiPlayer1, food)) {
                            // AI eats food
                            aiPlayer1.grow(0.05); // Small growth
                            this.foods.splice(j, 1);
                        }
                    }
                }
            }
        }
        */
    }

    // Stub method for power-up effects (disabled in this version)
    applyPowerUpEffect() {}

    updateDifficulty() {
        this.difficultyTimer++;

        if (this.difficultyTimer >= this.difficultyInterval) {
            this.difficultyLevel++;
            this.difficultyTimer = 0;

            // Spawn more enemies as difficulty increases (more gradual progression)
            this.enemySpawnInterval = Math.max(30, 120 - (this.difficultyLevel * 3));

            // Visual feedback for difficulty increase
            if (this.difficultyLevel > 1) {
                // Flash the background briefly
                const canvas = this.canvas;
                const ctx = this.ctx;
                const originalFillStyle = ctx.fillStyle;

                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Reset fill style
                ctx.fillStyle = originalFillStyle;
            }
        }
    }

    updateScore(points) {
        const earnedPoints = points * this.scoreMultiplier;
        this.score += earnedPoints;

        // Update player score to match game score
        if (this.player) {
            this.player.score = this.score;
        }

        // Update progress bar
        this.updateProgressBar();

        // Check for level advancement
        if (this.score >= this.level * this.levelGoal && !this.levelTransitioning) {
            this.startLevelTransition();
        }

        // Show floating score text
        if (points > 0) {
            this.showFloatingText(`+${earnedPoints}`, this.player.x, this.player.y - this.player.radius - 20, '#FFFF00');
        }

        // Send player update to server in multiplayer mode
        if (this.multiplayer && this.multiplayer.connected) {
            this.multiplayer.sendPlayerUpdate();
        }
    }

    startLevelTransition() {
        this.levelTransitioning = true;
        this.levelTransitionTimer = 0;

        // Pause enemy spawning during transition
        this.enemySpawnPaused = true;

        // Increase level
        this.level++;

        // Update level display if it exists
        const levelDisplay = document.getElementById('level-display');
        if (levelDisplay) {
            levelDisplay.textContent = `Level: ${this.level}`;
        }

        // Show level up message
        this.showFloatingText(`LEVEL ${this.level}!`, this.canvas.width / 2, this.canvas.height / 2, '#FFFF00', 36);

        // Play level up sound (if we had sound)
        // playSound('levelUp');
    }

    updateLevelTransition() {
        if (!this.levelTransitioning) return;

        this.levelTransitionTimer++;

        if (this.levelTransitionTimer >= this.levelTransitionDuration) {
            // Complete the level transition
            this.level++;
            this.levelTransitioning = false;
            this.enemySpawnPaused = false;

            // Update UI
            const levelDisplay = document.getElementById('level-display');
            if (levelDisplay) {
                levelDisplay.textContent = `Level: ${this.level}`;
            }

            // Increase difficulty slightly with each level
            this.difficultyLevel += 0.5;

            // Grant a power-up as a reward
            this.grantLevelUpReward();
        }
    }

    grantLevelUpReward() {
        // Power-ups disabled - just show level up message
        this.showFloatingText(`Level Up! Level ${this.level}`, this.player.x, this.player.y, '#FFFF00', 24);
    }

    showFloatingText(text, x, y, color = '#FFFFFF', fontSize = 20, life = 60, isParticle = false) {
        const floatingText = {
            text: text,
            x: x,
            y: y,
            color: color,
            fontSize: fontSize,
            alpha: 1,
            life: life, // Default: 1 second at 60fps
            isParticle: isParticle, // Flag to indicate if this is a particle effect
            velocityX: isParticle ? (Math.random() - 0.5) * 2 : 0, // Random X velocity for particles
            velocityY: isParticle ? -Math.random() * 2 - 1 : -1, // Upward Y velocity for particles
            rotation: isParticle ? Math.random() * Math.PI * 2 : 0 // Random rotation for particles
        };

        if (!this.floatingTexts) {
            this.floatingTexts = [];
        }

        this.floatingTexts.push(floatingText);
    }

    updateFloatingTexts() {
        if (!this.floatingTexts) return;

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const text = this.floatingTexts[i];

            if (text.isParticle) {
                // Update particle position with velocity
                text.x += text.velocityX;
                text.y += text.velocityY;

                // Add some gravity effect
                text.velocityY += 0.05;

                // Slow down horizontal movement
                text.velocityX *= 0.98;

                // Rotate particle
                text.rotation += 0.05;
            } else {
                // Regular floating text - just move upward
            text.y -= 1;
            }

            // Update transparency
            text.life--;
            text.alpha = text.life / (text.isParticle ? 20 : 60); // Particles fade faster

            // Remove if expired
            if (text.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    drawFloatingTexts() {
        if (!this.floatingTexts) return;

        this.ctx.save();

        for (const text of this.floatingTexts) {
            this.ctx.globalAlpha = text.alpha;

            if (text.isParticle) {
                // Draw particle
                this.ctx.save();
                this.ctx.translate(text.x, text.y);
                this.ctx.rotate(text.rotation);

                // Draw a small circle or square for particles
                this.ctx.fillStyle = text.color;

                if (Math.random() > 0.5) {
                    // Circle
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, text.fontSize / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                } else {
                    // Square
                    this.ctx.fillRect(-text.fontSize / 2, -text.fontSize / 2, text.fontSize, text.fontSize);
                }

                this.ctx.restore();
            } else {
                // Draw regular floating text
            this.ctx.font = `${text.fontSize}px Arial`;
            this.ctx.fillStyle = text.color;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(text.text, text.x, text.y);
            }
        }

        this.ctx.restore();
    }

    gameOver() {
        // Stop the game loop
        this.isRunning = false;
        cancelAnimationFrame(this.animationFrameId);

        // Make sure we're not showing multiple game over screens
        hideElement('game-over');

        // Update final score and level
        const finalScoreElement = document.getElementById('final-score');
        if (finalScoreElement) {
            finalScoreElement.textContent = `Your Score: ${this.player.score} | Level: ${this.player.sizeLevel}`;
        }

        // Check if this is a new high score in the leaderboard
        if (this.leaderboard && this.leaderboard.isHighScore(this.player.score)) {
            // Save high score to leaderboard
            this.leaderboard.saveHighScore(this.player.name, this.player.score, this.player.sizeLevel);
            if (finalScoreElement) {
                finalScoreElement.textContent += ' - NEW HIGH SCORE!';
            }
        }

        // Get the highest score from leaderboard
        const highScoreElement = document.getElementById('high-score');
        if (highScoreElement && this.leaderboard) {
            const highScores = this.leaderboard.loadHighScores();
            const highScore = highScores.length > 0 ? highScores[0].score : 0;
            highScoreElement.textContent = `High Score: ${highScore}`;
        }

        // Show game over screen
        hideElement('game-canvas');
        // Game HUD removed to avoid overlap with leaderboard
        hideElement('minimap-container');
        hideElement('progress-bar-container');
        showElement('game-over');
    }



    drawLeaderboard() {
        // Draw leaderboard in top-right corner
        const x = this.canvas.width - 210;
        const y = 10;
        const width = 200;
        const height = 220;

        // Make sure the leaderboard has the latest player score
        if (this.player) {
            // Ensure player score in leaderboard is synced with actual player score
            this.player.score = Math.max(this.player.score, this.score);

            // Update leaderboard
            this.leaderboard.update();
        }

        // Draw leaderboard using the leaderboard class
        this.leaderboard.renderLeaderboard(this.ctx, x, y, width, height);

        // Rank display removed
    }

    // AI player methods are stubs since AI players are disabled in this version
    updateAIPlayers() {}
    spawnAIPlayers() {}

    updateFood() {
        // Update food using the food manager
        if (this.foodManager) {
            this.foodManager.update();
        }
    }

    spawnFoods() {
        this.foodSpawnTimer++;

        if (this.foodSpawnTimer >= this.foodSpawnInterval && this.foodManager &&
            this.foodManager.foods.length < this.maxFoodItems) {
            this.spawnFood();
            this.foodSpawnTimer = 0;
        }
    }

    drawAIPlayers() {
        // AI players disabled
        /*
        // Draw each AI player
        for (const aiPlayer of this.aiPlayers) {
            if (aiPlayer.isAlive) {
                // Check if AI player is within elliptical vision area
                const dx = aiPlayer.x - this.player.x;
                const dy = aiPlayer.y - this.player.y;

                // Use the ellipse formula: (x/a)² + (y/b)² <= 1
                const visionRadiusX = this.canvas.width * 0.7; // 70% of screen width
                const visionRadiusY = this.canvas.height * 0.7; // 70% of screen height
                const normalizedDistance = Math.pow(dx / visionRadiusX, 2) + Math.pow(dy / visionRadiusY, 2);
                const isInVision = normalizedDistance <= 1;

                // Add visual indicator for fish within vision
                if (isInVision && this.player.isAlive) {
                    this.ctx.save();

                    // Add subtle outline based on size comparison
                    if (aiPlayer.radius > this.player.radius * 1.2) {
                        // Dangerous fish - red outline
                        this.ctx.strokeStyle = 'rgba(255, 80, 80, 0.3)';
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        this.ctx.arc(aiPlayer.x, aiPlayer.y, aiPlayer.radius + 5, 0, Math.PI * 2);
                        this.ctx.stroke();
                    } else if (aiPlayer.radius < this.player.radius * 0.8) {
                        // Edible fish - green outline
                        this.ctx.strokeStyle = 'rgba(80, 255, 80, 0.3)';
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        this.ctx.arc(aiPlayer.x, aiPlayer.y, aiPlayer.radius + 5, 0, Math.PI * 2);
                        this.ctx.stroke();
                    } else {
                        // Similar size fish - yellow outline
                        this.ctx.strokeStyle = 'rgba(255, 255, 80, 0.3)';
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        this.ctx.arc(aiPlayer.x, aiPlayer.y, aiPlayer.radius + 5, 0, Math.PI * 2);
                        this.ctx.stroke();
                    }

                    this.ctx.restore();
                }

                // Draw the AI player
                aiPlayer.draw();
            }
        }
        */
    }

    drawFood() {
        // Draw food using the food manager
        if (this.foodManager) {
            this.foodManager.draw();
        } else {
            // Legacy support for multiplayer food
            if (this.foods) {
        for (const food of this.foods) {
                    // Check if food has its own context (original Food class)
                    // or needs context passed (multiplayer food)
                    if (food.ctx) {
            food.draw();
                    } else {
                        food.draw(this.ctx);
                    }
                }
            }
        }
    }

    handlePlayerDeath() {
        // Prevent multiple calls to handlePlayerDeath
        if (this.deathHandled) return;

        // Set flag to indicate death is being handled
        this.deathHandled = true;

        // Show "You were eaten" message
        this.showFloatingText('You were eaten', this.player.x, this.player.y - 40, '#FF6666', 24);

        // Wait a short moment to let the message be visible, then show game over screen
        setTimeout(() => {
            // Clear any floating texts before showing game over screen
            this.floatingTexts = [];
            this.gameOver();
        }, 2000); // 2 seconds delay to read the message
    }

    spawnInitialAIPlayers() {
        // AI players disabled
        /*
        // Spawn initial AI players
        const initialCount = 5;
        for (let i = 0; i < initialCount; i++) {
            this.spawnAIPlayer();
        }
        */
    }

    spawnAIPlayer() {
        // AI players disabled
        /*
        if (this.aiPlayers.length >= this.maxAiPlayers) return;

        // Create a new AI player
        const aiPlayer = new AIPlayer(
            this.canvas,
            this.worldWidth,
            this.worldHeight,
            null, // Random name
            null, // Random color
            Math.max(1, Math.floor(this.player.sizeLevel * random(0.5, 1.5))) // Random size relative to player
        );

        // Make sure AI doesn't spawn too close to player
        const minDistance = 500;
        let attempts = 0;
        let validPosition = false;

        while (!validPosition && attempts < 10) {
            const distance = calculateDistance(aiPlayer.x, aiPlayer.y, this.player.x, this.player.y);
            if (distance > minDistance) {
                validPosition = true;
            } else {
                // Try a new position
                aiPlayer.x = random(this.worldWidth * 0.1, this.worldWidth * 0.9);
                aiPlayer.y = random(this.worldHeight * 0.1, this.worldHeight * 0.9);
                attempts++;
            }
        }

        // Add to leaderboard
        this.leaderboard.addPlayer(aiPlayer);

        // Add to AI players array
        this.aiPlayers.push(aiPlayer);
        */
    }

    spawnInitialFood() {
        // Spawn initial food using the food manager
        const initialCount = 50;
        if (this.foodManager) {
        for (let i = 0; i < initialCount; i++) {
                this.foodManager.spawnFood();
            }
        }
    }

    spawnFood() {
        if (!this.foodManager || this.foodManager.foods.length >= this.maxFoodItems) return null;

        // Spawn food using the food manager
        const food = this.foodManager.spawnFood();

        // Return the food for any additional processing
        return food;
    }


}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    const game = new Game(); // Create the game
    game.init(); // Initialize the game

    // Make game instance globally accessible
    // This is crucial for direct camera position access
    window.gameInstance = game;
});
