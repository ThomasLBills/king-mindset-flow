import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft } from "lucide-react";
import {
  scriptureCategories as categories,
  scriptureVerses as verses,
  type ScriptureCategoryKey as CategoryKey,
} from "@/data/scriptureLibrary";

const systemSans = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

interface ScriptureToolProps {
  onClose: () => void;
}

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
