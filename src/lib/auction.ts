import type { Publisher, Slot } from "./network";
import type { AdCreative, AuctionEvent, Campaign, DailyStat, Platform, RivalBid } from "./types";

export function todayISO(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function emptyDay(date: string): DailyStat {
  return { date, impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 };
}

export function spendOnDate(c: Campaign, date: string) {
  return c.stats.find((s) => s.date === date)?.spend ?? 0;
}

export function dayOf(c: Campaign, date: string) {
  return c.stats.find((s) => s.date === date) ?? emptyDay(date);
}

function haystack(c: Campaign) {
  return [
    c.targeting,
    c.product,
    c.name,
    c.strategy,
    c.brand,
    ...c.audiences.flatMap((a) => [a.name, a.description, ...a.tags]),
  ]
    .join(" ")
    .toLowerCase();
}

function queryFit(campaign: Campaign, query?: string) {
  const q = (query ?? "").trim().toLowerCase();
  if (!q) return 1;
  const hay = haystack(campaign);
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  const hits = words.filter((w) => hay.includes(w)).length;
  let score = words.length ? hits / words.length : 0.5;
  const collapsed = hay.replace(/[^a-z0-9]+/g, " ");
  const phrase = q.replace(/s\b/g, "").trim();
  if (collapsed.includes(q) || (phrase.length > 4 && collapsed.includes(phrase))) {
    score = Math.max(score, 0.95);
  }
  return score;
}

export function qualityScore(campaign: Campaign, publisher: Publisher, query?: string) {
  const hay = haystack(campaign);
  const tags = publisher.tags;
  const tagHits = tags.filter((t) => hay.includes(t.toLowerCase())).length;
  const tagScore = tags.length ? tagHits / tags.length : 0.5;
  const q = (query ?? "").trim();
  const qScore = q ? queryFit(campaign, query) : 0.5;
  const queryWeight = q ? 0.6 : 0;
  const raw = tagScore * (1 - queryWeight) + qScore * queryWeight;
  return Math.round((0.32 + raw * 0.68) * 100) / 100;
}

export function pickCreative(campaign: Campaign, format: Platform): AdCreative | null {
  return campaign.creatives.find((c) => c.format === format) ?? campaign.creatives[0] ?? null;
}

function unit(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return (h >>> 0) / 2 ** 32;
}

export function clickProbability(format: Platform, quality: number) {
  const base = format === "search" ? 0.055 : format === "social" ? 0.014 : format === "video" ? 0.02 : 0.009;
  return Math.min(0.14, Math.max(0.003, base * (quality / 0.65)));
}

export function conversionProbability(campaign: Campaign, quality: number) {
  const base =
    campaign.objective === "conversions" ? 0.055 : campaign.objective === "leads" ? 0.08 : 0.022;
  return Math.min(0.22, Math.max(0.01, base * quality));
}

type Ranked = {
  campaign: Campaign;
  creative: AdCreative;
  quality: number;
  bid: number;
  rank: number;
};

export function eligibleCampaigns(
  campaigns: Campaign[],
  slot: Slot,
  date: string,
): Campaign[] {
  return campaigns.filter((c) => {
    if (c.status !== "active") return false;
    if (spendOnDate(c, date) >= c.dailyBudget) return false;
    const formatOk =
      c.platforms.includes(slot.format) || c.creatives.some((cr) => cr.format === slot.format);
    return formatOk && pickCreative(c, slot.format) !== null;
  });
}

export function runAuction(opts: {
  publisher: Publisher;
  slot: Slot;
  campaigns: Campaign[];
  pageviewId: string;
  query?: string;
  now?: Date;
}): AuctionEvent {
  const now = opts.now ?? new Date();
  const date = todayISO(now);
  const pool = eligibleCampaigns(opts.campaigns, opts.slot, date);

  const ranked: Ranked[] = pool
    .map((campaign) => {
      const creative = pickCreative(campaign, opts.slot.format)!;
      const quality = qualityScore(campaign, opts.publisher, opts.query);
      const bid = Math.max(campaign.cpcBid, 0.05);
      const fit = queryFit(campaign, opts.query);
      const relevance = opts.query ? 0.42 + 0.58 * fit : 1;
      return { campaign, creative, quality, bid, rank: bid * quality * relevance };
    })
    .sort((a, b) => b.rank - a.rank || b.quality - a.quality);

  const id = `ax_${now.getTime().toString(36)}_${Math.floor(unit(opts.pageviewId + opts.slot.id) * 1e5).toString(36)}`;
  const ts = now.toISOString();

  if (!ranked.length) {
    return {
      id,
      ts,
      pageviewId: opts.pageviewId,
      publisherId: opts.publisher.id,
      slotId: opts.slot.id,
      format: opts.slot.format,
      query: opts.query,
      bid: 0,
      price: 0,
      quality: 0,
      rank: 0,
      outcome: "no_fill",
      rivals: [],
    };
  }

  const winner = ranked[0];
  const second = ranked[1];
  let price = second
    ? second.rank / Math.max(winner.quality, 0.1) + 0.01
    : Math.max(opts.publisher.floorCpc, winner.bid * 0.62);
  price = Math.min(winner.bid, Math.max(opts.publisher.floorCpc, price));
  price = Math.round(price * 100) / 100;

  const rivals: RivalBid[] = ranked.slice(1, 4).map((r) => ({
    campaignId: r.campaign.id,
    brand: r.campaign.brand,
    rank: Math.round(r.rank * 100) / 100,
  }));

  return {
    id,
    ts,
    pageviewId: opts.pageviewId,
    publisherId: opts.publisher.id,
    slotId: opts.slot.id,
    format: opts.slot.format,
    query: opts.query,
    campaignId: winner.campaign.id,
    creativeId: winner.creative.id,
    brand: winner.campaign.brand,
    headline: winner.creative.headline,
    owned: winner.campaign.owned,
    bid: winner.bid,
    price,
    quality: winner.quality,
    rank: Math.round(winner.rank * 100) / 100,
    outcome: "won",
    rivals,
  };
}

export function applyImpression(campaign: Campaign, date: string): Campaign {
  const stats = campaign.stats.slice();
  const i = stats.findIndex((s) => s.date === date);
  if (i === -1) stats.push({ ...emptyDay(date), impressions: 1 });
  else stats[i] = { ...stats[i], impressions: stats[i].impressions + 1 };
  return { ...campaign, stats };
}

export function applyClick(
  campaign: Campaign,
  date: string,
  price: number,
  converted: boolean,
): Campaign {
  const stats = campaign.stats.slice();
  const i = stats.findIndex((s) => s.date === date);
  const conv = converted ? 1 : 0;
  const rev = converted ? campaign.aov : 0;
  if (i === -1) {
    stats.push({
      ...emptyDay(date),
      clicks: 1,
      spend: price,
      conversions: conv,
      revenue: rev,
    });
  } else {
    const s = stats[i];
    stats[i] = {
      ...s,
      clicks: s.clicks + 1,
      spend: Math.round((s.spend + price) * 100) / 100,
      conversions: s.conversions + conv,
      revenue: Math.round((s.revenue + rev) * 100) / 100,
    };
  }
  return { ...campaign, stats };
}

export function shouldSimulateClick(event: AuctionEvent) {
  if (event.outcome !== "won") return false;
  return unit(event.id + "clk") < clickProbability(event.format, event.quality);
}

export function shouldConvert(campaign: Campaign, event: AuctionEvent) {
  return unit(event.id + "cv") < conversionProbability(campaign, event.quality);
}

export function suggestedBid(platforms: Platform[], dailyBudget: number) {
  const base = platforms.includes("search") ? 1.7 : platforms.includes("social") ? 1.15 : 0.85;
  const scaled = base * Math.sqrt(dailyBudget / 400);
  return Math.round(Math.min(6, Math.max(0.4, scaled)) * 100) / 100;
}
