// ─────────────────────────────────────────────────────────────
// REPPO — Service Worker (Client-Side Push Notifications)
// Handles "The Gentle Nudge" time-based local notifications
// ─────────────────────────────────────────────────────────────

const CACHE_NAME = 'reppo-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Listen for messages from the main app thread to schedule notifications
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SCHEDULE_NUDGE') {
        const { title, body, delayMs } = event.data.payload;

        console.log(`[Reppo SW] Scheduling notification "${title}" in ${Math.round(delayMs / 1000 / 60)} minutes.`);

        // Use setTimeout inside the SW.
        // NOTE: On iOS standard WebKit, long-running setTimeouts in Service Workers 
        // may be killed if the app is purged from memory. For a true offline scheduled alarm, 
        // we'd need Push API + Server, but this works for proof-of-concept testing while active/backgrounded safely.
        setTimeout(() => {
            self.registration.showNotification(title, {
                body: body,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                vibrate: [100, 50, 100],
                data: {
                    dateOfArrival: Date.now(),
                    primaryKey: '1'
                }
            });
        }, delayMs);
    }
});

self.addEventListener('notificationclick', (event) => {
    console.log('[Reppo SW] Notification click Received.');
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                let client = windowClients[i];
                // If so, just focus it.
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, then open the target URL in a new window/tab.
            if (clients.openWindow) {
                return clients.openWindow('/app');
            }
        })
    );
});
