// Mobile navigation functionality
(function() {
    'use strict';

    function initMobileNav() {
        const header = document.querySelector('.site-header');
        const navToggle = document.querySelector('.nav-toggle');
        const mainNav = document.querySelector('.main-nav');

        if (!navToggle || !header) {
            return;
        }

        // Toggle mobile navigation
        navToggle.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();

            const isOpen = header.classList.contains('is-open');

            // Toggle the open state
            if (isOpen) {
                header.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
            } else {
                header.classList.add('is-open');
                navToggle.setAttribute('aria-expanded', 'true');
            }

            // Update screen reader text
            const srText = navToggle.querySelector('.sr-only');
            if (srText) {
                srText.textContent = isOpen ? 'Menu' : 'Close menu';
            }
        }, false);

        // Close menu when clicking nav links
        if (mainNav) {
            mainNav.addEventListener('click', function(e) {
                if (e.target.classList.contains('nav-link') || e.target.classList.contains('nav-cta')) {
                    header.classList.remove('is-open');
                    navToggle.setAttribute('aria-expanded', 'false');
                    const srText = navToggle.querySelector('.sr-only');
                    if (srText) {
                        srText.textContent = 'Menu';
                    }
                }
            });
        }

        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && header.classList.contains('is-open')) {
                header.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.focus();
                const srText = navToggle.querySelector('.sr-only');
                if (srText) {
                    srText.textContent = 'Menu';
                }
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileNav);
    } else {
        // DOM already loaded
        initMobileNav();
    }
})();
