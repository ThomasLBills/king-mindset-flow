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
    icon: "bg-primary-foreground/15",
  },
  temptation: {
    bg: "bg-primary",
    text: "text-primary-foreground",
    icon: "bg-primary-foreground/15",
  },
  grace: {
    bg: "bg-primary",
    text: "text-primary-foreground",
    icon: "bg-primary-foreground/15",
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
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-xl flex-shrink-0", styles.icon)}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg font-semibold mb-0.5">{title}</h3>
          <p className="text-sm opacity-75">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 opacity-50 flex-shrink-0" />
      </div>
    </motion.button>
  );
};

export default ToolCard;
