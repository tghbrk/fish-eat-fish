/**
 * ObjectPool class for efficient object reuse
 * Helps reduce garbage collection and improve performance
 * @class
 */
class ObjectPool {
    /**
     * Creates a new object pool
     * @param {Function} factory - Function that creates new objects
     * @param {Function} reset - Function that resets objects for reuse
     * @param {number} initialSize - Initial number of objects to create
     */
    constructor(factory, reset, initialSize = 20) {
        this.factory = factory;
        this.reset = reset;
        this.pool = [];
        
        // Pre-populate the pool
        this.expand(initialSize);
    }

    /**
     * Expands the pool by creating new objects
     * @param {number} count - Number of objects to add
     */
    expand(count) {
        for (let i = 0; i < count; i++) {
            this.pool.push(this.factory());
        }
    }

    /**
     * Gets an object from the pool or creates a new one if empty
     * @returns {Object} An object from the pool
     */
    get() {
        if (this.pool.length === 0) {
            // Auto-expand the pool if empty
            this.expand(10);
        }
        return this.pool.pop();
    }

    /**
     * Returns an object to the pool for reuse
     * @param {Object} object - The object to return to the pool
     */
    release(object) {
        this.reset(object);
        this.pool.push(object);
    }

    /**
     * Returns the current size of the pool
     * @returns {number} Number of available objects in the pool
     */
    size() {
        return this.pool.length;
    }

    /**
     * Clears the pool, removing all objects
     */
    clear() {
        this.pool = [];
    }
}
