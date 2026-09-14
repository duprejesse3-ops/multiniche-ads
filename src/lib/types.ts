export const PLATFORMS = ["search", "social", "display", "video"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const OBJECTIVES = ["awareness", "traffic", "conversions", "leads"] as const;
export type Objective = (typeof OBJECTIVES)[number];

export const STATUSES = ["draft", "active", "paused", "ended"] as const;
export type CampaignStatus = (typeof STATUSES)[number];

export type AdCreative = {
  id: string;
  format: Platform;
  headline: string;
  subhead: string;
  body: string;
  cta: string;
  imageUrl?: string;
};

export type Audience = {
  id: string;
  name: string;
  description: string;
  size: string;
  affinity: number;
  tags: string[];
};

export type DailyStat = {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
};

export type RivalBid = {
  campaignId: string;
  brand: string;
  rank: number;
};

export type AuctionEvent = {
  id: string;
  ts: string;
  pageviewId: string;
  publisherId: string;
  slotId: string;
  format: Platform;
  query?: string;
  campaignId?: string;
  creativeId?: string;
  brand?: string;
  headline?: string;
  owned?: boolean;
  bid: number;
  price: number;
  quality: number;
  rank: number;
  outcome: "won" | "no_fill";
  rivals: RivalBid[];
  clicked?: boolean;
  converted?: boolean;
  simulated?: boolean;
  pageUrl?: string;
  siteHost?: string;
};

export type Campaign = {
  id: string;
  name: string;
  brand: string;
  product: string;
  status: CampaignStatus;
  objective: Objective;
  platforms: Platform[];
  dailyBudget: number;
  cpcBid: number;
  destination: string;
  owned: boolean;
  aov: number;
  strategy: string;
  targeting: string;
  creatives: AdCreative[];
  audiences: Audience[];
  stats: DailyStat[];
  createdAt: string;
};

export type LibraryItem = AdCreative & {
  brand: string;
  product: string;
  savedAt: string;
};

export type DeskBrief = {
  text: string;
  writtenAt: string;
};

export type OptimizeNote = {
  summary: string;
  actions: { title: string; detail: string }[];
};

export type OpenSite = {
  id: string;
  domain: string;
  name: string;
  tags: string[];
  hits: number;
  lastSeen: string;
};

