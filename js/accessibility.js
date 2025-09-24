/**
 * Accessibility Enhancer
 * WCAG 2.1 AA compliance and enhanced accessibility features
 */

class AccessibilityEnhancer {
    constructor() {
        this.setupKeyboardNavigation();
        this.enhanceScreenReaderSupport();
        this.addSkipLinks();
        this.setupFocusManagement();
        this.setupColorContrastDetection();
        this.setupMotionPreferences();
        this.enhanceFormAccessibility();
        this.setupCustomAnnouncements();
    }

    setupKeyboardNavigation() {
        // Enhanced keyboard navigation for carousel
        this.enhanceCarouselKeyboardNav();

        // Global keyboard shortcuts
        this.setupGlobalKeyboardShortcuts();

        // Focus trap for modals
        this.setupFocusTrapping();

        // Roving tabindex for complex components
        this.setupRovingTabindex();
    }

    enhanceCarouselKeyboardNav() {
        const carousel = document.getElementById('locationCarousel');
        if (!carousel) return;

        const track = carousel.querySelector('.carousel-track');
        const cards = carousel.querySelectorAll('.location-card');
        const indicators = carousel.querySelectorAll('.carousel-dot');

        // Make carousel focusable
        if (track && !track.hasAttribute('tabindex')) {
            track.setAttribute('tabindex', '0');
            track.setAttribute('role', 'region');
            track.setAttribute('aria-label', 'Service area locations carousel');
        }

        // Enhanced keyboard navigation
        carousel.addEventListener('keydown', (e) => {
            const focusedCard = document.activeElement.closest('.location-card');
            const focusedIndicator = document.activeElement.closest('.carousel-dot');

            let nextElement = null;
            let preventDefault = false;

            switch(e.key) {
                case 'ArrowRight':
                    if (focusedCard) {
                        nextElement = focusedCard.nextElementSibling || cards[0];
                        preventDefault = true;
                    } else if (focusedIndicator) {
                        const nextIndicator = focusedIndicator.nextElementSibling || indicators[0];
                        nextIndicator?.focus();
                        preventDefault = true;
                    }
                    break;

                case 'ArrowLeft':
                    if (focusedCard) {
                        nextElement = focusedCard.previousElementSibling || cards[cards.length - 1];
                        preventDefault = true;
                    } else if (focusedIndicator) {
                        const prevIndicator = focusedIndicator.previousElementSibling || indicators[indicators.length - 1];
                        prevIndicator?.focus();
                        preventDefault = true;
                    }
                    break;

                case 'Home':
                    if (focusedCard || focusedIndicator) {
                        nextElement = cards[0];
                        preventDefault = true;
                    }
                    break;

                case 'End':
                    if (focusedCard || focusedIndicator) {
                        nextElement = cards[cards.length - 1];
                        preventDefault = true;
                    }
                    break;

                case 'Enter':
                case ' ':
                    if (focusedCard) {
                        const link = focusedCard.querySelector('.location-link');
                        if (link) {
                            link.click();
                            preventDefault = true;
                        }
                    } else if (focusedIndicator) {
                        focusedIndicator.click();
                        preventDefault = true;
                    }
                    break;

                case 'Escape':
                    // Move focus to carousel container
                    track.focus();
                    preventDefault = true;
                    break;
            }

            if (nextElement) {
                const link = nextElement.querySelector('.location-link');
                if (link) {
                    link.focus();
                }
            }

            if (preventDefault) {
                e.preventDefault();
            }
        });

        // Add proper ARIA attributes to carousel components
        cards.forEach((card, index) => {
            const link = card.querySelector('.location-link');
            if (link) {
                link.setAttribute('role', 'button');
                link.setAttribute('aria-describedby', `card-description-${index}`);

                // Add hidden description for screen readers
                const description = card.querySelector('p');
                if (description) {
                    description.id = `card-description-${index}`;
                }
            }
        });

        indicators.forEach((indicator, index) => {
            indicator.setAttribute('role', 'tab');
            indicator.setAttribute('aria-label', `Go to location group ${index + 1}`);
            indicator.setAttribute('aria-selected', indicator.classList.contains('active') ? 'true' : 'false');
        });
    }

    setupGlobalKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + M: Go to main content
            if (e.altKey && e.key === 'm') {
                e.preventDefault();
                const mainContent = document.getElementById('main-content');
                if (mainContent) {
                    mainContent.focus();
                    mainContent.scrollIntoView();
                    this.announceToScreenReader('Jumped to main content');
                }
            }

            // Alt + N: Go to navigation
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                const nav = document.querySelector('.main-nav') || document.querySelector('nav');
                if (nav) {
                    const firstLink = nav.querySelector('a');
                    if (firstLink) {
                        firstLink.focus();
                        this.announceToScreenReader('Jumped to navigation');
                    }
                }
            }

            // Alt + F: Go to footer
            if (e.altKey && e.key === 'f') {
                e.preventDefault();
                const footer = document.querySelector('footer');
                if (footer) {
                    footer.scrollIntoView();
                    const firstLink = footer.querySelector('a');
                    if (firstLink) {
                        firstLink.focus();
                    }
                    this.announceToScreenReader('Jumped to footer');
                }
            }

            // Alt + S: Go to search (if available)
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                const searchInput = document.querySelector('input[type="search"]') ||
                                  document.querySelector('input[name="search"]');
                if (searchInput) {
                    searchInput.focus();
                    this.announceToScreenReader('Focused search field');
                }
            }
        });
    }

    setupFocusTrapping() {
        // Focus trap for modal dialogs
        document.addEventListener('modal-opened', (e) => {
            const modal = e.detail.modal;
            this.trapFocus(modal);
        });

        document.addEventListener('modal-closed', (e) => {
            this.releaseFocusTrap();
        });
    }

    trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        this.focusTrapHandler = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }

            if (e.key === 'Escape') {
                this.releaseFocusTrap();
                // Trigger modal close
                const closeEvent = new CustomEvent('modal-close-request');
                container.dispatchEvent(closeEvent);
            }
        };

        document.addEventListener('keydown', this.focusTrapHandler);

        // Focus first element
        if (firstElement) {
            firstElement.focus();
        }
    }

    releaseFocusTrap() {
        if (this.focusTrapHandler) {
            document.removeEventListener('keydown', this.focusTrapHandler);
            this.focusTrapHandler = null;
        }
    }

    setupRovingTabindex() {
        // Implement roving tabindex for navigation menus
        const navMenus = document.querySelectorAll('.nav-list, .footer-links');

        navMenus.forEach(menu => {
            this.implementRovingTabindex(menu, 'a');
        });
    }

    implementRovingTabindex(container, selector) {
        const items = container.querySelectorAll(selector);
        let currentIndex = 0;

        // Set initial tabindex values
        items.forEach((item, index) => {
            item.setAttribute('tabindex', index === 0 ? '0' : '-1');
        });

        container.addEventListener('keydown', (e) => {
            let newIndex = currentIndex;

            switch(e.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                    e.preventDefault();
                    newIndex = (currentIndex + 1) % items.length;
                    break;

                case 'ArrowUp':
                case 'ArrowLeft':
                    e.preventDefault();
                    newIndex = (currentIndex - 1 + items.length) % items.length;
                    break;

                case 'Home':
                    e.preventDefault();
                    newIndex = 0;
                    break;

                case 'End':
                    e.preventDefault();
                    newIndex = items.length - 1;
                    break;

                default:
                    return;
            }

            // Update tabindex values
            items[currentIndex].setAttribute('tabindex', '-1');
            items[newIndex].setAttribute('tabindex', '0');
            items[newIndex].focus();

            currentIndex = newIndex;
        });

        // Handle focus changes from clicking
        items.forEach((item, index) => {
            item.addEventListener('focus', () => {
                if (currentIndex !== index) {
                    items[currentIndex].setAttribute('tabindex', '-1');
                    item.setAttribute('tabindex', '0');
                    currentIndex = index;
                }
            });
        });
    }

    enhanceScreenReaderSupport() {
        // Add comprehensive live region support
        this.createLiveRegions();

        // Enhance carousel announcements
        this.enhanceCarouselAnnouncements();

        // Add progress indicators
        this.addProgressIndicators();

        // Improve form feedback
        this.enhanceFormFeedback();
    }

    createLiveRegions() {
        // Create or ensure live regions exist
        let politeRegion = document.getElementById('announcements-polite');
        let assertiveRegion = document.getElementById('announcements-assertive');

        if (!politeRegion) {
            politeRegion = document.createElement('div');
            politeRegion.id = 'announcements-polite';
            politeRegion.setAttribute('aria-live', 'polite');
            politeRegion.setAttribute('aria-atomic', 'true');
            politeRegion.className = 'sr-only';
            document.body.appendChild(politeRegion);
        }

        if (!assertiveRegion) {
            assertiveRegion = document.createElement('div');
            assertiveRegion.id = 'announcements-assertive';
            assertiveRegion.setAttribute('aria-live', 'assertive');
            assertiveRegion.setAttribute('aria-atomic', 'true');
            assertiveRegion.className = 'sr-only';
            document.body.appendChild(assertiveRegion);
        }

        this.politeRegion = politeRegion;
        this.assertiveRegion = assertiveRegion;
    }

    enhanceCarouselAnnouncements() {
        const carousel = document.getElementById('locationCarousel');
        if (!carousel) return;

        // Announce carousel changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('carousel-dot') && target.classList.contains('active')) {
                        const slideNumber = Array.from(carousel.querySelectorAll('.carousel-dot')).indexOf(target) + 1;
                        const totalSlides = carousel.querySelectorAll('.carousel-dot').length;

                        this.announceToScreenReader(`Showing location group ${slideNumber} of ${totalSlides}`, 'polite');
                    }
                }
            });
        });

        observer.observe(carousel, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });

        // Announce when locations are focused
        carousel.addEventListener('focusin', (e) => {
            const locationCard = e.target.closest('.location-card');
            if (locationCard) {
                const locationName = locationCard.querySelector('h3')?.textContent;
                const description = locationCard.querySelector('p')?.textContent;

                if (locationName) {
                    this.announceToScreenReader(`${locationName}. ${description || ''}`, 'polite');
                }
            }
        });
    }

    addProgressIndicators() {
        // Add progress indicators for forms and multi-step processes
        const forms = document.querySelectorAll('form[data-steps]');

        forms.forEach(form => {
            const steps = parseInt(form.dataset.steps) || 1;
            const currentStep = parseInt(form.dataset.currentStep) || 1;

            const progressIndicator = document.createElement('div');
            progressIndicator.className = 'progress-indicator';
            progressIndicator.setAttribute('role', 'progressbar');
            progressIndicator.setAttribute('aria-valuenow', currentStep);
            progressIndicator.setAttribute('aria-valuemin', '1');
            progressIndicator.setAttribute('aria-valuemax', steps);
            progressIndicator.setAttribute('aria-label', `Step ${currentStep} of ${steps}`);

            form.insertBefore(progressIndicator, form.firstChild);
        });
    }

    enhanceFormFeedback() {
        // Enhanced form validation feedback for screen readers
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const invalidFields = form.querySelectorAll(':invalid');

                if (invalidFields.length > 0) {
                    e.preventDefault();

                    const firstInvalid = invalidFields[0];
                    firstInvalid.focus();

                    const fieldName = firstInvalid.getAttribute('aria-label') ||
                                    firstInvalid.previousElementSibling?.textContent ||
                                    firstInvalid.name || 'field';

                    this.announceToScreenReader(`${fieldName} has an error and needs to be corrected`, 'assertive');
                }
            });

            // Real-time validation feedback
            form.addEventListener('blur', (e) => {
                const field = e.target;
                if (field.matches('input, textarea, select') && !field.validity.valid) {
                    const errorMessage = field.validationMessage;
                    this.announceToScreenReader(`${field.name || 'Field'}: ${errorMessage}`, 'polite');
                }
            }, true);
        });
    }

    addSkipLinks() {
        // Comprehensive skip link system
        const skipLinks = [
            { href: '#main-content', text: 'Skip to main content' },
            { href: '#navigation', text: 'Skip to navigation' },
            { href: 'footer', text: 'Skip to footer' }
        ];

        const skipContainer = document.createElement('div');
        skipContainer.className = 'skip-links';
        skipContainer.innerHTML = skipLinks.map(link =>
            `<a href="${link.href}" class="skip-link">${link.text}</a>`
        ).join('');

        // Insert at the very beginning of the body
        document.body.insertBefore(skipContainer, document.body.firstChild);

        // Style skip links
        const style = document.createElement('style');
        style.textContent = `
            .skip-links {
                position: absolute;
                top: -200px;
                left: 0;
                z-index: 9999;
            }

            .skip-link {
                position: absolute;
                left: -10000px;
                top: auto;
                width: 1px;
                height: 1px;
                overflow: hidden;
                background: #000;
                color: #fff;
                padding: 8px 16px;
                text-decoration: none;
                font-weight: bold;
                border-radius: 0 0 4px 0;
            }

            .skip-link:focus {
                position: fixed;
                top: 0;
                left: 0;
                width: auto;
                height: auto;
                overflow: visible;
                z-index: 10000;
            }
        `;
        document.head.appendChild(style);
    }

    setupFocusManagement() {
        // Enhanced focus management system
        this.setupFocusIndicators();
        this.manageFocusOnRouteChange();
        this.setupFocusRestore();
    }

    setupFocusIndicators() {
        // Enhanced focus indicators that are always visible
        const style = document.createElement('style');
        style.textContent = `
            :focus {
                outline: 3px solid #4A90E2 !important;
                outline-offset: 2px !important;
            }

            .focus-indicator {
                position: relative;
            }

            .focus-indicator:focus::after {
                content: '';
                position: absolute;
                top: -4px;
                left: -4px;
                right: -4px;
                bottom: -4px;
                border: 2px solid #4A90E2;
                border-radius: 4px;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    }

    manageFocusOnRouteChange() {
        // Manage focus when navigating between pages
        window.addEventListener('beforeunload', () => {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.id) {
                sessionStorage.setItem('lastFocusedElement', activeElement.id);
            }
        });

        window.addEventListener('load', () => {
            const lastFocusedId = sessionStorage.getItem('lastFocusedElement');
            if (lastFocusedId) {
                const element = document.getElementById(lastFocusedId);
                if (element) {
                    element.focus();
                }
                sessionStorage.removeItem('lastFocusedElement');
            }
        });
    }

    setupFocusRestore() {
        // Store and restore focus for modal interactions
        this.focusHistory = [];

        document.addEventListener('focusin', (e) => {
            if (!e.target.closest('.modal')) {
                this.focusHistory.push(e.target);
                // Keep only last 10 focus positions
                if (this.focusHistory.length > 10) {
                    this.focusHistory.shift();
                }
            }
        });
    }

    setupColorContrastDetection() {
        // Detect and warn about potential contrast issues
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.documentElement.classList.add('high-contrast-mode');

            // Enhance contrast for high contrast users
            const style = document.createElement('style');
            style.textContent = `
                .high-contrast-mode * {
                    border-color: ButtonText !important;
                }

                .high-contrast-mode .btn {
                    border: 2px solid ButtonText !important;
                }

                .high-contrast-mode .location-card {
                    border: 2px solid ButtonText !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    setupMotionPreferences() {
        // Respect user's motion preferences
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.classList.add('reduced-motion');

            // Disable animations and transitions
            const style = document.createElement('style');
            style.textContent = `
                .reduced-motion *,
                .reduced-motion *::before,
                .reduced-motion *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                    scroll-behavior: auto !important;
                }

                .reduced-motion .carousel-track {
                    transform: none !important;
                    transition: none !important;
                }
            `;
            document.head.appendChild(style);

            // Disable carousel auto-play
            const carousel = document.getElementById('locationCarousel');
            if (carousel && carousel.carouselInstance) {
                carousel.carouselInstance.isAutoPlaying = false;
                carousel.carouselInstance.stopAutoPlay();
            }
        }
    }

    enhanceFormAccessibility() {
        // Comprehensive form accessibility enhancements
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            this.addFormLabels(form);
            this.addFormValidation(form);
            this.addFormInstructions(form);
        });
    }

    addFormLabels(form) {
        // Ensure all form controls have proper labels
        const formControls = form.querySelectorAll('input, textarea, select');

        formControls.forEach(control => {
            if (!control.id) {
                control.id = `form-control-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }

            let label = form.querySelector(`label[for="${control.id}"]`);

            if (!label && control.placeholder) {
                // Create label from placeholder
                label = document.createElement('label');
                label.textContent = control.placeholder;
                label.htmlFor = control.id;
                label.className = 'sr-only';
                control.parentNode.insertBefore(label, control);
            }

            if (!label && !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby')) {
                // Add accessible name
                control.setAttribute('aria-label', control.name || control.type);
            }
        });
    }

    addFormValidation(form) {
        // Enhanced validation with accessibility
        const submitButton = form.querySelector('[type="submit"]');

        if (submitButton) {
            submitButton.addEventListener('click', (e) => {
                const requiredFields = form.querySelectorAll('[required]');
                const invalidFields = Array.from(requiredFields).filter(field => !field.validity.valid);

                if (invalidFields.length > 0) {
                    e.preventDefault();

                    // Focus first invalid field
                    invalidFields[0].focus();

                    // Announce validation errors
                    const errorCount = invalidFields.length;
                    this.announceToScreenReader(
                        `Form has ${errorCount} error${errorCount > 1 ? 's' : ''}. Please correct the highlighted fields.`,
                        'assertive'
                    );
                }
            });
        }
    }

    addFormInstructions(form) {
        // Add helpful instructions for complex forms
        const requiredFields = form.querySelectorAll('[required]');

        if (requiredFields.length > 0) {
            const instructions = document.createElement('div');
            instructions.textContent = `This form has ${requiredFields.length} required field${requiredFields.length > 1 ? 's' : ''}.`;
            instructions.className = 'form-instructions';
            instructions.id = `form-instructions-${form.id || Date.now()}`;

            form.insertBefore(instructions, form.firstChild);
            form.setAttribute('aria-describedby', instructions.id);
        }
    }

    setupCustomAnnouncements() {
        // System for custom screen reader announcements
        window.announce = (message, priority = 'polite') => {
            this.announceToScreenReader(message, priority);
        };

        // Announce important page changes
        this.announcePageLoad();
    }

    announcePageLoad() {
        // Announce key page information on load
        const pageTitle = document.querySelector('h1')?.textContent || document.title;
        const pageType = this.getPageType();

        setTimeout(() => {
            this.announceToScreenReader(`${pageType}: ${pageTitle}`, 'polite');
        }, 1000);
    }

    getPageType() {
        const path = window.location.pathname;

        if (path.includes('service-area')) return 'Service area page';
        if (path.match(/\/(dublin|hilliard|plain-city|westerville|worthington|powell)\.html/)) return 'Location page';
        if (path.includes('faq')) return 'Frequently asked questions';
        if (path.includes('contact')) return 'Contact page';

        return 'Page';
    }

    announceToScreenReader(message, priority = 'polite') {
        const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;

        if (region) {
            region.textContent = '';
            setTimeout(() => {
                region.textContent = message;
            }, 100);
        }
    }

    // Public method to restore focus to last known position
    restoreFocus() {
        if (this.focusHistory.length > 0) {
            const lastElement = this.focusHistory.pop();
            if (lastElement && document.contains(lastElement)) {
                lastElement.focus();
            }
        }
    }
}

// Initialize accessibility enhancements
document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityEnhancer = new AccessibilityEnhancer();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityEnhancer;
}