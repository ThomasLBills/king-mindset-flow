/// <reference types="vite/client" />

/**
 * Build-time constant injected by vite.config.ts.
 * `true` only when Vite runs in development mode AND the developer sets
 * VITE_DEV_BYPASS_AUTH=true. Production builds inline `false`, allowing
 * every `if (__DEV_BYPASS__)` branch to be dead-code eliminated.
 */
declare const __DEV_BYPASS__: boolean;
