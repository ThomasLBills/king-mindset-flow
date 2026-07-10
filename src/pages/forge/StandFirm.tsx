/**
 * "Your Armor": the Armor page (route /stand-firm, formerly /tools). A menu
 * of the six original tools, each rendered inside the shared crisis ArmorFrame.
 * "Put on the full armor of God. Choose what your moment requires."
 *
 * Tools:
 *  - Help Me Right Now  → light triage that routes into a tool
 *  - I Am Being Tempted → N.A.N. → Hold to Redirect (evidence "urge_redirected")
 *  - I Need to Return   → R.E.T.U.R.N. (relapse + streak reset + evidence)
 *  - Speak Truth Over Myself → Declarations (evidence "declaration")
 *  - Gratitude          → three entries (gratitude_entries + evidence "gratitude")
 *  - Scripture          → categorized verse browser (read-only)
 */
import { useState } from "react";
import { Heart, ScrollText, Sword, Undo2, Wind } from "lucide-react";
import { Eyebrow } from "@/components/forge/atoms";
import { ArmorFrame, ActionRow } from "@/components/armor/frame";
import { Tempted } from "@/components/armor/Tempted";
import { ReturnFlow } from "@/components/armor/ReturnFlow";
import { Declarations } from "@/components/armor/Declarations";
import { Gratitude } from "@/components/armor/Gratitude";
import { ScriptureBrowser } from "@/components/armor/ScriptureBrowser";

export type ToolKey = "tempted" | "return" | "scripture" | "truth" | "gratitude";
type Tool = "menu" | ToolKey;

const StandFirm = () => {
  const [tool, setTool] = useState<Tool>("menu");
  const back = () => setTool("menu");

  return (
    <ArmorFrame>
      {tool === "menu" && (
        <>
          <Eyebrow tone="gold" className="mb-3">
            Your Armor
          </Eyebrow>
          <h1 className="font-display text-4xl font-bold tracking-tight text-bone">
            Put on the Full Armor of God.
          </h1>
          <p className="mx-auto mb-7 mt-3 max-w-[340px] text-[15px] leading-relaxed text-bone-2">
            Choose what your moment requires.
          </p>
          <div className="flex w-full flex-col gap-2.5">
            <ActionRow
              icon={Wind}
              title="I Am Being Tempted"
              sub="Notice. Name. Navigate."
              primary
              onClick={() => setTool("tempted")}
            />
            <ActionRow
              icon={Undo2}
              title="I Need to Return"
              sub="R.E.T.U.R.N. Come Back Without Hiding."
              onClick={() => setTool("return")}
            />
            <ActionRow
              icon={ScrollText}
              title="Speak Truth Over Myself"
              sub="Declare Who God Says You Are."
              onClick={() => setTool("truth")}
            />
            <ActionRow
              icon={Heart}
              title="Gratitude"
              sub="Name Three Things God Has Done."
              onClick={() => setTool("gratitude")}
            />
            <ActionRow
              icon={Sword}
              title="Scripture"
              sub="The Sword of the Spirit."
              onClick={() => setTool("scripture")}
            />
          </div>
        </>
      )}

      {tool === "tempted" && <Tempted onBack={back} />}
      {tool === "return" && <ReturnFlow onBack={back} />}
      {tool === "truth" && <Declarations onBack={back} />}
      {tool === "gratitude" && <Gratitude onBack={back} />}
      {tool === "scripture" && <ScriptureBrowser onBack={back} />}
    </ArmorFrame>
  );
};

export default StandFirm;
