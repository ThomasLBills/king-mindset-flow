/** Privacy + Terms, forge-styled. Copy preserved from the original pages. */
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Eyebrow } from "@/components/forge/atoms";
import { LkMonogram } from "@/components/forge/brand";

const Section = ({ heading, children }: { heading: string; children: React.ReactNode }) => (
  <section className="mt-8">
    <h2 className="mb-2 font-display text-lg font-bold tracking-tight text-bone">{heading}</h2>
    <div className="text-sm leading-relaxed text-bone-2">{children}</div>
  </section>
);

const Frame = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="min-h-screen bg-forge">
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-dim transition-colors hover:text-bone-2">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Home
      </Link>
      <LkMonogram className="mb-5 h-7 w-9 text-gold" />
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">{title}</h1>
      <Eyebrow className="mt-2 block">Last updated: February 2026</Eyebrow>
      {children}
    </div>
  </div>
);

export const Privacy = () => (
  <Frame title="Privacy Policy">
    <Section heading="1. Information we collect">
      <p>
        We collect information you provide directly: name, email address, and usage data within the
        app (check-ins, progress tracking, chat messages).
      </p>
    </Section>
    <Section heading="2. How we use your information">
      <p>
        Your data is used to provide the Liberated Kings service, track your progress, enable
        community features, and improve the app experience. We never sell your personal data.
      </p>
    </Section>
    <Section heading="3. Data security">
      <p>
        All data is encrypted in transit and at rest. Chat messages and personal reflections are
        protected by strict access controls. Only you and authorized administrators can access your
        data.
      </p>
    </Section>
    <Section heading="4. Brotherhood & chat privacy">
      <p>
        Direct messages are private between you and your brother. Channel messages are visible to
        channel members. Admins and moderators may review flagged content for safety purposes.
      </p>
    </Section>
    <Section heading="5. Data retention">
      <p>
        Your data is retained as long as your account is active. You may request deletion of your
        account and associated data at any time by contacting support.
      </p>
    </Section>
    <Section heading="6. Contact">
      <p>
        For privacy questions, contact us at <strong className="text-bone">hello@liberatedkings.com</strong>.
      </p>
    </Section>
  </Frame>
);

export const Terms = () => (
  <Frame title="Terms of Service">
    <Section heading="1. Acceptance of terms">
      <p>By accessing Liberated Kings, you agree to these terms. If you do not agree, do not use the service.</p>
    </Section>
    <Section heading="2. Subscription & billing">
      <p>
        Access requires an active subscription (monthly or annual). Payments are processed via
        Stripe. You may cancel at any time; access continues until the end of your billing period.
      </p>
    </Section>
    <Section heading="3. Community guidelines">
      <ul className="list-disc space-y-1.5 pl-5">
        <li>No explicit content or triggering details in chat</li>
        <li>Treat all brothers with respect and dignity</li>
        <li>What's shared stays confidential</li>
        <li>No solicitation or spam</li>
      </ul>
    </Section>
    <Section heading="4. Content ownership">
      <p>
        Curriculum content is proprietary. Your personal entries (journal, action items) belong to
        you. Community messages may be moderated for safety.
      </p>
    </Section>
    <Section heading="5. Disclaimer">
      <p>
        Liberated Kings is not a substitute for professional counseling or therapy. If you are in
        crisis, please contact a licensed professional or call 988 (Suicide & Crisis Lifeline).
      </p>
    </Section>
    <Section heading="6. Termination">
      <p>We reserve the right to suspend accounts that violate community guidelines.</p>
    </Section>
    <Section heading="7. Contact">
      <p>
        Questions? Reach us at <strong className="text-bone">hello@liberatedkings.com</strong>.
      </p>
    </Section>
  </Frame>
);
