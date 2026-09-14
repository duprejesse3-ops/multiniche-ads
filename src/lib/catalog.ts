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
  },
];
