self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Required for installability. Requests stay on the network so the live game is never served from cache.
self.addEventListener("fetch", () => {});
