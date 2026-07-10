import { describe, it, expect } from "vitest";
import { parseMessage } from "./messageContent";

describe("parseMessage", () => {
  it("plain text becomes a single text token, no embeds", () => {
    const r = parseMessage("Week 3 reading hit hard this morning.");
    expect(r.embeds).toEqual([]);
    expect(r.tokens).toEqual([{ kind: "text", value: "Week 3 reading hit hard this morning." }]);
  });

  it("extracts a Vimeo link (with unlisted hash) as an embed and drops it from the text", () => {
    const r = parseMessage("6/17/2026 - The War for Your Attention https://vimeo.com/1193792578/9da9936ad4?share=copy&fl=sv");
    expect(r.embeds).toEqual([{ kind: "vimeo", id: "1193792578", hash: "9da9936ad4" }]);
    // The bare URL must not survive as text.
    expect(r.tokens.every((t) => t.kind !== "link")).toBe(true);
    expect(r.tokens.map((t) => (t.kind === "text" ? t.value : "")).join("")).not.toContain("vimeo.com");
    expect(r.tokens.map((t) => (t.kind === "text" ? t.value : "")).join("")).toContain("The War for Your Attention");
  });

  it("extracts a plain Vimeo link with no hash", () => {
    const r = parseMessage("https://vimeo.com/119599269");
    expect(r.embeds).toEqual([{ kind: "vimeo", id: "119599269", hash: undefined }]);
  });

  it("extracts YouTube in watch, youtu.be and shorts forms", () => {
    expect(parseMessage("https://www.youtube.com/watch?v=dQw4w9WgXcQ").embeds).toEqual([
      { kind: "youtube", id: "dQw4w9WgXcQ" },
    ]);
    expect(parseMessage("https://youtu.be/dQw4w9WgXcQ?t=10").embeds).toEqual([
      { kind: "youtube", id: "dQw4w9WgXcQ" },
    ]);
    expect(parseMessage("watch this https://youtube.com/shorts/abcdefghijk now").embeds).toEqual([
      { kind: "youtube", id: "abcdefghijk" },
    ]);
  });

  it("leaves a non-video URL as a clickable link (trailing punctuation excluded)", () => {
    const r = parseMessage("read this: https://example.com/article.");
    expect(r.embeds).toEqual([]);
    const link = r.tokens.find((t) => t.kind === "link");
    expect(link).toEqual({ kind: "link", href: "https://example.com/article", label: "https://example.com/article" });
    // The trailing period stays as text, not part of the href.
    expect(r.tokens.at(-1)).toEqual({ kind: "text", value: "." });
  });

  it("handles empty content", () => {
    expect(parseMessage("")).toEqual({ tokens: [], embeds: [] });
  });
});
