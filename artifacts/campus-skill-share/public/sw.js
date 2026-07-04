const CACHE_NAME = "skillet-v1";
const urlsToCache = ["/", "/manifest.json", "/favicon.svg"];

// Install: cache basic files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        }),
      ),
    ),
  );
});

// Fetch: serve from cache when offline, fallback to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    }),
  );
});
