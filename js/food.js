/**
 * Food class for the Fish Eat Fish game
 * Represents food particles that players can eat to grow
 * @class
 */
class Food {
    /**
     * Creates a new food item
     * @param {HTMLCanvasElement} canvas - The game canvas element
     * @param {number} worldWidth - Width of the game world
     * @param {number} worldHeight - Height of the game world
     */
    constructor(canvas, worldWidth, worldHeight) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // World dimensions
        this.worldWidth = worldWidth || canvas.width;
        this.worldHeight = worldHeight || canvas.height;

        // Position randomly within the world
        this.x = random(this.worldWidth * 0.1, this.worldWidth * 0.9);
        this.y = random(this.worldHeight * 0.1, this.worldHeight * 0.9);

        // Size and visual properties
        this.radius = random(3, 6);
        this.color = this.determineColor();
        this.value = this.radius; // Nutritional value proportional to size

        // Animation properties
        this.pulseAmount = 0;
        this.pulseDirection = 1;
        this.pulseSpeed = random(0.02, 0.05);
    }

    /**
     * Determines a random color for the food item
     * @returns {string} A hex color string
     * @private
     */
    determineColor() {
        const colors = [
            '#66FF66', // Green
            '#99FFFF', // Light blue
            '#FFFF99', // Light yellow
            '#FF99FF', // Light pink
            '#99FF99'  // Light green
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Updates the food's animation state
     */
    update() {
        // Update pulse effect
        this.pulseAmount += this.pulseSpeed * this.pulseDirection;
        if (this.pulseAmount >= 1) {
            this.pulseDirection = -1;
        } else if (this.pulseAmount <= 0) {
            this.pulseDirection = 1;
        }
    }

    /**
     * Renders the food item on the canvas
     */
    draw() {
        this.ctx.save();

        // Draw food with pulsing effect
        const pulseRadius = this.radius * (1 + this.pulseAmount * 0.2);

        // Draw outer glow
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, pulseRadius * 1.5, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + this.pulseAmount * 0.1})`;
        this.ctx.fill();
        this.ctx.closePath();

        // Draw food
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, pulseRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
        this.ctx.closePath();

        this.ctx.restore();
    }
    /**
     * Resets the food item for reuse in the object pool
     * @param {number} worldWidth - Width of the game world
     * @param {number} worldHeight - Height of the game world
     */
    reset(worldWidth, worldHeight) {
        // Update world dimensions if provided
        if (worldWidth) this.worldWidth = worldWidth;
        if (worldHeight) this.worldHeight = worldHeight;

        // Reset position randomly within the world
        this.x = random(this.worldWidth * 0.1, this.worldWidth * 0.9);
        this.y = random(this.worldHeight * 0.1, this.worldHeight * 0.9);

        // Reset size and visual properties
        this.radius = random(3, 6);
        this.color = this.determineColor();
        this.value = this.radius; // Nutritional value proportional to size

        // Reset animation properties
        this.pulseAmount = 0;
        this.pulseDirection = 1;
        this.pulseSpeed = random(0.02, 0.05);

        // Generate new ID for multiplayer tracking
        this.id = Date.now() + Math.random().toString(36).substring(2, 11);
    }
}

/**
 * FoodManager class for managing food items with object pooling
 * @class
 */
class FoodManager {
    /**
     * Creates a new food manager
     * @param {HTMLCanvasElement} canvas - The game canvas element
     * @param {number} worldWidth - Width of the game world
     * @param {number} worldHeight - Height of the game world
     * @param {number} maxFood - Maximum number of food items
     */
    constructor(canvas, worldWidth, worldHeight, maxFood = 100) {
        this.canvas = canvas;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.maxFood = maxFood;
        this.foods = [];

        // Create object pool for food items
        this.foodPool = new ObjectPool(
            // Factory function to create new food items
            () => new Food(canvas, worldWidth, worldHeight),
            // Reset function to prepare food items for reuse
            (food) => food.reset(worldWidth, worldHeight),
            // Initial pool size
            maxFood / 2
        );
    }

    /**
     * Updates all active food items
     */
    update() {
        for (const food of this.foods) {
            food.update();
        }
    }

    /**
     * Draws all active food items
     */
    draw() {
        for (const food of this.foods) {
            food.draw();
        }
    }

    /**
     * Spawns a new food item if below maximum
     * @returns {Food|null} The newly spawned food or null if at maximum
     */
    spawnFood() {
        if (this.foods.length >= this.maxFood) return null;

        // Get food from object pool
        const food = this.foodPool.get();
        this.foods.push(food);
        return food;
    }

    /**
     * Removes a food item and returns it to the pool
     * @param {number} index - Index of the food item to remove
     */
    removeFood(index) {
        if (index >= 0 && index < this.foods.length) {
            const food = this.foods[index];
            this.foods.splice(index, 1);
            this.foodPool.release(food);
        }
    }

    /**
     * Removes a food item by its ID and returns it to the pool
     * @param {string} id - ID of the food item to remove
     * @returns {boolean} True if food was found and removed
     */
    removeFoodById(id) {
        const index = this.foods.findIndex(food => food.id === id);
        if (index !== -1) {
            this.removeFood(index);
            return true;
        }
        return false;
    }

    /**
     * Clears all food items and returns them to the pool
     */
    clear() {
        for (const food of this.foods) {
            this.foodPool.release(food);
        }
        this.foods = [];
    }
}