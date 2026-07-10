/**
 * useAdminCollection - the one server-side collection hook every admin list
 * uses. It owns search (debounced), sorting, filtering, pagination and the
 * exact-count query against a single primary table, and returns a page at a
 * time so we never SELECT a whole table into the browser.
 *
 * Screens that need client-side joins (e.g. Users = profiles + entitlements +
 * roles) pass an `enrich` callback that runs against ONLY the current page's
 * rows, keyed by their ids - never the whole table.
 */
import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildOrIlike } from "@/lib/adminTable";

export type SortDir = "asc" | "desc";
export interface AdminSort {
  column: string;
  dir: SortDir;
}

// The supabase query builder is heavily generic over the literal table name;
// with a dynamic `table: string` those generics collapse to `never`, so we
// type the filter callback against a permissive builder shape on purpose.
type QueryBuilder = {
  or: (filter: string) => QueryBuilder;
  eq: (column: string, value: unknown) => QueryBuilder;
  gte: (column: string, value: unknown) => QueryBuilder;
  lte: (column: string, value: unknown) => QueryBuilder;
  in: (column: string, values: readonly unknown[]) => QueryBuilder;
  order: (column: string, opts: { ascending: boolean }) => QueryBuilder;
  range: (from: number, to: number) => QueryBuilder;
};

export interface UseAdminCollectionOptions<Row, Enriched = Row> {
  /** Stable react-query key base for this collection. */
  key: readonly unknown[];
  /** Primary table to paginate. */
  table: string;
  /** Column projection. Defaults to "*". */
  select?: string;
  /** Columns matched (case-insensitive substring) by the search box. */
  searchColumns?: string[];
  /** Initial sort. */
  defaultSort?: AdminSort;
  /** Rows per page. Defaults to 25. */
  pageSize?: number;
  /** Debounce for the search input, ms. Defaults to 300. */
  searchDebounceMs?: number;
  /** Apply screen-specific filters (eq/gte/lte/in) from the filter state. */
  applyFilters?: (q: QueryBuilder, filters: Record<string, string>) => QueryBuilder;
  /** Enrich the current page's rows with client-side joins (page ids only). */
  enrich?: (rows: Row[]) => Promise<Enriched[]>;
  enabled?: boolean;
}

const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

export function useAdminCollection<Row = Record<string, unknown>, Enriched = Row>(
  opts: UseAdminCollectionOptions<Row, Enriched>
) {
  const {
    key,
    table,
    select = "*",
    searchColumns,
    defaultSort,
    pageSize = 25,
    searchDebounceMs = 300,
    applyFilters,
    enrich,
    enabled = true,
  } = opts;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<AdminSort | null>(defaultSort ?? null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const debouncedSearch = useDebouncedValue(search, searchDebounceMs);

  // Any change to what the result set contains resets to page 1, so you never
  // land on a now-empty trailing page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sort?.column, sort?.dir, filters]);

  const query = useQuery({
    queryKey: [...key, { page, pageSize, debouncedSearch, sort, filters, select }],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      let q = supabase.from(table as never).select(select, { count: "exact" }) as unknown as QueryBuilder;
      const or = searchColumns ? buildOrIlike(searchColumns, debouncedSearch) : "";
      if (or) q = q.or(or);
      if (applyFilters) q = applyFilters(q, filters);
      if (sort) q = q.order(sort.column, { ascending: sort.dir === "asc" });
      q = q.range(from, from + pageSize - 1);

      const { data, count, error } = (await (q as unknown as Promise<{
        data: Row[] | null;
        count: number | null;
        error: { message: string } | null;
      }>));
      if (error) throw new Error(error.message);

      const base = (data ?? []) as Row[];
      const rows = enrich ? await enrich(base) : (base as unknown as Enriched[]);
      return { rows, count: count ?? 0 };
    },
  });

  const total = query.data?.count ?? null;
  const pageCount = total != null ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  // Clamp if a filter shrank the result set below the current page.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const toggleSort = (column: string) => {
    setSort((prev) => {
      if (!prev || prev.column !== column) return { column, dir: "asc" };
      if (prev.dir === "asc") return { column, dir: "desc" };
      return null; // asc -> desc -> unsorted
    });
  };

  const setFilter = (key: string, value: string | undefined) =>
    setFilters((prev) => {
      const next = { ...prev };
      if (!value) delete next[key];
      else next[key] = value;
      return next;
    });

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total != null ? Math.min(page * pageSize, total) : (query.data?.rows.length ?? 0);

  return {
    rows: useMemo(() => query.data?.rows ?? [], [query.data]),
    total,
    page,
    pageCount,
    pageSize,
    setPage,
    search,
    setSearch,
    sort,
    toggleSort,
    filters,
    setFilter,
    resetFilters: () => setFilters({}),
    rangeStart,
    rangeEnd,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
