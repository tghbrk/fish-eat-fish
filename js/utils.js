/**
 * Utility functions for the Fish Eat Fish game
 */

// Random number between min and max (inclusive)
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Check collision between two objects
function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (obj1.radius + obj2.radius);
}

// Calculate angle between two points
function calculateAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

// Calculate distance between two points
function calculateDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// Get random position outside the canvas
function getRandomPositionOutsideCanvas(canvas, radius) {
    const side = random(0, 3); // 0: top, 1: right, 2: bottom, 3: left
    let x, y;
    
    switch(side) {
        case 0: // top
            x = random(-radius, canvas.width + radius);
            y = -radius;
            break;
        case 1: // right
            x = canvas.width + radius;
            y = random(-radius, canvas.height + radius);
            break;
        case 2: // bottom
            x = random(-radius, canvas.width + radius);
            y = canvas.height + radius;
            break;
        case 3: // left
            x = -radius;
            y = random(-radius, canvas.height + radius);
            break;
    }
    
    return { x, y };
}

// Get random color
function getRandomColor() {
    const colors = [
        '#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', 
        '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
        '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', 
        '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC'
    ];
    return colors[random(0, colors.length - 1)];
}

// Show an element by ID
function showElement(id) {
    document.getElementById(id).classList.remove('hidden');
}

// Hide an element by ID
function hideElement(id) {
    document.getElementById(id).classList.add('hidden');
}
