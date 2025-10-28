/**
 * Mobile Optimizer and PWA Features
 * Enhanced mobile experience with Progressive Web App capabilities
 */

class MobileOptimizer {
    constructor() {
        this.isMobile = this.detectMobile();
        this.setupMobileOptimizations();
        this.setupTouchOptimizations();
        this.setupViewportOptimizations();
        this.setupConnectionOptimizations();
        this.setupPWAFeatures();
        this.setupOfflineSupport();
    }

    detectMobile() {
        return window.matchMedia('(max-width: 768px)').matches ||
               /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    setupMobileOptimizations() {
        if (!this.isMobile) return;

        // Add mobile-specific class
        document.documentElement.classList.add('mobile-device');

        // Optimize touch targets
        this.optimizeTouchTargets();

        // Optimize scrolling
        this.optimizeScrolling();

        // Add mobile-specific CSS
        this.addMobileCSSOptimizations();

        // Setup mobile navigation
        this.setupMobileNavigation();
    }

    optimizeTouchTargets() {
        // Ensure all interactive elements meet minimum touch target size (44x44px)
        const interactiveElements = document.querySelectorAll('a, button, input, [role="button"], [tabindex="0"]');

        interactiveElements.forEach(element => {
            const rect = element.getBoundingClientRect();

            if (rect.width < 44 || rect.height < 44) {
                element.style.minWidth = '44px';
                element.style.minHeight = '44px';
                element.style.display = element.style.display || 'inline-flex';
                element.style.alignItems = 'center';
                element.style.justifyContent = 'center';
            }
        });

        // Add touch feedback
        this.addTouchFeedback();
    }

    addTouchFeedback() {
        const style = document.createElement('style');
        style.textContent = `
            .mobile-device a,
            .mobile-device button,
            .mobile-device [role="button"] {
                -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
                transition: background-color 0.15s ease, transform 0.1s ease;
            }

            .mobile-device a:active,
            .mobile-device button:active,
            .mobile-device [role="button"]:active {
                background-color: rgba(0, 0, 0, 0.05);
                transform: scale(0.98);
            }

            .mobile-device .btn:active {
                background-color: var(--color-primary-dark, #0066cc);
            }

            .mobile-device .location-card:active {
                transform: translateY(2px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }
        `;
        document.head.appendChild(style);
    }

    optimizeScrolling() {
        // Smooth scrolling optimization for mobile
        document.documentElement.style.scrollBehavior = 'smooth';

        // Add momentum scrolling for iOS
        const style = document.createElement('style');
        style.textContent = `
            .mobile-device {
                -webkit-overflow-scrolling: touch;
            }

            .mobile-device .carousel-track {
                -webkit-overflow-scrolling: touch;
                scroll-snap-type: x mandatory;
            }

            .mobile-device .location-card {
                scroll-snap-align: start;
            }
        `;
        document.head.appendChild(style);

        // Prevent overscroll bounce on iOS
        document.body.addEventListener('touchmove', (e) => {
            if (e.target === document.body) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    addMobileCSSOptimizations() {
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                /* Optimize font sizes for mobile */
                .mobile-device {
                    font-size: 16px; /* Prevent zoom on iOS */
                    line-height: 1.5;
                }

                .mobile-device input,
                .mobile-device textarea,
                .mobile-device select {
                    font-size: 16px; /* Prevent zoom on iOS */
                }

                /* Optimize spacing for mobile */
                .mobile-device .container {
                    padding-left: 1rem;
                    padding-right: 1rem;
                }

                /* Optimize carousel for mobile */
                .mobile-device .location-carousel .carousel-container {
                    overflow-x: auto;
                    scroll-behavior: smooth;
                }

                .mobile-device .location-card {
                    flex: 0 0 280px;
                    margin-right: 1rem;
                }

                /* Hide carousel navigation on mobile, use scrolling */
                .mobile-device .carousel-nav {
                    display: none;
                }

                /* Optimize buttons for mobile */
                .mobile-device .btn {
                    min-height: 48px;
                    padding: 0.75rem 1.5rem;
                    font-size: 1rem;
                }

                /* Optimize hero sections */
                .mobile-device .location-hero .hero-features {
                    flex-direction: column;
                    gap: 0.75rem;
                    align-items: stretch;
                }

                .mobile-device .location-hero .feature-item {
                    justify-content: flex-start;
                    padding: 0.75rem 1rem;
                }

                /* Optimize grids for mobile */
                .mobile-device .benefits-grid,
                .mobile-device .projects-grid,
                .mobile-device .faq-grid {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }

                /* Optimize service grid */
                .mobile-device .service-grid {
                    grid-template-columns: 1fr;
                    gap: 2rem;
                }

                .mobile-device .pricing-info {
                    order: -1; /* Show pricing first on mobile */
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupMobileNavigation() {
        const navToggle = document.querySelector('.nav-toggle');
        const mainNav = document.querySelector('.main-nav');

        if (!navToggle || !mainNav) return;

        // Enhanced mobile navigation
        navToggle.addEventListener('click', () => {
            const isOpen = navToggle.getAttribute('aria-expanded') === 'true';

            navToggle.setAttribute('aria-expanded', (!isOpen).toString());
            mainNav.classList.toggle('nav-open', !isOpen);

            // Prevent body scroll when nav is open
            document.body.style.overflow = !isOpen ? 'hidden' : '';

            // Focus management
            if (!isOpen) {
                const firstLink = mainNav.querySelector('a');
                if (firstLink) {
                    firstLink.focus();
                }
            }
        });

        // Close navigation on outside click
        document.addEventListener('click', (e) => {
            if (!mainNav.contains(e.target) && !navToggle.contains(e.target)) {
                navToggle.setAttribute('aria-expanded', 'false');
                mainNav.classList.remove('nav-open');
                document.body.style.overflow = '';
            }
        });

        // Close navigation on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mainNav.classList.contains('nav-open')) {
                navToggle.setAttribute('aria-expanded', 'false');
                mainNav.classList.remove('nav-open');
                document.body.style.overflow = '';
                navToggle.focus();
            }
        });
    }

    setupTouchOptimizations() {
        // Enhanced touch support for carousel
        this.setupTouchCarousel();

        // Add pull-to-refresh simulation
        this.setupPullToRefresh();

        // Optimize form interactions
        this.optimizeFormTouch();
    }

    setupTouchCarousel() {
        const carousel = document.getElementById('locationCarousel');
        if (!carousel) return;

        const track = carousel.querySelector('.carousel-track');
        if (!track) return;

        // Enable horizontal scrolling on mobile
        if (this.isMobile) {
            track.style.overflowX = 'auto';
            track.style.scrollBehavior = 'smooth';
            track.style.scrollSnapType = 'x mandatory';

            // Add scroll snap to cards
            carousel.querySelectorAll('.location-card').forEach(card => {
                card.style.scrollSnapAlign = 'start';
                card.style.flexShrink = '0';
            });

            // Update indicators based on scroll position
            track.addEventListener('scroll', () => {
                this.updateCarouselIndicators(carousel, track);
            });
        }
    }

    updateCarouselIndicators(carousel, track) {
        const cards = carousel.querySelectorAll('.location-card');
        const indicators = carousel.querySelectorAll('.carousel-dot');

        if (cards.length === 0 || indicators.length === 0) return;

        const cardWidth = cards[0].offsetWidth + 16; // Including margin
        const scrollPosition = track.scrollLeft;
        const currentIndex = Math.round(scrollPosition / cardWidth);

        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
            indicator.setAttribute('aria-selected', index === currentIndex ? 'true' : 'false');
        });
    }

    setupPullToRefresh() {
        if (!this.isMobile) return;

        let startY = 0;
        let isRefreshing = false;
        const refreshThreshold = 100;

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].pageY;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (isRefreshing || window.scrollY > 0) return;

            const currentY = e.touches[0].pageY;
            const pullDistance = currentY - startY;

            if (pullDistance > refreshThreshold) {
                // Show refresh indicator
                this.showRefreshIndicator();
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (isRefreshing || window.scrollY > 0) return;

            const currentY = e.changedTouches[0].pageY;
            const pullDistance = currentY - startY;

            if (pullDistance > refreshThreshold) {
                this.triggerRefresh();
            } else {
                this.hideRefreshIndicator();
            }
        }, { passive: true });
    }

    showRefreshIndicator() {
        if (document.querySelector('.refresh-indicator')) return;

        const indicator = document.createElement('div');
        indicator.className = 'refresh-indicator';
        indicator.innerHTML = '↻ Release to refresh';
        indicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            background: var(--color-primary, #3b82f6);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0 0 0.5rem 0.5rem;
            font-size: 0.9rem;
            z-index: 1000;
            animation: slideDown 0.3s ease;
        `;

        document.body.appendChild(indicator);
    }

    hideRefreshIndicator() {
        const indicator = document.querySelector('.refresh-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    triggerRefresh() {
        this.hideRefreshIndicator();

        // Show loading state
        const loading = document.createElement('div');
        loading.className = 'refresh-loading';
        loading.innerHTML = '↻ Refreshing...';
        loading.style.cssText = `
            position: fixed;
            top: 1rem;
            left: 50%;
            transform: translateX(-50%);
            background: var(--color-primary, #3b82f6);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.9rem;
            z-index: 1000;
        `;

        document.body.appendChild(loading);

        // Simulate refresh (in real app, this would reload data)
        setTimeout(() => {
            loading.remove();
            window.location.reload();
        }, 1000);
    }

    optimizeFormTouch() {
        // Optimize form inputs for mobile
        const inputs = document.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            // Add appropriate input types for mobile keyboards
            if (input.name && input.name.toLowerCase().includes('phone')) {
                input.type = 'tel';
            }
            if (input.name && input.name.toLowerCase().includes('email')) {
                input.type = 'email';
            }

            // Add touch-friendly styling
            input.style.fontSize = '16px'; // Prevent zoom on iOS
            input.style.minHeight = '44px';

            // Add focus enhancement for mobile
            input.addEventListener('focus', () => {
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });
    }

    setupViewportOptimizations() {
        // Dynamic viewport height for mobile browsers
        this.updateViewportHeight();

        window.addEventListener('resize', () => {
            this.updateViewportHeight();
        });

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.updateViewportHeight();
            }, 100);
        });
    }

    updateViewportHeight() {
        // Fix viewport height issues on mobile browsers
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);

        // Update CSS to use the custom property
        if (!this.viewportCSS) {
            this.viewportCSS = document.createElement('style');
            this.viewportCSS.textContent = `
                .full-height {
                    height: 100vh;
                    height: calc(var(--vh, 1vh) * 100);
                }

                .min-full-height {
                    min-height: 100vh;
                    min-height: calc(var(--vh, 1vh) * 100);
                }
            `;
            document.head.appendChild(this.viewportCSS);
        }
    }

    setupConnectionOptimizations() {
        // Optimize for different connection speeds
        if ('connection' in navigator) {
            const connection = navigator.connection;

            // Adjust image quality based on connection
            this.optimizeForConnection(connection.effectiveType);

            // Listen for connection changes
            connection.addEventListener('change', () => {
                this.optimizeForConnection(connection.effectiveType);
            });
        }

        // Data saver mode
        if ('connection' in navigator && navigator.connection.saveData) {
            this.enableDataSaverMode();
        }
    }

    optimizeForConnection(effectiveType) {
        const isSlowConnection = ['slow-2g', '2g'].includes(effectiveType);

        if (isSlowConnection) {
            // Disable auto-play on slow connections
            const carousel = document.getElementById('locationCarousel');
            if (carousel && carousel.carouselInstance) {
                carousel.carouselInstance.isAutoPlaying = false;
                carousel.carouselInstance.stopAutoPlay();
            }

            // Reduce image quality
            document.documentElement.classList.add('slow-connection');
        } else {
            document.documentElement.classList.remove('slow-connection');
        }
    }

    enableDataSaverMode() {
        document.documentElement.classList.add('data-saver');

        // Add data saver optimizations
        const style = document.createElement('style');
        style.textContent = `
            .data-saver img {
                display: none;
            }

            .data-saver .hero-features .feature-icon {
                display: none;
            }

            .data-saver .location-icon {
                display: none;
            }
        `;
        document.head.appendChild(style);
    }

    setupPWAFeatures() {
        // Register service worker
        this.registerServiceWorker();

        // Add to home screen prompt
        this.setupInstallPrompt();

        // Handle online/offline status
        this.setupOfflineDetection();
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered successfully');

                    // Handle updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdateNotification();
                            }
                        });
                    });
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed:', error);
                });
        }
    }

    setupInstallPrompt() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;

            // Show install button
            this.showInstallButton(deferredPrompt);
        });

        window.addEventListener('appinstalled', (e) => {
            console.log('PWA was installed');
            this.hideInstallButton();
        });
    }

    showInstallButton(deferredPrompt) {
        const installButton = document.createElement('button');
        installButton.textContent = '📱 Install App';
        installButton.className = 'install-button';
        installButton.style.cssText = `
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            background: var(--color-primary, #3b82f6);
            color: white;
            border: none;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.9rem;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        `;

        installButton.addEventListener('click', () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the A2HS prompt');
                }
                deferredPrompt = null;
                installButton.remove();
            });
        });

        document.body.appendChild(installButton);

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (installButton.parentNode) {
                installButton.remove();
            }
        }, 10000);
    }

    hideInstallButton() {
        const installButton = document.querySelector('.install-button');
        if (installButton) {
            installButton.remove();
        }
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 1rem;
                left: 50%;
                transform: translateX(-50%);
                background: var(--color-primary, #3b82f6);
                color: white;
                padding: 1rem;
                border-radius: 0.5rem;
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 1rem;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            ">
                <span>New version available!</span>
                <button onclick="window.location.reload()" style="
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 0.25rem;
                    cursor: pointer;
                ">Update</button>
                <button onclick="this.closest('.update-notification').remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 1.2rem;
                ">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-hide after 30 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 30000);
    }

    setupOfflineDetection() {
        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showConnectionStatus('online');
        });

        window.addEventListener('offline', () => {
            this.showConnectionStatus('offline');
        });

        // Initial status
        if (!navigator.onLine) {
            this.showConnectionStatus('offline');
        }
    }

    showConnectionStatus(status) {
        // Remove existing status
        const existing = document.querySelector('.connection-status');
        if (existing) {
            existing.remove();
        }

        const statusBar = document.createElement('div');
        statusBar.className = 'connection-status';
        statusBar.textContent = status === 'online' ? 'Back online' : 'You\'re offline';
        statusBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: ${status === 'online' ? '#4ade80' : '#ef4444'};
            color: white;
            text-align: center;
            padding: 0.5rem;
            font-size: 0.9rem;
            z-index: 1000;
            animation: slideDown 0.3s ease;
        `;

        document.body.appendChild(statusBar);

        // Auto-hide online status after 3 seconds
        if (status === 'online') {
            setTimeout(() => {
                if (statusBar.parentNode) {
                    statusBar.remove();
                }
            }, 3000);
        }
    }

    setupOfflineSupport() {
        // Cache critical resources for offline use
        this.cacheResources();

        // Show offline page content
        if (!navigator.onLine) {
            this.showOfflineContent();
        }
    }

    cacheResources() {
        if ('caches' in window) {
            caches.open('streamline-dumpsters-v1').then(cache => {
                cache.addAll([
                    '/',
                    '/css/base.css',
                    '/css/location-page.css',
                    '/js/locationData.js',
                    // Add other critical resources
                ]);
            });
        }
    }

    showOfflineContent() {
        // Show cached location data when offline
        const cachedData = localStorage.getItem('cachedLocationData');
        if (cachedData) {
            // Use cached data to populate page
            console.log('Using cached location data for offline experience');
        }
    }
}

// Initialize mobile optimizations
document.addEventListener('DOMContentLoaded', () => {
    window.mobileOptimizer = new MobileOptimizer();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileOptimizer;
}