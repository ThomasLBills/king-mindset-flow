// Faith section content library
// Each type rotates independently with 21-day no-repeat logic

export interface Prayer {
  id: string;
  title: string;
  text: string;
}

export interface Scripture {
  id: string;
  reference: string;
  text: string;
  reflection: string;
}

export interface RenewedMindTruth {
  id: string;
  thoughtId: string;
  truth: string;
}

export const prayers: Prayer[] = [
  {
    id: "prayer-1",
    title: "Morning Surrender",
    text: "Father, I come to You not because I am strong, but because You are. Today, I surrender my thoughts, my desires, and my weaknesses into Your hands. I am Your son, not defined by my failures, but by Your love. Lead me in freedom today.",
  },
  {
    id: "prayer-2",
    title: "Identity Reset",
    text: "Lord, remind me who I am. Not what I have done, not what I feel, but who You say I am. I am chosen. I am loved. I am being made new. Help me walk in that truth today, one moment at a time.",
  },
  {
    id: "prayer-3",
    title: "Strength in Weakness",
    text: "God, I do not have what it takes on my own, and that is okay. Your power is made perfect in my weakness. I invite Your Spirit to fill the places where I am empty. I trust You more than I trust my urges.",
  },
  {
    id: "prayer-4",
    title: "Peace Over Pressure",
    text: "Father, when pressure builds and my mind races, anchor me in Your peace. I do not need to perform for You. I do not need to prove anything. I am already Yours. Help me rest in that truth today.",
  },
  {
    id: "prayer-5",
    title: "Freedom Declaration",
    text: "Lord, I declare that I am no longer a slave to sin. I am a son. The chains that once held me have been broken by Your power. Today, I choose to walk in the freedom You have already won for me.",
  },
  {
    id: "prayer-6",
    title: "Grace for the Battle",
    text: "God, the battle feels real today. But I know that You fight for me. Cover me with Your grace. When I stumble, remind me that Your mercy is new every morning. I am not disqualified. I am loved.",
  },
  {
    id: "prayer-7",
    title: "Heart Alignment",
    text: "Father, align my heart with Yours. When my desires pull me toward what destroys, redirect me toward what gives life. I want to want what You want. Transform my wants from the inside out.",
  },
  {
    id: "prayer-8",
    title: "Present Moment",
    text: "Lord, help me be present right now. Not anxious about later, not ashamed about before. This moment is where I meet You. This moment is where I can choose freedom. I am here with You.",
  },
];

export const scriptures: Scripture[] = [
  {
    id: "scripture-1",
    reference: "2 Corinthians 5:17 (ESV)",
    text: "Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come.",
    reflection: "Your past does not define your future. In Christ, you are already being made new, not because of your effort, but because of His finished work.",
  },
  {
    id: "scripture-2",
    reference: "Romans 8:1 (ESV)",
    text: "There is therefore now no condemnation for those who are in Christ Jesus.",
    reflection: "Shame says you are your mistakes. Truth says you are forgiven and free. Today, walk without condemnation.",
  },
  {
    id: "scripture-3",
    reference: "Galatians 5:1 (ESV)",
    text: "For freedom Christ has set us free; stand firm therefore, and do not submit again to a yoke of slavery.",
    reflection: "Freedom is not earned. It is received. You are not fighting for freedom; you are fighting from it. Stand firm in what is already yours.",
  },
  {
    id: "scripture-4",
    reference: "Philippians 4:13 (ESV)",
    text: "I can do all things through him who strengthens me.",
    reflection: "This is not about willpower. It is about drawing strength from a source greater than yourself. He is your power today.",
  },
  {
    id: "scripture-5",
    reference: "1 John 3:1 (ESV)",
    text: "See what kind of love the Father has given to us, that we should be called children of God; and so we are.",
    reflection: "You are not just forgiven. You are family. A beloved son. Let that identity shape how you see yourself today.",
  },
  {
    id: "scripture-6",
    reference: "Isaiah 43:18-19 (ESV)",
    text: "Remember not the former things, nor consider the things of old. Behold, I am doing a new thing; now it springs forth, do you not perceive it?",
    reflection: "God is not stuck in your past. He is doing something new in you right now. Look forward, not backward.",
  },
  {
    id: "scripture-7",
    reference: "Romans 6:14 (ESV)",
    text: "For sin will have no dominion over you, since you are not under law but under grace.",
    reflection: "Sin does not own you. You are not under its power anymore. Grace has broken the dominion. Walk in that reality.",
  },
  {
    id: "scripture-8",
    reference: "Psalm 103:12 (ESV)",
    text: "As far as the east is from the west, so far does he remove our transgressions from us.",
    reflection: "Your sins are not hovering over you. They have been removed completely. God is not keeping score. Neither should you.",
  },
  {
    id: "scripture-9",
    reference: "2 Timothy 1:7 (ESV)",
    text: "For God gave us a spirit not of fear but of power and love and self-control.",
    reflection: "Fear and shame do not come from God. What He gives you is power, love, and a sound mind. Receive that today.",
  },
  {
    id: "scripture-10",
    reference: "Ephesians 2:10 (ESV)",
    text: "For we are his workmanship, created in Christ Jesus for good works, which God prepared beforehand, that we should walk in them.",
    reflection: "You were made for purpose, not addiction. God has prepared good things for you to walk into. Keep moving forward.",
  },
];

export const commonThoughts = [
  { id: "failing", label: "I'm failing" },
  { id: "escape", label: "I need escape" },
  { id: "never-change", label: "I'll never change" },
  { id: "too-far", label: "I've gone too far" },
  { id: "alone", label: "No one understands" },
];

export const truthStatements: Record<string, string[]> = {
  failing: [
    "Failure is part of learning, not your identity. Every stumble is a chance to rise stronger.",
    "You're not failing-you're fighting. The fact that you care proves you're not who you used to be.",
    "Progress isn't perfection. You're further along than you think.",
  ],
  escape: [
    "The urge to escape is a signal, not a command. True rest comes from presence, not avoidance.",
    "What you're really craving is peace, not pleasure. Only one of those lasts.",
    "Escape promises relief but delivers regret. Face this moment-you can handle it.",
  ],
  "never-change": [
    "Change is already happening. You're here, fighting. That's proof you're not who you were.",
    "The lie says 'never.' Grace says 'not yet finished.' You are being transformed.",
    "Every small choice toward freedom rewires your brain. Change is happening, even when you can't see it.",
  ],
  "too-far": [
    "Grace has no limit. If you can breathe, you can begin again. God's mercy is new every morning.",
    "There is no 'too far' for the One who came to seek and save the lost. You are found.",
    "The enemy wants you to believe you're beyond reach. But God's arm is not too short to save.",
  ],
  alone: [
    "You are not alone. Brothers walk this path with you. Reach out-connection breaks isolation.",
    "Isolation is the enemy's playground. Step into the light with one trusted person.",
    "Millions of men fight this same battle. You're part of a brotherhood, even if you can't see them.",
  ],
  custom: [
    "I am not defined by my urges. I am a son of God, learning to live free.",
    "This thought does not have power over me. I choose to align with truth.",
    "My identity is secure in Christ. This moment will pass; His love will not.",
  ],
};

// Get a random truth for a thought type (used in daily rotation)
export const getDailyTruth = (thoughtId: string, dayIndex: number): string => {
  const truths = truthStatements[thoughtId] || truthStatements.custom;
  return truths[dayIndex % truths.length];
};
