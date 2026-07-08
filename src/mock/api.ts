/**
 * Mock service layer. Same async surface a real Supabase-backed service
 * would expose, so the internals can swap later without touching UI or hooks.
 * Mutable state persists to localStorage so the demo survives reloads.
 */
import * as fx from "./fixtures";
import type {
  BannerEvent,
  BillingInfo,
  Channel,
  ChatMessage,
  CheckIn,
  DirectThread,
  Group,
  Lesson,
  PathStep,
  PrayerRequest,
  RhythmKind,
  RhythmState,
  StandardCycle,
  Verse,
  Week,
  WeekStats,
} from "./types";

interface Store {
  standard: StandardCycle;
  declarations: string[];
  checkIn: CheckIn | null;
  reflectionDoneISO: string | null;
  banner: BannerEvent;
  weekStats: WeekStats;
  channels: Channel[];
  messages: ChatMessage[];
  dms: DirectThread[];
  dmMessages: ChatMessage[];
  weeks: Week[];
  lessons: Record<string, Lesson>;
  rhythms: RhythmState;
  billing: BillingInfo;
  prayerRequests: PrayerRequest[];
}

const KEY = "lk-mock-store-v2";

const seed = (): Store => ({
  standard: fx.STANDARD,
  declarations: [],
  checkIn: null,
  reflectionDoneISO: null,
  banner: fx.BANNER,
  weekStats: fx.WEEK_STATS,
  channels: fx.CHANNELS,
  messages: fx.MESSAGES,
  dms: fx.DMS,
  dmMessages: fx.DM_MESSAGES,
  weeks: fx.WEEKS,
  lessons: fx.LESSONS,
  rhythms: fx.RHYTHMS,
  billing: fx.BILLING,
  prayerRequests: [],
});

const load = (): Store => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...seed(), ...JSON.parse(raw) };
  } catch {
    /* corrupted store, reseed */
  }
  return seed();
};

let store = load();

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage full or unavailable, demo continues in memory */
  }
};

export const resetStore = () => {
  store = seed();
  localStorage.removeItem(KEY);
};

const delay = <T,>(value: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const isToday = (iso: string | null) =>
  !!iso && new Date(iso).toDateString() === new Date().toDateString();

const uid = () => `id-${Math.random().toString(36).slice(2, 10)}`;

// ---------- Today ----------

export const getStandard = () => delay(store.standard);

export const getPath = (): Promise<PathStep[]> => {
  const checkinDone = isToday(store.checkIn?.dateISO ?? null);
  const readingDone = store.lessons["w3-l3"]?.done ?? false;
  const reflectionDone = isToday(store.reflectionDoneISO);
  const reflectionOpen = new Date().getHours() >= 19;

  const steps: PathStep[] = fx.PATH.map((s) => ({ ...s }));
  steps[0].status = checkinDone ? "done" : "now";
  if (checkinDone && store.checkIn) {
    const moodWord = { strong: "strong", steady: "steady", shaky: "shaky" }[store.checkIn.mood];
    steps[0].sub = `Logged: ${moodWord}, slept ${store.checkIn.sleep === "well" ? "well" : "poorly"}`;
  }
  steps[1].status = readingDone ? "done" : checkinDone ? "now" : "locked";
  if (readingDone) steps[1].sub = "Finished · The Renewed Mind";
  steps[2].status = reflectionDone
    ? "done"
    : checkinDone && readingDone && reflectionOpen
      ? "now"
      : "locked";
  if (reflectionDone) steps[2].sub = "Reflection kept";
  return delay(steps);
};

export const completeCheckIn = (data: Omit<CheckIn, "dateISO">) => {
  store.checkIn = { ...data, dateISO: new Date().toISOString() };
  save();
  return delay(store.checkIn, 350);
};

export const completeReflection = () => {
  store.reflectionDoneISO = new Date().toISOString();
  save();
  return delay(true, 350);
};

// Rotate through the pool by calendar day so the same verse doesn't greet
// the user on every surface, every day.
const dayIndex = () => Math.floor(Date.now() / 86_400_000);

export const getVerseOfDay = (): Promise<Verse> =>
  delay(fx.FIGHTING_VERSES[dayIndex() % fx.FIGHTING_VERSES.length]);
export const getSideVerse = (): Promise<Verse> =>
  delay(fx.FIGHTING_VERSES[(dayIndex() + 3) % fx.FIGHTING_VERSES.length]);
export const getFightingVerses = (): Promise<Verse[]> => delay(fx.FIGHTING_VERSES);

export const getGroup = (): Promise<Group> => delay(fx.GROUP);
export const getBanner = (): Promise<BannerEvent> => delay(store.banner);

export const sendStrength = () => {
  store.banner = { ...store.banner, strengthened: true };
  store.weekStats = { ...store.weekStats, brothersReached: store.weekStats.brothersReached + 1 };
  save();
  return delay(store.banner, 400);
};

export const getWeekStats = (): Promise<WeekStats> => delay(store.weekStats);

// ---------- Stand Firm ----------

/**
 * The return after a fall: today goes on the record as fell — and stays
 * there. The Standard never resets; grace keeps the whole story.
 */
export const recordFall = () => {
  const days = [...store.standard.days];
  days[store.standard.day - 1] = "fell";
  store.standard = { ...store.standard, days };
  save();
  return delay(store.standard, 300);
};

export const getDeclarations = (): Promise<string[]> => delay(store.declarations);

export const addDeclaration = (text: string) => {
  const clean = text.trim();
  if (clean && !store.declarations.includes(clean)) {
    store.declarations = [...store.declarations, clean];
    save();
  }
  return delay(store.declarations, 200);
};

export const raiseBanner = (toBrotherIds: string[], template: string) => {
  const request: PrayerRequest = {
    id: uid(),
    toBrotherIds,
    template,
    sentAtISO: new Date().toISOString(),
  };
  store.prayerRequests = [...store.prayerRequests, request];
  store.weekStats = {
    ...store.weekStats,
    urgesRedirected: store.weekStats.urgesRedirected + 1,
    brothersReached: store.weekStats.brothersReached + toBrotherIds.length,
  };
  save();
  return delay(request, 500);
};

export const logRedirect = () => {
  store.weekStats = { ...store.weekStats, urgesRedirected: store.weekStats.urgesRedirected + 1 };
  save();
  return delay(store.weekStats, 200);
};

// ---------- Brotherhood ----------

export const getChannels = (): Promise<Channel[]> => delay(store.channels);
export const getDms = (): Promise<DirectThread[]> => delay(store.dms);

export const getMessages = (threadId: string): Promise<ChatMessage[]> =>
  delay(
    [...store.messages, ...store.dmMessages]
      .filter((m) => m.threadId === threadId)
      .sort((a, b) => a.sentAtISO.localeCompare(b.sentAtISO))
  );

export const sendMessage = (threadId: string, body: string, author: { name: string; initials: string }) => {
  const msg: ChatMessage = {
    id: uid(),
    threadId,
    authorName: author.name,
    authorInitials: author.initials,
    body,
    sentAtISO: new Date().toISOString(),
    own: true,
  };
  const isDm = threadId.startsWith("dm-");
  if (isDm) {
    store.dmMessages = [...store.dmMessages, msg];
    store.dms = store.dms.map((t) =>
      t.id === threadId ? { ...t, lastMessage: body, lastAtISO: msg.sentAtISO } : t
    );
  } else {
    store.messages = [...store.messages, msg];
  }
  save();
  return delay(msg, 300);
};

export const markThreadRead = (threadId: string) => {
  store.channels = store.channels.map((c) => (c.id === threadId ? { ...c, unread: 0 } : c));
  store.dms = store.dms.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t));
  save();
  return delay(true, 50);
};

// ---------- Grow ----------

export const getWeeks = (): Promise<Week[]> => delay(store.weeks);

export const getLesson = (id: string): Promise<Lesson | null> => delay(store.lessons[id] ?? null);

export const completeLesson = (id: string) => {
  const lesson = store.lessons[id];
  if (lesson && !lesson.done) {
    store.lessons = { ...store.lessons, [id]: { ...lesson, done: true } };
    store.weeks = store.weeks.map((w) => ({
      ...w,
      lessons: w.lessons.map((l) => (l.id === id ? { ...l, done: true } : l)),
    }));
    store.weekStats = { ...store.weekStats, readingsFinished: store.weekStats.readingsFinished + 1 };
    save();
  }
  return delay(store.lessons[id], 350);
};

// ---------- Rhythms ----------

export const getRhythms = (): Promise<RhythmState> => delay(store.rhythms);

export const completeRhythm = (kind: RhythmKind) => {
  store.rhythms = { ...store.rhythms, [kind]: true };
  save();
  return delay(store.rhythms, 300);
};

// ---------- Billing ----------

export const getBilling = (): Promise<BillingInfo> => delay(store.billing);
