/* Service Worker Tijara — permet l'installation et un fonctionnement de base hors-ligne */
const CACHE = 'tijara-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Installation : on met en cache la coquille de l'app
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// Activation : on nettoie les anciens caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stratégie : réseau d'abord (pour toujours avoir les données Supabase à jour),
// et repli sur le cache si pas de connexion.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  // On ne touche pas aux appels vers Supabase / API : toujours le réseau
  if (req.url.includes('supabase.co') || req.method !== 'GET') {
    return;
  }
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
