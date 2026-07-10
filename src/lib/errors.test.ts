import { describe, it, expect, vi, beforeEach } from "vitest";
import { mapSupabaseError } from "./errors";

describe("mapSupabaseError", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));

  it("maps unique-violation (23505)", () => {
    expect(mapSupabaseError({ code: "23505", message: "duplicate key" })).toMatch(/already exists/i);
  });
  it("maps RLS / insufficient-privilege (42501)", () => {
    expect(mapSupabaseError({ code: "42501", message: "permission denied" })).toMatch(/permission/i);
  });
  it("maps offline / failed fetch", () => {
    expect(mapSupabaseError(new TypeError("Failed to fetch"))).toMatch(/offline|connection/i);
  });
  it("passes through auth error messages", () => {
    expect(
      mapSupabaseError({ name: "AuthApiError", status: 400, message: "Invalid login credentials" }),
    ).toBe("Invalid login credentials");
  });
  it("falls back to a generic message", () => {
    expect(mapSupabaseError({})).toMatch(/something went wrong/i);
  });
  it("always logs the raw error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mapSupabaseError({ code: "23505" });
    expect(spy).toHaveBeenCalled();
  });
});
