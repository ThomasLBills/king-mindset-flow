import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Send, Users, Heart, Shield, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const templates = [
  {
    id: "checkin",
    icon: Heart,
    title: "Simple check-in",
    message: "Hey brother, just checking in. How are you doing today?",
  },
  {
    id: "struggling",
    icon: Shield,
    title: "Facing a hard moment",
    message: "Hey, I'm having a tough moment. Would appreciate your prayers.",
  },
  {
    id: "victory",
    icon: Users,
    title: "Sharing a win",
    message: "Had a moment of temptation but made it through. Grateful for you.",
  },
  {
    id: "prayer",
    icon: MessageCircle,
    title: "Prayer request",
    message: "Could use some prayer today. Feeling the weight of things.",
  },
];

const brothers = [
  { id: "1", name: "Marcus", initials: "MJ", available: true },
  { id: "2", name: "David", initials: "DW", available: true },
  { id: "3", name: "James", initials: "JT", available: false },
];

interface ReachOutProps {
  onClose: () => void;
}

const ReachOut = ({ onClose }: ReachOutProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedBrother, setSelectedBrother] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");

  const handleSend = () => {
    toast.success("Message sent", {
      description: "Your brother will be notified.",
    });
    onClose();
  };

  const currentMessage = selectedTemplate
    ? templates.find((t) => t.id === selectedTemplate)?.message || ""
    : customMessage;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onClose} className="p-2 -ml-2">
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-semibold">Reach Out</h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Brothers */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-3">Who do you want to reach?</p>
          <div className="flex gap-3">
            {brothers.map((brother) => (
              <button
                key={brother.id}
                onClick={() => setSelectedBrother(brother.id)}
                disabled={!brother.available}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                  selectedBrother === brother.id
                    ? "bg-primary text-primary-foreground"
                    : brother.available
                    ? "bg-secondary hover:bg-secondary/80"
                    : "bg-muted opacity-50 cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold",
                    selectedBrother === brother.id
                      ? "bg-primary-foreground/20"
                      : "bg-background"
                  )}
                >
                  {brother.initials}
                </div>
                <span className="text-sm font-medium">{brother.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-3">Choose a message template</p>
          <div className="space-y-2">
            {templates.map((template) => (
              <motion.button
                key={template.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTemplate(template.id)}
                className={cn(
                  "w-full p-4 rounded-xl border text-left transition-all",
                  selectedTemplate === template.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      selectedTemplate === template.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    )}
                  >
                    <template.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">{template.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {template.message}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {(selectedTemplate || customMessage) && (
          <div className="mb-6">
            <p className="text-sm font-medium mb-3">Message preview</p>
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-sm">{currentMessage}</p>
            </div>
          </div>
        )}

        {/* Safe reminder */}
        <div className="safe-zone">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Safe sharing:</strong> You don't need to share 
            explicit details. Brothers understand. Connection is what matters.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border">
        <Button
          variant="brotherhood"
          size="lg"
          onClick={handleSend}
          disabled={!selectedBrother || !currentMessage}
          className="w-full"
        >
          <Send className="w-4 h-4" />
          Send Message
        </Button>
      </div>
    </div>
  );
};

export default ReachOut;
