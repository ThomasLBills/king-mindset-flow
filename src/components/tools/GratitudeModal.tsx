import { useState } from "react";
import { motion } from "framer-motion";
import { X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useGratitude } from "@/hooks/useGratitude";

interface GratitudeModalProps {
  onClose: () => void;
}

const GratitudeModal = ({ onClose }: GratitudeModalProps) => {
  const { todayEntry, isLoading, alreadySubmittedToday, submitGratitude } = useGratitude();
  const [entry1, setEntry1] = useState("");
  const [entry2, setEntry2] = useState("");
  const [entry3, setEntry3] = useState("");
  const [showCompletion, setShowCompletion] = useState(false);
  const navigate = useNavigate();

  const allFilled = entry1.trim() && entry2.trim() && entry3.trim();

  const handleSubmit = () => {
    if (!allFilled) return;
    submitGratitude.mutate(
      { entry_1: entry1.trim(), entry_2: entry2.trim(), entry_3: entry3.trim() },
      {
        onSuccess: () => {
          setShowCompletion(true);
          setTimeout(() => onClose(), 1500);
        },
      }
    );
  };

  if (showCompletion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="modal-fullscreen bg-[#111111] items-center justify-center"
      >
        <div className="flex flex-col items-center justify-center flex-1 px-8">
          <h2 className="font-serif text-2xl font-bold text-white text-center">
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
      className="modal-fullscreen bg-[#111111]"
    >
      <div className="flex justify-end p-4">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="modal-fullscreen-body">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center w-full max-w-sm"
        >
          <h2 className="font-serif text-2xl font-bold text-white mb-2 text-center">
            What Are You Grateful For Today?
          </h2>
          <p className="text-sm text-white text-center mb-6">
            Gratitude rewires how you see. Name three things God has done today.
          </p>

          {isLoading ? (
            <p className="text-white/50 text-sm">Loading...</p>
          ) : alreadySubmittedToday && todayEntry ? (
            <>
              <div className="space-y-3 w-full mb-6">
                {[todayEntry.entry_1, todayEntry.entry_2, todayEntry.entry_3].map((entry, i) => (
                  <div
                    key={i}
                    className="w-full bg-white/5 border border-primary/20 rounded-xl p-4 text-sm text-white"
                  >
                    {entry}
                  </div>
                ))}
              </div>
              <div className="bg-white/5 border border-primary/20 rounded-xl p-4 w-full text-center">
                <p className="text-sm text-primary font-medium">
                  You've already given thanks today. Come back tomorrow.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3 w-full mb-6">
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
                    placeholder="I'm grateful for..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                ))}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!allFilled || submitGratitude.isPending}
                className={`w-full rounded-xl font-bold h-12 text-base transition-colors ${
                  allFilled
                    ? "bg-primary text-[#0A0A0A] hover:bg-primary/90"
                    : "bg-[#1C1C1E] border border-primary/30 text-white/50 cursor-not-allowed"
                }`}
              >
                Complete Gratitude
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GratitudeModal;
