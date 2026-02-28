/**
 * Service Worker for Digital Signage OpenLink offline support.
 *
 * Strategy:
 *   - App shell (HTML/JS/CSS): cache-first after initial load
 *   - Merged video files:      network-first, fall back to cache
 *   - API calls:               network-only (OpenLink.js handles fallback via localStorage)
 */

const CACHE_NAME = "ds-openlink-v1";

// Assets that make up the app shell — populated on install
const APP_SHELL = ["/"];

// ── Install: pre-cache app shell ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch handler ──
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1) Merged video files — network-first, cache fallback
  if (
    url.pathname.includes("/merged_videos/") ||
    url.pathname.includes("/media/merged_videos/")
  ) {
    event.respondWith(networkFirstVideo(event.request));
    return;
  }

  // 2) Navigation requests (HTML pages like /open-link/*) — cache-first with network update
  if (event.request.mode === "navigate") {
    event.respondWith(cacheFirstWithNetworkUpdate(event.request));
    return;
  }

  // 3) Static assets (JS, CSS, images) — cache-first
  if (
    event.request.destination === "script" ||
    event.request.destination === "style" ||
    event.request.destination === "image" ||
    event.request.destination === "font"
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // 4) Everything else (API calls etc.) — network only
  event.respondWith(fetch(event.request));
});

// ── Strategies ──

async function networkFirstVideo(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Clone and cache the video response
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    // Network failed — try cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    // Nothing cached either — return a 503
    return new Response("Offline — no cached video available", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

async function cacheFirstWithNetworkUpdate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // Always try to fetch fresh copy in background
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // If we have a cached version, return it immediately
  if (cached) {
    return cached;
  }

  // No cache — must wait for network
  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  return new Response("Offline", { status: 503 });
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    return new Response("Offline", { status: 503 });
  }
}
