#!/usr/bin/env node
/**
 * CSS Bundle Builder for Streamline Dumpsters
 *
 * This script concatenates and minifies all CSS files into a single main.min.css bundle
 * to dramatically improve page load performance by reducing HTTP requests from 15 to 1.
 *
 * Usage: node build-css.js
 */

const fs = require('fs');
const path = require('path');

// CSS files in the exact order they're loaded in index.html
const CSS_FILES = [
  // Core Foundation (Load First)
  'css/variables.css',
  'css/reset.css',

  // Typography & Basic Elements
  'css/typography.css',
  'css/media.css',

  // Layout System
  'css/layout.css',
  'css/utilities.css',

  // Components
  'css/buttons.css',
  'css/forms.css',
  'css/navigation.css',
  'css/hero.css',
  'css/footer.css',
  'css/components.css',

  // Accessibility & Responsive
  'css/accessibility.css',
  'css/responsive.css',
  'css/index.css',
  'css/modal-utilities.css'
];

const OUTPUT_FILE = 'css/main.min.css';

console.log('🔨 Building CSS Bundle...');
console.log('═══════════════════════════════════════════════════════\n');

let concatenatedCSS = '';
let totalOriginalSize = 0;

// Read and concatenate all CSS files
CSS_FILES.forEach((file, index) => {
  try {
    const filePath = path.join(__dirname, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);

    totalOriginalSize += stats.size;

    console.log(`✓ [${index + 1}/${CSS_FILES.length}] ${file} (${(stats.size / 1024).toFixed(2)} KB)`);

    // Add file separator comment for debugging
    concatenatedCSS += `\n/* ========== ${file} ========== */\n`;
    concatenatedCSS += content;
    concatenatedCSS += '\n';

  } catch (error) {
    console.error(`✗ Error reading ${file}:`, error.message);
    process.exit(1);
  }
});

console.log('\n📦 Minifying CSS...');

// Simple but effective CSS minification
let minifiedCSS = concatenatedCSS
  // Remove comments (including multi-line)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  // Remove unnecessary whitespace
  .replace(/\s+/g, ' ')
  // Remove spaces around special characters
  .replace(/\s*([{}:;,>+~])\s*/g, '$1')
  // Remove trailing semicolons before }
  .replace(/;}/g, '}')
  // Remove units from zero values (except for times like 0s)
  .replace(/([: ,])0(px|em|rem|%|vh|vw)/g, '$1 0')
  // Trim the result
  .trim();

// Write the minified bundle
try {
  fs.writeFileSync(path.join(__dirname, OUTPUT_FILE), minifiedCSS, 'utf8');
  const outputStats = fs.statSync(path.join(__dirname, OUTPUT_FILE));
  const compressionRatio = ((1 - (outputStats.size / totalOriginalSize)) * 100).toFixed(1);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ CSS Bundle Created Successfully!\n');
  console.log(`📊 Build Statistics:`);
  console.log(`   • Input files: ${CSS_FILES.length}`);
  console.log(`   • Original size: ${(totalOriginalSize / 1024).toFixed(2)} KB`);
  console.log(`   • Minified size: ${(outputStats.size / 1024).toFixed(2)} KB`);
  console.log(`   • Compression: ${compressionRatio}% smaller`);
  console.log(`   • Output: ${OUTPUT_FILE}`);
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('\n📝 Next Steps:');
  console.log('   1. Test the bundle: Open https://localhost:3000 in your browser');
  console.log('   2. Check browser DevTools for any CSS errors');
  console.log('   3. If everything looks good, replace the 15 CSS links with:');
  console.log('      <link rel="stylesheet" href="css/main.min.css">');
  console.log('\n');

} catch (error) {
  console.error('✗ Error writing output file:', error.message);
  process.exit(1);
}
