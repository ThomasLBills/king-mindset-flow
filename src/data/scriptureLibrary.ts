/**
 * The categorized ESV scripture library. Extracted verbatim from
 * ScriptureTool so the Forge screens and the tool share one source.
 */
export const scriptureCategories = [
  { key: "temptation", title: "Temptation", subtitle: "When the Urge Is Strong." },
  { key: "shame", title: "Shame", subtitle: "When the Enemy Accuses." },
  { key: "anxiety", title: "Anxiety", subtitle: "When Fear Takes Over." },
  { key: "loneliness", title: "Loneliness", subtitle: "When You Feel Alone." },
  { key: "anger", title: "Anger", subtitle: "When Frustration Builds." },
  { key: "identity", title: "Identity", subtitle: "When You Forget Who You Are." },
] as const;

export type ScriptureCategoryKey = (typeof scriptureCategories)[number]["key"];

export const scriptureVerses: Record<ScriptureCategoryKey, { text: string; reference: string }[]> = {
  temptation: [
    { text: "No temptation has overtaken you that is not common to man. God is faithful, and he will not let you be tempted beyond your ability, but with the temptation he will also provide the way of escape, that you may be able to endure it.", reference: "1 Corinthians 10:13" },
    { text: "Submit yourselves therefore to God. Resist the devil, and he will flee from you.", reference: "James 4:7" },
    { text: "For we do not have a high priest who is unable to sympathize with our weaknesses, but one who in every respect has been tempted as we are, yet without sin.", reference: "Hebrews 4:15" },
    { text: "I have stored up your word in my heart, that I might not sin against you.", reference: "Psalm 119:11" },
    { text: "The Lord knows how to rescue the godly from trials.", reference: "2 Peter 2:9" },
  ],
  shame: [
    { text: "There is therefore now no condemnation for those who are in Christ Jesus.", reference: "Romans 8:1" },
    { text: "As far as the east is from the west, so far does he remove our transgressions from us.", reference: "Psalm 103:12" },
    { text: "If we confess our sins, he is faithful and just to forgive us our sins and to cleanse us from all unrighteousness.", reference: "1 John 1:9" },
    { text: "Who shall bring any charge against God's elect? It is God who justifies.", reference: "Romans 8:33" },
    { text: "Fear not, for you will not be ashamed; be not confounded, for you will not be disgraced.", reference: "Isaiah 54:4" },
  ],
  anxiety: [
    { text: "Cast all your anxiety on him because he cares for you.", reference: "1 Peter 5:7" },
    { text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.", reference: "Philippians 4:6-7" },
    { text: "When I am afraid, I put my trust in you.", reference: "Psalm 56:3" },
    { text: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid.", reference: "John 14:27" },
    { text: "For God gave us a spirit not of fear but of power and love and self-control.", reference: "2 Timothy 1:7" },
  ],
  loneliness: [
    { text: "It is the Lord who goes before you. He will be with you; he will not leave you or forsake you. Do not fear or be dismayed.", reference: "Deuteronomy 31:8" },
    { text: "And let us consider how to stir up one another to love and good works, not neglecting to meet together, as is the habit of some, but encouraging one another.", reference: "Hebrews 10:24-25" },
    { text: "Two are better than one, because they have a good reward for their toil. For if they fall, one will lift up his fellow.", reference: "Ecclesiastes 4:9-10" },
    { text: "I will not leave you as orphans; I will come to you.", reference: "John 14:18" },
    { text: "A friend loves at all times, and a brother is born for adversity.", reference: "Proverbs 17:17" },
  ],
  anger: [
    { text: "Know this, my beloved brothers: let every person be quick to hear, slow to speak, slow to anger; for the anger of man does not produce the righteousness of God.", reference: "James 1:19-20" },
    { text: "Refrain from anger, and forsake wrath! Fret not yourself; it tends only to evil.", reference: "Psalm 37:8" },
    { text: "A soft answer turns away wrath, but a harsh word stirs up anger.", reference: "Proverbs 15:1" },
    { text: "Be angry and do not sin; do not let the sun go down on your anger.", reference: "Ephesians 4:26" },
    { text: "The Lord is merciful and gracious, slow to anger and abounding in steadfast love.", reference: "Psalm 103:8" },
  ],
  identity: [
    { text: "Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come.", reference: "2 Corinthians 5:17" },
    { text: "For we are his workmanship, created in Christ Jesus for good works, which God prepared beforehand, that we should walk in them.", reference: "Ephesians 2:10" },
    { text: "See what kind of love the Father has given to us, that we should be called children of God; and so we are.", reference: "1 John 3:1" },
    { text: "I have been crucified with Christ. It is no longer I who live, but Christ who lives in me.", reference: "Galatians 2:20" },
    { text: "But you are a chosen race, a royal priesthood, a holy nation, a people for his own possession, that you may proclaim the excellencies of him who called you out of darkness into his marvelous light.", reference: "1 Peter 2:9" },
  ],
};

/** Verse shape the Forge UI renders. */
export interface Verse {
  ref: string;
  text: string;
}

/**
 * "A verse to fight with" pool for Stand Firm: the library's temptation +
 * identity categories (the two the original tool points the urge-moment at).
 */
export const FIGHTING_VERSES: Verse[] = [...scriptureVerses.temptation, ...scriptureVerses.identity].map(
  (v) => ({ ref: v.reference, text: v.text })
);
