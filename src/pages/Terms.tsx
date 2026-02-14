import AppLayout from "@/components/layout/AppLayout";

const Terms = () => (
  <AppLayout>
    <div className="px-5 py-6 max-w-2xl mx-auto prose prose-sm">
      <h1 className="font-serif text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-muted-foreground text-sm mb-4">Last updated: February 2026</p>

      <h2 className="font-serif text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h2>
      <p>By accessing Rise Up Kings, you agree to these terms. If you do not agree, do not use the service.</p>

      <h2 className="font-serif text-xl font-semibold mt-6 mb-3">2. Subscription & Billing</h2>
      <p>Access requires an active subscription (monthly or annual). Payments are processed via Stripe. You may cancel at any time; access continues until the end of your billing period.</p>

      <h2 className="font-serif text-xl font-semibold mt-6 mb-3">3. Community Guidelines</h2>
      <ul>
        <li>No explicit content or triggering details in chat</li>
        <li>Treat all brothers with respect and dignity</li>
        <li>What's shared stays confidential</li>
        <li>No solicitation or spam</li>
      </ul>

      <h2 className="font-serif text-xl font-semibold mt-6 mb-3">4. Content Ownership</h2>
      <p>Curriculum content is proprietary. Your personal entries (journal, action items) belong to you. Community messages may be moderated for safety.</p>

      <h2 className="font-serif text-xl font-semibold mt-6 mb-3">5. Disclaimer</h2>
      <p>Rise Up Kings is not a substitute for professional counseling or therapy. If you are in crisis, please contact a licensed professional or call 988 (Suicide & Crisis Lifeline).</p>

      <h2 className="font-serif text-xl font-semibold mt-6 mb-3">6. Termination</h2>
      <p>We reserve the right to suspend accounts that violate community guidelines.</p>

      <h2 className="font-serif text-xl font-semibold mt-6 mb-3">7. Contact</h2>
      <p>Questions? Reach us at <strong>support@riseupkings.com</strong>.</p>
    </div>
  </AppLayout>
);

export default Terms;
