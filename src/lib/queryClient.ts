import { QueryClient, MutationCache, QueryCache } from "@tanstack/react-query";
import { notify } from "./notify";
import { mapSupabaseError } from "./errors";

// Type mutation `meta` so call-sites get autocomplete on the opt-out flag.
declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: { handled?: boolean };
  }
}

/** Default mutation error handler — toasts unless the mutation opts out via `meta.handled`. */
export function mutationErrorHandler(
  error: unknown,
  _vars: unknown,
  _ctx: unknown,
  mutation: { meta?: { handled?: boolean } },
): void {
  if (mutation?.meta?.handled) return;
  notify.error(mapSupabaseError(error));
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Alt-tab back to the app was refetching every query on window focus; keep
      // data fresh for a minute and don't refetch just because the tab regained focus.
      queries: { staleTime: 60_000, refetchOnWindowFocus: false },
    },
    // No mutation is ever silent: an unhandled mutation error still toasts.
    mutationCache: new MutationCache({ onError: mutationErrorHandler }),
    // Query load failures surface via <ErrorState> in-region, so the global handler
    // only logs — a global toast would double-signal.
    queryCache: new QueryCache({ onError: (error) => console.error("[query error]", error) }),
  });
}
