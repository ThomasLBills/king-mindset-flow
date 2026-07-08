import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
