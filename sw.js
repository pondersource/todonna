const cacheName = 'todonna-cache-v9';

const urlsToCache = [
    './css/bulma.css',
    './css/mobilohm-font-codes.css',
    './css/mobilohm-font-embedded.css',
    './css/mobilohm-font-ie7-codes.css',
    './css/mobilohm-font-ie7.css',
    './css/mobilohm-font.css',
    './css/todonna-bulma-dark.css',
    './css/todonna-bulma-light.css',
    './css/todonna.css',
    './font/fontello-config.json',
    './font/mobilohm-font.eot',
    './font/mobilohm-font.svg',
    './font/mobilohm-font.ttf',
    './font/mobilohm-font.woff',
    './font/mobilohm-font.woff2',
    './img/logo.png',
    './index.html',
    './js/list.js',
    './js/storage-providers.js',
    './js/prefs.js',
    './js/serviceworker.js',
    './js/sync.js',
    './js/todonna.js',
    './manifest.json',
    './vendor/widget.js',
    './vendor/remotestorage.js',
    './vendor/rs-apps.js',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(cacheName)
            .then((cache) => {
                console.log('Opened cache');
                return Promise.all(
                    urlsToCache.map(url => {
                        return fetch(url, { cache: 'reload' }).then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return cache.put(url, response);
                        }).catch(error => {
                            console.error(`Failed to fetch and cache ${url}:`, error);
                        });
                    })
                );
            })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [cacheName];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                    return null;
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.open(cacheName).then((cache) => {
            return fetch(event.request).then((response) => {
                if (event.request.method === 'GET' && new URL(event.request.url).origin === self.location.origin && response.ok) {
                    cache.put(event.request, response.clone());
                }
                return response;
            }).catch(() => {
                return caches.match(event.request);
            });
        })
    );
});

function checkForUpdate() {
    self.registration.update();
}

self.addEventListener('message', (event) => {
    if (event.data.action === 'checkForUpdate') {
        checkForUpdate();
    } else if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
