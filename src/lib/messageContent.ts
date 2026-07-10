/**
 * Turns a raw chat message string into renderable pieces:
 *  - `embeds`: Vimeo / YouTube videos to show as inline players
 *  - `tokens`: the remaining text, with plain URLs split out as clickable links
 *
 * Video URLs are pulled OUT of the text (so a pasted link renders as a player,
 * not a raw string) while every other URL stays inline as a link. Safe by
 * construction: callers render tokens as React children and build embed URLs
 * only from the extracted video id, never from raw user input via innerHTML.
 */

export type MessageEmbed =
  | { kind: "vimeo"; id: string; hash?: string }
  | { kind: "youtube"; id: string };

export type MessageToken =
  | { kind: "text"; value: string }
  | { kind: "link"; href: string; label: string };

export interface ParsedMessage {
  tokens: MessageToken[];
  embeds: MessageEmbed[];
}

// vimeo.com/<id>[/<hash>][?query]  (hash is the unlisted-video token)
const VIMEO_RE = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)(?:\/([0-9a-zA-Z]+))?(?:\?\S*)?/gi;
// youtube.com/watch?v=<id> | youtu.be/<id> | /embed/<id> | /shorts/<id>  (ids are 11 chars)
const YOUTUBE_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})(?:[?&]\S*)?/gi;
// Any leftover http(s) URL, for linkifying non-video text.
const URL_RE = /https?:\/\/[^\s<]+/gi;

export function parseMessage(content: string): ParsedMessage {
  const src = content ?? "";

  // 1. Collect video matches with their positions so we can both embed them
  //    and cut them out of the text.
  const videos: { start: number; end: number; embed: MessageEmbed }[] = [];
  for (const m of src.matchAll(VIMEO_RE)) {
    videos.push({
      start: m.index ?? 0,
      end: (m.index ?? 0) + m[0].length,
      embed: { kind: "vimeo", id: m[1], hash: m[2] || undefined },
    });
  }
  for (const m of src.matchAll(YOUTUBE_RE)) {
    videos.push({
      start: m.index ?? 0,
      end: (m.index ?? 0) + m[0].length,
      embed: { kind: "youtube", id: m[1] },
    });
  }
  videos.sort((a, b) => a.start - b.start);

  // Drop any overlapping match (defensive: vimeo/youtube can't overlap in practice).
  const kept: typeof videos = [];
  let lastEnd = -1;
  for (const v of videos) {
    if (v.start >= lastEnd) {
      kept.push(v);
      lastEnd = v.end;
    }
  }
  const embeds = kept.map((v) => v.embed);

  // 2. Rebuild the text without the video URLs.
  let text = "";
  let cursor = 0;
  for (const v of kept) {
    text += src.slice(cursor, v.start);
    cursor = v.end;
  }
  text += src.slice(cursor);
  text = text.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  // 3. Split the remaining text into text + link tokens.
  const tokens: MessageToken[] = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) tokens.push({ kind: "text", value: text.slice(last, idx) });
    // Trailing punctuation usually belongs to the sentence, not the URL.
    let href = m[0];
    const trail = href.match(/[),.!?;:]+$/);
    const trailing = trail ? trail[0] : "";
    if (trailing) href = href.slice(0, -trailing.length);
    tokens.push({ kind: "link", href, label: href });
    if (trailing) tokens.push({ kind: "text", value: trailing });
    last = idx + m[0].length;
  }
  if (last < text.length) tokens.push({ kind: "text", value: text.slice(last) });

  return { tokens, embeds };
}
