const sansFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const BrotherhoodCallSection = () => {
  const isTuesday = new Date().getDay() === 2;

  return (
    <div
      className="relative dark-card-gradient rounded-[16px] px-5 py-5 overflow-hidden text-center"
      style={{ fontFamily: sansFont }}
    >
      <h3
        className="uppercase mb-5 text-lg"
        style={{ fontWeight: 500, letterSpacing: "0.12em", color: "#B8963F" }}
      >
        Weekly Brotherhood Call
      </h3>
      {isTuesday ? (
        <a
          href="https://www.riseupkings.com/thomas"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-[10px]"
          style={{
            padding: "13px 32px",
            background: "#B8963F",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: "#1A1A1A",
            fontFamily: sansFont,
            textDecoration: "none",
          }}
        >
          JOIN CALL NOW
        </a>
      ) : (
        <p
          style={{ fontSize: "14px", fontWeight: 400, color: "rgba(245, 243, 238, 0.5)" }}
        >
          Link Available Tuesday
        </p>
      )}
      <p
        className="mt-5"
        style={{ fontSize: "13px", fontWeight: 400, color: "rgba(245, 243, 238, 0.55)" }}
      >
        Next Call: Tuesday at 6 PM Central
      </p>
    </div>
  );
};

export default BrotherhoodCallSection;