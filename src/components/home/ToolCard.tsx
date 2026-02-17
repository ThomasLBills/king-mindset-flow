import { motion } from "framer-motion";
import { LucideIcon, ChevronRight } from "lucide-react";

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

const ToolCard = ({ title, description, icon: Icon, onClick }: ToolCardProps) => {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl bg-[#111111] border-l-4 border-primary transition-all hover:border-primary/80"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg font-bold text-white">{title}</h3>
          <p className="text-sm text-white/50">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
      </div>
    </motion.button>
  );
};

export default ToolCard;
