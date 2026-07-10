/**
 * Daily verses for the Forge UI, sourced the same way the production app
 * sources them: the faithContent constants rotated per-day by useDailyContent
 * (same "scripture" storage key, so the verse of the day matches the
 * original Rhythms scripture).
 */
import { scriptures } from "@/data/faithContent";
import { useDailyContent } from "@/hooks/useDailyContent";
import type { Verse } from "@/data/scriptureLibrary";

const toVerse = (s: { reference: string; text: string } | undefined): Verse | undefined =>
  s ? { ref: s.reference, text: s.text } : undefined;

export const useVerseOfDay = (): { data: Verse | undefined; isLoading: boolean } => {
  const { todayContent, isLoading } = useDailyContent({ key: "scripture", items: scriptures });
  return { data: toVerse(todayContent), isLoading };
};

export const useSideVerse = (): { data: Verse | undefined; isLoading: boolean } => {
  const { todayContent, isLoading } = useDailyContent({ key: "side-verse", items: scriptures });
  return { data: toVerse(todayContent), isLoading };
};
