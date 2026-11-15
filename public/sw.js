const CACHE_NAME = 'pothhalapro-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './css/themes.css',
  './css/print.css',
  './js/app.js',
  './js/license.js',
  './js/nic-cloner.js',
  './js/sticker-studio.js',
  './js/counter-tools.js',
  './js/education-hub.js',
  './manifest.json',
  './assets/cartoons/superhero.svg',
  './assets/cartoons/astronaut.svg',
  './assets/cartoons/princess.svg',
  './assets/cartoons/racing_car.svg',
  './assets/cartoons/robot.svg',
  './assets/cartoons/dinosaur.svg',
  './assets/cartoons/scholar.svg',
  './assets/cartoons/lion_mascot.svg',
  './assets/samples/sample_nic_front.svg',
  './assets/samples/sample_nic_back.svg',
  './assets/samples/sample_license_front.svg',
  './assets/samples/sample_license_back.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline studio assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Offline-first strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback for HTML documents
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
