// Clean up any stale Service Workers registered on localhost:3000 from previous projects (e.g., Firebase)
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => {
      return self.clients.matchAll();
    }).then((clients) => {
      // Stale service worker unregistered
    })
  );
});
