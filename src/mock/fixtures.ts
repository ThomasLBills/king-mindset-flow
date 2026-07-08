import type {
  BannerEvent,
  BillingInfo,
  Channel,
  ChatMessage,
  DirectThread,
  Group,
  Lesson,
  PathStep,
  RhythmState,
  StandardCycle,
  Verse,
  Week,
  WeekStats,
} from "./types";

/** Hours ago → ISO string, so seeded timestamps always read naturally. */
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const daysAgo = (d: number) => hoursAgo(d * 24);

export const GROUP: Group = {
  id: "watchmen",
  name: "The Watchmen",
  members: [
    { id: "b-daniel", name: "Daniel R.", initials: "DR", status: "struggling" },
    { id: "b-josiah", name: "Josiah T.", initials: "JT", status: "steady" },
    { id: "b-marcus", name: "Marcus E.", initials: "ME", status: "steady" },
    { id: "b-andre", name: "Andre K.", initials: "AK", status: "away" },
    { id: "b-samuel", name: "Samuel P.", initials: "SP", status: "steady" },
  ],
};

/** Day 30 of the cycle; days 12, 20, 25, 28 fell and stay on the record. */
export const STANDARD: StandardCycle = {
  day: 30,
  longestRun: 19,
  days: Array.from({ length: 30 }, (_, i) =>
    [12, 20, 25, 28].includes(i + 1) ? "fell" : "held"
  ),
};

export const PATH: PathStep[] = [
  {
    id: "step-checkin",
    kind: "checkin",
    title: "Morning check-in",
    sub: "How are you arriving today?",
    status: "now",
  },
  {
    id: "step-reading",
    kind: "reading",
    title: "The lie beneath the urge",
    sub: "Today's reading · 5 min",
    status: "locked",
    to: "/app/grow/lesson/w3-l3",
  },
  {
    id: "step-reflection",
    kind: "reflection",
    title: "Evening reflection",
    sub: "Opens after 7:00 PM",
    status: "locked",
  },
];

export const VERSE_OF_DAY: Verse = {
  ref: "Ephesians 6:13",
  text:
    "Take up the whole armor of God, that you may be able to withstand in the evil day, and having done all, to stand firm.",
};

export const SIDE_VERSE: Verse = {
  ref: "1 Corinthians 10:13",
  text: "No temptation has overtaken you that is not common to man.",
};

export const FIGHTING_VERSES: Verse[] = [
  VERSE_OF_DAY,
  {
    ref: "1 Corinthians 10:13",
    text:
      "No temptation has overtaken you that is not common to man. God is faithful, and he will not let you be tempted beyond your ability, but with the temptation he will also provide the way of escape.",
  },
  {
    ref: "James 4:7",
    text: "Submit yourselves therefore to God. Resist the devil, and he will flee from you.",
  },
  {
    ref: "2 Timothy 1:7",
    text: "For God gave us a spirit not of fear but of power and love and self-control.",
  },
  {
    ref: "Romans 8:1",
    text: "There is therefore now no condemnation for those who are in Christ Jesus.",
  },
  {
    ref: "Galatians 5:1",
    text:
      "For freedom Christ has set us free; stand firm therefore, and do not submit again to a yoke of slavery.",
  },
  {
    ref: "Psalm 119:9-11",
    text:
      "How can a young man keep his way pure? By guarding it according to your word. I have stored up your word in my heart, that I might not sin against you.",
  },
  {
    ref: "Proverbs 4:23",
    text: "Keep your heart with all vigilance, for from it flow the springs of life.",
  },
  {
    ref: "1 John 1:9",
    text:
      "If we confess our sins, he is faithful and just to forgive us our sins and to cleanse us from all unrighteousness.",
  },
  {
    ref: "Philippians 4:13",
    text: "I can do all things through him who strengthens me.",
  },
];

export const WEEK_STATS: WeekStats = {
  urgesRedirected: 4,
  readingsFinished: 5,
  brothersReached: 2,
};

export const BANNER: BannerEvent = {
  brotherId: "b-daniel",
  name: "Daniel R.",
  initials: "DR",
  when: "2h ago",
  strengthened: false,
};

export const CHANNELS: Channel[] = [
  { id: "ch-session", name: "The Liberated Session", description: "Weekly call recordings. View only.", unread: 0, readOnly: true },
  { id: "ch-hall", name: "The Hall", description: "The main gathering. Open to every brother.", unread: 3 },
  { id: "ch-testimony", name: "Testimonies", description: "Victories worth telling. Post yours.", unread: 1 },
  { id: "ch-prayer", name: "Prayer Wall", description: "Requests and answered prayers.", unread: 0 },
  { id: "ch-account", name: "Accountability", description: "Confess, return, and stay in the light.", unread: 0 },
  { id: "ch-fathers", name: "Fathers", description: "For the men raising the next generation.", unread: 0 },
];

/** Brotherhood ground rules — restored verbatim from the original app. */
export const GROUND_RULES = [
  "Connection matters more than details",
  "Restore with grace, not condemnation",
  "What's spoken here stays here",
];

export const MESSAGES: ChatMessage[] = [
  // The Hall
  { id: "m1", threadId: "ch-hall", authorName: "Josiah T.", authorInitials: "JT", body: "Week 3 reading hit hard this morning. “The urge is a liar with good timing.” Writing that one down.", sentAtISO: hoursAgo(5), own: false },
  { id: "m2", threadId: "ch-hall", authorName: "Samuel P.", authorInitials: "SP", body: "Same. That line about the lie promising relief and delivering shame. Been there too many times to count.", sentAtISO: hoursAgo(4), own: false },
  { id: "m3", threadId: "ch-hall", authorName: "Andre K.", authorInitials: "AK", body: "Grateful for this group, men. Rough weekend but I raised the banner instead of hiding. That's new for me.", sentAtISO: hoursAgo(3), own: false },
  { id: "m4", threadId: "ch-hall", authorName: "Daniel R.", authorInitials: "DR", body: "Proud of you Andre. Coming back quickly is the whole fight.", sentAtISO: hoursAgo(2), own: false },
  // Testimonies
  { id: "m5", threadId: "ch-testimony", authorName: "Samuel P.", authorInitials: "SP", body: "Six months in. My wife told me last night she can tell the difference. Less of the thing, more of me. That's why we fight.", sentAtISO: daysAgo(1), own: false },
  { id: "m6", threadId: "ch-testimony", authorName: "Josiah T.", authorInitials: "JT", body: "This is the good stuff. Thank you for telling it, Sam.", sentAtISO: daysAgo(1), own: false },
  // Prayer wall
  { id: "m7", threadId: "ch-prayer", authorName: "Daniel R.", authorInitials: "DR", body: "Travel week for work. Hotel rooms are my hardest ground. Pray for me, brothers. I'll check in each night.", sentAtISO: hoursAgo(8), own: false },
  { id: "m8", threadId: "ch-prayer", authorName: "Marcus E.", authorInitials: "ME", body: "Standing with you Daniel. Text me any hour. I mean it.", sentAtISO: hoursAgo(7), own: true },
  // Fathers
  { id: "m9", threadId: "ch-fathers", authorName: "Andre K.", authorInitials: "AK", body: "My son turns 13 this month. Starting to think about how I talk to him about all this, and what I wish someone had told me at his age.", sentAtISO: daysAgo(2), own: false },
  // The Liberated Session (view only)
  { id: "m10", threadId: "ch-session", authorName: "LK Team", authorInitials: "LK", body: "Recording: Brotherhood Call, week of June 30. The Renewed Mind, part one. Worth a second listen if you're in Week 3.", sentAtISO: daysAgo(6), own: false },
  { id: "m11", threadId: "ch-session", authorName: "LK Team", authorInitials: "LK", body: "Recording: Brotherhood Call, week of July 7. Josiah shared his story at the 40-minute mark. Don't skip it.", sentAtISO: daysAgo(1), own: false },
  // Accountability
  { id: "m12", threadId: "ch-account", authorName: "Andre K.", authorInitials: "AK", body: "Fell on Saturday. Back on my feet Sunday morning, told my wife, called Daniel. Posting here because hiding is what almost kept me down.", sentAtISO: daysAgo(2), own: false },
  { id: "m13", threadId: "ch-account", authorName: "Josiah T.", authorInitials: "JT", body: "That's the covenant, brother. Quick return. Proud of you.", sentAtISO: daysAgo(2), own: false },
];

export const DMS: DirectThread[] = [
  { id: "dm-daniel", brotherId: "b-daniel", name: "Daniel R.", initials: "DR", lastMessage: "Thanks brother. Landing Tuesday. First night is the test.", lastAtISO: hoursAgo(1), unread: 1 },
  { id: "dm-josiah", brotherId: "b-josiah", name: "Josiah T.", initials: "JT", lastMessage: "Good word this morning. See you on the call.", lastAtISO: daysAgo(1), unread: 0 },
  { id: "dm-samuel", brotherId: "b-samuel", name: "Samuel P.", initials: "SP", lastMessage: "Six months. Grace upon grace, man.", lastAtISO: daysAgo(3), unread: 0 },
  { id: "dm-andre", brotherId: "b-andre", name: "Andre K.", initials: "AK", lastMessage: "Offline this week, camping with the family. Pray for good talks with my son.", lastAtISO: daysAgo(4), unread: 0 },
];

export const DM_MESSAGES: ChatMessage[] = [
  { id: "d1", threadId: "dm-daniel", authorName: "Daniel R.", authorInitials: "DR", body: "Hey, travel week coming up. Hotel rooms are where I've fallen before.", sentAtISO: hoursAgo(2), own: false },
  { id: "d2", threadId: "dm-daniel", authorName: "Marcus E.", authorInitials: "ME", body: "Then we plan for it. Text me when you land, and again before you sleep. Every night.", sentAtISO: hoursAgo(1.5), own: true },
  { id: "d3", threadId: "dm-daniel", authorName: "Daniel R.", authorInitials: "DR", body: "Thanks brother. Landing Tuesday. First night is the test.", sentAtISO: hoursAgo(1), own: false },
  { id: "d4", threadId: "dm-josiah", authorName: "Josiah T.", authorInitials: "JT", body: "Good word this morning. See you on the call.", sentAtISO: daysAgo(1), own: false },
  { id: "d5", threadId: "dm-samuel", authorName: "Samuel P.", authorInitials: "SP", body: "Six months. Grace upon grace, man.", sentAtISO: daysAgo(3), own: false },
  { id: "d6", threadId: "dm-andre", authorName: "Andre K.", authorInitials: "AK", body: "Offline this week, camping with the family. Pray for good talks with my son.", sentAtISO: daysAgo(4), own: false },
];

const LESSON_BODIES: Record<string, { body: string[]; reflection: string; scripture?: Verse }> = {
  "w3-l3": {
    scripture: {
      ref: "Romans 12:2",
      text:
        "Do not be conformed to this world, but be transformed by the renewal of your mind, that by testing you may discern what is the will of God.",
    },
    body: [
      "Every urge arrives carrying a message, and the message is always the same: this will help. Relief is one click away. You have had a hard day, and you deserve something for it. The urge never announces itself as your enemy. It comes dressed as a friend with your interests at heart.",
      "But walk the promise backward. Did it ever deliver? The relief lasted minutes; the shame moved in for days. The thing that promised to make you feel like a man left you feeling less of one. That is not a helper. That is a lie with good timing.",
      "Naming the lie matters because you cannot fight fog. As long as the urge stays a feeling, vast and urgent and inevitable, it wins by weight. The moment you put words to it (\"this is the old promise, and it has never once been kept\") it becomes an argument. And arguments can be answered.",
      "This is what Scripture means by the renewal of the mind. Not trying harder. Not white-knuckling the same thoughts. Replacing the script: testing the promise against the record, and letting the record speak.",
      "Today, when the pull comes, and it may, do one thing before anything else: say the lie out loud. Name what it is promising. Then ask the only question that matters. Has it ever kept that promise?",
    ],
    reflection: "What does the urge usually promise you, in your own words? Write the promise down, then write what it actually delivered last time.",
  },
  "w3-l4": {
    scripture: {
      ref: "2 Corinthians 10:5",
      text:
        "We destroy arguments and every lofty opinion raised against the knowledge of God, and take every thought captive to obey Christ.",
    },
    body: [
      "Yesterday you learned to name the lie. Today you learn what to do with it once it has a name. Paul's word for it is capture: the thought gets taken prisoner, not entertained as a guest.",
      "Notice what the verse does not say. It does not say you can stop the thought from arriving. Thoughts arrive. A knock on the door is not a sin; opening the door, pouring it a drink, and letting it talk for an hour is where the fight is lost.",
      "So here is the drill, and it takes ten seconds. One: catch it. The moment you notice the thought, say to yourself, that is a thought, not a command. Two: name it. Out loud if you can. \"That is the old promise again.\" Three: sentence it. Tell it what it is guilty of: the shame, the hiding, the man it made you at your worst. Four: replace it. A captured cell cannot stay empty. Put a verse, your why, or a brother's name in the space it held.",
      "The drill feels mechanical at first. Good. Mechanical is what you want at 11 PM when nothing spiritual feels true. You are not trying to feel free in that moment; you are running a procedure until the wave passes, and it will pass.",
      "Run it today on a small thought, one with no heat in it, just for practice. Men who only rehearse under fire lose under fire.",
    ],
    reflection:
      "Practice the four steps once today on a low-stakes thought and write down what you replaced it with. What will you reach for at step four when it counts?",
  },
  default: {
    body: [
      "A man does not drift into freedom. He walks there, one ordinary day at a time, on a road other men have walked before him.",
      "This lesson is part of your path for the week. Read it slowly. The goal is not more information. The goal is a changed mind, and that change moves at the speed of honesty.",
      "Take the words with you into the day. One idea, truly carried, outweighs ten merely understood.",
    ],
    reflection: "What one line from today's reading do you need to carry into tomorrow?",
  },
};

interface LessonSeed {
  id: string;
  title: string;
  minutes: number;
  done: boolean;
}

const WEEK_SEEDS: { number: number; title: string; theme: string; locked: boolean; lessons: LessonSeed[] }[] = [
  {
    number: 1,
    title: "Waking Up",
    theme: "Seeing the fight clearly for the first time.",
    locked: false,
    lessons: [
      { id: "w1-l1", title: "The war you were born into", minutes: 5, done: true },
      { id: "w1-l2", title: "Why willpower was never the plan", minutes: 5, done: true },
      { id: "w1-l3", title: "The first honest inventory", minutes: 6, done: true },
      { id: "w1-l4", title: "What freedom is actually for", minutes: 5, done: true },
    ],
  },
  {
    number: 2,
    title: "Out of Hiding",
    theme: "Shame dies in the light of brotherhood.",
    locked: false,
    lessons: [
      { id: "w2-l1", title: "The isolation playbook", minutes: 5, done: true },
      { id: "w2-l2", title: "Confession is a weapon", minutes: 6, done: true },
      { id: "w2-l3", title: "Choosing your watchmen", minutes: 5, done: true },
      { id: "w2-l4", title: "The covenant of quick return", minutes: 5, done: true },
    ],
  },
  {
    number: 3,
    title: "The Renewed Mind",
    theme: "Replacing the script the urge runs on.",
    locked: false,
    lessons: [
      { id: "w3-l1", title: "Thoughts are not commands", minutes: 5, done: true },
      { id: "w3-l2", title: "The 20-minute wave", minutes: 5, done: true },
      { id: "w3-l3", title: "The lie beneath the urge", minutes: 5, done: false },
      { id: "w3-l4", title: "Taking every thought captive", minutes: 6, done: false },
    ],
  },
  {
    number: 4,
    title: "The Body",
    theme: "Your body is terrain. Learn to hold it.",
    locked: true,
    lessons: [
      { id: "w4-l1", title: "Triggers live in the body first", minutes: 5, done: false },
      { id: "w4-l2", title: "Sleep, stress, and the open gate", minutes: 5, done: false },
      { id: "w4-l3", title: "Movement as counterattack", minutes: 5, done: false },
      { id: "w4-l4", title: "Building the daily guard", minutes: 6, done: false },
    ],
  },
  {
    number: 5,
    title: "The Wound",
    theme: "What the habit was medicating.",
    locked: true,
    lessons: [
      { id: "w5-l1", title: "Every escape has a reason", minutes: 6, done: false },
      { id: "w5-l2", title: "Naming the pain honestly", minutes: 6, done: false },
      { id: "w5-l3", title: "Grief, anger, and the Father", minutes: 6, done: false },
      { id: "w5-l4", title: "Healing is not a detour", minutes: 5, done: false },
    ],
  },
  {
    number: 6,
    title: "The Fall & The Return",
    theme: "Grace that gets you up faster than shame knocked you down.",
    locked: true,
    lessons: [
      { id: "w6-l1", title: "What to do in the first hour", minutes: 5, done: false },
      { id: "w6-l2", title: "The what-the-hell effect", minutes: 5, done: false },
      { id: "w6-l3", title: "Repentance without self-hatred", minutes: 6, done: false },
      { id: "w6-l4", title: "The record of grace", minutes: 5, done: false },
    ],
  },
  {
    number: 7,
    title: "The Guard",
    theme: "Building a life the enemy can't ambush.",
    locked: true,
    lessons: [
      { id: "w7-l1", title: "Environment beats intention", minutes: 5, done: false },
      { id: "w7-l2", title: "The rhythms that hold", minutes: 5, done: false },
      { id: "w7-l3", title: "Brotherhood for the long haul", minutes: 5, done: false },
      { id: "w7-l4", title: "Your personal battle plan", minutes: 7, done: false },
    ],
  },
  {
    number: 8,
    title: "The King",
    theme: "Freedom is for something. Go be it.",
    locked: true,
    lessons: [
      { id: "w8-l1", title: "From fighting to building", minutes: 5, done: false },
      { id: "w8-l2", title: "The people entrusted to you", minutes: 5, done: false },
      { id: "w8-l3", title: "Becoming a watchman for others", minutes: 5, done: false },
      { id: "w8-l4", title: "The charge", minutes: 6, done: false },
    ],
  },
];

export const WEEKS: Week[] = WEEK_SEEDS.map((w) => ({
  id: `week-${w.number}`,
  number: w.number,
  title: w.title,
  theme: w.theme,
  locked: w.locked,
  lessons: w.lessons.map(({ id, title, minutes, done }) => ({ id, title, minutes, done })),
}));

export const LESSONS: Record<string, Lesson> = Object.fromEntries(
  WEEK_SEEDS.flatMap((w) =>
    w.lessons.map((l) => {
      const content = LESSON_BODIES[l.id] ?? LESSON_BODIES.default;
      return [
        l.id,
        {
          id: l.id,
          weekNumber: w.number,
          weekTitle: w.title,
          title: l.title,
          minutes: l.minutes,
          scripture: content.scripture,
          body: content.body,
          reflection: content.reflection,
          done: l.done,
        } satisfies Lesson,
      ];
    })
  )
);

export const RHYTHMS: RhythmState = {
  prayer: true,
  scripture: false,
  renewedMind: false,
  gratitude: false,
};

export const BILLING: BillingInfo = {
  plan: "Brotherhood, annual",
  price: "$99 / year",
  renewsAtISO: new Date(Date.now() + 214 * 24 * 3_600_000).toISOString(),
  invoices: [
    { id: "inv-3", dateISO: daysAgo(151), amount: "$99.00", status: "paid" },
    { id: "inv-2", dateISO: daysAgo(516), amount: "$99.00", status: "paid" },
    { id: "inv-1", dateISO: daysAgo(881), amount: "$99.00", status: "paid" },
  ],
};

/** Weekly brotherhood call. Real detail (Tue 6 PM Central), not the mockup's invented one. */
export const WEEKLY_CALL = {
  label: "Tuesday · 6:00 PM Central",
  joinUrl: "https://meet.liberatedkings.com/brotherhood",
};

export const PRAYER_TEMPLATES = [
  "Brothers, the pull is strong right now. Stand with me.",
  "In the fight this hour. Pray I hold the line.",
  "Tempted and tired. I'm not hiding it. Pray for me.",
];
