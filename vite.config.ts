import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Auth bypass is compiled to a literal `true`/`false` at build time so the
  // branch can be tree-shaken out of production bundles entirely. It is ONLY
  // ever true when both conditions hold:
  //   1. Vite is running in development mode (`vite dev` / `--mode development`)
  //   2. The developer explicitly opted in via VITE_DEV_BYPASS_AUTH=true
  const bypassRequested = process.env.VITE_DEV_BYPASS_AUTH === "true";
  const isDevBuild = mode === "development";

  // Hard failure: if someone tries to ship a production build with the bypass
  // env var enabled, abort the build. This prevents accidental deployment of
  // an auth-bypass artifact.
  if (bypassRequested && !isDevBuild) {
    throw new Error(
      "[SECURITY] VITE_DEV_BYPASS_AUTH=true is set for a non-development build " +
        `(mode=${mode}). The auth bypass is only allowed in development. ` +
        "Unset the variable or run `vite --mode development`."
    );
  }

  const devBypass = bypassRequested && isDevBuild;

  return {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  define: {
    // Build-time constant. Production builds inline `false`, letting the
    // bundler drop every `if (__DEV_BYPASS__)` branch and eliminate the
    // bypass helper from the shipped code.
    __DEV_BYPASS__: JSON.stringify(devBypass),
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/],
        // Don't precache large assets
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      manifest: false, // We use our own public/manifest.json
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
