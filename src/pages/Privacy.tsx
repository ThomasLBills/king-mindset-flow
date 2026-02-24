import AppLayout from "@/components/layout/AppLayout";

const Privacy = () => (
  <AppLayout>
    <div className="px-5 py-6 max-w-2xl mx-auto prose prose-sm">
      <h1 className="font-serif text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-muted-foreground text-sm mb-4">Last updated: February 2026</p>

      <h2 className="font-serif text-xl font-semibold mt-6 mb-3">1. Information We Collect</h2>
      <p>We collect information you provide directly: name, email address, and usage data within the app (check-ins, progress tracking, chat messages).</p>

      <h2 className="font-serif text-xl font-semibold mt-6 mb-3">2. How We Use Your Information</h2>
      <p>Your data is used to provide the Liberated Kings service, track your progress, enable community features, and improve the app experience. We never sell your personal data.</p>

      <h2 className="font-serif text-xl font-semibold mt-6 mb-3">3. Data Security</h2>
      <p>All data is encrypted in transit and at rest. Chat messages and personal reflections are protected by strict access controls — only you and authorized administrators can access your data.</p>

      <h2 className="font-serif text-xl font-semibold mt-6 mb-3">4. Brotherhood & Chat Privacy</h2>
      <p>Direct messages are private between you and your brother. Channel messages are visible to channel members. Admins and moderators may review flagged content for safety purposes.</p>

      <h2 className="font-serif text-xl font-semibold mt-6 mb-3">5. Data Retention</h2>
      <p>Your data is retained as long as your account is active. You may request deletion of your account and associated data at any time by contacting support.</p>

      <h2 className="font-serif text-xl font-semibold mt-6 mb-3">6. Contact</h2>
      <p>For privacy questions, contact us at <strong>hello@riseupkings.com</strong>.</p>
    </div>
  </AppLayout>
);

export default Privacy;
