/**
 * Content Management System
 * Simple CMS for location updates and content management
 */

class LocationContentManager {
    constructor() {
        this.isEditMode = false;
        this.editableElements = new Map();
        this.originalContent = new Map();

        this.setupEditMode();
        this.setupAutoSave();
        this.setupVersioning();
    }

    setupEditMode() {
        // Check for admin authorization
        if (this.isAuthorized()) {
            this.enableEditMode();
        }

        // Listen for auth changes
        this.setupAuthListener();
    }

    isAuthorized() {
        // Simple authorization check
        const adminMode = localStorage.getItem('admin_mode');
        const authToken = localStorage.getItem('auth_token');
        const authExpiry = localStorage.getItem('auth_expiry');

        if (!adminMode || !authToken || !authExpiry) {
            return false;
        }

        // Check if token is expired
        if (Date.now() > parseInt(authExpiry)) {
            this.clearAuth();
            return false;
        }

        return adminMode === 'true';
    }

    setupAuthListener() {
        // Simple auth toggle for development
        document.addEventListener('keydown', (e) => {
            // Ctrl + Shift + E to toggle edit mode
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                this.toggleAuthMode();
            }
        });

        // Listen for storage changes (multi-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key === 'admin_mode') {
                if (e.newValue === 'true' && !this.isEditMode) {
                    this.enableEditMode();
                } else if (e.newValue !== 'true' && this.isEditMode) {
                    this.disableEditMode();
                }
            }
        });
    }

    toggleAuthMode() {
        if (this.isAuthorized()) {
            this.clearAuth();
            this.disableEditMode();
        } else {
            // Simple auth for development
            const password = prompt('Enter admin password:');
            if (password === 'streamline2024') { // In production, use proper authentication
                this.setAuth();
                this.enableEditMode();
            } else {
                alert('Invalid password');
            }
        }
    }

    setAuth() {
        const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        localStorage.setItem('admin_mode', 'true');
        localStorage.setItem('auth_token', 'dev-token-' + Date.now());
        localStorage.setItem('auth_expiry', expiry.toString());
    }

    clearAuth() {
        localStorage.removeItem('admin_mode');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_expiry');
    }

    enableEditMode() {
        if (this.isEditMode) return;

        this.isEditMode = true;
        document.body.classList.add('edit-mode');

        this.addEditControls();
        this.addEditToolbar();
        this.markEditableElements();

        console.log('Edit mode enabled');
    }

    disableEditMode() {
        if (!this.isEditMode) return;

        this.isEditMode = false;
        document.body.classList.remove('edit-mode');

        this.removeEditControls();
        this.removeEditToolbar();
        this.unmarkEditableElements();

        console.log('Edit mode disabled');
    }

    addEditToolbar() {
        if (document.querySelector('.edit-toolbar')) return;

        const toolbar = document.createElement('div');
        toolbar.className = 'edit-toolbar';
        toolbar.innerHTML = `
            <div class="edit-toolbar-content">
                <span class="edit-mode-indicator">✏️ Edit Mode</span>
                <div class="edit-actions">
                    <button class="edit-btn" onclick="window.contentManager.saveAll()">💾 Save All</button>
                    <button class="edit-btn" onclick="window.contentManager.revertAll()">↶ Revert All</button>
                    <button class="edit-btn" onclick="window.contentManager.exportData()">📤 Export</button>
                    <button class="edit-btn" onclick="window.contentManager.importData()">📥 Import</button>
                    <button class="edit-btn" onclick="window.contentManager.disableEditMode()">❌ Exit</button>
                </div>
            </div>
        `;

        // Style the toolbar
        toolbar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #1f2937;
            color: white;
            padding: 0.75rem;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        const style = document.createElement('style');
        style.textContent = `
            .edit-toolbar-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                max-width: 1200px;
                margin: 0 auto;
            }

            .edit-mode-indicator {
                font-weight: bold;
                color: #10b981;
            }

            .edit-actions {
                display: flex;
                gap: 0.5rem;
            }

            .edit-btn {
                background: #374151;
                color: white;
                border: 1px solid #4b5563;
                padding: 0.5rem 1rem;
                border-radius: 0.375rem;
                cursor: pointer;
                font-size: 0.875rem;
                transition: background-color 0.2s;
            }

            .edit-btn:hover {
                background: #4b5563;
            }

            .edit-mode body {
                padding-top: 60px;
            }

            .editable-element {
                outline: 2px dashed #10b981;
                outline-offset: 2px;
                position: relative;
                cursor: text;
            }

            .editable-element:hover {
                outline-color: #059669;
                background: rgba(16, 185, 129, 0.05);
            }

            .edit-control {
                position: absolute;
                top: -30px;
                right: 0;
                background: #10b981;
                color: white;
                border: none;
                padding: 0.25rem 0.5rem;
                font-size: 0.75rem;
                cursor: pointer;
                border-radius: 0.25rem;
                opacity: 0;
                transition: opacity 0.2s;
            }

            .editable-element:hover .edit-control {
                opacity: 1;
            }

            .unsaved-changes {
                outline-color: #f59e0b !important;
                background: rgba(245, 158, 11, 0.1) !important;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(toolbar);

        // Adjust body padding
        document.body.style.paddingTop = '60px';
    }

    removeEditToolbar() {
        const toolbar = document.querySelector('.edit-toolbar');
        if (toolbar) {
            toolbar.remove();
        }

        // Reset body padding
        document.body.style.paddingTop = '';
    }

    markEditableElements() {
        // Mark elements that can be edited
        const editableSelectors = [
            'h1, h2, h3, h4, h5, h6',
            'p:not(.skip-edit)',
            '.location-title',
            '.hero-subtitle',
            '.location-description',
            '.benefit-card h3',
            '.benefit-card p',
            '.project-card h3',
            '.project-card p',
            '.faq-item h3',
            '.faq-item p',
            '.feature-item span:last-child',
            '.neighborhood-grid li'
        ];

        editableSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                if (!element.closest('.edit-toolbar') && !element.querySelector('input, textarea')) {
                    this.makeElementEditable(element);
                }
            });
        });
    }

    makeElementEditable(element) {
        const key = this.generateElementKey(element);

        element.classList.add('editable-element');
        element.setAttribute('data-editable', key);
        element.setAttribute('contenteditable', 'true');

        // Store original content
        this.originalContent.set(key, element.innerHTML);
        this.editableElements.set(key, element);

        // Add edit control
        this.addEditControl(element, key);

        // Add event listeners
        this.setupElementEvents(element, key);
    }

    generateElementKey(element) {
        // Generate unique key for element
        const tagName = element.tagName.toLowerCase();
        const className = element.className.replace(/\s+/g, '-');
        const textContent = element.textContent.substring(0, 20).replace(/\s+/g, '-');
        const timestamp = Date.now();

        return `${tagName}-${className}-${textContent}-${timestamp}`.replace(/[^a-zA-Z0-9-]/g, '');
    }

    addEditControl(element, key) {
        const control = document.createElement('button');
        control.className = 'edit-control';
        control.textContent = '✏️ Edit';
        control.onclick = (e) => {
            e.stopPropagation();
            this.openEditModal(element, key);
        };

        element.style.position = 'relative';
        element.appendChild(control);
    }

    setupElementEvents(element, key) {
        // Track changes
        element.addEventListener('input', () => {
            this.markAsChanged(element, key);
        });

        element.addEventListener('blur', () => {
            this.autoSaveElement(element, key);
        });

        // Prevent default behavior for some elements
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                if (element.tagName !== 'P' && element.tagName !== 'DIV') {
                    e.preventDefault();
                    element.blur();
                }
            }
        });
    }

    openEditModal(element, key) {
        const currentContent = element.innerHTML;
        const modal = document.createElement('div');
        modal.className = 'edit-modal';
        modal.innerHTML = `
            <div class="edit-modal-content">
                <h3>Edit Content</h3>
                <textarea class="edit-textarea">${currentContent}</textarea>
                <div class="edit-modal-actions">
                    <button class="edit-btn save-btn">Save</button>
                    <button class="edit-btn cancel-btn">Cancel</button>
                </div>
            </div>
        `;

        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;

        const modalStyle = document.createElement('style');
        modalStyle.textContent = `
            .edit-modal-content {
                background: white;
                padding: 2rem;
                border-radius: 0.5rem;
                max-width: 600px;
                width: 90vw;
                max-height: 80vh;
                overflow-y: auto;
            }

            .edit-textarea {
                width: 100%;
                height: 200px;
                margin: 1rem 0;
                padding: 0.75rem;
                border: 2px solid #d1d5db;
                border-radius: 0.375rem;
                font-family: inherit;
                resize: vertical;
            }

            .edit-modal-actions {
                display: flex;
                gap: 0.5rem;
                justify-content: flex-end;
            }

            .save-btn {
                background: #10b981;
            }

            .save-btn:hover {
                background: #059669;
            }

            .cancel-btn {
                background: #6b7280;
            }

            .cancel-btn:hover {
                background: #4b5563;
            }
        `;

        document.head.appendChild(modalStyle);
        document.body.appendChild(modal);

        const textarea = modal.querySelector('.edit-textarea');
        const saveBtn = modal.querySelector('.save-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');

        saveBtn.onclick = () => {
            element.innerHTML = textarea.value;
            this.markAsChanged(element, key);
            this.autoSaveElement(element, key);
            modal.remove();
            modalStyle.remove();
        };

        cancelBtn.onclick = () => {
            modal.remove();
            modalStyle.remove();
        };

        // Focus textarea
        textarea.focus();
        textarea.select();
    }

    markAsChanged(element, key) {
        element.classList.add('unsaved-changes');

        // Update saved indicator in toolbar
        this.updateSavedStatus();
    }

    updateSavedStatus() {
        const hasUnsaved = document.querySelectorAll('.unsaved-changes').length > 0;
        const indicator = document.querySelector('.edit-mode-indicator');

        if (indicator) {
            indicator.textContent = hasUnsaved ? '✏️ Edit Mode (Unsaved)' : '✏️ Edit Mode';
            indicator.style.color = hasUnsaved ? '#f59e0b' : '#10b981';
        }
    }

    unmarkEditableElements() {
        document.querySelectorAll('.editable-element').forEach(element => {
            element.classList.remove('editable-element', 'unsaved-changes');
            element.removeAttribute('data-editable');
            element.removeAttribute('contenteditable');

            const control = element.querySelector('.edit-control');
            if (control) {
                control.remove();
            }
        });

        this.editableElements.clear();
    }

    removeEditControls() {
        document.querySelectorAll('.edit-control').forEach(control => {
            control.remove();
        });
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.isEditMode) {
                this.autoSaveAll();
            }
        }, 30000);
    }

    autoSaveElement(element, key) {
        const content = element.innerHTML;
        const savedContent = this.getSavedContent();

        savedContent[key] = {
            content: content,
            timestamp: Date.now(),
            original: this.originalContent.get(key)
        };

        this.setSavedContent(savedContent);
        element.classList.remove('unsaved-changes');

        this.updateSavedStatus();
    }

    autoSaveAll() {
        this.editableElements.forEach((element, key) => {
            if (element.classList.contains('unsaved-changes')) {
                this.autoSaveElement(element, key);
            }
        });
    }

    saveAll() {
        this.autoSaveAll();
        this.showNotification('All changes saved!', 'success');
    }

    revertAll() {
        if (confirm('Are you sure you want to revert all changes?')) {
            this.editableElements.forEach((element, key) => {
                const original = this.originalContent.get(key);
                if (original) {
                    element.innerHTML = original;
                    element.classList.remove('unsaved-changes');
                }
            });

            // Clear saved content
            this.setSavedContent({});
            this.updateSavedStatus();
            this.showNotification('All changes reverted!', 'info');
        }
    }

    exportData() {
        const data = {
            content: this.getSavedContent(),
            metadata: {
                page: window.location.pathname,
                timestamp: Date.now(),
                version: '1.0.0'
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `content-export-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
        this.showNotification('Content exported!', 'success');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    if (data.content) {
                        this.setSavedContent(data.content);
                        this.applyImportedContent(data.content);
                        this.showNotification('Content imported successfully!', 'success');
                    } else {
                        throw new Error('Invalid file format');
                    }
                } catch (error) {
                    this.showNotification('Error importing content: ' + error.message, 'error');
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }

    applyImportedContent(contentData) {
        Object.entries(contentData).forEach(([key, data]) => {
            const element = document.querySelector(`[data-editable="${key}"]`);
            if (element && data.content) {
                element.innerHTML = data.content;
            }
        });
    }

    getSavedContent() {
        return JSON.parse(localStorage.getItem('editedContent') || '{}');
    }

    setSavedContent(content) {
        localStorage.setItem('editedContent', JSON.stringify(content));
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };

        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 1rem;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 1rem;
            border-radius: 0.5rem;
            z-index: 10002;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    setupVersioning() {
        // Simple versioning system
        this.versions = JSON.parse(localStorage.getItem('contentVersions') || '[]');
    }

    createVersion(description) {
        const version = {
            id: Date.now(),
            description: description || 'Auto-saved version',
            content: this.getSavedContent(),
            timestamp: Date.now()
        };

        this.versions.unshift(version);

        // Keep only last 10 versions
        if (this.versions.length > 10) {
            this.versions = this.versions.slice(0, 10);
        }

        localStorage.setItem('contentVersions', JSON.stringify(this.versions));
        return version;
    }

    // Initialize on page load
    init() {
        // Apply saved content on page load
        const savedContent = this.getSavedContent();

        // Wait for DOM to be ready
        setTimeout(() => {
            Object.entries(savedContent).forEach(([key, data]) => {
                const element = document.querySelector(`[data-editable="${key}"]`);
                if (element && data.content) {
                    element.innerHTML = data.content;
                }
            });
        }, 100);
    }
}

// Initialize content manager
document.addEventListener('DOMContentLoaded', () => {
    window.contentManager = new LocationContentManager();
    window.contentManager.init();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocationContentManager;
}