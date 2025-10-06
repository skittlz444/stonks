/**
 * Tests for cache version management scripts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { updateCacheVersion } from '../scripts/update-cache-version.js';
import { resetCacheVersion } from '../scripts/reset-cache-version.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Cache Version Management Scripts', () => {
  const SW_PATH = path.join(__dirname, '..', 'public', 'sw.js');
  const BACKUP_PATH = path.join(__dirname, 'temp-sw-backup.js');
  const BUILD_TIMESTAMP_PLACEHOLDER = '{{BUILD_TIMESTAMP}}';
  
  let originalContent;
  
  beforeEach(() => {
    // Backup original service worker content
    originalContent = fs.readFileSync(SW_PATH, 'utf8');
    fs.writeFileSync(BACKUP_PATH, originalContent, 'utf8');
    
    // Ensure we start with a clean placeholder state
    const placeholderContent = originalContent
      .replace(/const BUILD_TIMESTAMP = '[^']+';/, `const BUILD_TIMESTAMP = '${BUILD_TIMESTAMP_PLACEHOLDER}';`)
      .replace(/const CACHE_NAME = `stonks-[^`]+`;/, `const CACHE_NAME = \`stonks-${BUILD_TIMESTAMP_PLACEHOLDER}\`;`);
    
    fs.writeFileSync(SW_PATH, placeholderContent, 'utf8');
  });
  
  afterEach(() => {
    // Restore original content
    fs.writeFileSync(SW_PATH, originalContent, 'utf8');
    
    // Clean up backup file
    if (fs.existsSync(BACKUP_PATH)) {
      fs.unlinkSync(BACKUP_PATH);
    }
  });

  describe('updateCacheVersion', () => {
    it('should replace BUILD_TIMESTAMP placeholder with actual timestamp', () => {
      // Arrange - service worker should have placeholder
      const beforeContent = fs.readFileSync(SW_PATH, 'utf8');
      expect(beforeContent).toContain(BUILD_TIMESTAMP_PLACEHOLDER);
      
      // Act
      updateCacheVersion();
      
      // Assert
      const afterContent = fs.readFileSync(SW_PATH, 'utf8');
      expect(afterContent).not.toContain(BUILD_TIMESTAMP_PLACEHOLDER);
    });
    
    it('should generate timestamp in correct format (YYYYMMDD-HHMMSS)', () => {
      // Act
      updateCacheVersion();
      
      // Assert
      const content = fs.readFileSync(SW_PATH, 'utf8');
      const timestampMatch = content.match(/const BUILD_TIMESTAMP = '(\d{8}-\d{6})';/);
      
      expect(timestampMatch).toBeTruthy();
      expect(timestampMatch[1]).toMatch(/^\d{8}-\d{6}$/);
      
      // Verify it's a valid date format
      const [datePart, timePart] = timestampMatch[1].split('-');
      const year = datePart.substring(0, 4);
      const month = datePart.substring(4, 6);
      const day = datePart.substring(6, 8);
      const hour = timePart.substring(0, 2);
      const minute = timePart.substring(2, 4);
      const second = timePart.substring(4, 6);
      
      expect(parseInt(year)).toBeGreaterThanOrEqual(2024);
      expect(parseInt(month)).toBeGreaterThanOrEqual(1);
      expect(parseInt(month)).toBeLessThanOrEqual(12);
      expect(parseInt(day)).toBeGreaterThanOrEqual(1);
      expect(parseInt(day)).toBeLessThanOrEqual(31);
      expect(parseInt(hour)).toBeGreaterThanOrEqual(0);
      expect(parseInt(hour)).toBeLessThanOrEqual(23);
      expect(parseInt(minute)).toBeGreaterThanOrEqual(0);
      expect(parseInt(minute)).toBeLessThanOrEqual(59);
      expect(parseInt(second)).toBeGreaterThanOrEqual(0);
      expect(parseInt(second)).toBeLessThanOrEqual(59);
    });
    
    it('should update CACHE_NAME with timestamp', () => {
      // Act
      updateCacheVersion();
      
      // Assert
      const content = fs.readFileSync(SW_PATH, 'utf8');
      const cacheNameMatch = content.match(/const CACHE_NAME = `stonks-(\d{8}-\d{6})`;/);
      
      expect(cacheNameMatch).toBeTruthy();
      expect(cacheNameMatch[1]).toMatch(/^\d{8}-\d{6}$/);
    });
    
    it('should use same timestamp for both BUILD_TIMESTAMP and CACHE_NAME', () => {
      // Act
      updateCacheVersion();
      
      // Assert
      const content = fs.readFileSync(SW_PATH, 'utf8');
      const timestampMatch = content.match(/const BUILD_TIMESTAMP = '(\d{8}-\d{6})';/);
      const cacheNameMatch = content.match(/const CACHE_NAME = `stonks-(\d{8}-\d{6})`;/);
      
      expect(timestampMatch[1]).toBe(cacheNameMatch[1]);
    });
  });

  describe('resetCacheVersion', () => {
    it('should restore BUILD_TIMESTAMP placeholder', () => {
      // Arrange - first update with timestamp
      updateCacheVersion();
      const updatedContent = fs.readFileSync(SW_PATH, 'utf8');
      expect(updatedContent).not.toContain(BUILD_TIMESTAMP_PLACEHOLDER);
      
      // Act
      resetCacheVersion();
      
      // Assert
      const resetContent = fs.readFileSync(SW_PATH, 'utf8');
      expect(resetContent).toContain(`const BUILD_TIMESTAMP = '${BUILD_TIMESTAMP_PLACEHOLDER}';`);
    });
    
    it('should restore CACHE_NAME placeholder', () => {
      // Arrange - first update with timestamp
      updateCacheVersion();
      const updatedContent = fs.readFileSync(SW_PATH, 'utf8');
      expect(updatedContent).toMatch(/const CACHE_NAME = `stonks-\d{8}-\d{6}`;/);
      
      // Act
      resetCacheVersion();
      
      // Assert
      const resetContent = fs.readFileSync(SW_PATH, 'utf8');
      expect(resetContent).toContain(`const CACHE_NAME = \`stonks-${BUILD_TIMESTAMP_PLACEHOLDER}\`;`);
    });
    
    it('should be idempotent (safe to call multiple times)', () => {
      // Arrange - first update, then reset
      updateCacheVersion();
      resetCacheVersion();
      const firstResetContent = fs.readFileSync(SW_PATH, 'utf8');
      
      // Act - reset again
      resetCacheVersion();
      const secondResetContent = fs.readFileSync(SW_PATH, 'utf8');
      
      // Assert
      expect(firstResetContent).toBe(secondResetContent);
      expect(secondResetContent).toContain(BUILD_TIMESTAMP_PLACEHOLDER);
    });
  });

  describe('Integration Tests', () => {
    it('update and reset cycle should work correctly', () => {
      // Start with placeholder
      const startContent = fs.readFileSync(SW_PATH, 'utf8');
      expect(startContent).toContain(BUILD_TIMESTAMP_PLACEHOLDER);
      
      // Update
      updateCacheVersion();
      const updatedContent = fs.readFileSync(SW_PATH, 'utf8');
      expect(updatedContent).not.toContain(BUILD_TIMESTAMP_PLACEHOLDER);
      expect(updatedContent).toMatch(/stonks-\d{8}-\d{6}/);
      
      // Reset
      resetCacheVersion();
      const resetContent = fs.readFileSync(SW_PATH, 'utf8');
      expect(resetContent).toContain(BUILD_TIMESTAMP_PLACEHOLDER);
    });
  });
});
