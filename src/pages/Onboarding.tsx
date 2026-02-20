import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const steps = ["welcome", "profile", "finish"] as const;
type Step = typeof steps[number];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("welcome");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        display_name: displayName.trim() || firstName.trim() || null,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
      return;
    }
    setStep("finish");
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id);
    setSaving(false);
    navigate("/app", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-peace">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-serif text-3xl font-bold">Welcome, King.</h1>
              <p className="text-muted-foreground">
                You've taken the first step toward freedom. Let's set up your profile so your brothers can find you.
              </p>
              <Button onClick={() => setStep("profile")} size="lg" className="gap-2">
                Let's Go <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {step === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 bg-card rounded-2xl border border-border p-6"
            >
              <div>
                <h2 className="font-serif text-2xl font-bold">Your Profile</h2>
                <p className="text-sm text-muted-foreground mt-1">How should your brothers know you?</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>First Name</Label>
                    <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
                  </div>
                </div>
                <div>
                  <Label>Display Name</Label>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="How you appear in chat" />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving || !firstName.trim()} className="w-full gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </motion.div>
          )}

          {step === "finish" && (
            <motion.div
              key="finish"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-serif text-3xl font-bold">You're Ready.</h1>
              <p className="text-muted-foreground">
                Your journey to freedom starts now. Walk with intention, lean on your brothers, and trust the process.
              </p>
              <Button onClick={handleComplete} size="lg" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enter the Kingdom <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Onboarding;
