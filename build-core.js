#!/usr/bin/env node
/**
 * Core JS Bundle Builder for Streamline Dumpsters
 *
 * This script concatenates config.js and modal-loader.js into core.min.js
 *
 * Usage: node build-core.js
 */

const fs = require('fs');
const path = require('path');

// JS files to bundle (in order)
const JS_FILES = [
  'js/config.js',
  'js/modal-loader.js'
];

const OUTPUT_FILE = 'js/core.min.js';

console.log('🔨 Building Core JS Bundle...');
console.log('═══════════════════════════════════════════════════════\n');

let concatenatedJS = '';
let totalOriginalSize = 0;

// Read and concatenate all JS files
JS_FILES.forEach((file, index) => {
  try {
    const filePath = path.join(__dirname, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);

    totalOriginalSize += stats.size;

    console.log(`✓ [${index + 1}/${JS_FILES.length}] ${file} (${(stats.size / 1024).toFixed(2)} KB)`);

    // Add file separator comment for debugging
    concatenatedJS += `\n/* ========== ${file} ========== */\n`;
    concatenatedJS += content;
    concatenatedJS += '\n';

  } catch (error) {
    console.error(`✗ Error reading ${file}:`, error.message);
    process.exit(1);
  }
});

console.log('\n📦 Minifying JavaScript...');

// Simple but effective JS minification
let minifiedJS = concatenatedJS
  // Remove multi-line comments
  .replace(/\/\*[\s\S]*?\*\//g, '')
  // Remove single-line comments (but preserve URLs like https://)
  .replace(/([^:])\/\/.*$/gm, '$1')
  // Remove extra whitespace
  .replace(/\s+/g, ' ')
  // Remove spaces around operators and braces (be careful!)
  .replace(/\s*([{}();,=:])\s*/g, '$1')
  // Trim the result
  .trim();

// Write the minified bundle
try {
  fs.writeFileSync(path.join(__dirname, OUTPUT_FILE), minifiedJS, 'utf8');
  const outputStats = fs.statSync(path.join(__dirname, OUTPUT_FILE));
  const compressionRatio = ((1 - (outputStats.size / totalOriginalSize)) * 100).toFixed(1);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ Core JS Bundle Created Successfully!\n');
  console.log(`📊 Build Statistics:`);
  console.log(`   • Input files: ${JS_FILES.length}`);
  console.log(`   • Original size: ${(totalOriginalSize / 1024).toFixed(2)} KB`);
  console.log(`   • Minified size: ${(outputStats.size / 1024).toFixed(2)} KB`);
  console.log(`   • Compression: ${compressionRatio}% smaller`);
  console.log(`   • Output: ${OUTPUT_FILE}`);
  console.log('\n═══════════════════════════════════════════════════════');

} catch (error) {
  console.error('✗ Error writing output file:', error.message);
  process.exit(1);
}
