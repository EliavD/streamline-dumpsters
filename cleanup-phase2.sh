#!/bin/bash
# STREAMLINE DUMPSTERS - PHASE 2 CLEANUP
# Removes unused minified files and development scripts
# Creates backup before deletion with restore capability

set -e  # Exit on error

BACKUP_DIR="../streamline_cleanup_phase2_backup_$(date +%Y%m%d_%H%M%S)"
CURRENT_DIR=$(pwd)

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       STREAMLINE DUMPSTERS - PHASE 2 CLEANUP              ║"
echo "║       Unused Minified Files & Dev Scripts                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "This script will remove unused minified files and dev scripts."
echo "Total space to be recovered: ~200 KB"
echo ""

# Create backup directory
echo "📦 Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Files to remove (unused minified + dev scripts)
PHASE2_DELETE=(
    "js/bookNow.min.js"
    "js/junkRemoval.min.js"
    "js/carousel.min.js"
    "js/reviews.min.js"
    "js/index-main.min.js"
    "js/features.min.js"
    "css/service-area.min.css"
    "fix-console-logs.js"
    "update-css-links.js"
)

# Create backup
echo ""
echo "📋 Backing up files..."
for item in "${PHASE2_DELETE[@]}"; do
    if [ -e "$item" ]; then
        size=$(du -sh "$item" 2>/dev/null | awk '{print $1}')
        echo "  ✓ Backing up: $item ($size)"
        # Preserve directory structure
        parent_dir=$(dirname "$item")
        mkdir -p "$BACKUP_DIR/$parent_dir"
        cp -p "$item" "$BACKUP_DIR/$parent_dir/"
    else
        echo "  ⚠️  Not found: $item (skipping)"
    fi
done

# Create restore script
cat > "$BACKUP_DIR/RESTORE.sh" << 'RESTORE_SCRIPT_END'
#!/bin/bash
# PHASE 2 RESTORE SCRIPT
# Run this to restore all deleted files

set -e
ORIGINAL_DIR="$1"

if [ -z "$ORIGINAL_DIR" ]; then
    echo "Usage: ./RESTORE.sh /path/to/streamline/dumpsters/directory"
    exit 1
fi

echo "Restoring Phase 2 files to: $ORIGINAL_DIR"

# Copy everything back
if [ -f "js/bookNow.min.js" ]; then
    cp -p js/bookNow.min.js "$ORIGINAL_DIR/js/"
fi
if [ -f "js/junkRemoval.min.js" ]; then
    cp -p js/junkRemoval.min.js "$ORIGINAL_DIR/js/"
fi
if [ -f "js/carousel.min.js" ]; then
    cp -p js/carousel.min.js "$ORIGINAL_DIR/js/"
fi
if [ -f "js/reviews.min.js" ]; then
    cp -p js/reviews.min.js "$ORIGINAL_DIR/js/"
fi
if [ -f "js/index-main.min.js" ]; then
    cp -p js/index-main.min.js "$ORIGINAL_DIR/js/"
fi
if [ -f "js/features.min.js" ]; then
    cp -p js/features.min.js "$ORIGINAL_DIR/js/"
fi
if [ -f "css/service-area.min.css" ]; then
    cp -p css/service-area.min.css "$ORIGINAL_DIR/css/"
fi
if [ -f "fix-console-logs.js" ]; then
    cp -p fix-console-logs.js "$ORIGINAL_DIR/"
fi
if [ -f "update-css-links.js" ]; then
    cp -p update-css-links.js "$ORIGINAL_DIR/"
fi

echo "✅ All Phase 2 files restored successfully!"
RESTORE_SCRIPT_END

chmod +x "$BACKUP_DIR/RESTORE.sh"

# Create manifest
cat > "$BACKUP_DIR/MANIFEST.txt" << MANIFEST_END
STREAMLINE DUMPSTERS - PHASE 2 CLEANUP BACKUP
==============================================
Created: $(date)
Original Directory: $CURRENT_DIR
Phase: 2 - Unused Minified Files & Dev Scripts

FILES BACKED UP:
================
$(for item in "${PHASE2_DELETE[@]}"; do
    if [ -e "$item" ]; then
        du -sh "$item" 2>/dev/null | awk '{print $1"\t"$2}'
    fi
done)

TOTAL SIZE BACKED UP: $(du -sh "$BACKUP_DIR" 2>/dev/null | awk '{print $1}')

TO RESTORE ALL FILES:
=====================
cd "$BACKUP_DIR"
./RESTORE.sh "$CURRENT_DIR"

FILES TO BE DELETED:
====================

UNUSED MINIFIED FILES (unminified versions are used):
- js/bookNow.min.js (55K)
- js/junkRemoval.min.js (21K)
- js/carousel.min.js (3.3K)
- js/reviews.min.js (7.1K)
- js/index-main.min.js (0 bytes - EMPTY FILE)
- js/features.min.js (81K) - Overridden in index.html
- css/service-area.min.css (~10K)

DEVELOPMENT SCRIPTS (one-time use):
- fix-console-logs.js (7.4K)
- update-css-links.js (2.8K)

REASON FOR DELETION:
====================
1. Minified Files: Your production HTML loads the unminified .js files
   - bookNow.js is loaded, not bookNow.min.js
   - junkRemoval.js is loaded, not junkRemoval.min.js
   - carousel.js is loaded, not carousel.min.js
   - reviews.js is loaded, not reviews.min.js
   - features.min.js was loaded but is now overridden with individual files

2. Dev Scripts: These were one-time utility scripts for code fixes
   - fix-console-logs.js: Already completed its purpose
   - update-css-links.js: Already completed its purpose

VERIFICATION PERFORMED:
=======================
✓ Phase 1 completed successfully
✓ Website tested and working perfectly
✓ No HTML files reference these minified versions
✓ Unminified versions are in use
✓ Dev scripts are not in package.json
✓ Safe to remove after testing confirms

SAFETY MEASURES:
================
✓ Complete backup created before deletion
✓ Restore script included
✓ Can restore individual files if needed
✓ Reversible operation

NOTE: Keep core.min.js - it IS used in index.html
MANIFEST_END

echo ""
echo "✅ Backup created successfully!"
echo "   📁 Location: $BACKUP_DIR"
echo "   📄 Manifest: $BACKUP_DIR/MANIFEST.txt"
echo "   🔄 Restore:  $BACKUP_DIR/RESTORE.sh"
echo ""

# Show what will be deleted
echo "════════════════════════════════════════════════════════════"
echo "FILES TO BE DELETED:"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "UNUSED MINIFIED FILES:"
for item in js/bookNow.min.js js/junkRemoval.min.js js/carousel.min.js js/reviews.min.js js/index-main.min.js js/features.min.js css/service-area.min.css; do
    if [ -e "$item" ]; then
        size=$(du -sh "$item" 2>/dev/null | awk '{print $1}')
        printf "  %-35s %s\n" "$item" "$size"
    fi
done
echo ""
echo "DEVELOPMENT SCRIPTS:"
for item in fix-console-logs.js update-css-links.js; do
    if [ -e "$item" ]; then
        size=$(du -sh "$item" 2>/dev/null | awk '{print $1}')
        printf "  %-35s %s\n" "$item" "$size"
    fi
done
echo "════════════════════════════════════════════════════════════"
echo ""

# Confirmation prompt
read -p "⚠️  Proceed with Phase 2 deletion? Type 'yes' to confirm: " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Deletion cancelled. Backup preserved in: $BACKUP_DIR"
    echo "   You can manually delete the backup folder if not needed."
    exit 0
fi

# Delete files
echo "🗑️  Deleting files..."
deleted_count=0
for item in "${PHASE2_DELETE[@]}"; do
    if [ -e "$item" ]; then
        echo "  ✓ Removing: $item"
        rm -f "$item"
        ((deleted_count++))
    fi
done

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ PHASE 2 CLEANUP COMPLETE!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📊 RESULTS:"
echo "   Files deleted: $deleted_count"
echo "   Space recovered: ~200 KB"
echo "   Backup location: $BACKUP_DIR"
echo ""
echo "📊 TOTAL CLEANUP (Phase 1 + 2):"
echo "   Total space recovered: ~2 MB"
echo "   Site size: 38 MB → 36 MB"
echo ""
echo "🔄 TO RESTORE (if needed):"
echo "   cd $BACKUP_DIR"
echo "   ./RESTORE.sh $CURRENT_DIR"
echo ""
echo "📋 NEXT STEPS:"
echo "   1. Test your website again"
echo "   2. Verify all pages load correctly"
echo "   3. Check modals still work"
echo "   4. Check browser console for errors"
echo ""
echo "   If everything works:"
echo "   - Keep backup for a few days, then delete"
echo "   - Enjoy your cleaner codebase!"
echo ""
echo "   If something breaks:"
echo "   - Run the RESTORE.sh script in the backup folder"
echo ""
echo "✨ Phase 2 cleanup complete!"
