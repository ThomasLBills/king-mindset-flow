import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Production Content-Security-Policy, injected into index.html at build time
// only. Dev must stay CSP-free: the React refresh preamble is an inline
// script and HMR runs over websockets, both of which this policy would block.
// Note: frame-ancestors (clickjacking protection) is ignored in <meta> CSP by
// spec, so that directive has to live at the hosting layer as a response header.
const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://ahsadpsvknpsdwgrdecu.supabase.co wss://ahsadpsvknpsdwgrdecu.supabase.co",
  "frame-src 'self' https://player.vimeo.com",
  "media-src 'self' https://ahsadpsvknpsdwgrdecu.supabase.co blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const injectCsp = (): Plugin => ({
  name: "inject-csp",
  // `apply: "build"` keeps the dev server untouched (see PRODUCTION_CSP note).
  apply: "build",
  transformIndexHtml() {
    return [
      {
        tag: "meta",
        attrs: { "http-equiv": "Content-Security-Policy", content: PRODUCTION_CSP },
        // Prepend so the policy is parsed before any <script> in <head> —
        // a meta CSP only governs resources that appear after it.
        injectTo: "head-prepend",
      },
    ];
  },
});

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
      // Redesign note: hmr.overlay is intentionally NOT disabled anymore.
      // Hiding compile errors made HMR failures look like app bugs.
    },
    define: {
      // Build-time constant. Production builds inline `false`, letting the
      // bundler drop every `if (__DEV_BYPASS__)` branch and eliminate the
      // bypass helper from the shipped code.
      __DEV_BYPASS__: JSON.stringify(devBypass),
    },
    // Redesign note: vite-plugin-pwa removed (PWA out of scope this round).
    // public/sw.js is a kill-switch that unregisters the old worker from
    // users' browsers; keep serving it for as long as old installs may exist.
    plugins: [react(), mode === "development" && componentTagger(), injectCsp()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // One stable vendor chunk for the React runtime: it changes far
          // less often than app code, so route chunks can churn between
          // deploys while returning visitors keep this one warm in cache.
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
          },
        },
      },
    },
  };
});
