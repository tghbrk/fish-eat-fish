# Product Requirements Document: Fish Eat Fish (Enhanced Version)

**Version:** 3.0
**Date:** 2025-04-25

## 1. Overview

### 1.1. Introduction
This document outlines the requirements for the enhanced version of "Fish Eat Fish," a 2D arcade-style web game. Building upon the original concept, this version introduces multiplayer functionality, a persistent leaderboard, diverse enemy types with unique behaviors, a dynamic prey/weakness system, and visual player progression. The core gameplay remains centered around controlling a fish that consumes smaller entities to grow larger while avoiding larger predators in a persistent online environment.

### 1.2. Goals
*   Provide an engaging and competitive multiplayer "eat and grow" experience.
*   Implement a robust leaderboard system to foster competition and replayability.
*   Introduce diverse enemy types and mechanics (prey/weakness) for deeper gameplay.
*   Offer clear visual feedback for player growth, status, and interactions.
*   Ensure smooth performance and intuitive controls on web browsers.
*   Establish a foundation for potential future expansions (new modes, power-ups).

### 1.3. Target Audience
*   Casual gamers seeking competitive, quick-session online games.
*   Players who enjoy progression and leaderboard climbing.
*   Fans of arcade-style "eat and grow" games.

## 2. Functional Requirements

### 2.1. Core Gameplay Loop
1.  **Control:** The player controls a fish using the mouse cursor or touch input. The fish follows the cursor/touch position on the screen with a smooth, natural movement.
2.  **Movement:** Player movement incorporates inertia for a smoother feel. Movement is primarily horizontal with a slower overall pace for better gameplay experience.
3.  **Boost:** Players can activate a temporary speed boost by clicking/holding the left mouse button or touching/holding the screen. Boosting consumes the player's growth progress and can even revert the player to smaller size levels if used extensively. Visual effects indicate when boost is active.
4.  **Eating:** Players grow by consuming:
    *   **Smaller Fish:** Eating fish smaller than the player grants points and contributes to growth progress.
    *   **Food Particles:** Small, passive food particles spawn in the world, providing minor growth progress when consumed.
5.  **Growth:**
    *   Consuming fish/food fills a growth progress bar displayed at the bottom of the screen.
    *   When the progress bar is full, the player advances to the next `sizeLevel`.
    *   Growth increases the player's fish radius, slightly decreases base speed, and increases the `fishNeededToGrow` for the next level.
    *   Player's visual appearance (size, shape, and color) evolves as they reach new size levels.
    *   Visual indicators show when fish can be eaten (green outline) or are dangerous (red outline).
6.  **Predation:** Players are eliminated if they collide with a fish larger than them.
7.  **Scoring:** Points are awarded for eating fish, with larger fish worth more points. Score contributes to leaderboard ranking.
8.  **Game Over:** Occurs when the player's fish is eaten. A game over screen appears with a replay button rather than automatic respawning.
9.  **Fish Visibility:** Fish within the player's vision area are highlighted with subtle colored outlines indicating if they're edible (green), dangerous (red), or similar in size (yellow).

### 2.2. Enemy Fish & AI
1.  **Spawning:** Enemies spawn periodically from the edges of the large game world. Fish are scattered throughout the map rather than concentrated at the top.
2.  **Types:** Enemy fish have a simplified design with consistent behavior:
    *   **Regular Fish:** Standard behavior and points. Color varies by size.
    *   Fish change size, shape, and color when they grow, matching the same growth mechanic as the player.
3.  **AI Behavior:**
    *   **Movement:** Enemies move across the world with primarily horizontal movement, bouncing off world boundaries. They exhibit semi-random movement patterns, occasionally changing direction.
    *   **No Water Flow:** The game environment has no water current/flow that affects fish movement.
4.  **Visual Indicators:**
    *   Fish within the player's vision range have subtle colored outlines:
        *   Red outline for fish that are dangerous to the player (20% larger)
        *   Green outline for fish that can be eaten by the player (20% smaller)
        *   Yellow outline for fish of similar size to the player

### 2.3. Multiplayer
1.  **Mode:** The primary game mode is Player vs. Player (PvP) within a shared world instance with leaderboard functionality.
2.  **Server:** Requires either a Node.js or Python backend server to manage game state, player synchronization, and leaderboard data.
3.  **Connection:** The client attempts to connect to the server upon starting a game. If connection fails or running locally via `file://`, defaults to single-player mode (no other players visible, leaderboard shows local players only).
4.  **Synchronization:** Player positions, scores, sizes, names, and visual appearances are synchronized across all connected clients. Enemy states and food positions are managed and synchronized by the server.
5.  **Player Representation:** Other players are visible in the game world with their current size and appearance.
6.  **No AI Players:** The game focuses on real player interactions without AI-controlled fish.

### 2.4. Leaderboard
1.  **Functionality:** An in-game leaderboard displays the names and current scores of all connected players, ranked in real-time.
2.  **Persistence:** Scores are managed by the server and match the UI display.
3.  **UI:** Displayed in the top-right corner with a semi-transparent background that matches the game's aesthetic.
4.  **Visual Style:** The leaderboard has a transparent background with subtle borders and highlights the current player's entry.

### 2.5. World & Environment
1.  **World Size:** The game takes place in a large world, significantly bigger than the visible screen area (`worldWidth`, `worldHeight`).
2.  **Camera:** The camera follows the player's fish, keeping it centered on the screen. There is no edge attraction effect at screen boundaries.
3.  **Minimap:** A minimap in the top-left corner displays:
    * The player's position relative to the overall world boundaries
    * Only entities within the player's vision area
    * A transparent background that matches the game's aesthetic
    * Color-coded dots representing different entities (player, food, other fish)
    * An elliptical vision area that matches the player's screen view
4.  **Background:** Features a clean underwater background without distracting elements.
5.  **Full Screen Mode:** The game supports full screen mode for an immersive experience.

### 2.6. Levels & Difficulty
1.  **Level Progression:** Players advance through size levels by filling their growth progress bar.
2.  **Growth Mechanics:**
    * Each level requires more food/fish to be eaten than the previous level
    * The progress bar at the bottom center shows progress toward the next size level
    * The label above the progress bar shows "Level" instead of "Size"
3.  **Visual Feedback:**
    * Fish change size, shape, and color when leveling up
    * A growth animation plays when the player levels up
    * The progress bar updates in real-time, including when boost is being used
4.  **Boost Mechanics:**
    * Boosting consumes growth progress
    * If all growth progress in the current level is consumed, the player will shrink to the previous level
    * Boosting can continue until the player returns to the smallest fish size
    * Visual effects indicate when boost is active

### 2.7. User Interface (UI) & User Experience (UX)
1.  **Main Menu:**
    *   "Start Game" button.
    *   Player Name input field.
    *   "How to Play" button/section.
    *   Full screen toggle option.
2.  **In-Game HUD:**
    *   Growth Progress Bar at the bottom center with "Level" label.
    *   Live Leaderboard in the top-right with transparent background.
    *   Minimap in the top-left with transparent background.
    *   No score display, player rank, player name, or connection status displays to keep the UI clean.
3.  **Game Over Screen:**
    *   "Game Over" message.
    *   Final Score.
    *   "Play Again" button.
    *   "Main Menu" button.
4.  **Tutorial:**
    *   An interactive tutorial sequence for first-time players, explaining core mechanics (movement, eating, avoiding, boosting).
5.  **Visual Feedback:**
    *   Clear visual distinction between fish sizes.
    *   Floating text for score gains.
    *   Visual effects for eating, boosting, and level transitions.
    *   Player fish appearance changes with growth/level.
    *   Cursor indicator fades out while the mouse is moving, with 70% opacity.
    *   Color-coded outlines for fish (green for edible, red for dangerous, yellow for similar size).
6.  **Sound & Music:**
    *   Background music loop.
    *   Sound effects for eating, growth, boost, game over, etc.

### 2.8. Simplified Gameplay
1.  **No Special Fish Types:**
    *   The game uses a simplified approach without special fish types like golden, poisonous, or armored fish.
    *   All fish follow the same basic mechanics, with size being the primary differentiator.
2.  **No Power-ups:**
    *   The game does not include power-ups to keep gameplay focused on the core eat-and-grow mechanics.
    *   The boost feature provides sufficient strategic depth without additional power-ups.
3.  **No AI Players:**
    *   The game focuses on real player interactions in multiplayer mode.
    *   In single-player mode, only regular enemy fish are present.

## 3. Non-Functional Requirements

### 3.1. Technology Stack
*   **Frontend:** HTML5, CSS3, JavaScript (ES6+), HTML5 Canvas API.
*   **Backend:** Either Node.js or Python for the server implementation, with WebSockets for multiplayer communication.
*   **Libraries:** No major external frontend frameworks (uses vanilla JS for core logic).

### 3.2. Performance
*   Target smooth 60 FPS gameplay on typical desktop browsers.
*   Optimize rendering and collision detection for potentially numerous on-screen entities.
*   Minimize network latency impact on gameplay experience. Server logic should be efficient.

### 3.3. Platform & Compatibility
*   Primary Target: Desktop Web Browsers (Chrome, Firefox, Edge, Safari).
*   Mobile Responsiveness: Basic touch controls are implemented, but UI/UX should be reviewed and potentially optimized for mobile devices.

### 3.4. Controls
*   **Mouse:** Mouse movement for direction, Left-Click for boost.
*   **Touch:** Touch movement for direction, Touch hold for boost.
*   **Cursor:** The cursor fades out while moving but remains partially visible (70% opacity).

### 3.5. Scalability
*   The server should be designed to handle a moderate number of concurrent players per game instance (e.g., 10-20). Architecture should allow for potential future scaling (multiple game instances/servers).

### 3.6. Code Quality
*   Maintain readable, well-commented, and modular code (using classes like `Game`, `PlayerFish`, `EnemyFish`, `MultiplayerManager`, `Leaderboard`).

## 4. Success Metrics

*   **Player Engagement:** Average session length, frequency of play.
*   **Retention:** Daily/Weekly active users, first-time player tutorial completion rate.
*   **Competitiveness:** Leaderboard activity (score ranges, player rank distribution).
*   **Performance:** Average client FPS, server stability under load, low network latency.
*   **User Feedback:** Qualitative feedback gathered through user comments or surveys.

## 5. Acceptance Criteria (Examples)

*   **AC1 (Movement):** Player fish follows the mouse cursor position with smooth, primarily horizontal movement.
*   **AC2 (Eating):** When the player fish collides with a smaller enemy fish, the enemy fish disappears, the player's score increases, and the growth progress bar fills proportionally.
*   **AC3 (Growth):** Upon filling the growth progress bar, the player's `sizeLevel` increases, the fish's visual appearance changes (size, shape, color), and the progress bar resets.
*   **AC4 (Boost):** Holding the left mouse button activates boost, increasing player speed and visibly draining the growth progress bar; releasing stops the effect.
*   **AC5 (Advanced Boost):** When boost depletes the current level's growth progress, the player shrinks to the previous level and continues boosting with the new level's progress bar.
*   **AC6 (Predation):** When the player fish collides with a larger enemy fish, the game over screen appears with a replay button.
*   **AC7 (Visual Indicators):** Fish within the player's vision range display color-coded outlines (green for edible, red for dangerous, yellow for similar size).
*   **AC8 (Minimap):** The minimap shows an elliptical vision area that matches the player's screen view, with only entities within that area visible.
*   **AC9 (Transparent UI):** The minimap and leaderboard have semi-transparent backgrounds that don't obstruct gameplay.
*   **AC10 (Multiplayer):** Other connected players are visible on screen and their movements/size changes are reflected in near real-time.
*   **AC11 (Leaderboard):** The in-game leaderboard accurately displays the names and scores of connected players, sorted by score.
*   **AC12 (Cursor Fade):** The cursor indicator fades to 70% opacity while the mouse is moving.
*   **AC13 (Full Screen):** The game can be toggled to full screen mode from the main menu.