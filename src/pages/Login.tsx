import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import lkLogo from "@/assets/lk-logo-horizontal.png";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signInWithPassword, user } = useAuth();
  const { isEntitled, isLoading: entitlementLoading } = useEntitlement();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for success message from password reset
  const [successMessage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get("message");
    if (msg) {
      window.history.replaceState({}, "", "/login");
    }
    return msg;
  });

  useEffect(() => {
    if (!user) return;
    if (entitlementLoading) return;
    if (isEntitled) {
      navigate("/app", { replace: true });
    } else {
      navigate("/upgrade", { replace: true });
    }
  }, [user, isEntitled, entitlementLoading, navigate]);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    const { error } = await signInWithPassword(email, password);
    if (error) {
      // Check if this user exists but hasn't set a password yet
      try {
        const { data } = await supabase.functions.invoke("check-user-eligible", {
          body: { email },
        });
        if (data?.eligible && data?.password_set === false) {
          // Redirect to setup-account — check-user-eligible already sent a code
          setLoading(false);
          navigate("/setup-account");
          return;
        }
      } catch {
        // Ignore — fall through to normal error
      }
      setLoading(false);
      setErrorMessage(error.message);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };




  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-10"
      style={{
        backgroundColor: "#FAF7F2",
        backgroundImage:
          "radial-gradient(ellipse at center, #FAF7F2 0%, #F4EFE6 100%)",
      }}
    >
      {/* Faint paper-grain noise overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          opacity: 0.04,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full mx-auto flex flex-col items-center"
        style={{ maxWidth: 420 }}
      >
        {/* Logo — crest treatment */}
        <a
          href="/"
          aria-label="Liberated Kings — Home"
          className="flex justify-center login-logo-wrap"
          style={{ marginTop: 48, marginBottom: 36 }}
        >
          <img
            src={lkLogo}
            alt="Liberated Kings"
            className="object-contain login-logo"
            style={{ height: 56, width: "auto", display: "block" }}
          />
        </a>

        {/* Daily Scripture */}
        <p
          className="text-center mb-8"
          style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontStyle: "italic",
            fontSize: 14,
            lineHeight: 1.5,
            color: "#B8964F",
            maxWidth: 320,
          }}
        >
          "Where the Spirit of the Lord is, there is freedom." — 2 Corinthians 3:17
        </p>

        {/* Card */}
        <div
          className="w-full login-card"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: "32px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            border: "1.5px solid rgba(201, 169, 106, 0.6)",
          }}
        >
          <div>
            <div className="text-center mb-6">
              <h1
                style={{
                  fontFamily: "'Crimson Pro', Georgia, serif",
                  fontSize: 28,
                  fontWeight: 600,
                  color: "#1A1A1A",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Welcome Back
              </h1>
              <p
                style={{
                  fontSize: 15,
                  color: "#5A5A5A",
                  letterSpacing: "0.01em",
                  marginTop: 8,
                  marginBottom: 0,
                }}
              >
                Sign in to walk in your freedom.
              </p>
            </div>

            {successMessage && (
              <div className="mb-4 p-3 rounded-lg bg-success/10 text-success text-sm text-center font-medium">
                {successMessage}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              aria-live="polite"
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block mb-2"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#4A4A4A",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
                    style={{ color: "#8A8A8A" }}
                  />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="login-field"
                    style={{
                      height: 52,
                      fontSize: 16,
                      borderRadius: 12,
                      paddingLeft: 44,
                      backgroundColor: "#F4F4F0",
                      border: errorMessage ? "1px solid #B23A3A" : "1px solid #E5E1D8",
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block mb-2"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#4A4A4A",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    aria-hidden="true"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
                    style={{ color: "#8A8A8A" }}
                  />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="login-field"
                    style={{
                      height: 52,
                      fontSize: 16,
                      borderRadius: 12,
                      paddingLeft: 44,
                      paddingRight: 44,
                      backgroundColor: "#F4F4F0",
                      border: errorMessage ? "1px solid #B23A3A" : "1px solid #E5E1D8",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-black/5 transition-colors"
                    style={{ color: "#8A8A8A" }}
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" className="w-[18px] h-[18px]" />
                    ) : (
                      <Eye aria-hidden="true" className="w-[18px] h-[18px]" />
                    )}
                  </button>
                </div>
                {errorMessage && (
                  <p
                    role="alert"
                    className="mt-2"
                    style={{ fontSize: 13, color: "#B23A3A" }}
                  >
                    {errorMessage}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="login-submit w-full inline-flex items-center justify-center gap-2 transition-all"
                style={{
                  height: 52,
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#FFFFFF",
                  background:
                    "linear-gradient(180deg, #C9A96A 0%, #B8964F 100%)",
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                  border: "none",
                }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Sign In</>
                )}
              </button>
            </form>

            {/* Secondary links */}
            <div className="mt-6 flex flex-col items-center" style={{ gap: 12 }}>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="hover:underline transition-colors flex items-center justify-center"
                style={{
                  fontSize: 14,
                  color: "#5A5A5A",
                  minHeight: 44,
                  padding: "0 8px",
                }}
              >
                Forgot password?
              </button>

              <div
                aria-hidden="true"
                style={{
                  height: 1,
                  width: "100%",
                  backgroundColor: "#E5E1D8",
                }}
              />

              <button
                type="button"
                onClick={() => navigate("/setup-account")}
                className="transition-colors flex items-center justify-center"
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#1A1A1A",
                  minHeight: 44,
                  padding: "0 8px",
                }}
              >
                New here?{" "}
                <span
                  style={{
                    color: "#B8964F",
                    marginLeft: 6,
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                  }}
                >
                  Set up your account
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;