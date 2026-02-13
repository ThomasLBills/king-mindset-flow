import AdminChannels from "./AdminChannels";
import { motion } from "framer-motion";

const AdminCommunity = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Community</h1>
        <p className="text-sm text-muted-foreground">Manage channels and moderation</p>
      </div>
      <AdminChannels />
    </motion.div>
  );
};

export default AdminCommunity;
