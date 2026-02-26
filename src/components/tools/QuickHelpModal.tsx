import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Users, Check, LucideIcon } from "lucide-react";

interface QuickHelpData {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  title: string;
  scripture: string;
  reference: string;
  steps: string[];
  action: string;
}

interface QuickHelpModalProps {
  data: QuickHelpData;
  onClose: () => void;
  onReachOut: () => void;
}

const QuickHelpModal = ({ data, onClose, onReachOut }: QuickHelpModalProps) => {
  const Icon = data.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-fullscreen bg-background overflow-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-secondary rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${data.bgColor}`}>
            <Icon className={`w-4 h-4 ${data.color}`} />
          </div>
          <span className="font-medium">{data.label}</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="font-serif text-3xl font-bold mb-6 text-center">{data.title}</h1>
          
          {/* Scripture Card */}
          <div className="scripture-card mb-8">
            <p className="font-serif text-lg text-primary-foreground/90 leading-relaxed mb-2">
              "{data.scripture}"
            </p>
            <p className="text-sm text-primary-foreground/60">{data.reference}</p>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-8">
            {data.steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-start gap-4 p-4 bg-secondary/50 rounded-xl"
              >
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm font-medium leading-relaxed">{step}</p>
              </motion.div>
            ))}
          </div>

          {/* Action */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-8"
          >
            <p className="font-serif text-xl font-semibold text-primary">{data.action}</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border space-y-3">
        <Button variant="calm" size="lg" onClick={onClose} className="w-full">
          <Check className="w-4 h-4" />
          I'm feeling better
        </Button>
        <Button variant="brotherhood" size="lg" onClick={onReachOut} className="w-full">
          <Users className="w-4 h-4" />
          Reach out to a brother
        </Button>
      </div>
    </motion.div>
  );
};

export default QuickHelpModal;
