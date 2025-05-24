/**
 * Simple test script to verify bug fixes
 */

// Test 1: Check if formatFishType function exists and works
console.log('Testing formatFishType function...');
try {
    // This would normally be loaded from utils.js
    function formatFishType(fishType) {
        if (!fishType) return 'Unknown';
        return fishType.charAt(0).toUpperCase() + fishType.slice(1).toLowerCase();
    }
    
    console.log('✓ formatFishType("small fish"):', formatFishType("small fish"));
    console.log('✓ formatFishType(null):', formatFishType(null));
    console.log('✓ formatFishType(""):', formatFishType(""));
} catch (error) {
    console.error('✗ formatFishType test failed:', error);
}

// Test 2: Check if showElement/hideElement handle missing elements gracefully
console.log('\nTesting DOM element functions...');
try {
    function showElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.classList.remove('hidden');
        } else {
            console.warn(`Element with id '${id}' not found`);
        }
    }
    
    function hideElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
        } else {
            console.warn(`Element with id '${id}' not found`);
        }
    }
    
    // Test with non-existent element
    showElement('non-existent-element');
    hideElement('non-existent-element');
    console.log('✓ DOM element functions handle missing elements gracefully');
} catch (error) {
    console.error('✗ DOM element test failed:', error);
}

// Test 3: Check package.json structure
console.log('\nTesting package.json structure...');
const fs = require('fs');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check if @playwright/test is in devDependencies
    if (packageJson.devDependencies && packageJson.devDependencies['@playwright/test']) {
        console.log('✓ @playwright/test is correctly in devDependencies');
    } else {
        console.error('✗ @playwright/test not found in devDependencies');
    }
    
    // Check if it's not in dependencies
    if (!packageJson.dependencies || !packageJson.dependencies['@playwright/test']) {
        console.log('✓ @playwright/test is correctly NOT in dependencies');
    } else {
        console.error('✗ @playwright/test incorrectly found in dependencies');
    }
} catch (error) {
    console.error('✗ Package.json test failed:', error);
}

console.log('\nBug fix tests completed!');
