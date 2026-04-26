const sansFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

// TEMP TEST MODE — set to false (or remove) after verifying Tuesday rendering.
const FORCE_TUESDAY = true;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const BrotherhoodCallSection = () => {
  const actualDayIndex = new Date().getDay();
  const actualDayName = DAY_NAMES[actualDayIndex];
  const isTuesday = FORCE_TUESDAY || actualDayIndex === 2;

  return (
    <div
      className="relative dark-card-gradient rounded-[16px] px-5 py-5 overflow-hidden text-center"
      style={{ fontFamily: sansFont }}
    >
      <h3
        className="uppercase mb-3 text-lg"
        style={{ fontWeight: 500, letterSpacing: "0.12em", color: "#B8963F" }}
      >
        Weekly Brotherhood Call
      </h3>
      <p
        style={{ fontSize: "14px", fontWeight: 400, color: "#F5F3EE", lineHeight: 1.5 }}
      >
        {isTuesday ? "Join us tonight at 6 PM Central" : "Next Call: Tuesday at 6 PM Central"}
      </p>
      {isTuesday && (
        <a
          href="https://www.riseupkings.com/thomas"
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-full rounded-[10px] overflow-hidden border-0 select-none flex items-center justify-center mt-5"
          style={{
            padding: "13px 0",
            background: "#B8963F",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1A1A1A",
            fontFamily: sansFont,
            textDecoration: "none",
          }}
        >
          JOIN CALL NOW
        </a>
      )}
      {/* TEMP DEBUG — remove after testing */}
      <p
        className="mt-4"
        style={{ fontSize: "11px", fontWeight: 400, color: "rgba(245, 243, 238, 0.4)" }}
      >
        Detected Day: {actualDayName}
      </p>
    </div>
  );
};

export default BrotherhoodCallSection;