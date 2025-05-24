# Fish Eat Fish 🐟

A multiplayer 2D arcade-style web game where players control fish that grow by eating smaller entities while avoiding larger predators. Built with HTML5 Canvas, JavaScript, and Socket.IO for real-time multiplayer gameplay.

![Fish Eat Fish Game](https://img.shields.io/badge/Game-Fish%20Eat%20Fish-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-ISC-yellow)

## 🎮 Features

### Core Gameplay
- **Smooth Movement**: Mouse-controlled fish movement with natural inertia
- **Growth System**: Eat smaller fish and food to grow larger and advance through size levels
- **Boost Mechanic**: Left-click to activate speed boost (consumes growth progress)
- **Visual Indicators**: Color-coded outlines for fish (green=edible, red=dangerous, yellow=similar size)
- **Level Progression**: Fish change size, shape, and color as they grow
- **Real-time Progress Bar**: Shows growth progress toward next level

### Multiplayer Features
- **Real-time PvP**: Compete against other players in a shared world
- **Live Leaderboard**: See current scores and rankings of all connected players
- **Player Synchronization**: Real-time position, size, and appearance updates
- **Automatic Fallback**: Single-player mode when server is unavailable

### User Interface
- **Minimap**: Top-left minimap showing player position and nearby entities
- **Transparent UI**: Semi-transparent elements that don't obstruct gameplay
- **Tutorial System**: Interactive tutorial for first-time players
- **Game Over Screen**: Replay functionality instead of automatic respawning
- **Cursor Fade**: Cursor fades to 70% opacity during gameplay

### Technical Features
- **Performance Monitoring**: Built-in FPS monitoring (press 'F' to toggle)
- **Responsive Design**: Adapts to different screen sizes
- **Full Screen Support**: Immersive full-screen gameplay
- **Object Pooling**: Optimized performance for many game entities

## 🛠️ Technology Stack

### Frontend
- **HTML5 Canvas**: 2D graphics rendering
- **JavaScript (ES6+)**: Core game logic
- **CSS3**: Styling and animations
- **Socket.IO Client**: Real-time communication

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web server framework
- **Socket.IO**: WebSocket communication
- **ES Modules**: Modern JavaScript module system

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fish-eat-fish
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   Or for production:
   ```bash
   npm start
   ```

4. **Open the game**
   - Navigate to `http://localhost:3000` in your web browser
   - For local testing without server: open `index.html` directly (single-player mode)

## 🎯 Game Controls

- **Movement**: Move your mouse cursor to control your fish
- **Boost**: Left-click and hold to activate speed boost
- **Performance Stats**: Press 'F' to toggle FPS display

## 🐠 Game Mechanics

### Growth System
- Eat smaller fish and food particles to fill your growth progress bar
- When the bar is full, advance to the next size level
- Each level increases your fish size and changes appearance
- Higher levels require more food to advance

### Boost System
- Boost increases movement speed temporarily
- Consumes growth progress from your current level
- Can shrink you to previous levels if overused
- Strategic use is key to survival and hunting

### Fish Interactions
- **Edible Fish**: 20% smaller than you (green outline)
- **Dangerous Fish**: 20% larger than you (red outline)
- **Similar Size**: Close to your size (yellow outline)
- Collision with larger fish results in game over

### Multiplayer Dynamics
- All players start at the same size level
- Real-time competition for food and territory
- Leaderboard tracks current session scores
- No AI players - pure player vs player experience

## 🌐 Multiplayer Architecture

The game uses a client-server architecture with Socket.IO for real-time communication:

- **Server**: Manages game state, player synchronization, and food spawning
- **Client**: Handles rendering, input, and local game logic
- **Synchronization**: Player positions, sizes, and scores are synchronized in real-time
- **Food Management**: Server controls food spawning and removal
- **Collision Detection**: Client-side with server validation

## 📁 File Structure

```
fish-eat-fish/
├── index.html              # Main HTML file
├── styles.css              # Game styling
├── server.js               # Node.js server
├── package.json            # Dependencies and scripts
├── js/
│   ├── game.js             # Main game class
│   ├── player.js           # Player fish logic
│   ├── enemy.js            # Enemy fish logic
│   ├── food.js             # Food system
│   ├── multiplayer.js      # Multiplayer communication
│   ├── leaderboard.js      # Leaderboard system
│   ├── utils.js            # Utility functions
│   ├── object-pool.js      # Performance optimization
│   ├── performance-monitor.js # FPS monitoring
│   └── water-effect.js     # Background effects
└── fish-eat-fish-PRD.md    # Product Requirements Document
```

## 🔧 Development

### Available Scripts
- `npm start`: Start production server
- `npm run dev`: Start development server with auto-reload
- `npm test`: Run tests (placeholder)

### Performance Optimization
- Object pooling for game entities
- Efficient collision detection
- Canvas optimization techniques
- Real-time performance monitoring

### Adding Features
1. Review the PRD for feature specifications
2. Follow the existing code structure and patterns
3. Test in both single-player and multiplayer modes
4. Update documentation as needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the package.json file for details.

## 🎮 Game Design Philosophy

Fish Eat Fish focuses on:
- **Simplicity**: Easy to learn, hard to master
- **Competition**: Real-time multiplayer competition
- **Progression**: Satisfying growth mechanics
- **Performance**: Smooth 60 FPS gameplay
- **Accessibility**: Works across different devices and browsers

---

**Enjoy the game and may the biggest fish win! 🏆**
