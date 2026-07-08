/**
 * Weekly brotherhood call. The production app hardcodes this in
 * BrotherhoodCallSection.tsx (Tuesday 6 PM Central, riseupkings.com link);
 * this is the same source of truth for the Forge UI.
 */
export const WEEKLY_CALL = {
  label: "Tuesday · 6:00 PM Central",
  joinUrl: "https://www.riseupkings.com/thomas",
};

/** The room only opens on call day, matching the original behavior. */
export const isCallDay = () => new Date().getDay() === 2;
