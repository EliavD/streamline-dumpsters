/**
 * Performance Monitor and Analytics
 * Tracks Core Web Vitals, user interactions, and site performance metrics
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.setupCoreWebVitals();
        this.monitorPageSpeed();
        this.trackUserExperience();
        this.setupResourceTiming();
        this.monitorErrors();
    }

    setupCoreWebVitals() {
        // Core Web Vitals tracking using the web-vitals library approach
        this.trackLCP(); // Largest Contentful Paint
        this.trackFID(); // First Input Delay
        this.trackCLS(); // Cumulative Layout Shift
        this.trackFCP(); // First Contentful Paint
        this.trackTTFB(); // Time to First Byte
    }

    trackLCP() {
        // Track Largest Contentful Paint
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];

                    const lcp = Math.round(lastEntry.startTime);
                    this.metrics.lcp = lcp;

                    // Send to analytics
                    this.sendToAnalytics({
                        name: 'LCP',
                        value: lcp,
                        rating: lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor'
                    });
                });

                observer.observe({ type: 'largest-contentful-paint', buffered: true });
            } catch (error) {
                console.warn('LCP tracking failed:', error);
            }
        }
    }

    trackFID() {
        // Track First Input Delay
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach((entry) => {
                        const fid = Math.round(entry.processingStart - entry.startTime);
                        this.metrics.fid = fid;

                        this.sendToAnalytics({
                            name: 'FID',
                            value: fid,
                            rating: fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor'
                        });
                    });
                });

                observer.observe({ type: 'first-input', buffered: true });
            } catch (error) {
                console.warn('FID tracking failed:', error);
            }
        }
    }

    trackCLS() {
        // Track Cumulative Layout Shift
        if ('PerformanceObserver' in window) {
            try {
                let clsValue = 0;
                let sessionValue = 0;
                let sessionEntries = [];

                const observer = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();

                    entries.forEach((entry) => {
                        if (!entry.hadRecentInput) {
                            sessionValue += entry.value;
                            sessionEntries.push(entry);

                            if (sessionValue > clsValue) {
                                clsValue = sessionValue;
                            }
                        }
                    });

                    this.metrics.cls = Math.round(clsValue * 1000) / 1000;

                    this.sendToAnalytics({
                        name: 'CLS',
                        value: clsValue,
                        rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor'
                    });
                });

                observer.observe({ type: 'layout-shift', buffered: true });
            } catch (error) {
                console.warn('CLS tracking failed:', error);
            }
        }
    }

    trackFCP() {
        // Track First Contentful Paint
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach((entry) => {
                        if (entry.name === 'first-contentful-paint') {
                            const fcp = Math.round(entry.startTime);
                            this.metrics.fcp = fcp;

                            this.sendToAnalytics({
                                name: 'FCP',
                                value: fcp,
                                rating: fcp <= 1800 ? 'good' : fcp <= 3000 ? 'needs-improvement' : 'poor'
                            });
                        }
                    });
                });

                observer.observe({ type: 'paint', buffered: true });
            } catch (error) {
                console.warn('FCP tracking failed:', error);
            }
        }
    }

    trackTTFB() {
        // Track Time to First Byte
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach((entry) => {
                        if (entry.entryType === 'navigation') {
                            const ttfb = Math.round(entry.responseStart);
                            this.metrics.ttfb = ttfb;

                            this.sendToAnalytics({
                                name: 'TTFB',
                                value: ttfb,
                                rating: ttfb <= 800 ? 'good' : ttfb <= 1800 ? 'needs-improvement' : 'poor'
                            });
                        }
                    });
                });

                observer.observe({ type: 'navigation', buffered: true });
            } catch (error) {
                console.warn('TTFB tracking failed:', error);
            }
        }
    }

    monitorPageSpeed() {
        // Track comprehensive page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
                    const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
                    const totalTime = navigation.loadEventEnd - navigation.fetchStart;

                    this.metrics.loadTime = Math.round(loadTime);
                    this.metrics.domContentLoaded = Math.round(domContentLoaded);
                    this.metrics.totalTime = Math.round(totalTime);

                    // Send comprehensive load metrics
                    this.sendToAnalytics({
                        name: 'page_load_time',
                        value: Math.round(loadTime),
                        page: window.location.pathname
                    });

                    this.sendToAnalytics({
                        name: 'total_page_time',
                        value: Math.round(totalTime),
                        page: window.location.pathname
                    });
                }
            }, 0);
        });
    }

    trackUserExperience() {
        // Track user interaction delays and responsiveness
        this.trackClickDelay();
        this.trackScrollPerformance();
        this.trackFormInteractions();
    }

    trackClickDelay() {
        let clickStartTime = 0;

        document.addEventListener('mousedown', () => {
            clickStartTime = performance.now();
        }, true);

        document.addEventListener('click', (e) => {
            if (clickStartTime) {
                const clickDelay = performance.now() - clickStartTime;

                if (clickDelay > 100) {
                    this.sendToAnalytics({
                        name: 'slow_interaction',
                        delay: Math.round(clickDelay),
                        element: e.target.tagName,
                        page: window.location.pathname
                    });
                }

                clickStartTime = 0;
            }
        }, true);
    }

    trackScrollPerformance() {
        let scrollStartTime = 0;
        let isScrolling = false;

        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                scrollStartTime = performance.now();
                isScrolling = true;
            }

            // Debounce scroll end detection
            clearTimeout(window.scrollEndTimer);
            window.scrollEndTimer = setTimeout(() => {
                if (isScrolling) {
                    const scrollDuration = performance.now() - scrollStartTime;

                    // Track slow scrolling
                    if (scrollDuration > 16) { // Slower than 60fps
                        this.sendToAnalytics({
                            name: 'slow_scroll',
                            duration: Math.round(scrollDuration),
                            page: window.location.pathname
                        });
                    }

                    isScrolling = false;
                }
            }, 100);
        });
    }

    trackFormInteractions() {
        // Track form performance and interactions
        document.querySelectorAll('form').forEach((form) => {
            const formStartTime = performance.now();

            form.addEventListener('submit', () => {
                const formInteractionTime = performance.now() - formStartTime;

                this.sendToAnalytics({
                    name: 'form_interaction_time',
                    value: Math.round(formInteractionTime),
                    form_id: form.id || 'unnamed',
                    page: window.location.pathname
                });
            });
        });
    }

    setupResourceTiming() {
        // Monitor resource loading performance
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();

                    entries.forEach((entry) => {
                        // Track slow resources
                        if (entry.duration > 1000) {
                            this.sendToAnalytics({
                                name: 'slow_resource',
                                resource: entry.name,
                                duration: Math.round(entry.duration),
                                type: entry.initiatorType
                            });
                        }

                        // Track CSS and JS loading
                        if (entry.initiatorType === 'script' || entry.initiatorType === 'css') {
                            this.sendToAnalytics({
                                name: 'resource_timing',
                                resource_type: entry.initiatorType,
                                duration: Math.round(entry.duration),
                                size: entry.transferSize || 0
                            });
                        }
                    });
                });

                observer.observe({ entryTypes: ['resource'] });
            } catch (error) {
                console.warn('Resource timing tracking failed:', error);
            }
        }
    }

    monitorErrors() {
        // Track JavaScript errors
        window.addEventListener('error', (event) => {
            this.sendToAnalytics({
                name: 'javascript_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                page: window.location.pathname
            });
        });

        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.sendToAnalytics({
                name: 'unhandled_rejection',
                reason: event.reason?.toString() || 'Unknown',
                page: window.location.pathname
            });
        });
    }

    sendToAnalytics(metric) {
        // Send metrics to Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', metric.name, {
                custom_parameter: metric.value || metric.duration,
                metric_rating: metric.rating,
                page_path: window.location.pathname,
                ...metric
            });
        }

        // Send to custom analytics endpoint (if available)
        if (window.customAnalytics) {
            window.customAnalytics.track(metric);
        }

        // Store metrics locally for debugging
        this.storeMetricLocally(metric);
    }

    storeMetricLocally(metric) {
        const existingMetrics = JSON.parse(localStorage.getItem('performanceMetrics') || '[]');
        const timestampedMetric = {
            ...metric,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            userAgent: navigator.userAgent,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };

        existingMetrics.push(timestampedMetric);

        // Keep only last 50 metrics to avoid localStorage bloat
        if (existingMetrics.length > 50) {
            existingMetrics.splice(0, existingMetrics.length - 50);
        }

        localStorage.setItem('performanceMetrics', JSON.stringify(existingMetrics));
    }

    // Public method to get current metrics
    getMetrics() {
        return { ...this.metrics };
    }

    // Public method to get stored metrics
    getStoredMetrics() {
        return JSON.parse(localStorage.getItem('performanceMetrics') || '[]');
    }

    // Method to generate performance report
    generateReport() {
        const metrics = this.getMetrics();
        const report = {
            coreWebVitals: {
                lcp: metrics.lcp,
                fid: metrics.fid,
                cls: metrics.cls,
                fcp: metrics.fcp,
                ttfb: metrics.ttfb
            },
            loadTimes: {
                loadTime: metrics.loadTime,
                domContentLoaded: metrics.domContentLoaded,
                totalTime: metrics.totalTime
            },
            page: window.location.pathname,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent.substring(0, 100) // Truncated for storage
        };

        console.log('Performance Report:', report);
        return report;
    }
}

// Location Analytics Extension
class LocationAnalytics extends PerformanceMonitor {
    constructor() {
        super();
        this.setupLocationTracking();
        this.trackCarouselInteractions();
        this.setupHeatmapping();
        this.trackLocationEngagement();
    }

    setupLocationTracking() {
        // Track which locations users are most interested in
        document.querySelectorAll('.location-link, .location-card a').forEach(link => {
            link.addEventListener('click', (e) => {
                const locationName = e.currentTarget.querySelector('h3')?.textContent ||
                                   e.currentTarget.textContent?.trim();

                if (locationName) {
                    this.sendToAnalytics({
                        name: 'location_click',
                        location_name: locationName,
                        page_title: document.title,
                        click_position: this.getElementPosition(e.currentTarget)
                    });

                    this.trackLocationInterest(locationName);
                }
            });
        });
    }

    trackCarouselInteractions() {
        const carousel = document.getElementById('locationCarousel');
        if (!carousel) return;

        // Track carousel navigation
        carousel.addEventListener('click', (e) => {
            if (e.target.matches('.carousel-nav, .carousel-nav *')) {
                const direction = e.target.closest('.next') ? 'next' : 'previous';
                this.sendToAnalytics({
                    name: 'carousel_navigation',
                    direction: direction,
                    page: window.location.pathname
                });
            }

            if (e.target.matches('.carousel-dot, .carousel-dot *')) {
                const dotIndex = Array.from(carousel.querySelectorAll('.carousel-dot')).indexOf(e.target.closest('.carousel-dot'));
                this.sendToAnalytics({
                    name: 'carousel_dot_click',
                    dot_index: dotIndex,
                    page: window.location.pathname
                });
            }
        });

        // Track carousel auto-advance
        if (carousel.carouselInstance) {
            carousel.addEventListener('carousel-advance', (e) => {
                this.sendToAnalytics({
                    name: 'carousel_auto_advance',
                    slide_index: e.detail.slideIndex,
                    page: window.location.pathname
                });
            });
        }
    }

    setupHeatmapping() {
        // Basic scroll depth tracking
        let maxScroll = 0;
        const scrollMilestones = [25, 50, 75, 90, 100];

        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);

            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;

                // Track major scroll milestones
                scrollMilestones.forEach(milestone => {
                    if (maxScroll >= milestone && !this[`milestone_${milestone}_tracked`]) {
                        this[`milestone_${milestone}_tracked`] = true;
                        this.sendToAnalytics({
                            name: 'scroll_depth',
                            percent: milestone,
                            page: window.location.pathname
                        });
                    }
                });
            }
        });

        // Track time spent in view for different sections
        this.trackSectionViewTime();
    }

    trackSectionViewTime() {
        const sections = document.querySelectorAll('section[class]');
        const sectionTimes = {};

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const sectionName = entry.target.className.split(' ')[0];

                    if (entry.isIntersecting) {
                        sectionTimes[sectionName] = Date.now();
                    } else if (sectionTimes[sectionName]) {
                        const timeSpent = Date.now() - sectionTimes[sectionName];

                        if (timeSpent > 1000) { // Only track if viewed for more than 1 second
                            this.sendToAnalytics({
                                name: 'section_view_time',
                                section: sectionName,
                                time_spent: Math.round(timeSpent),
                                page: window.location.pathname
                            });
                        }

                        delete sectionTimes[sectionName];
                    }
                });
            }, { threshold: 0.5 });

            sections.forEach(section => observer.observe(section));
        }
    }

    trackLocationEngagement() {
        // Track engagement with location-specific content
        const locationElements = document.querySelectorAll('[class*="location"], [class*="neighborhood"], [class*="area"]');

        locationElements.forEach((element) => {
            element.addEventListener('click', (e) => {
                const elementClass = element.className;
                const elementText = element.textContent?.trim().substring(0, 50);

                this.sendToAnalytics({
                    name: 'location_content_interaction',
                    element_class: elementClass,
                    element_text: elementText,
                    page: window.location.pathname
                });
            });
        });
    }

    trackLocationInterest(locationName) {
        // Store location interest data for personalization
        const interest = JSON.parse(localStorage.getItem('locationInterest') || '{}');
        interest[locationName] = (interest[locationName] || 0) + 1;
        interest.lastInteraction = Date.now();
        localStorage.setItem('locationInterest', JSON.stringify(interest));

        // Send aggregated interest data periodically
        if (Date.now() - (interest.lastSent || 0) > 300000) { // Every 5 minutes
            this.sendToAnalytics({
                name: 'location_interest_summary',
                interests: interest,
                page: window.location.pathname
            });
            interest.lastSent = Date.now();
            localStorage.setItem('locationInterest', JSON.stringify(interest));
        }
    }

    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        };
    }
}

// Initialize performance monitoring
document.addEventListener('DOMContentLoaded', () => {
    // Use LocationAnalytics for service area and location pages
    if (window.location.pathname.includes('service-area') ||
        window.location.pathname.match(/\/(dublin|hilliard|plain-city|westerville|worthington|powell)\.html/)) {
        window.performanceMonitor = new LocationAnalytics();
    } else {
        window.performanceMonitor = new PerformanceMonitor();
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceMonitor, LocationAnalytics };
}