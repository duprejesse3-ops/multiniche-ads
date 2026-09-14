import type { Objective, Platform } from "./types";

export const STORE = {
  name: "Multiniche AI",
  host: "multinicheai.com",
  href: "https://multinicheai.com",
  line: "Prompt packs, automations, and agent configs — built once, sold as instruments.",
} as const;

export type CatalogSku = {
  id: string;
  name: string;
  role: string;
  format: string;
  price: number;
  blurb: string;
  offer: string;
  objective: Objective;
  platforms: Platform[];
  notes: string;
  spec: string;
  sample: string;
  license: string;
};

export const CATALOG: CatalogSku[] = [
  {
    id: "AI-PP-001",
    name: "Deep Work Prompt Pack",
    role: "Founders & Ops",
    format: "Prompt Pack",
    price: 19,
    blurb: "120 prompts for prioritization, focus blocks, and end-of-day resets. PDF + Notion.",
    offer: "$19 one-time. Watch it run on your own task first.",
    objective: "conversions",
    platforms: ["search", "social"],
    notes: "Spec sheet, not a pitch. Solo founders drowning in meetings. Compatible with Claude, ChatGPT, Gemini.",
    spec: "You are the morning operator. Calendar: seven meetings, one unblocked 90 minutes at 8:30. The one outcome that makes today a win is the pricing page. Write (1) the deep-work block with a start ritual, (2) the three items that wait, (3) a 6pm shutdown line. No generic advice.",
    sample:
      "8:30–10:00. Phone in the other room. Start ritual: open only the pricing Notion doc. Parking: investor update, invoice chase, hiring doc. Shutdown: pricing page is in Notion; Maya’s two comments are first tomorrow.",
    license: "One-time. Yours to keep. PDF + Notion.",
  },
  {
    id: "AI-AB-002",
    name: "Inbox Zero Automation",
    role: "Sales & CS",
    format: "Automation",
    price: 29,
    blurb: "Auto-sorts, drafts replies, and flags what needs a human. Make.com blueprint.",
    offer: "$29 one-time. Try the live proof before you buy.",
    objective: "conversions",
    platforms: ["search", "social"],
    notes: "Sales and CS operators. Make.com. No recurring charge.",
    spec: "Classify this thread. Subject: “Pricing for 12 seats — looping in finance.” Last message is a 400-word maybe. Output JSON: {bucket: needs-human|draft|archive, draft: string, reason: string}.",
    sample:
      '{ "bucket": "needs-human", "draft": "", "reason": "Finance is looped and they asked for a custom 12-seat number. Do not auto-send a price." }',
    license: "One-time Make.com blueprint. No seat.",
  },
  {
    id: "AI-AG-003",
    name: "Meeting Notes Agent",
    role: "Founders & Ops",
    format: "Agent Config",
    price: 15,
    blurb: "Turns raw transcripts into decisions, owners, and deadlines.",
    offer: "$15 one-time. First agent run is free.",
    objective: "conversions",
    platforms: ["search", "social"],
    notes: "Founders with too many meetings. System prompt + template.",
    spec: "Transcript: 22 minutes, three people. Extract decisions, owners, deadlines. Drop anything that was just venting. Table only.",
    sample:
      "Decision: ship the pricing page Friday. Owner: Maya. Deadline: Friday 3pm. Decision: pause the agency. Owner: you. Deadline: Monday standup. Dropped: the rant about Slack.",
    license: "One-time system prompt + template.",
  },
  {
    id: "AI-AB-005",
    name: "Content Calendar Autopilot",
    role: "Marketers",
    format: "Automation",
    price: 24,
    blurb: "Drafts posts from your notes and queues them by channel. Zapier blueprint.",
    offer: "$24 one-time. 15% off when you add two more tools.",
    objective: "traffic",
    platforms: ["social", "display"],
    notes: "Marketers shipping content. Zapier. Watch it draft from a real note.",
    spec: "Note: “Shipped the digest. People asked how we pick SKUs.” Draft one X post, one LinkedIn line, one newsletter lede. Same fact, three registers. No hashtags.",
    sample:
      "X: We pick SKUs by the job, not the tool. LinkedIn: The catalog is a job board for software. Newsletter: How we choose what to build next — one job per SKU.",
    license: "One-time Zapier blueprint.",
  },
  {
    id: "AI-TP-007",
    name: "Client Onboarding Kit",
    role: "Sales & CS",
    format: "Doc Template",
    price: 34,
    blurb: "Intake form, welcome sequence, and kickoff checklist. Notion + email.",
    offer: "$34 one-time. Instant digital download.",
    objective: "conversions",
    platforms: ["search", "display"],
    notes: "Agencies and CS leads. Spec the kit, don't sell a lifestyle.",
    spec: "New client: a 6-person studio, $4k/mo, kickoff Thursday. Produce the intake questions we still don't know, the welcome email, and the 7-item kickoff checklist.",
    sample:
      "Intake: who signs, where files live, what “done” means. Welcome: Thursday 10:00, bring the last three deliverables. Kickoff: access, success metric, silent hours, invoice path, first draft date.",
    license: "One-time Notion + email kit.",
  },
  {
    id: "AI-PP-011",
    name: "Writing Style Prompt Kit",
    role: "Writers",
    format: "Prompt Pack",
    price: 16,
    blurb: "Locks tone and voice so drafts sound like you. 30 prompts · PDF.",
    offer: "$16 one-time. Works in Claude, ChatGPT, Gemini.",
    objective: "conversions",
    platforms: ["social", "search"],
    notes: "Writers who hate generic AI voice. Show the lock, not the muse.",
    spec: "Voice lock: short sentences. No 'delve'. No throat-clearing. Rewrite: “In today’s fast-paced world, leverage AI to unlock your potential.”",
    sample: "Stop announcing the era. Use the tool on one page, today.",
    license: "One-time. 30 prompts · PDF.",
  },
  {
    id: "AI-PP-014",
    name: "Landing Page Copy Prompts",
    role: "Marketers",
    format: "Prompt Pack",
    price: 18,
    blurb: "Headline, hero, and CTA variants tuned for conversion testing. 35 prompts.",
    offer: "$18 one-time. Watch a free run on your page.",
    objective: "conversions",
    platforms: ["search", "social"],
    notes: "Marketers testing pages. Spec sheet of what the pack outputs.",
    spec: "Product: a $19 deep-work prompt pack. Audience: solo founders. Write 3 headlines that name the job, not the vibe. One CTA.",
    sample:
      "A spec for the first ninety minutes. / 120 prompts. One focus block. / Write the morning down before the calendar does. CTA: Watch it run.",
    license: "One-time. 35 prompts.",
  },
  {
    id: "AI-AB-013",
    name: "Code Review Digest",
    role: "Developers",
    format: "Automation",
    price: 26,
    blurb: "Summarizes open PRs into a daily digest with risk flags. GitHub Actions.",
    offer: "$26 one-time. Blueprint, not a seat license.",
    objective: "traffic",
    platforms: ["search"],
    notes: "Engineering leads. GitHub Actions. Concrete risk flags, no DevRel fluff.",
    spec: "Open PRs: auth-rewrite (9 days, 40 files), copy-tweak (2 hours, 1 file), bump-deps (14 days, lockfile only). Rank by risk. One line each. No cheerleading.",
    sample:
      "1. auth-rewrite — 9 days, 40 files, no reviewer. 2. bump-deps — 14 days, lockfile, silent. 3. copy-tweak — ship it.",
    license: "One-time GitHub Action. Not a seat.",
  },
  {
    id: "AI-STUDIO",
    name: "Claude Agent Studio",
    role: "Everyone",
    format: "Agent",
    price: 9,
    blurb: "Rent a Claude agent by the run — investor update, pricing analysis, migration plan. Prepaid credits from $9.",
    offer: "Credits from $9. 1 credit per quick run. Never expire.",
    objective: "leads",
    platforms: ["search", "display"],
    notes: "Metered Claude runs. No account needed to start. First run free.",
    spec: "Task: 8-line investor update. Facts: $42k MRR, +11% month, one hire (ops), runway 9 months. No adjectives. Owners at the end.",
    sample:
      "MRR $42k, +11% m/m. Hired ops. Runway 9 months. Next: pricing page this week. Owner: Maya.",
    license: "Prepaid credits. First run free. Never expire.",
  },
];
