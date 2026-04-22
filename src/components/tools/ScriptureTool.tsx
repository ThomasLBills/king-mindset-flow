import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft } from "lucide-react";

const systemSans = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

interface ScriptureToolProps {
  onClose: () => void;
}

const categories = [
  { key: "temptation", title: "Temptation", subtitle: "When the urge is strong" },
  { key: "shame", title: "Shame", subtitle: "When the enemy accuses" },
  { key: "anxiety", title: "Anxiety", subtitle: "When fear takes over" },
  { key: "loneliness", title: "Loneliness", subtitle: "When you feel alone" },
  { key: "anger", title: "Anger", subtitle: "When frustration builds" },
  { key: "identity", title: "Identity", subtitle: "When you forget who you are" },
] as const;

type CategoryKey = (typeof categories)[number]["key"];

const verses: Record<CategoryKey, { text: string; reference: string }[]> = {
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

const ScriptureTool = ({ onClose }: ScriptureToolProps) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [verseIndex, setVerseIndex] = useState(0);

  const handleCategorySelect = (key: CategoryKey) => {
    setSelectedCategory(key);
    setVerseIndex(0);
  };

  const handleNext = () => {
    if (!selectedCategory) return;
    const total = verses[selectedCategory].length;
    if (verseIndex >= total - 1) {
      setSelectedCategory(null);
      setVerseIndex(0);
    } else {
      setVerseIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setVerseIndex(0);
  };

  // Verse view
  if (selectedCategory) {
    const categoryVerses = verses[selectedCategory];
    const current = categoryVerses[verseIndex];
    const total = categoryVerses.length;
    const isLast = verseIndex === total - 1;
    const categoryTitle = categories.find((c) => c.key === selectedCategory)?.title;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-fullscreen dark-card-gradient"
        style={{ fontFamily: systemSans }}
      >
        <div className="flex justify-between items-center" style={{ padding: "20px 20px 0 20px" }}>
          <button onClick={handleBack} className="transition-opacity hover:opacity-70" style={{ background: "none", border: "none", padding: 0 }}>
            <ChevronLeft className="w-6 h-6" style={{ color: "rgba(245, 243, 238, 0.5)" }} />
          </button>
          <button onClick={onClose} className="transition-opacity hover:opacity-70" style={{ background: "none", border: "none", padding: 0 }}>
            <X className="w-6 h-6" style={{ color: "rgba(245, 243, 238, 0.5)" }} />
          </button>
        </div>

        <div className="modal-fullscreen-body">
          <motion.div
            key={verseIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col w-full max-w-sm"
          >
            <h2 style={{ fontWeight: 600, fontSize: "24px", color: "#F5F3EE", letterSpacing: "-0.02em", marginBottom: "4px" }}>
              {categoryTitle}
            </h2>
            <p style={{ fontSize: "13px", color: "rgba(245, 243, 238, 0.5)", marginBottom: "32px", textAlign: "left" }}>
              {verseIndex + 1} of {total}
            </p>

            <div style={{ borderLeft: "3px solid hsl(var(--primary))", paddingLeft: "16px", marginBottom: "40px" }}>
              <p style={{ fontSize: "20px", fontWeight: 600, color: "#F5F3EE", lineHeight: 1.45 }}>
                {current.text}
              </p>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--primary))", marginTop: "14px" }}>
                {current.reference}
              </p>
            </div>

            <button
              onClick={handleNext}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "12px",
                border: "none",
                fontSize: "15px",
                fontWeight: 600,
                fontFamily: systemSans,
                cursor: "pointer",
                background: "hsl(var(--primary))",
                color: "#1A1A1A",
              }}
            >
              {isLast ? "Done" : "Next"}
            </button>
          </motion.div>
        </div>

        <p style={{ textAlign: "center", fontSize: "11px", color: "rgba(245, 243, 238, 0.25)", padding: "0 20px 20px" }}>
          Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.
        </p>
      </motion.div>
    );
  }

  // Category selection view
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-fullscreen dark-card-gradient"
      style={{ fontFamily: systemSans }}
    >
      <div className="flex justify-end" style={{ padding: "20px 20px 0 20px" }}>
        <button onClick={onClose} className="transition-opacity hover:opacity-70" style={{ background: "none", border: "none", padding: 0 }}>
          <X className="w-6 h-6" style={{ color: "rgba(245, 243, 238, 0.5)" }} />
        </button>
      </div>

      <div className="modal-fullscreen-body">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col w-full max-w-sm"
        >
          <h2 style={{ fontWeight: 600, fontSize: "24px", color: "#F5F3EE", letterSpacing: "-0.02em", marginBottom: "4px" }}>
            Scripture
          </h2>
          <p style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--primary))", marginBottom: "12px" }}>
            The Sword of the Spirit
          </p>
          <p style={{ fontSize: "15px", color: "#F5F3EE", marginBottom: "24px", lineHeight: 1.5 }}>
            Choose what you're facing. God's Word meets you here.
          </p>

          <div className="flex flex-col" style={{ gap: "8px" }}>
            {categories.map((cat) => (
              <motion.button
                key={cat.key}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCategorySelect(cat.key)}
                style={{
                  background: "#242424",
                  border: "none",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                <span style={{ fontSize: "16px", fontWeight: 600, color: "#F5F3EE" }}>{cat.title}</span>
                <span style={{ fontSize: "13px", color: "hsl(var(--primary))" }}>{cat.subtitle}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      <p style={{ textAlign: "center", fontSize: "11px", color: "rgba(245, 243, 238, 0.25)", padding: "0 20px 20px" }}>
        Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.
      </p>
    </motion.div>
  );
};

export default ScriptureTool;
