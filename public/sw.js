const CACHE_NAME = "table-trivia-v1";
const ASSETS = ["/icon.svg", "/icon-192.png"];

const NETWORK_TIMEOUT_MS = 4000;

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

function shouldHandle(request) {
  if (request.method !== "GET") return false;
  if (!isSameOrigin(request)) return false;
  if (request.url.includes("/api/")) return false;
  return true;
}

function isNavigationRequest(request) {
  return request.mode === "navigate" || request.destination === "document";
}

async function putInCache(request, response) {
  if (!response || !response.ok) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const network = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), NETWORK_TIMEOUT_MS)),
    ]);
    await putInCache(request, network);
    return network;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error("No network and no cache");
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      void putInCache(request, response);
      return response;
    })
    .catch(() => null);
  if (cached) return cached;
  const network = await networkPromise;
  if (network) return network;
  throw new Error("No cache and no network");
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (!shouldHandle(event.request)) return;
  event.respondWith(isNavigationRequest(event.request) ? networkFirst(event.request) : staleWhileRevalidate(event.request));
});
