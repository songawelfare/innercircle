// sw.js - Service Worker for THE SONGA Inner Circle
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

// Firebase initialization - UPDATED with your current config
firebase.initializeApp({
  apiKey: "AIzaSyBDZicoo7dFLtSmgRPvQE_gdm-tNOyCTXA",
  authDomain: "the-songa-77b1b.firebaseapp.com",
  databaseURL: "https://the-songa-77b1b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "the-songa-77b1b",
  storageBucket: "the-songa-77b1b.firebasestorage.app",
  messagingSenderId: "123922889572",
  appId: "1:123922889572:web:482b2a624930baaf92d871"
});

const messaging = firebase.messaging();

const CACHE_NAME = 'songa-inner-circle-v1.2';
const urlsToCache = [
  // Main pages
  '/',
  '/index.html',
  '/events.html',
  '/library.html',
  '/profile.html',
  
  // Assets
  '/manifest.json',
  
  // Images
  'https://i.postimg.cc/BbdzCkxQ/20260116-0851-Elegant-Lion-Emblem-remix-01kf2npwbtf06ttr4htekjnd47-removebg-preview-2.webp',
  
  // CSS
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  
  // Firebase SDKs
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage-compat.js',
  'https://accounts.google.com/gsi/client',
  
  // Google Sign-In
  'https://accounts.google.com/gsi/client'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing for THE SONGA Inner Circle');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching core files');
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.log(`Failed to cache ${url}:`, err);
            });
          })
        );
      })
      .then(() => {
        console.log('Service Worker: All core files cached');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('Service Worker: Installation failed:', err);
      })
  );
});

// Activate event - clean up old caches  
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated for THE SONGA Inner Circle');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and Chrome extensions
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Handle Firebase API requests - don't cache, just fetch
  if (event.request.url.includes('firebaseio.com') ||
      event.request.url.includes('firebasestorage.app') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('postimg.cc')) {
    // For Firebase and external resources, fetch from network first
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, try cache as fallback for images
          if (event.request.url.includes('postimg.cc')) {
            return caches.match(event.request);
          }
          return new Response('Network error', { status: 408 });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache if not a valid response
            if (!networkResponse || networkResponse.status !== 200 || 
                networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response for caching
            const responseToCache = networkResponse.clone();
            
            // Cache the new resource
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
                console.log('Service Worker: Cached new resource:', event.request.url);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.log('Service Worker: Fetch failed, returning offline page:', error);
            
            // If it's a page request, return the cached index.html
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // For CSS/JS, return a basic error
            if (event.request.url.includes('.css')) {
              return new Response('/* Offline - CSS not available */', {
                headers: { 'Content-Type': 'text/css' }
              });
            }
            
            if (event.request.url.includes('.js')) {
              return new Response('// Offline - JS not available', {
                headers: { 'Content-Type': 'application/javascript' }
              });
            }
            
            return new Response('Offline - Content not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Handle background messages (when app is closed or in background)
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Received background message:', payload);

  // Customize notification based on payload
  let notificationTitle = 'THE SONGA Inner Circle';
  let notificationBody = 'New notification';
  let notificationIcon = 'https://i.postimg.cc/BbdzCkxQ/20260116-0851-Elegant-Lion-Emblem-remix-01kf2npwbtf06ttr4htekjnd47-removebg-preview-2.webp';
  let notificationTag = 'songa-inner-circle-notification';
  let notificationData = {};

  // Extract notification data from payload
  if (payload.notification) {
    notificationTitle = payload.notification.title || notificationTitle;
    notificationBody = payload.notification.body || notificationBody;
    notificationIcon = payload.notification.icon || notificationIcon;
    notificationData = payload.data || {};
  } else if (payload.data) {
    // Handle data-only messages
    const data = payload.data;
    notificationTitle = data.title || 'THE SONGA Inner Circle';
    notificationBody = data.body || data.message || 'New update available';
    notificationData = data;
    
    // Set tag based on notification type
    if (data.type) {
      notificationTag = `songa-${data.type}-notification`;
    }
  }

  const notificationOptions = {
    body: notificationBody,
    icon: notificationIcon,
    badge: notificationIcon,
    data: notificationData,
    tag: notificationTag,
    timestamp: Date.now(),
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('[Service Worker] Notification shown successfully');
    })
    .catch((error) => {
      console.error('[Service Worker] Failed to show notification:', error);
    });
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();
  
  const notificationData = event.notification.data;
  const action = event.action;
  
  // Handle different notification actions
  let urlToOpen = '/';
  let focusOn = null;
  
  if (notificationData) {
    // Handle post notifications
    if (notificationData.postId) {
      urlToOpen = `/#post-${notificationData.postId}`;
      focusOn = `post-${notificationData.postId}`;
    }
    
    // Handle event notifications
    if (notificationData.eventId) {
      urlToOpen = '/events.html';
    }
    
    // Handle profile notifications
    if (notificationData.userId && notificationData.type === 'follow') {
      urlToOpen = '/profile.html';
    }
  }
  
  // Handle action buttons
  if (action === 'dismiss') {
    console.log('Notification dismissed');
    return;
  }
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        // Focus existing window
        if (client.url.includes(location.origin) && 'focus' in client) {
          if (focusOn) {
            // Send message to focus specific element
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              data: {
                elementId: focusOn,
                notificationData: notificationData
              }
            });
          }
          return client.focus();
        }
      }
      
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen).then((newClient) => {
          if (newClient && focusOn) {
            // Wait for page to load, then send message
            setTimeout(() => {
              newClient.postMessage({
                type: 'NOTIFICATION_CLICK',
                data: {
                  elementId: focusOn,
                  notificationData: notificationData
                }
              });
            }, 1000);
          }
          return newClient;
        });
      }
    })
    .catch((error) => {
      console.error('[Service Worker] Error handling notification click:', error);
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event.notification.tag);
});

// Handle push subscription
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[Service Worker] Push subscription changed');
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'BIN2yC0V5v6wYQZ8nXcR7tGmHjKlOp9AsDfGhJkLzXcVbNmQwErTyUiOaPsDfGhJkLzXcVbNmQwErTyUiOaPs' // Your VAPID key
    })
    .then((subscription) => {
      console.log('[Service Worker] New subscription:', subscription);
      
      // Send new subscription to your server
      return fetch('/api/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldSubscription: event.oldSubscription,
          newSubscription: subscription
        })
      });
    })
    .catch((error) => {
      console.error('[Service Worker] Failed to update subscription:', error);
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sync event for background sync
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts());
  } else if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Background sync functions
async function syncPosts() {
  console.log('[Service Worker] Syncing posts...');
  // Implement post sync logic here
}

async function syncNotifications() {
  console.log('[Service Worker] Syncing notifications...');
  // Implement notification sync logic here
}

// Periodically clean up old cache entries
setInterval(() => {
  caches.open(CACHE_NAME).then((cache) => {
    cache.keys().then((keys) => {
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      keys.forEach((request) => {
        cache.match(request).then((response) => {
          if (response) {
            const dateHeader = response.headers.get('date');
            if (dateHeader) {
              const cachedDate = new Date(dateHeader).getTime();
              if (cachedDate < weekAgo) {
                cache.delete(request);
                console.log('[Service Worker] Cleaned old cache:', request.url);
              }
            }
          }
        });
      });
    });
  });
}, 24 * 60 * 60 * 1000); // Run once per day
