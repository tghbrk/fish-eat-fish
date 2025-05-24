import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create the Express app and HTTP server
const app = express();
const server = createServer(app);
const io = new Server(server);

// Serve static files from the current directory
app.use(express.static(__dirname));

// Game state
const gameState = {
    players: {},
    foods: [],
    enemies: [],
    worldWidth: 3840,  // Default, will be updated based on client window size
    worldHeight: 2160, // Default, will be updated based on client window size
    maxFoodItems: 100,
    connectedPlayers: 0  // Track number of connected players
};

// Food generation
function generateFood() {
    if (gameState.foods.length >= gameState.maxFoodItems) return;

    // Create a new food item with random position
    const food = {
        id: Date.now() + Math.random().toString(36).substring(2, 11),
        x: Math.random() * gameState.worldWidth,
        y: Math.random() * gameState.worldHeight,
        radius: 5,
        value: 1,
        color: getRandomFoodColor()
    };

    gameState.foods.push(food);
    return food;
}

function getRandomFoodColor() {
    const colors = ['#AAFFAA', '#AAAAFF', '#FFAAAA', '#FFFFAA', '#FFAAFF', '#AAFFFF'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Generate initial food
for (let i = 0; i < 50; i++) {
    generateFood();
}

// Food spawning interval - optimized for player count
let foodSpawnInterval;

function startFoodSpawning() {
    if (foodSpawnInterval) {
        clearInterval(foodSpawnInterval);
    }

    // Adjust spawn rate based on number of players
    let spawnRate;
    if (gameState.connectedPlayers === 0) {
        return; // No spawning if no players
    } else if (gameState.connectedPlayers === 1) {
        spawnRate = 2000; // Slower spawning for single player (every 2 seconds)
    } else {
        spawnRate = 500; // Normal spawning for multiplayer (every 500ms)
    }

    foodSpawnInterval = setInterval(() => {
        const newFood = generateFood();
        if (newFood && gameState.connectedPlayers > 0) {
            io.emit('foodSpawned', newFood);
        }
    }, spawnRate);
}

// Start initial food spawning
startFoodSpawning();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Increment connected players count
    gameState.connectedPlayers++;
    console.log(`Connected players: ${gameState.connectedPlayers}`);

    // Restart food spawning with new player count
    startFoodSpawning();

    // Send current game state to the new player
    socket.emit('gameState', gameState);

    // Handle player joining
    socket.on('playerJoin', (playerData) => {
        console.log('Player joined:', playerData.name);

        // Create player in game state
        gameState.players[socket.id] = {
            id: socket.id,
            name: playerData.name,
            x: playerData.x,
            y: playerData.y,
            radius: playerData.radius,
            color: playerData.color,
            eyeColor: playerData.eyeColor,
            pupilColor: playerData.pupilColor,
            angle: playerData.angle,
            score: 0,
            sizeLevel: 1,
            isAlive: true
        };

        // Update world dimensions if needed
        if (playerData.worldWidth && playerData.worldHeight) {
            gameState.worldWidth = Math.max(gameState.worldWidth, playerData.worldWidth);
            gameState.worldHeight = Math.max(gameState.worldHeight, playerData.worldHeight);
        }

        // Broadcast new player to all other players (only if there are other players)
        if (gameState.connectedPlayers > 1) {
            socket.broadcast.emit('playerJoined', gameState.players[socket.id]);
        }
    });

    // Handle player movement
    socket.on('playerUpdate', (playerData) => {
        const player = gameState.players[socket.id];
        if (player) {
            // Update player data
            player.x = playerData.x;
            player.y = playerData.y;
            player.radius = playerData.radius;
            player.angle = playerData.angle;
            player.score = playerData.score;
            player.sizeLevel = playerData.sizeLevel;
            player.isAlive = playerData.isAlive;

            // Broadcast player update to all other players (only if there are other players)
            if (gameState.connectedPlayers > 1) {
                socket.broadcast.emit('playerMoved', player);
            }
        }
    });

    // Handle food eaten
    socket.on('foodEaten', (foodId) => {
        // Remove food from game state
        const foodIndex = gameState.foods.findIndex(food => food.id === foodId);
        if (foodIndex !== -1) {
            gameState.foods.splice(foodIndex, 1);

            // Broadcast food eaten to all players
            io.emit('foodRemoved', foodId);
        }
    });

    // Handle player eating another player
    socket.on('playerEaten', (eatenPlayerId) => {
        const eatenPlayer = gameState.players[eatenPlayerId];
        if (eatenPlayer) {
            eatenPlayer.isAlive = false;

            // Broadcast player eaten to all players
            io.emit('playerDied', eatenPlayerId);
        }
    });

    // Handle player respawn
    socket.on('playerRespawn', (playerData) => {
        const player = gameState.players[socket.id];
        if (player) {
            // Update player data
            player.x = playerData.x;
            player.y = playerData.y;
            player.radius = playerData.radius;
            player.score = playerData.score;
            player.sizeLevel = playerData.sizeLevel;
            player.isAlive = true;

            // Broadcast player respawn to all players (only if there are other players)
            if (gameState.connectedPlayers > 1) {
                io.emit('playerRespawned', player);
            }
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Decrement connected players count
        gameState.connectedPlayers = Math.max(0, gameState.connectedPlayers - 1);
        console.log(`Connected players: ${gameState.connectedPlayers}`);

        // Restart food spawning with new player count
        startFoodSpawning();

        // Remove player from game state
        if (gameState.players[socket.id]) {
            const playerName = gameState.players[socket.id].name;
            delete gameState.players[socket.id];

            // Broadcast player left to all players (only if there are other players)
            if (gameState.connectedPlayers > 0) {
                io.emit('playerLeft', socket.id);
            }
            console.log('Player left:', playerName);
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
