import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";
import { useDeclarations } from "@/hooks/useDeclarations";

const systemSans = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const declarations = [
  { text: "I am a child of God, and He loves me unconditionally.", reference: "John 1:12, Romans 8:38-39" },
  { text: "I have been redeemed and forgiven of my sins through the sacrifice of Jesus on the cross.", reference: "Ephesians 1:7" },
  { text: "I am a new creation in Christ, and my old self has passed away.", reference: "2 Corinthians 5:17" },
  { text: "I have been given a spirit of power, love, and self-discipline, not fear.", reference: "2 Timothy 1:7" },
  { text: "I am free in Christ. The chains are broken.", reference: "Galatians 5:1" },
  { text: "I am being transformed by the renewing of my mind.", reference: "Romans 12:2" },
];

// ========== Toggle Component ==========
const ModeToggle = ({ mode, onChange }: { mode: "gods-word" | "my-declarations"; onChange: (m: "gods-word" | "my-declarations") => void }) => (
  <div style={{ background: "#242424", borderRadius: "10px", padding: "3px", display: "flex", marginBottom: "20px" }}>
    {([["gods-word", "God's Word"], ["my-declarations", "My Declarations"]] as const).map(([key, label]) => (
      <button
        key={key}
        onClick={() => onChange(key)}
        style={{
          flex: 1,
          padding: "8px 0",
          borderRadius: "8px",
          border: "none",
          fontSize: "14px",
          fontWeight: mode === key ? 500 : 400,
          fontFamily: systemSans,
          background: mode === key ? "#1A1A1A" : "transparent",
          color: mode === key ? "#F5F3EE" : "rgba(245, 243, 238, 0.4)",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        {label}
      </button>
    ))}
  </div>
);

// ========== Write/Edit Declaration Screen ==========
const WriteDeclarationScreen = ({
  onClose,
  onSave,
  initialText = "",
  isEdit = false,
  saving = false,
}: {
  onClose: () => void;
  onSave: (text: string) => void;
  initialText?: string;
  isEdit?: boolean;
  saving?: boolean;
}) => {
  const [text, setText] = useState(initialText);
  const [focused, setFocused] = useState(false);
  const filled = text.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[55] bg-[#111111] flex flex-col"
      style={{ fontFamily: systemSans }}
    >
      <div className="flex justify-end" style={{ padding: "20px 20px 0 20px" }}>
        <button onClick={onClose} className="transition-opacity hover:opacity-70" style={{ background: "none", border: "none", padding: 0 }}>
          <X className="w-6 h-6" style={{ color: "rgba(245, 243, 238, 0.5)" }} />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="flex flex-col w-full max-w-sm">
          <h2 style={{ fontWeight: 600, fontSize: "24px", color: "#F5F3EE", letterSpacing: "-0.02em", marginBottom: "4px" }}>
            {isEdit ? "Edit Your Declaration" : "Write Your Declaration"}
          </h2>
          <p style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--primary))", marginBottom: "20px" }}>
            Speak who God says you are
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="I am..."
            rows={4}
            style={{
              width: "100%",
              background: "#242424",
              border: "none",
              borderLeft: focused ? "3px solid hsl(var(--primary))" : "none",
              borderRadius: focused ? "0 12px 12px 0" : "12px",
              padding: "18px 16px",
              fontSize: "18px",
              fontWeight: 400,
              fontFamily: systemSans,
              color: "#F5F3EE",
              outline: "none",
              resize: "none",
              minHeight: "120px",
              transition: "all 0.15s ease",
            }}
            className="placeholder:text-[rgba(245,243,238,0.3)]"
          />
          <button
            onClick={() => filled && onSave(text.trim())}
            disabled={!filled || saving}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              fontSize: "15px",
              fontWeight: filled ? 600 : 500,
              fontFamily: systemSans,
              cursor: filled ? "pointer" : "not-allowed",
              background: filled ? "hsl(var(--primary))" : "#242424",
              color: filled ? "#1A1A1A" : "rgba(245, 243, 238, 0.3)",
              marginTop: "16px",
              transition: "all 0.2s ease",
            }}
          >
            {saving ? "Saving..." : isEdit ? "Update Declaration" : "Save Declaration"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ========== Delete Confirmation ==========
const DeleteConfirmation = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 z-[55] bg-[#111111]/95 flex items-center justify-center px-6"
    style={{ fontFamily: systemSans }}
  >
    <div className="flex flex-col w-full max-w-sm items-center">
      <p style={{ fontSize: "18px", fontWeight: 600, color: "#F5F3EE", marginBottom: "24px", textAlign: "center" }}>
        Remove this declaration?
      </p>
      <div className="flex gap-3 w-full">
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: "14px", borderRadius: "12px", border: "none",
            background: "#242424", color: "rgba(245, 243, 238, 0.5)",
            fontSize: "15px", fontWeight: 500, fontFamily: systemSans, cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 1, padding: "14px", borderRadius: "12px", border: "none",
            background: "hsl(var(--primary))", color: "#1A1A1A",
            fontSize: "15px", fontWeight: 600, fontFamily: systemSans, cursor: "pointer",
          }}
        >
          Remove
        </button>
      </div>
    </div>
  </motion.div>
);

// ========== Gods Word View (existing) ==========
const GodsWordView = ({ onClose }: { onClose: () => void }) => {
  const [showCompletion, setShowCompletion] = useState(false);
  const [holding, setHolding] = useState(false);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addEvidence } = useEvidenceCounter();
  const navigate = useNavigate();

  const selectedDeclaration = useMemo(
    () => declarations[Math.floor(Math.random() * declarations.length)],
    []
  );

  const handleBelieve = useCallback(() => {
    addEvidence.mutate("declaration");
    setShowCompletion(true);
    setTimeout(() => {
      onClose();
      navigate("/app");
    }, 1500);
  }, [addEvidence, onClose, navigate]);

  const startHold = useCallback(() => {
    if (completed) return;
    setHolding(true);
    timerRef.current = setTimeout(() => {
      setHolding(false);
      setCompleted(true);
      if (navigator.vibrate) navigator.vibrate(50);
      handleBelieve();
    }, 2000);
  }, [completed, handleBelieve]);

  const cancelHold = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (!completed) setHolding(false);
  }, [completed]);

  if (showCompletion) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-8">
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ fontFamily: systemSans, fontWeight: 600, fontSize: "24px", color: "#F5F3EE", textAlign: "center", marginBottom: "12px" }}>
          Truth declared.
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ color: "#F5F3EE", fontSize: "16px", textAlign: "center" }}>
          You are building evidence.
        </motion.p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-sm">
      <p style={{ fontSize: "15px", fontWeight: 400, color: "#F5F3EE", marginBottom: "24px", lineHeight: 1.5 }}>
        Speak this over yourself:
      </p>
      <div style={{ borderLeft: "3px solid hsl(var(--primary))", paddingLeft: "20px", marginBottom: "24px" }}>
        <p style={{ fontSize: "22px", fontWeight: 600, color: "#F5F3EE", lineHeight: 1.4 }}>
          {selectedDeclaration.text}
        </p>
        <p style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--primary))", marginTop: "12px" }}>
          {selectedDeclaration.reference}
        </p>
      </div>
      <p style={{ fontSize: "14px", fontWeight: 400, color: "#F5F3EE", marginBottom: "28px", lineHeight: 1.5 }}>
        Say it out loud. Let your ears hear what your mouth declares.{" "}
        <span style={{ color: "hsl(var(--primary))" }}>Your brain rewires when you speak truth.</span>
      </p>
      <button
        onMouseDown={startHold} onMouseUp={cancelHold} onMouseLeave={cancelHold}
        onTouchStart={startHold} onTouchEnd={cancelHold} onTouchCancel={cancelHold}
        style={{
          position: "relative", width: "100%", padding: "16px", borderRadius: "12px", border: "none",
          fontSize: "15px", fontWeight: 600, fontFamily: systemSans, cursor: "pointer",
          background: completed ? "#B8963F" : "#F5F3EE", color: "#1A1A1A",
          overflow: "hidden", outline: "none", WebkitUserSelect: "none", userSelect: "none",
        }}
      >
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: "12px",
          background: "#B8963F", width: holding ? "100%" : "0%",
          transition: holding ? "width 2s linear" : "none",
        }} />
        <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          {completed ? <><Check className="w-4 h-4" /> Declared</> : "Hold to Declare"}
        </span>
      </button>
    </div>
  );
};

// ========== My Declarations View ==========
const MyDeclarationsView = ({ onClose }: { onClose: () => void }) => {
  const { declarations: myDeclarations, isLoading, addDeclaration, updateDeclaration, deleteDeclaration } = useDeclarations();
  const { addEvidence } = useEvidenceCounter();
  const navigate = useNavigate();

  const [index, setIndex] = useState(0);
  const [showWrite, setShowWrite] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [holding, setHolding] = useState(false);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = myDeclarations.length;
  const current = myDeclarations[index] || null;

  const handleBelieve = useCallback(() => {
    addEvidence.mutate("declaration");
    setShowCompletion(true);
    setTimeout(() => {
      onClose();
      navigate("/app");
    }, 1500);
  }, [addEvidence, onClose, navigate]);

  const startHold = useCallback(() => {
    if (completed || !current) return;
    setHolding(true);
    timerRef.current = setTimeout(() => {
      setHolding(false);
      setCompleted(true);
      if (navigator.vibrate) navigator.vibrate(50);
      handleBelieve();
    }, 2000);
  }, [completed, current, handleBelieve]);

  const cancelHold = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (!completed) setHolding(false);
  }, [completed]);

  const handleNext = () => {
    if (count > 0) setIndex((i) => (i + 1) % count);
  };

  const handleSave = (text: string) => {
    if (editingId) {
      updateDeclaration.mutate({ id: editingId, text }, {
        onSuccess: () => { setEditingId(null); setShowWrite(false); },
      });
    } else {
      addDeclaration.mutate(text, {
        onSuccess: () => { setShowWrite(false); },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!current) return;
    deleteDeclaration.mutate(current.id, {
      onSuccess: () => {
        setShowDelete(false);
        if (index >= count - 1 && index > 0) setIndex(index - 1);
      },
    });
  };

  if (showCompletion) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-8">
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ fontFamily: systemSans, fontWeight: 600, fontSize: "24px", color: "#F5F3EE", textAlign: "center", marginBottom: "12px" }}>
          Truth declared.
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ color: "#F5F3EE", fontSize: "16px", textAlign: "center" }}>
          You are building evidence.
        </motion.p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <p style={{ color: "rgba(245, 243, 238, 0.5)", fontSize: "14px" }}>Loading...</p>
      </div>
    );
  }

  // Empty state
  if (count === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-4">
        <p style={{ fontSize: "16px", fontWeight: 500, color: "#F5F3EE", textAlign: "center", marginBottom: "8px" }}>
          You haven't written any declarations yet.
        </p>
        <p style={{ fontSize: "14px", color: "rgba(245, 243, 238, 0.5)", textAlign: "center", marginBottom: "20px" }}>
          Write what God has spoken over you. Declare it daily.
        </p>
        <button
          onClick={() => { setEditingId(null); setShowWrite(true); }}
          style={{ background: "none", border: "none", color: "hsl(var(--primary))", fontSize: "14px", fontWeight: 500, fontFamily: systemSans, cursor: "pointer" }}
        >
          + Write your first declaration
        </button>
        <AnimatePresence>
          {showWrite && (
            <WriteDeclarationScreen
              onClose={() => setShowWrite(false)}
              onSave={handleSave}
              saving={addDeclaration.isPending}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-sm relative">
      {/* Edit/Delete icons */}
      <div className="flex gap-3 justify-end mb-2">
        <button
          onClick={() => { setEditingId(current!.id); setShowWrite(true); }}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          <Pencil className="w-4 h-4" style={{ color: "rgba(245, 243, 238, 0.3)" }} />
        </button>
        <button
          onClick={() => setShowDelete(true)}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          <Trash2 className="w-4 h-4" style={{ color: "rgba(245, 243, 238, 0.3)" }} />
        </button>
      </div>

      {/* Indicator */}
      <p style={{ fontSize: "13px", color: "rgba(245, 243, 238, 0.4)", marginBottom: "16px" }}>
        {index + 1} of {count}
      </p>

      {/* Declaration */}
      <motion.div
        key={current!.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        style={{ borderLeft: "3px solid hsl(var(--primary))", paddingLeft: "16px", marginBottom: "28px" }}
      >
        <p style={{ fontSize: "22px", fontWeight: 600, color: "#F5F3EE", lineHeight: 1.4 }}>
          {current!.declaration_text}
        </p>
      </motion.div>

      {/* Next button (if more than 1) */}
      {count > 1 && (
        <button
          onClick={handleNext}
          style={{
            background: "none", border: "1px solid rgba(245, 243, 238, 0.15)",
            borderRadius: "12px", padding: "12px", color: "#F5F3EE",
            fontSize: "14px", fontWeight: 500, fontFamily: systemSans,
            cursor: "pointer", marginBottom: "12px",
          }}
        >
          Next
        </button>
      )}

      {/* Hold to Declare */}
      <button
        onMouseDown={startHold} onMouseUp={cancelHold} onMouseLeave={cancelHold}
        onTouchStart={startHold} onTouchEnd={cancelHold} onTouchCancel={cancelHold}
        style={{
          position: "relative", width: "100%", padding: "16px", borderRadius: "12px", border: "none",
          fontSize: "15px", fontWeight: 600, fontFamily: systemSans, cursor: "pointer",
          background: completed ? "#B8963F" : "#F5F3EE", color: "#1A1A1A",
          overflow: "hidden", outline: "none", WebkitUserSelect: "none", userSelect: "none",
          marginBottom: "16px",
        }}
      >
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: "12px",
          background: "#B8963F", width: holding ? "100%" : "0%",
          transition: holding ? "width 2s linear" : "none",
        }} />
        <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          {completed ? <><Check className="w-4 h-4" /> Declared</> : "Hold to Declare"}
        </span>
      </button>

      {/* Add more */}
      {count < 5 ? (
        <button
          onClick={() => { setEditingId(null); setShowWrite(true); }}
          style={{ background: "none", border: "none", color: "hsl(var(--primary))", fontSize: "14px", fontWeight: 500, fontFamily: systemSans, cursor: "pointer" }}
        >
          + Write a declaration
        </button>
      ) : (
        <p style={{ fontSize: "13px", color: "hsl(var(--primary))", textAlign: "center" }}>
          You've reached 5 declarations. Edit or remove one to add a new one.
        </p>
      )}

      <AnimatePresence>
        {showWrite && (
          <WriteDeclarationScreen
            onClose={() => { setShowWrite(false); setEditingId(null); }}
            onSave={handleSave}
            initialText={editingId ? current?.declaration_text || "" : ""}
            isEdit={!!editingId}
            saving={addDeclaration.isPending || updateDeclaration.isPending}
          />
        )}
        {showDelete && (
          <DeleteConfirmation
            onConfirm={handleDeleteConfirm}
            onCancel={() => setShowDelete(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ========== Main Modal ==========
const DeclarationsModal = ({ onClose }: { onClose: () => void }) => {
  const [mode, setMode] = useState<"gods-word" | "my-declarations">("gods-word");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-fullscreen bg-[#111111]"
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
          className="flex flex-col w-full max-w-sm flex-1"
        >
          <h2 style={{ fontFamily: systemSans, fontWeight: 600, fontSize: "24px", color: "#F5F3EE", letterSpacing: "-0.02em", marginBottom: "4px" }}>
            Speak Truth Over Myself
          </h2>
          <p style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--primary))", marginBottom: "16px" }}>
            Declare Who God Says You Are
          </p>

          <ModeToggle mode={mode} onChange={setMode} />

          {mode === "gods-word" ? (
            <GodsWordView onClose={onClose} />
          ) : (
            <MyDeclarationsView onClose={onClose} />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DeclarationsModal;
