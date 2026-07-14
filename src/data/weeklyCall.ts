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

/**
 * True during the live window: Tuesday 6:00 PM – 8:00 PM Central Time.
 * Uses the America/Chicago timezone so it stays correct regardless of the
 * viewer's device tz (matches the rest of the app's CT-based schedule).
 */
export const isCallLive = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value;
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  if (weekday !== "Tue") return false;
  // 6:00 PM (18) up to but not including 8:00 PM (20)
  return hour >= 18 && hour < 20;
};
