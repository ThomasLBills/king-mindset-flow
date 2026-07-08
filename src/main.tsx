import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
