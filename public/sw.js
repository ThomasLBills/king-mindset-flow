/**
 * Service-worker kill-switch.
 *
 * An earlier build of this app (vite-plugin-pwa) registered a service worker
 * at /sw.js that precached the old site and served it cache-first, which
 * breaks the redesigned app. It also could never self-update in dev, because
 * the dev server answered /sw.js with HTML (the SPA fallback), which browsers
 * reject as a worker script.
 *
 * This file replaces any stuck worker: the browser re-fetches /sw.js on
 * navigation, gets this valid script, installs it, and the new worker wipes
 * every cache, unregisters itself, and reloads open tabs with fresh content.
 * Keep it for as long as any visitor might still carry the old worker.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});
