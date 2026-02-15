import { motion } from "framer-motion";
import { LucideIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  variant: "pressure" | "temptation" | "grace";
  onClick: () => void;
}

const variantStyles = {
  pressure: {
    bg: "bg-primary",
    text: "text-primary-foreground",
    icon: "bg-primary-foreground/20",
  },
  temptation: {
    bg: "bg-accent",
    text: "text-accent-foreground",
    icon: "bg-accent-foreground/20",
  },
  grace: {
    bg: "bg-accent",
    text: "text-accent-foreground",
    icon: "bg-accent-foreground/20",
  },
};

const ToolCard = ({ title, description, icon: Icon, variant, onClick }: ToolCardProps) => {
  const styles = variantStyles[variant];

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "tool-card w-full text-left",
        styles.bg,
        styles.text
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("p-3 rounded-xl", styles.icon)}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-serif text-lg font-semibold mb-1">{title}</h3>
          <p className="text-sm opacity-80">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 opacity-60 mt-1" />
      </div>
    </motion.button>
  );
};

export default ToolCard;
