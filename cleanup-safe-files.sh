#!/bin/bash
################################################################################
# Streamline Dumpsters - Safe File Cleanup Script
# DO NOT RUN WITHOUT REVIEWING CLEANUP-REPORT.md FIRST!
#
# This script removes only the "SAFE TO DELETE" files identified in analysis
# A full backup is created before any deletions
################################################################################

set -e  # Exit on any error

echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║  Streamline Dumpsters - Safe File Cleanup                               ║"
echo "║  This will delete 67 files (~1.8 MB)                                    ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Create backup directory
BACKUP_DIR="backup_before_cleanup_$(date +%Y%m%d_%H%M%S)"
echo "Creating backup: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Backup everything first
echo "Backing up all files..."
cp -r . "$BACKUP_DIR/" 2>/dev/null || true
echo "✓ Backup created at: $BACKUP_DIR"
echo ""

# Confirmation prompt
echo "⚠️  WARNING: About to delete 67 files"
echo "   Backup saved at: $BACKUP_DIR"
echo ""
echo "Press Ctrl+C to CANCEL"
echo "Press Enter to CONTINUE with deletion..."
read

echo ""
echo "Starting cleanup..."
echo "══════════════════════════════════════════════════════════════════════════"

# Counter
deleted=0

# HTML Backup Files (19 files)
echo ""
echo "Removing HTML backup files..."
for file in bookNow.html.before-css-split \
            bookNow.html.before-inline-removal \
            contact.html.before-css-split \
            dublin.html.before-css-split \
            dublin.html.before-inline-removal \
            faq.html.before-css-split \
            faq.html.before-inline-removal \
            hilliard.html.before-css-split \
            hilliard.html.before-inline-removal \
            index.html.before-css-split \
            index.html.before-inline-removal \
            plain-city.html.before-css-split \
            plain-city.html.before-inline-removal \
            powell.html.before-css-split \
            powell.html.before-inline-removal \
            upper-arlington.html.before-css-split \
            upper-arlington.html.before-inline-removal \
            worthington.html.before-css-split \
            worthington.html.before-inline-removal; do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "  ✓ Deleted: $file"
    ((deleted++))
  fi
done

# CSS Backup Files (9 files)
echo ""
echo "Removing CSS backup files..."
for file in css/base.backup.css \
            css/base.css.before-split \
            css/bookNow.backup.css \
            css/contact.backup.css \
            css/faq.backup.css \
            css/index.backup.css \
            css/location-page.backup.css \
            css/modal-utilities.backup.css \
            css/service-area.backup.css; do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "  ✓ Deleted: $file"
    ((deleted++))
  fi
done

# Old base.css (replaced by modular CSS)
echo ""
echo "Removing old CSS base file (replaced by modular CSS)..."
if [ -f "css/base.css" ]; then
  rm -f css/base.css
  echo "  ✓ Deleted: css/base.css"
  ((deleted++))
fi

# Test HTML Files (4 files)
echo ""
echo "Removing test HTML files..."
for file in test-purged-css.html \
            cors-fix-test.html \
            quick-fix-loading.html \
            test-updated-booking.html; do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "  ✓ Deleted: $file"
    ((deleted++))
  fi
done

# Build/Development Scripts (15 files)
echo ""
echo "Removing build and development scripts..."
for file in add_srcset.py \
            resize_additional.py \
            resize_images.py \
            analyze-unused-files.js \
            extract-inline-styles.js \
            purge-css.js \
            purgecss.config.js \
            replace-inline-styles.js \
            split-css-fixed.js \
            split-css.js \
            swap-css-for-testing.js \
            update-html-css-links-v2.js \
            update-html-css-links.js \
            backup-and-replace.js \
            https-server.js; do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "  ✓ Deleted: $file"
    ((deleted++))
  fi
done

# HTTPS Setup Scripts (3 files)
for file in setup-https.bat \
            setup-https.ps1 \
            setup-https.sh; do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "  ✓ Deleted: $file"
    ((deleted++))
  fi
done

# Google Apps Scripts Source Copies (3 files)
echo ""
echo "Removing Google Apps Script source copies..."
for file in google-apps-script-working.gs \
            junk-removal-backend.gs \
            test-sheet-connection.gs; do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "  ✓ Deleted: $file"
    ((deleted++))
  fi
done

# JSON Artifacts (3 files)
echo ""
echo "Removing analysis/planning JSON files..."
for file in inline-styles-report.json \
            seo-metadata-plan.json \
            unused-files-report.json; do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "  ✓ Deleted: $file"
    ((deleted++))
  fi
done

# Old Component Files (3 files)
echo ""
echo "Removing old component files..."
for file in components/JunkRemovalModal.html \
            components/DumpsterRentalModal.html \
            components/junk-removal-modal.html; do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "  ✓ Deleted: $file"
    ((deleted++))
  fi
done

echo ""
echo "══════════════════════════════════════════════════════════════════════════"
echo "✓ Cleanup complete!"
echo "  Files deleted: $deleted"
echo "  Backup saved: $BACKUP_DIR"
echo ""
echo "NEXT STEPS:"
echo "  1. Test your website thoroughly"
echo "  2. Check all pages load correctly"
echo "  3. Verify booking form and modals work"
echo "  4. Test on mobile device"
echo "  5. If everything works, you can delete the backup folder"
echo "  6. Commit changes to git"
echo ""
echo "If anything breaks, restore from: $BACKUP_DIR"
echo "══════════════════════════════════════════════════════════════════════════"
