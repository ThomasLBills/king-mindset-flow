import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import lkLogo from "@/assets/lk-logo-horizontal.png";

const steps = ["welcome", "profile", "finish"] as const;
type Step = typeof steps[number];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    await queryClient.invalidateQueries({ queryKey: ["onboarding-check", user.id] });
    setSaving(false);
    navigate("/app", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <img src={lkLogo} alt="Liberated Kings" className="h-16 object-contain" />
        </div>
        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="card-elevated border border-primary/40">
                <CardHeader className="text-center">
                  <CardTitle className="font-serif text-2xl">Welcome, King.</CardTitle>
                  <CardDescription>
                    You are already free in Christ. Let's set up your profile so your brothers know you are here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Button onClick={() => setStep("profile")} size="lg" className="gap-2">
                    Begin <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="card-elevated border border-primary/40">
                <CardHeader className="text-center">
                  <CardTitle className="font-serif text-2xl">Your Profile</CardTitle>
                  <CardDescription>How should your brothers know you?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  <Button onClick={handleSaveProfile} disabled={saving || !firstName.trim()} className="w-full gap-2" size="lg">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "finish" && (
            <motion.div
              key="finish"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex justify-center">
                <Button onClick={handleComplete} size="lg" disabled={saving} className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Walk in Your Freedom <ArrowRight className="w-4 h-4" /></>}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Onboarding;
