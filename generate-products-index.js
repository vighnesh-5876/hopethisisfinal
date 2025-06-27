#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate products index.json file by scanning the content/products directory
 * This ensures newly added products are automatically detected
 */
function generateProductsIndex() {
    const productsDir = path.join(__dirname, 'content/products');
    const indexPath = path.join(productsDir, 'index.json');
    
    try {
        // Read all files in the products directory
        const files = fs.readdirSync(productsDir);
        
        // Filter for .md files only, excluding index.json and .gitkeep
        const productFiles = files.filter(file => 
            file.endsWith('.md') && 
            file !== 'index.json' && 
            file !== '.gitkeep'
        ).sort();
        
        // Create index data
        const indexData = {
            products: productFiles,
            lastUpdated: new Date().toISOString(),
            count: productFiles.length
        };
        
        // Write index.json file
        fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
        
        console.log(`Generated products index with ${productFiles.length} products:`);
        productFiles.forEach(file => console.log(`  - ${file}`));
        console.log(`Index saved to: ${indexPath}`);
        
        return indexData;
        
    } catch (error) {
        console.error('Error generating products index:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    generateProductsIndex();
}

module.exports = generateProductsIndex;