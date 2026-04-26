import { Users } from "lucide-react";

const sansFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const BrotherhoodCallSection = () => {
  const isTuesday = new Date().getDay() === 2;

  return (
    <div
      className="relative dark-card-gradient rounded-[16px] px-5 py-6 overflow-hidden text-center"
      style={{ fontFamily: sansFont }}
    >
      <div className="flex justify-center mb-3">
        <Users size={20} strokeWidth={1.75} style={{ color: "#B8963F" }} />
      </div>
      <h3
        className="uppercase mb-3"
        style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", color: "#B8963F" }}
      >
        Weekly Brotherhood Call
      </h3>
      <p
        style={{ fontSize: "14px", fontWeight: 400, color: "#F5F3EE", lineHeight: 1.5 }}
      >
        Every Tuesday at 6 PM Central. You don't walk alone.
      </p>
      {isTuesday ? (
        <a
          href="https://www.riseupkings.com/thomas"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-5 rounded-[10px]"
          style={{
            padding: "12px 28px",
            background: "#B8963F",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1A1A1A",
            fontFamily: sansFont,
            textDecoration: "none",
          }}
        >
          Join Tonight's Call
        </a>
      ) : (
        <p
          className="mt-2"
          style={{ fontSize: "13px", fontWeight: 400, color: "rgba(245, 243, 238, 0.55)" }}
        >
          Next Call: Tuesday at 6 PM Central
        </p>
      )}
    </div>
  );
};

export default BrotherhoodCallSection;