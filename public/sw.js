const CACHE_NAME = "ferreteria-7a-v1";

const ARCHIVOS_INICIALES = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ARCHIVOS_INICIALES);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nombresCaches) => {
      return Promise.all(
        nombresCaches
          .filter((nombre) => nombre !== CACHE_NAME)
          .map((nombre) => caches.delete(nombre))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((respuesta) => {
        const respuestaClonada = respuesta.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, respuestaClonada);
        });

        return respuesta;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});