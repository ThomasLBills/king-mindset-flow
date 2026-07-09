/**
 * AdminList - the shared presentational table for every admin collection.
 * Pair it with useAdminCollection (server-side search/sort/filter/paginate).
 * It owns nothing but presentation + row selection: search box, filter slot,
 * CSV export, sortable headers (aria-sort), skeleton/empty/error states,
 * bulk-action bar, per-row actions, and a responsive horizontal scroll.
 */
import { type ReactNode, useEffect, useId, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, ChevronsUpDown, Download, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LkMonogram } from "@/components/forge/brand";
import { toCsv, downloadCsv } from "@/lib/adminTable";
import type { AdminSort } from "@/hooks/useAdminCollection";

export interface AdminColumn<Row> {
  /** Stable id, also the sort column when `sortable` is set (unless sortKey). */
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  /** Server-side sort column; omit to make the column unsortable. */
  sortKey?: string;
  /** Plain-text value for CSV export + truncation title. */
  csv?: (row: Row) => string | number | null | undefined;
  /** Clamp width and show full text on hover/focus via title. */
  truncate?: boolean;
  headClassName?: string;
  cellClassName?: string;
}

export interface AdminListProps<Row> {
  columns: AdminColumn<Row>[];
  rows: Row[];
  getRowId: (row: Row) => string;

  isLoading: boolean;
  isFetching?: boolean;
  isError?: boolean;
  onRetry?: () => void;

  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;

  sort?: AdminSort | null;
  onToggleSort?: (column: string) => void;

  page?: number;
  pageCount?: number;
  onPageChange?: (p: number) => void;
  total?: number | null;
  rangeStart?: number;
  rangeEnd?: number;

  /** Screen-supplied filter controls (Selects, date inputs, ...). */
  filters?: ReactNode;
  /** Right-aligned toolbar actions (e.g. "Add user"). */
  toolbarActions?: ReactNode;

  selectable?: boolean;
  bulkActions?: (selectedIds: string[], clear: () => void) => ReactNode;
  rowActions?: (row: Row) => ReactNode;
  rowActionsHeader?: ReactNode;

  csvFilename?: string;

  emptyTitle?: string;
  emptyHint?: string;
  /** sr-only description of the table for screen readers. */
  caption: string;
  /** Noun for the result count, e.g. "users". Defaults to "results". */
  noun?: string;
}

function SortHeader({
  active,
  dir,
  onClick,
  children,
}: {
  active: boolean;
  dir: AdminSort["dir"] | null;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mx-2 flex min-h-[24px] items-center gap-1 rounded px-2 py-1 font-medium text-inherit transition-colors hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      {children}
      {active && dir === "asc" && <ArrowUp className="h-3.5 w-3.5 text-gold" aria-hidden="true" />}
      {active && dir === "desc" && <ArrowDown className="h-3.5 w-3.5 text-gold" aria-hidden="true" />}
      {!active && <ChevronsUpDown className="h-3.5 w-3.5 text-dim/60" aria-hidden="true" />}
    </button>
  );
}

export function AdminList<Row>({
  columns,
  rows,
  getRowId,
  isLoading,
  isFetching,
  isError,
  onRetry,
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  sort,
  onToggleSort,
  page = 1,
  pageCount = 1,
  onPageChange,
  total,
  rangeStart,
  rangeEnd,
  filters,
  toolbarActions,
  selectable,
  bulkActions,
  rowActions,
  rowActionsHeader,
  csvFilename,
  emptyTitle = "Nothing here yet",
  emptyHint,
  caption,
  noun = "results",
}: AdminListProps<Row>) {
  const searchId = useId();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Acting on rows you can't see is a footgun, so selection resets whenever the
  // visible page changes.
  useEffect(() => {
    setSelected(new Set());
  }, [page]);

  const pageIds = rows.map(getRowId);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPageSelected = pageIds.some((id) => selected.has(id));

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const clearSelection = () => setSelected(new Set());

  const colSpan = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);
  const showEmpty = !isLoading && !isError && rows.length === 0;

  const handleExport = () => {
    if (!csvFilename) return;
    const cols = columns.filter((c) => c.csv);
    const headers = cols.map((c) => (typeof c.header === "string" ? c.header : c.id));
    const data = rows.map((r) => cols.map((c) => c.csv!(r) ?? ""));
    downloadCsv(csvFilename, toCsv(headers, data));
  };

  const countLabel =
    total != null && rangeStart != null && rangeEnd != null
      ? total === 0
        ? `No ${noun}`
        : `Showing ${rangeStart}-${rangeEnd} of ${total} ${noun}`
      : `${rows.length} ${noun}`;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {onSearchChange && (
            <div className="relative w-full max-w-xs">
              <Label htmlFor={searchId} className="sr-only">
                {searchPlaceholder}
              </Label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim"
                aria-hidden="true"
              />
              <Input
                id={searchId}
                type="search"
                value={search ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          )}
          {filters}
        </div>
        <div className="flex items-center gap-2">
          {csvFilename && rows.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
              <Download className="h-4 w-4" aria-hidden="true" /> Export CSV
            </Button>
          )}
          {toolbarActions}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectable && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gold-deep bg-raised-2 px-4 py-2.5">
          <span className="text-sm font-medium text-bone">{selected.size} selected</span>
          <div className="flex flex-wrap gap-2">{bulkActions?.(Array.from(selected), clearSelection)}</div>
          <Button variant="ghost" size="sm" onClick={clearSelection} className="ml-auto text-dim hover:text-bone">
            Clear
          </Button>
        </div>
      )}

      {/* Announce result count changes to assistive tech. */}
      <p role="status" aria-live="polite" className="sr-only">
        {isLoading ? "Loading" : countLabel}
      </p>

      <div className={cn("overflow-x-auto rounded-lg border border-line bg-raised", isFetching && "opacity-70")}>
        <Table>
          <caption className="sr-only">{caption}</caption>
          <TableHeader>
            <TableRow className="border-line hover:bg-transparent">
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all rows on this page"
                    disabled={pageIds.length === 0}
                  />
                </TableHead>
              )}
              {columns.map((col) => {
                const active = !!col.sortKey && sort?.column === col.sortKey;
                return (
                  <TableHead
                    key={col.id}
                    className={cn("text-dim", col.headClassName)}
                    aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : col.sortKey ? "none" : undefined}
                  >
                    {col.sortKey && onToggleSort ? (
                      <SortHeader active={active} dir={active ? sort!.dir : null} onClick={() => onToggleSort(col.sortKey!)}>
                        {col.header}
                      </SortHeader>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                );
              })}
              {rowActions && <TableHead className="text-right text-dim">{rowActionsHeader ?? "Actions"}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={`sk-${i}`} className="border-line">
                  {Array.from({ length: colSpan }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full max-w-[12rem]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {isError && (
              <TableRow className="border-line hover:bg-transparent">
                <TableCell colSpan={colSpan} className="py-12 text-center">
                  <AlertTriangle className="mx-auto mb-3 h-7 w-7 text-ember" aria-hidden="true" />
                  <p className="text-sm text-bone-2">Could not load this list.</p>
                  {onRetry && (
                    <Button variant="outline" size="sm" onClick={() => onRetry()} className="mt-3">
                      Retry
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}

            {showEmpty && (
              <TableRow className="border-line hover:bg-transparent">
                <TableCell colSpan={colSpan} className="py-14 text-center">
                  <LkMonogram className="mx-auto mb-3 h-8 w-11 opacity-70" />
                  <p className="font-display text-sm font-semibold uppercase tracking-wide text-bone-2">{emptyTitle}</p>
                  {emptyHint && <p className="mx-auto mt-1 max-w-sm text-sm text-dim">{emptyHint}</p>}
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              rows.map((row) => {
                const id = getRowId(row);
                return (
                  <TableRow key={id} className="border-line" data-state={selected.has(id) ? "selected" : undefined}>
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={selected.has(id)}
                          onCheckedChange={() => toggleRow(id)}
                          aria-label={`Select row ${id}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => {
                      const title = col.truncate && col.csv ? String(col.csv(row) ?? "") : undefined;
                      return (
                        <TableCell key={col.id} className={cn("align-middle", col.cellClassName)}>
                          {col.truncate ? (
                            <span className="block max-w-[22ch] truncate" title={title}>
                              {col.cell(row)}
                            </span>
                          ) : (
                            col.cell(row)
                          )}
                        </TableCell>
                      );
                    })}
                    {rowActions && <TableCell className="text-right">{rowActions(row)}</TableCell>}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {/* Footer: count + pagination */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-dim tabular-nums" aria-hidden="true">
          {countLabel}
        </p>
        {onPageChange && pageCount > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-h-[36px]"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="px-1 text-sm text-dim tabular-nums">
              Page {page} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[36px]"
              onClick={() => onPageChange(Math.min(pageCount, page + 1))}
              disabled={page >= pageCount}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
