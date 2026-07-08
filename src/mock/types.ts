/**
 * Domain types for the mock data layer. Shapes mirror the real app's
 * Supabase-backed hooks (src/hooks/*) so this layer can be swapped for
 * real services later without touching the UI.
 */

export type BrotherStatus = "steady" | "struggling" | "away";

export interface Brother {
  id: string;
  name: string;
  initials: string;
  status: BrotherStatus;
}

export interface Group {
  id: string;
  name: string;
  members: Brother[];
}

export type DayOutcome = "held" | "fell";

export interface StandardCycle {
  /** Current day number within the cycle (1-based) */
  day: number;
  longestRun: number;
  /** Outcome per elapsed day, index 0 = day 1 */
  days: DayOutcome[];
}

export type PathStepKind = "checkin" | "reading" | "reflection";
export type PathStepStatus = "done" | "now" | "locked";

export interface PathStep {
  id: string;
  kind: PathStepKind;
  title: string;
  sub: string;
  status: PathStepStatus;
  /** Route the step's action navigates to, if any */
  to?: string;
}

export interface Verse {
  ref: string;
  text: string;
}

export interface CheckIn {
  mood: "strong" | "steady" | "shaky";
  sleep: "well" | "poorly";
  note?: string;
  dateISO: string;
}

export interface WeekStats {
  urgesRedirected: number;
  readingsFinished: number;
  brothersReached: number;
}

export interface BannerEvent {
  brotherId: string;
  name: string;
  initials: string;
  /** e.g. "2h ago", precomputed for mock simplicity */
  when: string;
  strengthened: boolean;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  unread: number;
  /** View-only feeds (e.g. weekly call recordings) hide the composer */
  readOnly?: boolean;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  authorName: string;
  authorInitials: string;
  body: string;
  sentAtISO: string;
  own: boolean;
}

export interface DirectThread {
  id: string;
  brotherId: string;
  name: string;
  initials: string;
  lastMessage: string;
  lastAtISO: string;
  unread: number;
}

export interface LessonSummary {
  id: string;
  title: string;
  minutes: number;
  done: boolean;
}

export interface Week {
  id: string;
  number: number;
  title: string;
  theme: string;
  locked: boolean;
  lessons: LessonSummary[];
}

export interface Lesson {
  id: string;
  weekNumber: number;
  weekTitle: string;
  title: string;
  minutes: number;
  scripture?: Verse;
  /** Paragraphs */
  body: string[];
  reflection: string;
  done: boolean;
}

export type RhythmKind = "prayer" | "scripture" | "renewedMind" | "gratitude";

export type RhythmState = Record<RhythmKind, boolean>;

export interface Invoice {
  id: string;
  dateISO: string;
  amount: string;
  status: "paid" | "open";
}

export interface BillingInfo {
  plan: string;
  price: string;
  renewsAtISO: string;
  invoices: Invoice[];
}

export interface PrayerRequest {
  id: string;
  toBrotherIds: string[];
  template: string;
  sentAtISO: string;
}
