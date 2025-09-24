/*
================================================================================
CAROUSEL.JS - Streamline Dumpsters Ltd. Edge-to-Edge Feature Carousel
================================================================================

PURPOSE:
Handles feature carousel functionality for continuous scrolling styled feature boxes.
The carousel now uses CSS animations for smooth continuous movement with pause/resume
functionality and accessibility support.

FUNCTIONALITY:
- CSS-driven continuous scrolling animation
- Pause on hover/focus for accessibility
- Automatic pause when page is not visible
- Reduced motion support
- Accessibility announcements

ACCESSIBILITY:
- ARIA labels for carousel content
- Screen reader announcements
- Pause on hover/focus to prevent content movement
- Reduced motion support for users with preferences

BROWSER SUPPORT:
- Modern browsers (Chrome 70+, Firefox 65+, Safari 12+, Edge 79+)
- Graceful degradation for older browsers
================================================================================
*/

document.addEventListener('DOMContentLoaded', function() {
    const carouselContainer = document.querySelector('.carousel-container');
    const carouselTrack = document.querySelector('.carousel-track');
    const items = document.querySelectorAll('.carousel-item');

    if (!carouselContainer || !carouselTrack || items.length === 0) {
        console.log('Feature carousel elements not found');
        return;
    }

    // Configuration
    const config = {
        pauseOnHover: true,
        pauseOnFocus: true,
        announceFeatures: true
    };

    // State management
    let isPaused = false;
    let isPageVisible = true;

    // Initialize carousel
    function init() {
        setupAccessibility();
        setupEventListeners();
        console.log('Edge-to-edge carousel initialized with CSS animations');
    }

    // Setup accessibility features
    function setupAccessibility() {
        carouselTrack.setAttribute('aria-label', 'Continuous carousel of company features');
        carouselTrack.setAttribute('role', 'region');
        carouselTrack.setAttribute('aria-live', 'polite');

        // Mark items for screen readers (only label first 8, hide duplicates)
        items.forEach((item, index) => {
            item.setAttribute('role', 'text');
            if (index < 8) {
                // Only label the first 8 original items
                item.setAttribute('aria-label', `Feature ${index + 1}: ${item.textContent}`);
                item.setAttribute('tabindex', '-1'); // Make focusable for screen readers
            } else {
                // Hide duplicate items from screen readers
                item.setAttribute('aria-hidden', 'true');
            }
        });

        // Announce carousel content initially
        if (config.announceFeatures) {
            announceCarouselContent();
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Pause on hover
        if (config.pauseOnHover) {
            carouselContainer.addEventListener('mouseenter', pauseCarousel);
            carouselContainer.addEventListener('mouseleave', resumeCarousel);
        }

        // Pause on focus for accessibility
        if (config.pauseOnFocus) {
            carouselContainer.addEventListener('focusin', pauseCarousel);
            carouselContainer.addEventListener('focusout', resumeCarousel);
        }

        // Pause when page is not visible
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Handle reduced motion preference changes
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        mediaQuery.addEventListener('change', handleReducedMotionChange);
    }

    // Pause carousel animation
    function pauseCarousel() {
        if (!isPaused && isPageVisible) {
            isPaused = true;
            carouselTrack.style.animationPlayState = 'paused';
        }
    }

    // Resume carousel animation
    function resumeCarousel() {
        if (isPaused && isPageVisible) {
            isPaused = false;
            carouselTrack.style.animationPlayState = 'running';
        }
    }

    // Handle page visibility change
    function handleVisibilityChange() {
        isPageVisible = !document.hidden;

        if (isPageVisible) {
            if (!isPaused) {
                carouselTrack.style.animationPlayState = 'running';
            }
        } else {
            carouselTrack.style.animationPlayState = 'paused';
        }
    }

    // Handle reduced motion preference changes
    function handleReducedMotionChange(e) {
        if (e.matches) {
            // User prefers reduced motion - slower animation is handled by CSS
            console.log('Reduced motion detected - using slower carousel animation');
        } else {
            // User allows normal motion
            console.log('Normal motion allowed - using standard carousel animation');
        }
    }

    // Announce carousel content for screen readers
    function announceCarouselContent() {
        const features = Array.from(items).map(item => item.textContent.trim());
        const announcement = `Company features: ${features.join(', ')}`;

        // Create a temporary announcement element
        const announceElement = document.createElement('div');
        announceElement.setAttribute('aria-live', 'polite');
        announceElement.setAttribute('aria-atomic', 'true');
        announceElement.style.position = 'absolute';
        announceElement.style.left = '-10000px';
        announceElement.style.width = '1px';
        announceElement.style.height = '1px';
        announceElement.style.overflow = 'hidden';

        announceElement.textContent = announcement;
        document.body.appendChild(announceElement);

        // Remove after announcement
        setTimeout(() => {
            if (announceElement.parentNode) {
                announceElement.parentNode.removeChild(announceElement);
            }
        }, 1000);
    }

    // Force restart animation (useful for dynamic content changes)
    function restartAnimation() {
        carouselTrack.style.animation = 'none';
        carouselTrack.offsetHeight; // Trigger reflow
        carouselTrack.style.animation = '';
    }

    // Initialize everything
    init();

    // Expose public API for debugging
    if (window.DEBUG) {
        window.featureCarousel = {
            pause: pauseCarousel,
            resume: resumeCarousel,
            restart: restartAnimation,
            isPaused: () => isPaused,
            isVisible: () => isPageVisible,
            getItemCount: () => items.length
        };
    }
});