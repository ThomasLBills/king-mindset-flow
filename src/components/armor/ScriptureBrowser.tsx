/**
 * "Scripture — The Sword of the Spirit". Category list → verse carousel.
 * Read-only content browser; logs no evidence (matches the original tool).
 * Data comes from the shared scriptureLibrary (extracted verbatim from the
 * original ScriptureTool).
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/forge/atoms";
import { BackTo } from "./frame";
import {
  scriptureCategories,
  scriptureVerses,
  type ScriptureCategoryKey,
} from "@/data/scriptureLibrary";

const ESV = "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.";

export const ScriptureBrowser = ({ onBack }: { onBack: () => void }) => {
  const [cat, setCat] = useState<ScriptureCategoryKey | null>(null);
  const [i, setI] = useState(0);

  if (!cat) {
    return (
      <>
        <Eyebrow tone="gold" className="mb-2">
          The Sword of the Spirit
        </Eyebrow>
        <h1 className="font-display text-3xl font-bold tracking-tight text-bone">Scripture</h1>
        <p className="mb-6 mt-2 text-sm text-bone-2">
          Choose what you're facing. God's Word meets you here.
        </p>
        <div className="flex w-full flex-col gap-2">
          {scriptureCategories.map((c) => (
            <button
              key={c.key}
              onClick={() => {
                setCat(c.key);
                setI(0);
              }}
              className="rounded-lg border border-line bg-raised px-4 py-3 text-left transition-colors hover:border-gold-deep hover:bg-raised-2"
            >
              <b className="block text-[15px] font-semibold text-bone">{c.title}</b>
              <span className="text-xs text-bone-2">{c.subtitle}</span>
            </button>
          ))}
        </div>
        <p className="mt-6 text-[10px] leading-relaxed text-dim">{ESV}</p>
        <BackTo onClick={onBack} label="Back to Your Armor" />
      </>
    );
  }

  const verses = scriptureVerses[cat];
  const v = verses[i];
  const category = scriptureCategories.find((c) => c.key === cat)!;
  const last = i >= verses.length - 1;

  return (
    <>
      <Eyebrow tone="gold" className="mb-2">
        {category.title}
      </Eyebrow>
      <p className="mb-4 text-xs text-dim">
        {i + 1} of {verses.length}
      </p>
      <blockquote>
        <p className="font-serif text-2xl italic leading-relaxed text-bone">“{v.text}”</p>
        <footer className="mt-4">
          <Eyebrow tone="gold">{v.reference}</Eyebrow>
        </footer>
      </blockquote>
      <Button
        className="mt-8 w-full"
        size="lg"
        onClick={() => (last ? setCat(null) : setI((n) => n + 1))}
      >
        {last ? "Done" : "Next"}
      </Button>
      <p className="mt-6 text-[10px] leading-relaxed text-dim">{ESV}</p>
      <BackTo onClick={() => setCat(null)} label="All categories" />
    </>
  );
};
