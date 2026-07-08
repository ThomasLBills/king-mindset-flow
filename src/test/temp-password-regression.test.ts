import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression tests for the temp_password remediation (audit Task 1).
 *
 * These tests guard against re-introducing the plaintext-password leak by:
 *   1. Statically scanning the repo for any code path that would write
 *      `temp_password` back onto the `profiles` table.
 *   2. Statically scanning for any code that inserts `temp_password` into
 *      the admin audit log payloads (before_json / after_json).
 *
 * The column itself has been dropped from the database, so a live insert
 * would fail — but we still fail fast at CI time to keep the pattern out
 * of the codebase entirely.
 */

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "supabase/functions"];
const IGNORE_DIRS = new Set(["node_modules", "dist", ".git", "build"]);
const CODE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

// This test file itself contains the forbidden strings; skip it.
const SELF = __filename;

function walk(dir: string, acc: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    if (IGNORE_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (CODE_EXT.test(name) && full !== SELF) acc.push(full);
  }
  return acc;
}

const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));

describe("temp_password regression guards", () => {
  it("scans a non-empty set of source files", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("no source file writes `temp_password` onto profiles", () => {
    // Match assignment-style occurrences: `temp_password:` in object literals
    // (Supabase .update/.insert/.upsert payloads) or `.temp_password =` writes.
    const writePattern = /temp_password\s*[:=]/;
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      if (writePattern.test(src)) offenders.push(file);
    }
    expect(
      offenders,
      `Found code that assigns to temp_password:\n${offenders.join("\n")}`
    ).toEqual([]);
  });

  it("no source file references the `temp_password` column at all", () => {
    // Even reads are forbidden — the column is dropped, and any lingering
    // .select("temp_password") / raw SQL reference is dead code we should catch.
    const anyPattern = /temp_password/;
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      if (anyPattern.test(src)) offenders.push(file);
    }
    expect(
      offenders,
      `Found stale references to temp_password:\n${offenders.join("\n")}`
    ).toEqual([]);
  });

  it("no admin audit log payload embeds a temp_password field", () => {
    // Guard against future audit-log code accidentally spreading a profile
    // row (which historically included temp_password) into before/after JSON.
    const auditPattern =
      /(before_json|after_json)[\s\S]{0,400}temp_password/;
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      if (auditPattern.test(src)) offenders.push(file);
    }
    expect(
      offenders,
      `Found audit log payloads referencing temp_password:\n${offenders.join(
        "\n"
      )}`
    ).toEqual([]);
  });
});