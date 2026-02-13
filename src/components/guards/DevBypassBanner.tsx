const DevBypassBanner = () => (
  <div className="fixed top-0 left-0 right-0 z-[9999] text-center text-xs font-semibold py-1"
    style={{ backgroundColor: "hsl(45, 93%, 47%)", color: "hsl(45, 80%, 10%)" }}>
    ⚠️ Preview Mode: Auth bypass enabled — not for production
  </div>
);

export default DevBypassBanner;
