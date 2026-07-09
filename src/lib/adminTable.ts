/**
 * Pure helpers for the shared admin collection kit (useAdminCollection +
 * AdminList). Kept dependency-free and side-effect-free so they are trivially
 * unit-testable; the only browser-touching function is downloadCsv.
 */

/**
 * Sanitize a free-text search term before it is interpolated into a PostgREST
 * `or(...)` filter string. PostgREST treats `,` `(` `)` as structural and
 * `%` `_` `*` `\` as `ilike` wildcards/escapes, so an unsanitized term either
 * breaks the query or lets a user inject wildcard logic. We strip all of them
 * and cap the length - this is the trust-boundary validation for search input.
 */
export function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[,()%_*\\]/g, "").trim().slice(0, 100);
}

/**
 * Build the value for `.or(...)` that matches `term` (case-insensitive
 * substring) against any of `columns`. Returns "" when the term is empty after
 * sanitizing, so callers can skip the filter entirely.
 */
export function buildOrIlike(columns: string[], term: string): string {
  const t = sanitizeSearchTerm(term);
  if (!t || columns.length === 0) return "";
  return columns.map((c) => `${c}.ilike.%${t}%`).join(",");
}

/** RFC-4180-ish CSV cell, hardened against spreadsheet formula injection. */
function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  // Formula injection: a cell that starts with = + - @ (or a control char that
  // some parsers strip to reach one) can execute when opened in Excel/Sheets.
  // Neutralize by prefixing a single quote, the standard mitigation.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serialize a header row + data rows to CSV text (CRLF line endings). */
export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}

/** Trigger a client-side download of CSV text. No-op outside the browser. */
export function downloadCsv(filename: string, csv: string): void {
  if (typeof document === "undefined") return;
  // Prepend a BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
