/**
 * NEW-feature registry: every feature invented during the redesign
 * (see docs/redesign/feature-provenance.md). Each maps to one flag;
 * flipping a flag to false removes that feature cleanly if the client cuts it.
 * Everything not listed here is EXISTING and ships unconditionally.
 */
export const FEATURES = {
  /**
   * "Standing" identity hero on Today: the covenant "why" + a son-not-slave
   * truth line. Replaces the retired abstinence scoreboard ("The Standard" /
   * days-held / longest-run), which framed recovery as days-since-porn.
   */
  standing: true,
  /** "Readings finished" / "Brothers reached" dashboard stats */
  extraStats: true,
  /** Named small groups ("The Watchmen"); the app has 1:1 + channels only */
  groups: true,
  /** Per-brother presence dots (steady / struggling / away) */
  statusDots: true,
  /** Breathing pacer on the crisis screen */
  breathingPacer: true,
  /** "Remember your why" crisis action (stored reason) */
  rememberWhy: true,
  /** "Move your body" crisis action */
  moveYourBody: true,
  /** Signed covenant onboarding step */
  covenant: true,
} as const;

export type FeatureFlag = keyof typeof FEATURES;
