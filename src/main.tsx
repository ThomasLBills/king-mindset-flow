import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Route chunks are hash-named, so a deploy while a tab is open makes that
// tab's next lazy navigation request files that no longer exist. Vite
// surfaces this as "vite:preloadError"; reloading picks up the fresh
// manifest. The per-URL sessionStorage flag limits us to one automatic
// reload, so a genuinely broken chunk can't spin the tab in a reload loop.
window.addEventListener("vite:preloadError", (event) => {
  const reloadedKey = `chunk-reload:${window.location.href}`;
  if (sessionStorage.getItem(reloadedKey)) return; // already retried — let the error boundary handle it
  sessionStorage.setItem(reloadedKey, "1");
  event.preventDefault(); // suppress Vite's re-throw; the reload is the recovery
  window.location.reload();
});

// PWA is out of scope for the redesign. A service worker registered by an
// earlier build will keep serving stale files and break SPA navigation,
// so unregister any leftovers and clear their caches.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
  if ("caches" in window) {
    caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
  }
}

createRoot(document.getElementById("root")!).render(<App />);
