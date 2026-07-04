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

// Fetch: try network first, fall back to cache only if network fails
self.addEventListener("fetch", (event) => {
  // Only handle simple page loads/GET requests
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      }),
  );
});
