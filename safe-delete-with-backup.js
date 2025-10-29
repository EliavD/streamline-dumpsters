#!/usr/bin/env node
/**
 * Safe File Deletion with Backup
 * Backs up files before deletion, then removes them
 */
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = 'backup_deleted_files_20251012';

// Files marked as SAFE TO DELETE
const filesToDelete = [
  // HTML Backups (19 files)
  'bookNow.html.before-css-split',
  'bookNow.html.before-inline-removal',
  'contact.html.before-css-split',
  'dublin.html.before-css-split',
  'dublin.html.before-inline-removal',
  'faq.html.before-css-split',
  'faq.html.before-inline-removal',
  'hilliard.html.before-css-split',
  'hilliard.html.before-inline-removal',
  'index.html.before-css-split',
  'index.html.before-inline-removal',
  'plain-city.html.before-css-split',
  'plain-city.html.before-inline-removal',
  'powell.html.before-css-split',
  'powell.html.before-inline-removal',
  'upper-arlington.html.before-css-split',
  'upper-arlington.html.before-inline-removal',
  'worthington.html.before-css-split',
  'worthington.html.before-inline-removal',

  // CSS Backups (9 files)
  'css/base.backup.css',
  'css/base.css.before-split',
  'css/bookNow.backup.css',
  'css/contact.backup.css',
  'css/faq.backup.css',
  'css/index.backup.css',
  'css/location-page.backup.css',
  'css/modal-utilities.backup.css',
  'css/service-area.backup.css',

  // Old base.css (replaced by modular)
  'css/base.css',

  // Test HTML Files (4 files)
  'test-purged-css.html',
  'cors-fix-test.html',
  'quick-fix-loading.html',
  'test-updated-booking.html',

  // Build Scripts (15 files)
  'add_srcset.py',
  'resize_additional.py',
  'resize_images.py',
  'analyze-unused-files.js',
  'extract-inline-styles.js',
  'purge-css.js',
  'purgecss.config.js',
  'replace-inline-styles.js',
  'split-css-fixed.js',
  'split-css.js',
  'swap-css-for-testing.js',
  'update-html-css-links-v2.js',
  'update-html-css-links.js',
  'backup-and-replace.js',
  'https-server.js',

  // HTTPS Setup (3 files)
  'setup-https.bat',
  'setup-https.ps1',
  'setup-https.sh',

  // Google Apps Scripts (3 files)
  'google-apps-script-working.gs',
  'junk-removal-backend.gs',
  'test-sheet-connection.gs',

  // JSON Artifacts (3 files)
  'inline-styles-report.json',
  'seo-metadata-plan.json',
  'unused-files-report.json',

  // Old Components (3 files)
  'components/JunkRemovalModal.html',
  'components/DumpsterRentalModal.html',
  'components/junk-removal-modal.html'
];

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function backupFile(file) {
  if (!fs.existsSync(file)) {
    return false;
  }

  const backupPath = path.join(BACKUP_DIR, file);
  ensureDir(backupPath);

  try {
    fs.copyFileSync(file, backupPath);
    return true;
  } catch (error) {
    console.error(`  ✗ Error backing up ${file}:`, error.message);
    return false;
  }
}

function deleteFile(file) {
  if (!fs.existsSync(file)) {
    return false;
  }

  try {
    fs.unlinkSync(file);
    return true;
  } catch (error) {
    console.error(`  ✗ Error deleting ${file}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Safe File Deletion with Backup');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`Backup directory: ${BACKUP_DIR}`);
  console.log(`Files to process: ${filesToDelete.length}\n`);

  let backedUp = 0;
  let deleted = 0;
  let skipped = 0;

  // Step 1: Backup all files
  console.log('STEP 1: Backing up files...');
  console.log('─────────────────────────────────────────────────────────────────');

  for (const file of filesToDelete) {
    if (fs.existsSync(file)) {
      if (backupFile(file)) {
        console.log(`  ✓ Backed up: ${file}`);
        backedUp++;
      }
    } else {
      skipped++;
    }
  }

  console.log(`\nBackup complete: ${backedUp} files backed up, ${skipped} files not found\n`);

  // Step 2: Delete files
  console.log('STEP 2: Deleting files from codebase...');
  console.log('─────────────────────────────────────────────────────────────────');

  for (const file of filesToDelete) {
    if (fs.existsSync(file)) {
      if (deleteFile(file)) {
        console.log(`  ✓ Deleted: ${file}`);
        deleted++;
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('DELETION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Files backed up: ${backedUp}`);
  console.log(`Files deleted: ${deleted}`);
  console.log(`Files skipped (not found): ${skipped}`);
  console.log(`\nBackup location: ${BACKUP_DIR}`);
  console.log('\nNEXT STEPS:');
  console.log('1. Test all pages in browser');
  console.log('2. Check modals and forms work');
  console.log('3. Verify no console errors');
  console.log('4. If anything breaks, files are in backup folder');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
