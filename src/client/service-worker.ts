self.addEventListener("install", (event: any) => {
  event.waitUntil(
    caches.open("pwa-cache-v1").then((cache) => {
      return cache.addAll([
        // "/",
        // "/public/js/main.bundle.js",
        "/public/manifest.json",
      ]);
    })
  );
});

self.addEventListener("fetch", (event: any) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
