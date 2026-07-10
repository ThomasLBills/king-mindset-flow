import { cn } from "@/lib/utils";
import logoHorizontal from "@/assets/lk-logo-horizontal.png";

/**
 * Brand marks use the real logo files (black mark, transparent background):
 * public/lk-icon.png and src/assets/lk-logo-horizontal.png. The PNGs are
 * black, so a CSS filter tints them for the dark theme.
 */
type Tone = "gold" | "bone" | "dim" | "ink";

const TONE_FILTER: Record<Tone, string> = {
  // black → approx gold #C9A961
  gold: "invert(78%) sepia(32%) saturate(480%) hue-rotate(5deg) brightness(0.95)",
  // black → approx bone #ECE3D2
  bone: "invert(94%) sepia(8%) saturate(180%) hue-rotate(5deg)",
  // black → approx dim #857C6C
  dim: "invert(52%) sepia(12%) saturate(320%) hue-rotate(4deg) brightness(0.9)",
  // native near-black mark, for use on light surfaces
  ink: "none",
};

/** The LK icon mark. */
export const LkMonogram = ({ className, tone = "gold" }: { className?: string; tone?: Tone }) => (
  <img
    src="/lk-icon.png"
    alt=""
    aria-hidden="true"
    className={cn("block object-contain", className)}
    style={{ filter: TONE_FILTER[tone] }}
  />
);

/** The horizontal LIBERATED KINGS wordmark. */
export const LkWordmark = ({ className, tone = "bone" }: { className?: string; tone?: Tone }) => (
  <img
    src={logoHorizontal}
    alt="Liberated Kings"
    className={cn("block object-contain", className)}
    style={{ filter: TONE_FILTER[tone] }}
  />
);

/** Engraved covenant seal, a drawn design element (not the client logo). */
export const LkSeal = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 320 320" className={cn("block", className)} aria-hidden="true">
    <defs>
      <path id="lk-bt" d="M 27,160 A 133,133 0 0 1 293,160" />
      <path id="lk-bb" d="M 27,160 A 133,133 0 0 0 293,160" />
      <path id="lk-mt" d="M 58,160 A 102,102 0 0 1 262,160" />
      <path id="lk-mb" d="M 58,160 A 102,102 0 0 0 262,160" />
    </defs>
    <g fill="none" stroke="currentColor" strokeLinejoin="miter" vectorEffect="non-scaling-stroke">
      <circle strokeWidth="1" cx="160" cy="160" r="157" />
      <circle strokeWidth="0.75" cx="160" cy="160" r="151" />
      <circle strokeWidth="0.75" cx="160" cy="160" r="118" />
      <circle strokeWidth="1" cx="160" cy="160" r="112" />
      <circle strokeWidth="0.75" cx="160" cy="160" r="92" />
      <polygon strokeWidth="1" points="110,108 210,108 210,148 196,182 160,214 124,182 110,148" />
      <polyline strokeWidth="1.6" points="124,172 160,136 196,172" />
      <polyline strokeWidth="0.75" points="134,190 160,166 186,190" />
      <line strokeWidth="1" x1="160" y1="118" x2="160" y2="206" />
    </g>
    <g fill="currentColor" fontFamily="Georgia, serif" fontWeight="600">
      <text fontSize="12" letterSpacing="5.5">
        <textPath href="#lk-bt" startOffset="50%" textAnchor="middle">
          LIBERATED KINGS
        </textPath>
      </text>
      <text fontSize="12" letterSpacing="5.5">
        <textPath href="#lk-bb" startOffset="50%" textAnchor="middle">
          · STAND FIRM ·
        </textPath>
      </text>
      <text fontSize="7.5" letterSpacing="2.5">
        <textPath href="#lk-mt" startOffset="50%" textAnchor="middle">
          EPHESIANS · VI · XIII
        </textPath>
      </text>
      <text fontSize="7.5" letterSpacing="2.5">
        <textPath href="#lk-mb" startOffset="50%" textAnchor="middle">
          · MMXXVI ·
        </textPath>
      </text>
    </g>
    <g fill="currentColor">
      <polygon points="27,153 34,160 27,167 20,160" />
      <polygon points="293,153 300,160 293,167 286,160" />
      <polygon points="160,112 165,120 160,128 155,120" />
    </g>
  </svg>
);
