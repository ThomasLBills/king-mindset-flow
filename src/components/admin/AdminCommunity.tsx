import AdminChannels from "./AdminChannels";
import { Eyebrow, BackLink } from "@/components/forge/atoms";

const AdminCommunity = () => {
  return (
    <div className="space-y-6">
      <BackLink to="/admin" label="Admin" className="md:hidden" />
      <header>
        <Eyebrow className="mb-1 block">Community</Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          Where brothers gather
        </h1>
        <p className="mt-1 text-sm text-dim">Manage channels and moderation.</p>
      </header>
      <AdminChannels />
    </div>
  );
};

export default AdminCommunity;
