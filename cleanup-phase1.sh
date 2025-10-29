#!/bin/bash
# STREAMLINE DUMPSTERS - PHASE 1 SAFE CLEANUP
# Creates backup before deletion with restore capability

set -e  # Exit on error

BACKUP_DIR="../streamline_cleanup_backup_$(date +%Y%m%d_%H%M%S)"
CURRENT_DIR=$(pwd)

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       STREAMLINE DUMPSTERS - PHASE 1 SAFE CLEANUP         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "This script will safely remove unused files after creating backups."
echo "Total space to be recovered: ~1.8 MB"
echo ""

# Create backup directory
echo "📦 Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Files and directories to remove (SAFE category only)
SAFE_TO_DELETE=(
    "backup_deleted_files_20251012"
    "js_backup_1760821794864"
    "components/booking-modal.html.backup"
    "test-booknow-simple.html"
    "test-modal-debug.html"
    "test-logger.html"
)

# Create backup
echo ""
echo "📋 Backing up files..."
for item in "${SAFE_TO_DELETE[@]}"; do
    if [ -e "$item" ]; then
        echo "  ✓ Backing up: $item"
        # Preserve directory structure
        parent_dir=$(dirname "$item")
        mkdir -p "$BACKUP_DIR/$parent_dir"
        cp -rp "$item" "$BACKUP_DIR/$parent_dir/"
    else
        echo "  ⚠️  Not found: $item (skipping)"
    fi
done

# Create restore script
cat > "$BACKUP_DIR/RESTORE.sh" << 'RESTORE_SCRIPT_END'
#!/bin/bash
# RESTORE SCRIPT
# Run this to restore all deleted files

set -e
ORIGINAL_DIR="$1"

if [ -z "$ORIGINAL_DIR" ]; then
    echo "Usage: ./RESTORE.sh /path/to/streamline/dumpsters/directory"
    exit 1
fi

echo "Restoring files to: $ORIGINAL_DIR"

# Copy everything back
if [ -d "backup_deleted_files_20251012" ]; then
    cp -rp backup_deleted_files_20251012 "$ORIGINAL_DIR/"
fi
if [ -d "js_backup_1760821794864" ]; then
    cp -rp js_backup_1760821794864 "$ORIGINAL_DIR/"
fi
if [ -f "components/booking-modal.html.backup" ]; then
    cp -p components/booking-modal.html.backup "$ORIGINAL_DIR/components/"
fi
if [ -f "test-booknow-simple.html" ]; then
    cp -p test-booknow-simple.html "$ORIGINAL_DIR/"
fi
if [ -f "test-modal-debug.html" ]; then
    cp -p test-modal-debug.html "$ORIGINAL_DIR/"
fi
if [ -f "test-logger.html" ]; then
    cp -p test-logger.html "$ORIGINAL_DIR/"
fi

echo "✅ All files restored successfully!"
echo ""
echo "To verify restoration:"
echo "  cd $ORIGINAL_DIR"
echo "  ls -la backup_deleted_files_20251012/"
RESTORE_SCRIPT_END

chmod +x "$BACKUP_DIR/RESTORE.sh"

# Create manifest
cat > "$BACKUP_DIR/MANIFEST.txt" << MANIFEST_END
STREAMLINE DUMPSTERS - PHASE 1 CLEANUP BACKUP
==============================================
Created: $(date)
Original Directory: $CURRENT_DIR

FILES BACKED UP:
================
$(for item in "${SAFE_TO_DELETE[@]}"; do
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
- backup_deleted_files_20251012/ (1.4M - old backup from Oct 12)
- js_backup_1760821794864/ (345K - timestamped backup)
- components/booking-modal.html.backup (8.2K - backup file)
- test-booknow-simple.html (5.0K - test file)
- test-modal-debug.html (3.4K - debug file)
- test-logger.html (870B - test file)

REASON FOR DELETION:
====================
These are backup files, old backups, and test files that are not
referenced anywhere in the production codebase.

VERIFICATION PERFORMED:
=======================
✓ grep searches for references in all HTML/JS/CSS files
✓ No production code references found
✓ All clearly marked as backup/test files
✓ Files are old (Oct 12-19, 2024)
✓ Can be restored from this backup or git history if needed

SAFETY MEASURES:
================
✓ Complete backup created before deletion
✓ Restore script included
✓ Directory structure preserved
✓ File permissions preserved
✓ Reversible operation

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
for item in "${SAFE_TO_DELETE[@]}"; do
    if [ -e "$item" ]; then
        size=$(du -sh "$item" 2>/dev/null | awk '{print $1}')
        printf "  %-45s %s\n" "$item" "$size"
    fi
done
echo "════════════════════════════════════════════════════════════"
echo ""

# Confirmation prompt
read -p "⚠️  Proceed with deletion? Type 'yes' to confirm: " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Deletion cancelled. Backup preserved in: $BACKUP_DIR"
    echo "   You can manually delete the backup folder if not needed."
    exit 0
fi

# Delete files
echo "🗑️  Deleting files..."
deleted_count=0
for item in "${SAFE_TO_DELETE[@]}"; do
    if [ -e "$item" ]; then
        echo "  ✓ Removing: $item"
        rm -rf "$item"
        ((deleted_count++))
    fi
done

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ PHASE 1 CLEANUP COMPLETE!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📊 RESULTS:"
echo "   Files/folders deleted: $deleted_count"
echo "   Space recovered: ~1.8 MB"
echo "   Backup location: $BACKUP_DIR"
echo ""
echo "🔄 TO RESTORE (if needed):"
echo "   cd $BACKUP_DIR"
echo "   ./RESTORE.sh $CURRENT_DIR"
echo ""
echo "📋 NEXT STEPS:"
echo "   1. Test your website thoroughly"
echo "   2. Check all pages load correctly"
echo "   3. Verify modals work"
echo "   4. Check browser console for errors"
echo ""
echo "   If everything works:"
echo "   - You can delete the backup folder after a few days"
echo "   - Consider running Phase 2 to remove unused minified files (~200KB more)"
echo ""
echo "   If something breaks:"
echo "   - Run the RESTORE.sh script in the backup folder"
echo "   - Files will be restored to their original locations"
echo ""
echo "✨ Cleanup complete!"
