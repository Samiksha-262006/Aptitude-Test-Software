/**
 * AptitudePro Progressive Web App (PWA) Service Worker
 * Safe Static App Shell Caching & Offline Support
 * 
 * IMPORTANT: Excludes all Firebase Authentication and Cloud Firestore network requests.
 * Firebase manages its own cloud synchronization and authentication tokens.
 */

const CACHE_NAME = 'aptitudepro-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/style.css',
    '/js/firebase-config.js',
    '/js/auth.js',
    '/js/questions.js',
    '/js/sound.js',
    '/js/leaderboard.js',
    '/js/app.js',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Domains that MUST bypass service worker caching to preserve live Firebase & API functionality
const EXCLUDED_HOSTS = [
    'firestore.googleapis.com',
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'firebaseinstallations.googleapis.com',
    'firebase.googleapis.com',
    'apis.google.com',
    'aptitude-software-test.firebaseapp.com'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
            .catch((err) => console.warn('PWA Precache warning:', err))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // 1. Non-GET requests should always use the network
    if (request.method !== 'GET') {
        return;
    }

    // 2. Bypass service worker for all Firebase backend, auth, and database endpoints
    if (EXCLUDED_HOSTS.some((host) => url.hostname.includes(host))) {
        return;
    }

    // 3. Navigation (HTML pages): Network-First with offline cache fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) return cachedResponse;
                    return caches.match('/index.html');
                })
        );
        return;
    }

    // 4. Static assets (CSS, JS, Fonts, Images): Stale-While-Revalidate
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(() => cachedResponse);

            return cachedResponse || fetchPromise;
        })
    );
});
