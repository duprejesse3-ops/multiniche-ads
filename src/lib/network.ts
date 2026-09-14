import type { Platform } from "./types";

export type Slot = {
  id: string;
  format: Platform;
  placement: "leaderboard" | "infeed" | "rail" | "sponsored";
};

export type Article = {
  title: string;
  dek: string;
  byline: string;
  body: string[];
};

export type Publisher = {
  id: string;
  slug: string;
  name: string;
  domain: string;
  kicker: string;
  blurb: string;
  tags: string[];
  slots: Slot[];
  floorCpc: number;
  articles: Article[];
};

export const PUBLISHERS: Publisher[] = [
  {
    id: "pub_findr",
    slug: "findr",
    name: "Findr",
    domain: "findr.net",
    kicker: "Search",
    blurb: "The query box. Search ads auction against the words people type.",
    tags: ["search", "founders", "productivity", "chatgpt", "claude", "github", "marketing"],
    slots: [{ id: "s_findr_1", format: "search", placement: "sponsored" }],
    floorCpc: 0.45,
    articles: [],
  },
  {
    id: "pub_digest",
    slug: "deep-work-digest",
    name: "Deep Work Digest",
    domain: "deepworkdigest.com",
    kicker: "Operators",
    blurb: "Focus, calendars, and the morning block. High overlap with prompt packs.",
    tags: ["founders", "notion", "ops", "productivity", "chatgpt"],
    slots: [
      { id: "s_dw_lead", format: "display", placement: "leaderboard" },
      { id: "s_dw_feed", format: "social", placement: "infeed" },
    ],
    floorCpc: 0.7,
    articles: [
      {
        title: "Protect the first ninety minutes",
        dek: "A calendar that starts at 9:30 is already lost. The block has to be a real object.",
        byline: "Mira Chen · 12 min",
        body: [
          "Most founders do not have a focus problem. They have a calendar that treats deep work as leftover. Meetings land at 9, Slack is already red, and the important thing moves to Friday.",
          "The fix is not a new personality. It is a spec: a named block, a start ritual, and a rule for what is allowed to interrupt it. Write the rule down. The people who interrupt you cannot argue with a document they have not seen.",
          "If you use an assistant, give it the spec, not a vibe. “Protect 7:30–9:00. No scheduling. Surface only P0 pages.” Instruments beat inspiration.",
        ],
      },
      {
        title: "End-of-day reset, written down",
        dek: "The Friday dump is a process. Stop doing it from memory.",
        byline: "Desk staff · 6 min",
        body: [
          "A reset is three lists: still open, waiting on someone, and parked. If it is not on a list, it will return at 11pm as anxiety.",
          "Do it at a fixed time. Do not wait until you “feel done.” You will not.",
        ],
      },
    ],
  },
  {
    id: "pub_ship",
    slug: "ship-log",
    name: "Ship Log",
    domain: "shiplog.dev",
    kicker: "Engineering",
    blurb: "PR risk, review load, the digest an eng manager actually reads.",
    tags: ["github", "engineering", "developers"],
    slots: [
      { id: "s_ship_lead", format: "display", placement: "leaderboard" },
      { id: "s_ship_rail", format: "search", placement: "rail" },
    ],
    floorCpc: 0.85,
    articles: [
      {
        title: "The PR that sat for nine days",
        dek: "Review latency is a product metric. Treat it like one.",
        byline: "Jonah Adeyemi · 9 min",
        body: [
          "We had a 400-line auth change with two comments and a thumbs-up from someone who had not run it. It merged on a Friday. Monday was a rollback.",
          "A daily digest with risk flags — files touched, auth/payments paths, missing tests — would have made the stall visible. Slack did not.",
          "If your “process” is a channel, you do not have a process. You have a hope.",
        ],
      },
    ],
  },
  {
    id: "pub_ops",
    slug: "operator-weekly",
    name: "Operator Weekly",
    domain: "operatorweekly.com",
    kicker: "Sales & CS",
    blurb: "Inbox triage, Make.com, the exception queue. Built for revops.",
    tags: ["sales", "make", "cs", "zapier", "ops"],
    slots: [
      { id: "s_ops_feed", format: "social", placement: "infeed" },
      { id: "s_ops_lead", format: "display", placement: "leaderboard" },
    ],
    floorCpc: 0.9,
    articles: [
      {
        title: "Stop answering the ones a blueprint can draft",
        dek: "Human attention is the scarce SKU. Spend it on exceptions.",
        byline: "Priya Raman · 8 min",
        body: [
          "A CS lead at a 22-person shop showed us her morning: 70 threads, 12 that needed a person, 58 that needed a template and a timestamp.",
          "She now sorts on labels, drafts the 58, and only opens the 12. The blueprint is a Make scenario. It is not a personality hire.",
          "If your inbox is a to-do list, you will never get to the work that makes money.",
        ],
      },
    ],
  },
  {
    id: "pub_desk",
    slug: "desk-notes",
    name: "Desk Notes",
    domain: "desknotes.co",
    kicker: "Marketing",
    blurb: "Calendars, voice lock, pages that convert. Writers and small studios.",
    tags: ["marketing", "content", "writers", "agency", "zapier"],
    slots: [
      { id: "s_desk_feed", format: "social", placement: "infeed" },
      { id: "s_desk_lead", format: "display", placement: "leaderboard" },
    ],
    floorCpc: 0.55,
    articles: [
      {
        title: "Notes in. Posts queued. That is the product.",
        dek: "A calendar that does not draft is a spreadsheet with anxiety.",
        byline: "Ellis Ward · 7 min",
        body: [
          "Most content tools sell a mood board. What a two-person studio needs is a pipe: a note becomes a draft, the draft gets a slot, the slot ships.",
          "Voice lock belongs in the pipe, not in a workshop. If the draft does not sound like you, the calendar is a liability.",
          "Watch it run on a real note before you buy another “AI copilot.”",
        ],
      },
    ],
  },
];

export function publisherBySlug(slug: string) {
  return PUBLISHERS.find((p) => p.slug === slug);
}

export function publisherById(id: string) {
  return PUBLISHERS.find((p) => p.id === id);
}

export const TRENDING_QUERIES = [
  "deep work prompts",
  "inbox automation make.com",
  "claude agent for founders",
  "github pr digest",
  "content calendar zapier",
  "landing page copy prompts",
];
