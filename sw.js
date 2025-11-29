// sw.js - Service Worker for THE SONGA WELFARE
const CACHE_NAME = 'songa-welfare-v1.0';
const urlsToCache = [
  '/innercircle/',
  '/innercircle/index.html',
  '/innercircle/events.html',
  '/innercircle/library.html', 
  '/innercircle/about.html',
  '/innercircle/manifest.json',
  'https://i.postimg.cc/QCfkMpcM/20251121-1617-Golden-Lion-Emblem-remix-01kak8vrfpfb9r1335qyg8w1gt.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches  
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
