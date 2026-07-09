import { describe, it, expect } from "vitest";
import { sanitizeSearchTerm, buildOrIlike, toCsv } from "@/lib/adminTable";

describe("sanitizeSearchTerm", () => {
  it("strips PostgREST-structural and wildcard chars", () => {
    // Commas/parens would break the or() parser; %/_/*/\ are ilike wildcards.
    expect(sanitizeSearchTerm("a,b(c)%_*\\d")).toBe("abcd");
  });
  it("trims and caps length", () => {
    expect(sanitizeSearchTerm("  hi  ")).toBe("hi");
    expect(sanitizeSearchTerm("x".repeat(200)).length).toBe(100);
  });
});

describe("buildOrIlike", () => {
  it("builds a comma-joined ilike filter over columns", () => {
    expect(buildOrIlike(["email", "name"], "bob")).toBe("email.ilike.%bob%,name.ilike.%bob%");
  });
  it("returns empty when the term sanitizes away, so callers skip the filter", () => {
    expect(buildOrIlike(["email"], "  ,() ")).toBe("");
    expect(buildOrIlike([], "bob")).toBe("");
  });
  it("cannot inject extra or-conditions via commas", () => {
    // "a,role.eq.admin" must not become two conditions.
    expect(buildOrIlike(["email"], "a,role.eq.admin")).toBe("email.ilike.%arole.eq.admin%");
  });
});

describe("toCsv", () => {
  it("quotes cells containing comma, quote, or newline and doubles quotes", () => {
    const csv = toCsv(["a", "b"], [["plain", 'has,comma'], ['has"quote', "line\nbreak"]]);
    expect(csv).toBe('a,b\r\nplain,"has,comma"\r\n"has""quote","line\nbreak"');
  });
  it("renders null/undefined as empty", () => {
    expect(toCsv(["a"], [[null], [undefined]])).toBe("a\r\n\r\n");
  });
});
