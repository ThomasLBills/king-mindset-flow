/**
 * Daily check-in engine: the ORIGINAL mechanic's data + derivation rules,
 * extracted so the inline Today card (`CheckInCard`) and the modal
 * (`CheckInDialog`) share one source of truth.
 *
 * Contract (must not drift, see REDESIGN-PARITY-MAP.local.md §1):
 *  - Pick ONE feeling from 16 (4 core + 12 extra behind "show more").
 *  - Selecting a feeling surfaces its matching priority Scripture.
 *  - `needs_support` is AUTO-DERIVED from the feeling, never a manual input.
 */

export type Feeling = { id: string; label: string };
export type Scripture = { text: string; ref: string };

export const CORE_FEELINGS: readonly Feeling[] = [
  { id: "hopeful", label: "Hopeful" },
  { id: "tempted", label: "Tempted" },
  { id: "grateful", label: "Grateful" },
  { id: "anxious", label: "Anxious" },
];

export const EXTRA_FEELINGS: readonly Feeling[] = [
  { id: "calm", label: "Calm" },
  { id: "tired", label: "Tired" },
  { id: "discouraged", label: "Discouraged" },
  { id: "ashamed", label: "Ashamed" },
  { id: "peaceful", label: "Peaceful" },
  { id: "isolated", label: "Isolated" },
  { id: "connected", label: "Connected" },
  { id: "rested", label: "Rested" },
  { id: "overwhelmed", label: "Overwhelmed" },
  { id: "angry", label: "Angry" },
  { id: "lonely", label: "Lonely" },
  { id: "fear", label: "Fear" },
];

export const ALL_FEELINGS: readonly Feeling[] = [...CORE_FEELINGS, ...EXTRA_FEELINGS];

/** Feelings that flag the check-in as needing support (auto-derived). */
export const NEEDS_SUPPORT = ["anxious", "tempted", "isolated", "discouraged", "ashamed"];

/** Auto-derive `needs_support` from the selected feeling, never manual. */
export const needsSupportFor = (feelingId: string): boolean => NEEDS_SUPPORT.includes(feelingId);

/** One cited verse per feeling: the original check-in Scripture engine. */
export const FEELING_SCRIPTURE: Record<string, Scripture> = {
  anxious: {
    text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
    ref: "Philippians 4:6-7",
  },
  ashamed: {
    text: "There is therefore now no condemnation for those who are in Christ Jesus.",
    ref: "Romans 8:1",
  },
  tempted: {
    text: "No temptation has overtaken you that is not common to man. God is faithful, and he will not let you be tempted beyond your ability, but with the temptation he will also provide the way of escape, that you may be able to endure it.",
    ref: "1 Corinthians 10:13",
  },
  isolated: {
    text: "And let us consider how to stir up one another to love and good works, not neglecting to meet together, as is the habit of some, but encouraging one another.",
    ref: "Hebrews 10:24-25",
  },
  discouraged: {
    text: "Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand.",
    ref: "Isaiah 41:10",
  },
  rested: {
    text: "He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.",
    ref: "Psalm 23:2-3",
  },
  calm: {
    text: "You keep him in perfect peace whose mind is stayed on you, because he trusts in you.",
    ref: "Isaiah 26:3",
  },
  connected: {
    text: "For where two or three are gathered in my name, there am I among them.",
    ref: "Matthew 18:20",
  },
  hopeful: {
    text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.",
    ref: "Jeremiah 29:11",
  },
  grateful: {
    text: "Give thanks in all circumstances; for this is the will of God in Christ Jesus for you.",
    ref: "1 Thessalonians 5:18",
  },
  tired: {
    text: "Come to me, all who labor and are heavy laden, and I will give you rest.",
    ref: "Matthew 11:28",
  },
  peaceful: {
    text: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid.",
    ref: "John 14:27",
  },
  angry: {
    text: "Know this, my beloved brothers: let every person be quick to hear, slow to speak, slow to anger; for the anger of man does not produce the righteousness of God.",
    ref: "James 1:19-20",
  },
  overwhelmed: {
    text: "God is our refuge and strength, a very present help in trouble.",
    ref: "Psalm 46:1",
  },
  lonely: {
    text: "God settles the solitary in a home; he leads out the prisoners to prosperity, but the rebellious dwell in a parched land.",
    ref: "Psalm 68:6",
  },
  fear: {
    text: "For God gave us a spirit not of fear but of power and love and self-control.",
    ref: "2 Timothy 1:7",
  },
};

/** Look up the verse for a feeling id (undefined if unmapped). */
export const scriptureFor = (feelingId: string | null | undefined): Scripture | null =>
  feelingId ? FEELING_SCRIPTURE[feelingId] ?? null : null;

/** Human label for a feeling id, falling back to the raw id. */
export const feelingLabel = (feelingId: string): string =>
  ALL_FEELINGS.find((f) => f.id === feelingId)?.label ?? feelingId;

/** Shared option-chip styling for the feeling grid (card + dialog). */
export const feelingChipClass = (selected: boolean): string =>
  [
    "rounded-md border px-3 py-2.5 text-center text-sm font-medium transition-colors",
    selected
      ? "border-gold-deep bg-raised-2 text-gold-bright"
      : "border-line bg-raised text-bone-2 hover:border-gold-deep/50",
  ].join(" ");
