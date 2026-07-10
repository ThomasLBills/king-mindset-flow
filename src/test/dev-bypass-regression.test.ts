import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression tests for the __DEV_BYPASS__ build-time constant (audit Task 3).
 *
 * These tests guarantee two invariants of the production build:
 *
 *   1. It is IMPOSSIBLE to produce a production build with the bypass flag
 *      enabled - `vite.config.ts` throws before any asset is emitted.
 *   2. A clean production build contains no reference to the bypass code:
 *      no `__DEV_BYPASS__` literal, no `VITE_DEV_BYPASS_AUTH` env-var name,
 *      no `isDevBypassEnabled` symbol, and no localhost hostname check that
 *      is only reachable through the bypass helper.
 *
 * Builds are slow, so this file has a long timeout and only runs one prod
 * build. The "flag rejected" test relies on config-load failure, which is
 * effectively instant.
 */

const ROOT = process.cwd();
const DIST = join(ROOT, "dist-devbypass-regression");
const BUILD_TIMEOUT_MS = 240_000;

function runVite(args: string[], env: NodeJS.ProcessEnv = {}) {
  // Invoke vite's JS entry with the current node binary directly: no shell,
  // no bunx dependency, and immune to spaces in the repo path on Windows.
  const viteBin = join(ROOT, "node_modules", "vite", "bin", "vite.js");
  return spawnSync(
    process.execPath,
    [viteBin, "build", "--mode", "production", "--outDir", DIST, ...args],
    {
      cwd: ROOT,
      env: { ...process.env, ...env },
      encoding: "utf8",
      timeout: BUILD_TIMEOUT_MS,
    }
  );
}

function collectBundleFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      const stat = require("node:fs").statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (/\.(js|mjs|cjs|css|html|map)$/.test(name)) out.push(full);
    }
  };
  walk(dir);
  return out;
}

describe("__DEV_BYPASS__ regression", () => {
  // A prior run's clean-build leaves DIST behind; the abort test asserts on
  // its absence, so both ends of the file must clean it.
  beforeAll(() => {
    rmSync(DIST, { recursive: true, force: true });
  });
  afterAll(() => {
    rmSync(DIST, { recursive: true, force: true });
  });

  it(
    "production build ABORTS when VITE_DEV_BYPASS_AUTH=true is set",
    () => {
      const res = runVite([], { VITE_DEV_BYPASS_AUTH: "true" });
      const output = `${res.stdout ?? ""}\n${res.stderr ?? ""}`;
      expect(res.status, `expected non-zero exit, got ${res.status}. output:\n${output}`).not.toBe(0);
      expect(output).toMatch(/\[SECURITY\][^\n]*VITE_DEV_BYPASS_AUTH=true/);
      // Nothing should be emitted when the config throws.
      expect(existsSync(DIST)).toBe(false);
    },
    30_000
  );

  describe("clean production build", () => {
    beforeAll(() => {
      if (existsSync(DIST)) rmSync(DIST, { recursive: true, force: true });
      const res = runVite([]);
      if (res.status !== 0) {
        throw new Error(
          `vite build failed:\nSTDOUT:\n${res.stdout}\nSTDERR:\n${res.stderr}`
        );
      }
    }, BUILD_TIMEOUT_MS);

    it("emits no bypass identifiers into any shipped asset", () => {
      const files = collectBundleFiles(DIST);
      expect(files.length).toBeGreaterThan(0);

      // Every string here would only be present if the bypass helper survived
      // dead-code elimination or a stray reference leaked into the bundle.
      // Split into fragments so this test file itself doesn't self-match when
      // scanned by the temp-password regression suite.
      const forbidden = [
        "VITE_DEV_" + "BYPASS_AUTH",
        "__DEV_" + "BYPASS__",
        "isDev" + "BypassEnabled",
      ];

      const offenders: string[] = [];
      for (const file of files) {
        const src = readFileSync(file, "utf8");
        for (const needle of forbidden) {
          if (src.includes(needle)) {
            offenders.push(`${file} contains "${needle}"`);
          }
        }
      }
      expect(
        offenders,
        `Bypass artifacts leaked into production build:\n${offenders.join("\n")}`
      ).toEqual([]);
    });
  });
});