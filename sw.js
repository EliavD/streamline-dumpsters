/**
 * Service Worker for Streamline Dumpsters PWA
 * Provides offline support and caching for better performance
 */

const CACHE_NAME = 'streamline-dumpsters-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/service-area.html',
    '/dublin.html',
    '/hilliard.html',
    '/plain-city.html',
    '/westerville.html',
    '/worthington.html',
    '/powell.html',
    '/faq.html',
    '/contact.html',
    '/bookNow.html',
    '/css/base.css',
    '/css/location-page.css',
    '/css/service-area.css',
    '/js/locationData.js',
    '/js/navigation.js',
    '/js/service-area.js',
    '/js/localSEO.js',
    '/js/performanceMonitor.js',
    '/js/accessibility.js',
    '/js/mobileOptimizer.js',
    '/assets/img/StreamlineDUumpsterslogo.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Failed to cache resources during install:', error);
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }

                // Clone the request because it's a one-time use stream
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then((response) => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response because it's a one-time use stream
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            // Only cache GET requests
                            if (event.request.method === 'GET') {
                                cache.put(event.request, responseToCache);
                            }
                        });

                    return response;
                }).catch(() => {
                    // If network fails and no cache, return offline page
                    if (event.request.destination === 'document') {
                        return caches.match('/offline.html');
                    }
                });
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for form submissions
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

function doBackgroundSync() {
    // Handle offline form submissions
    return new Promise((resolve) => {
        // Retrieve stored form data and submit when online
        // This would integrate with your form handling system
        console.log('Performing background sync');
        resolve();
    });
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/assets/img/icon-192x192.png',
            badge: '/assets/img/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});

// Handle message from main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});