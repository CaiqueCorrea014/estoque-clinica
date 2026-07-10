const CACHE_NAME = "clinica-estoque-v1";
const ASSETS = [
  "/estoque-clinica/",
  "/estoque-clinica/index.html",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  "https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.4/dist/quagga.min.js"
];

// Instala e faz cache dos arquivos principais
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => console.log("Cache parcial:", err));
    })
  );
  self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia: Network First (tenta internet, se falhar usa cache)
self.addEventListener("fetch", event => {
  // Firebase e APIs externas — sempre online
  if (event.request.url.includes("firebase") ||
      event.request.url.includes("googleapis.com/identitytoolkit") ||
      event.request.url.includes("firestore.googleapis.com")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Salva cópia no cache
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => {
        // Sem internet — usa cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback para index.html
          return caches.match("/estoque-clinica/index.html");
        });
      })
  );
});
