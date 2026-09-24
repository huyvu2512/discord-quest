// Minimal Service Worker for PWA Home Screen Installation
const CACHE_NAME = 'discord-quest-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Allow normal network requests
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
