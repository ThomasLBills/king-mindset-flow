/**
 * "Speak Truth Over Myself". Two tabs:
 *  - God's Word: a built-in declaration (text + reference) to declare.
 *  - My Declarations: the user's own declarations (user_declarations, max 5)
 *    with add / edit / delete.
 * Either tab's "Hold to Declare" logs evidence_events "declaration".
 */
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Eyebrow } from "@/components/forge/atoms";
import { HoldButton } from "@/components/forge/HoldButton";
import { BackTo } from "./frame";
import { useDeclarations } from "@/hooks/useDeclarations";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";
import { celebrate } from "@/lib/celebrate";

const GODS_WORD = [
  { text: "I am a child of God, and He loves me unconditionally.", reference: "John 1:12, Romans 8:38-39" },
  { text: "I have been redeemed and forgiven of my sins through the sacrifice of Jesus on the cross.", reference: "Ephesians 1:7" },
  { text: "I am a new creation in Christ, and my old self has passed away.", reference: "2 Corinthians 5:17" },
  { text: "I have been given a spirit of power, love, and self-discipline, not fear.", reference: "2 Timothy 1:7" },
  { text: "I am free in Christ. The chains are broken.", reference: "Galatians 5:1" },
  { text: "I am being transformed by the renewing of my mind.", reference: "Romans 12:2" },
];

type Tab = "gods-word" | "mine";

export const Declarations = ({ onBack }: { onBack: () => void }) => {
  const [tab, setTab] = useState<Tab>("gods-word");
  const { declarations, addDeclaration, updateDeclaration, deleteDeclaration } = useDeclarations();
  const { addEvidence } = useEvidenceCounter();

  const [wordIndex, setWordIndex] = useState(() => Math.floor(Math.random() * GODS_WORD.length));
  const [composing, setComposing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [declared, setDeclared] = useState(false);

  const word = GODS_WORD[wordIndex];
  const atMax = declarations.length >= 5;

  // Preserve the exact data write (evidence_events "declaration"). On a
  // confirmed write, celebrate and flash a brief "Declared" state so the
  // declaration lands as earned evidence; the button re-arms after.
  const declare = () => {
    addEvidence.mutate("declaration", {
      onSuccess: () => {
        celebrate();
        setDeclared(true);
        setTimeout(() => setDeclared(false), 1600);
      },
    });
    toast.success("Truth declared. You are building evidence.");
  };

  const declareLabel = declared ? (
    <span className="flex items-center gap-2">
      <Check className="h-4 w-4" aria-hidden="true" /> Declared
    </span>
  ) : (
    "Hold to Declare"
  );

  const startEdit = (id: string, text: string) => {
    setEditId(id);
    setDraft(text);
    setComposing(true);
  };

  const saveDraft = () => {
    const text = draft.trim();
    if (!text) return;
    const opts = {
      onSuccess: () => {
        setComposing(false);
        setEditId(null);
        setDraft("");
      },
    };
    if (editId) updateDeclaration.mutate({ id: editId, text }, opts);
    else addDeclaration.mutate(text, opts);
  };

  const tabButton = (key: Tab, label: string) => (
    <button
      onClick={() => setTab(key)}
      className={cn(
        "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
        tab === key
          ? "border-gold-deep bg-raised-2 text-gold-bright"
          : "border-line bg-raised text-bone-2 hover:border-gold-deep/50"
      )}
    >
      {label}
    </button>
  );

  return (
    <>
      <Eyebrow tone="gold" className="mb-2">
        Declare Who God Says You Are
      </Eyebrow>
      <h1 className="mb-5 font-display text-3xl font-bold tracking-tight text-bone">
        Speak Truth Over Myself
      </h1>

      <div className="mb-6 flex w-full gap-2">
        {tabButton("gods-word", "God's Word")}
        {tabButton("mine", "My Declarations")}
      </div>

      {tab === "gods-word" && (
        <>
          <p className="mb-3 text-sm text-bone-2">Speak this over yourself:</p>
          <blockquote className="rounded-md border border-line bg-raised/80 px-5 py-4">
            <p className="font-serif text-xl italic leading-relaxed text-bone">“{word.text}”</p>
            <footer className="mt-3">
              <Eyebrow tone="gold">{word.reference}</Eyebrow>
            </footer>
          </blockquote>
          <p className="mt-4 text-sm text-bone-2">
            Say it out loud. Let your ears hear what your mouth declares.{" "}
            <span className="text-gold">Your brain rewires when you speak truth.</span>
          </p>
          <div className="mt-6 flex w-full gap-2.5">
            <Button
              variant="outline"
              className="h-12 flex-1"
              onClick={() => setWordIndex((i) => (i + 1) % GODS_WORD.length)}
            >
              Another
            </Button>
            <div className="flex-1">
              <HoldButton onComplete={declare} disabled={declared}>
                {declareLabel}
              </HoldButton>
            </div>
          </div>
        </>
      )}

      {tab === "mine" && (
        <div className="w-full">
          {composing ? (
            <>
              <Eyebrow tone="gold" className="mb-2 block text-left">
                {editId ? "Edit your declaration" : "Write your declaration"}
              </Eyebrow>
              <Textarea
                rows={3}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="I am..."
                autoFocus
              />
              <div className="mt-3 flex gap-2.5">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setComposing(false);
                    setEditId(null);
                    setDraft("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={!draft.trim() || addDeclaration.isPending || updateDeclaration.isPending}
                  onClick={saveDraft}
                >
                  {editId ? "Update Declaration" : "Save Declaration"}
                </Button>
              </div>
            </>
          ) : declarations.length === 0 ? (
            <>
              <p className="text-bone-2">You haven't written any declarations yet.</p>
              <p className="mt-1 text-sm text-dim">Write what God has spoken over you. Declare it daily.</p>
              <Button className="mt-5 w-full" onClick={() => setComposing(true)}>
                + Write your first declaration
              </Button>
            </>
          ) : (
            <>
              <ul className="flex flex-col gap-2 text-left">
                {declarations.map((d) => (
                  <li
                    key={d.id}
                    className="rounded-md border border-line bg-raised/80 px-4 py-3 font-serif text-sm italic text-bone"
                  >
                    <span className="block break-words [overflow-wrap:anywhere]">
                      “{d.declaration_text}”
                    </span>
                    {confirmDelete === d.id ? (
                      <span className="mt-2 flex items-center gap-2 not-italic">
                        <span className="text-xs text-bone-2">Remove this declaration?</span>
                        <button
                          className="text-xs text-dim hover:text-bone-2"
                          onClick={() => setConfirmDelete(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="text-xs font-semibold text-ember"
                          onClick={() =>
                            deleteDeclaration.mutate(d.id, { onSuccess: () => setConfirmDelete(null) })
                          }
                        >
                          Remove
                        </button>
                      </span>
                    ) : (
                      <span className="mt-2 flex items-center gap-3 not-italic">
                        <button
                          className="flex items-center gap-1 text-xs text-dim hover:text-gold"
                          onClick={() => startEdit(d.id, d.declaration_text)}
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button
                          className="flex items-center gap-1 text-xs text-dim hover:text-ember"
                          onClick={() => setConfirmDelete(d.id)}
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {atMax ? (
                <p className="mt-3 text-xs text-dim">
                  You've reached 5 declarations. Edit or remove one to add a new one.
                </p>
              ) : (
                <button
                  className="mt-3 text-sm text-gold underline-offset-4 hover:underline"
                  onClick={() => setComposing(true)}
                >
                  + Write a declaration
                </button>
              )}
              <div className="mt-5">
                <HoldButton onComplete={declare} disabled={declared}>
                  {declareLabel}
                </HoldButton>
              </div>
            </>
          )}
        </div>
      )}

      <BackTo onClick={onBack} label="Back to Your Armor" />
    </>
  );
};
