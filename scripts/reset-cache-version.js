#!/usr/bin/env node

/**
 * Reset script to restore service worker cache name to development placeholder
 * This is useful for development and ensuring the build script works correctly
 */

const fs = require('fs');
const path = require('path');

const SW_PATH = path.join(__dirname, '..', 'public', 'sw.js');
const BUILD_TIMESTAMP_PLACEHOLDER = '{{BUILD_TIMESTAMP}}';

function resetCacheVersion() {
  try {
    // Read the service worker file
    let swContent = fs.readFileSync(SW_PATH, 'utf8');
    
    // Find the cache name line and replace with placeholder
    const cacheNameRegex = /const CACHE_NAME = `stonks-[^`]+`;/;
    const placeholderLine = `const CACHE_NAME = \`stonks-${BUILD_TIMESTAMP_PLACEHOLDER}\`;`;
    
    if (cacheNameRegex.test(swContent)) {
      swContent = swContent.replace(cacheNameRegex, placeholderLine);
    } else {
      console.log('⚠️  Cache name pattern not found in service worker');
      return;
    }
    
    // Also reset the BUILD_TIMESTAMP constant
    const timestampRegex = /const BUILD_TIMESTAMP = '[^']+';/;
    const placeholderConstant = `const BUILD_TIMESTAMP = '${BUILD_TIMESTAMP_PLACEHOLDER}';`;
    
    if (timestampRegex.test(swContent)) {
      swContent = swContent.replace(timestampRegex, placeholderConstant);
    }
    
    // Write back to file
    fs.writeFileSync(SW_PATH, swContent, 'utf8');
    
    console.log('✅ Reset service worker cache version to development placeholder');
    
  } catch (error) {
    console.error('❌ Failed to reset cache version:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  resetCacheVersion();
}

module.exports = { resetCacheVersion };
