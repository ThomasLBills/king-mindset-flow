import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGratitude } from "@/hooks/useGratitude";

const systemSans = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

interface GratitudeModalProps {
  onClose: () => void;
}

const GratitudeModal = ({ onClose }: GratitudeModalProps) => {
  const { todayEntry, isLoading, alreadySubmittedToday, submitGratitude } = useGratitude();
  const [entry1, setEntry1] = useState("");
  const [entry2, setEntry2] = useState("");
  const [entry3, setEntry3] = useState("");
  const [showCompletion, setShowCompletion] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const navigate = useNavigate();

  const allFilled = entry1.trim() && entry2.trim() && entry3.trim();

  const handleSubmit = () => {
    if (!allFilled) return;
    submitGratitude.mutate(
      { entry_1: entry1.trim(), entry_2: entry2.trim(), entry_3: entry3.trim() },
      {
        onSuccess: () => {
          setShowCompletion(true);
          setTimeout(() => {
            onClose();
            navigate("/app");
          }, 1500);
        },
      }
    );
  };

  if (showCompletion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="modal-fullscreen dark-card-gradient items-center justify-center"
      >
        <div className="flex flex-col items-center justify-center flex-1 px-8">
          <h2 style={{ fontFamily: systemSans, fontWeight: 600, fontSize: "24px", color: "#F5F3EE", textAlign: "center" }}>
            Gratitude recorded. Eyes trained on grace.
          </h2>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-fullscreen dark-card-gradient"
      style={{ fontFamily: systemSans }}
    >
      {/* Close button */}
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
          <h2 style={{ fontFamily: systemSans, fontWeight: 600, fontSize: "24px", color: "#F5F3EE", letterSpacing: "-0.02em", marginBottom: "8px" }}>
            What Are You Grateful For Today?
          </h2>
          <p style={{ fontSize: "15px", fontWeight: 400, marginBottom: "24px", lineHeight: 1.5 }}>
            <span style={{ color: "hsl(var(--primary))" }}>Gratitude rewires how you see.</span>{" "}
            <span style={{ color: "#F5F3EE" }}>Name three things God has done today.</span>
          </p>

          {isLoading ? (
            <p style={{ color: "rgba(245, 243, 238, 0.5)", fontSize: "14px" }}>Loading...</p>
          ) : alreadySubmittedToday && todayEntry ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }} className="w-full">
                {[todayEntry.entry_1, todayEntry.entry_2, todayEntry.entry_3].map((entry, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#242424",
                      borderRadius: "12px",
                      padding: "18px 16px",
                      fontSize: "15px",
                      color: "#F5F3EE",
                      border: "none",
                    }}
                  >
                    {entry}
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(184, 150, 63, 0.1)", borderRadius: "12px", padding: "16px", border: "none" }}>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--primary))", textAlign: "center" }}>
                  You've already given thanks today. Come back tomorrow.
                </p>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }} className="w-full">
                {[
                  { value: entry1, setter: setEntry1 },
                  { value: entry2, setter: setEntry2 },
                  { value: entry3, setter: setEntry3 },
                ].map((field, i) => (
                  <input
                    key={i}
                    type="text"
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    onFocus={() => setFocusedIdx(i)}
                    onBlur={() => setFocusedIdx(null)}
                    placeholder="I'm grateful for..."
                    style={{
                      width: "100%",
                      background: "#242424",
                      border: "none",
                      borderLeft: focusedIdx === i ? "3px solid hsl(var(--primary))" : "none",
                      borderRadius: focusedIdx === i ? "0 12px 12px 0" : "12px",
                      padding: "18px 16px",
                      fontSize: "15px",
                      fontWeight: 400,
                      fontFamily: systemSans,
                      color: "#F5F3EE",
                      outline: "none",
                      transition: "all 0.15s ease",
                    }}
                    className="placeholder:text-[rgba(245,243,238,0.35)]"
                  />
                ))}
              </div>
              <button
                onClick={handleSubmit}
                disabled={!allFilled || submitGratitude.isPending}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: allFilled ? 600 : 500,
                  fontFamily: systemSans,
                  cursor: allFilled ? "pointer" : "not-allowed",
                  background: allFilled ? "hsl(var(--primary))" : "#242424",
                  color: allFilled ? "#1A1A1A" : "rgba(245, 243, 238, 0.3)",
                  transition: "all 0.2s ease",
                }}
              >
                Complete Gratitude
              </button>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GratitudeModal;
