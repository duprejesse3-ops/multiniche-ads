import {
  applyClick,
  applyImpression,
  applyRun,
  pickCreative,
  runAuction,
  shouldConvert,
  shouldSimulateClick,
  shouldSimulateRun,
  todayISO,
} from "./auction";
import { getSql } from "./db";
import { PUBLISHERS, publisherById, type Publisher, type Slot } from "./network";
import { asOffer, attachProof, bindSpec, clipTask, runPrice } from "./proof";
import { seedCampaigns } from "./seed";
import type { AdCreative, AgentOffer, AuctionEvent, Campaign, OpenSite, PageTask, Platform } from "./types";

const TAPE_CAP = 140;

export type ServeResult = {
  event: AuctionEvent;
  campaign: Campaign | null;
  creative: AdCreative | null;
  clickUrl: string;
  runUrl: string;
  offer: AgentOffer | null;
};

function parseBody<T>(raw: unknown): T {
  if (typeof raw === "string") return JSON.parse(raw) as T;
  return raw as T;
}

function asSlot(format: Platform, slotId: string): Slot {
  return {
    id: slotId,
    format,
    placement:
      format === "search" ? "sponsored" : format === "social" ? "infeed" : "leaderboard",
  };
}

function pack(origin: string, eventId: string, campaign: Campaign | null) {
  const clickUrl = `${origin}/api/ads/click?e=${encodeURIComponent(eventId)}`;
  const runUrl = `${origin}/api/ads/run?e=${encodeURIComponent(eventId)}`;
  const withProof = campaign ? attachProof(campaign) : null;
  return {
    clickUrl,
    runUrl,
    offer: withProof ? asOffer({ campaign: withProof, clickUrl, runUrl }) : null,
  };
}

export function resolvePublisher(opts: {
  publisherId?: string;
  host?: string;
  tags?: string[];
  format: Platform;
  slotId: string;
}): Publisher {
  if (opts.publisherId) {
    const known = publisherById(opts.publisherId);
    if (known) return known;
  }
  const host = (opts.host ?? "open-web").replace(/^www\./, "").toLowerCase() || "open-web";
  const tags =
    opts.tags && opts.tags.length
      ? opts.tags
      : ["founders", "productivity", "chatgpt", "ops", "marketing"];
  return {
    id: `web_${host.replace(/[^a-z0-9.-]/g, "_")}`,
    slug: host,
    name: host,
    domain: host,
    kicker: "Open web",
    blurb: "Third-party page on the Multiniche exchange.",
    tags,
    slots: [asSlot(opts.format, opts.slotId)],
    floorCpc: 0.55,
    articles: [],
  };
}

export async function ensureSeeded() {
  const sql = await getSql();
  const rows = await sql<{ n: number }>`select count(*)::int as n from campaigns`;
  if ((rows[0]?.n ?? 0) > 0) return;
  for (const c of seedCampaigns()) {
    await sql.query(
      `insert into campaigns (id, body, updated_at) values ($1, $2::jsonb, now())
       on conflict (id) do nothing`,
      [c.id, JSON.stringify(c)],
    );
  }
}

export async function listCampaigns(): Promise<Campaign[]> {
  await ensureSeeded();
  const sql = await getSql();
  const rows = await sql<{ id: string; body: unknown }>`
    select id, body from campaigns
  `;
  const list = rows.map((r) => attachProof(parseBody<Campaign>(r.body)));
  list.sort((a, b) => (a.owned === b.owned ? 0 : a.owned ? -1 : 1));
  return list;
}

export async function listTape(): Promise<AuctionEvent[]> {
  const sql = await getSql();
  const rows = await sql<{ body: unknown }>`
    select body from auction_events order by created_at desc limit ${TAPE_CAP}
  `;
  return rows.map((r) => parseBody<AuctionEvent>(r.body));
}

export async function listOpenSites(): Promise<OpenSite[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    domain: string;
    name: string;
    tags: unknown;
    hits: number;
    last_seen: string | Date;
  }>`
    select id, domain, name, tags, hits, last_seen from open_sites
    order by last_seen desc
  `;
  return rows.map((r) => ({
    id: r.id,
    domain: r.domain,
    name: r.name,
    tags: parseBody<string[]>(r.tags),
    hits: Number(r.hits),
    lastSeen:
      r.last_seen instanceof Date
        ? r.last_seen.toISOString()
        : typeof r.last_seen === "string"
          ? r.last_seen
          : new Date(r.last_seen).toISOString(),
  }));
}

export async function saveCampaign(campaign: Campaign) {
  const sql = await getSql();
  await sql.query(
    `insert into campaigns (id, body, updated_at) values ($1, $2::jsonb, now())
     on conflict (id) do update set body = $2::jsonb, updated_at = now()`,
    [campaign.id, JSON.stringify(campaign)],
  );
  return campaign;
}

async function saveEvent(event: AuctionEvent) {
  const sql = await getSql();
  await sql.query(
    `insert into auction_events (id, body, created_at) values ($1, $2::jsonb, now())
     on conflict (id) do update set body = $2::jsonb`,
    [event.id, JSON.stringify(event)],
  );
}

async function findEvent(id: string): Promise<AuctionEvent | null> {
  const sql = await getSql();
  const rows = await sql<{ body: unknown }>`
    select body from auction_events where id = ${id} limit 1
  `;
  return rows[0] ? parseBody<AuctionEvent>(rows[0].body) : null;
}

async function findCampaign(id: string): Promise<Campaign | null> {
  const sql = await getSql();
  const rows = await sql<{ body: unknown }>`
    select body from campaigns where id = ${id} limit 1
  `;
  return rows[0] ? attachProof(parseBody<Campaign>(rows[0].body)) : null;
}

async function touchSite(publisher: Publisher) {
  if (!publisher.id.startsWith("web_")) return;
  const sql = await getSql();
  await sql.query(
    `insert into open_sites (id, domain, name, tags, hits, last_seen)
     values ($1, $2, $3, $4::jsonb, 1, now())
     on conflict (id) do update set
       hits = open_sites.hits + 1,
       last_seen = now(),
       tags = $4::jsonb`,
    [publisher.id, publisher.domain, publisher.name, JSON.stringify(publisher.tags)],
  );
}

export async function serveAd(opts: {
  publisherId?: string;
  host?: string;
  tags?: string[];
  slotId: string;
  format: Platform;
  pageviewId: string;
  query?: string;
  pageUrl?: string;
  origin: string;
  simulated?: boolean;
  engage?: boolean;
}): Promise<ServeResult> {
  const campaigns = await listCampaigns();
  const publisher = resolvePublisher({
    publisherId: opts.publisherId,
    host: opts.host,
    tags: opts.tags,
    format: opts.format,
    slotId: opts.slotId,
  });
  const slot = publisher.slots.find((s) => s.id === opts.slotId) ?? asSlot(opts.format, opts.slotId);

  const existing = (await listTape()).find(
    (e) => e.pageviewId === opts.pageviewId && e.slotId === slot.id,
  );
  if (existing) {
    const campaign = existing.campaignId ? await findCampaign(existing.campaignId) : null;
    const creative = campaign ? pickCreative(campaign, existing.format) : null;
    return {
      event: existing,
      campaign,
      creative,
      ...pack(opts.origin, existing.id, campaign),
    };
  }

  const event: AuctionEvent = {
    ...runAuction({
      publisher,
      slot,
      campaigns,
      pageviewId: opts.pageviewId,
      query: opts.query,
    }),
    simulated: opts.simulated ?? false,
    pageUrl: opts.pageUrl,
    siteHost: publisher.domain,
  };

  let campaign: Campaign | null = null;
  if (event.outcome === "won" && event.campaignId) {
    const current = campaigns.find((c) => c.id === event.campaignId) ?? null;
    if (current) {
      campaign = applyImpression(current, todayISO());
      await saveCampaign(campaign);
    }
  }

  await saveEvent(event);
  await touchSite(publisher);

  if (opts.engage && event.outcome === "won") {
    const hasProof = Boolean(campaign?.proof?.spec);
    if (shouldSimulateRun(event, hasProof)) {
      const ran = await runAd(event.id, {
        simulated: true,
        live: false,
        task: clipTask({
          title: publisher.articles[0]?.title ?? publisher.name,
          url: opts.pageUrl ?? `https://${publisher.domain}/`,
          excerpt: (publisher.articles[0]?.body ?? []).join(" ") || publisher.blurb,
        }),
      });
      if (ran.event) {
        campaign = ran.campaign ?? campaign;
        event.ran = ran.event.ran;
        event.converted = ran.event.converted;
      }
    } else if (shouldSimulateClick(event)) {
      const clicked = await clickAd(event.id, { simulated: true });
      if (clicked.event) {
        campaign = clicked.campaign ?? campaign;
        event.clicked = clicked.event.clicked;
        event.converted = clicked.event.converted;
      }
    }
  }

  const creative =
    campaign && event.format ? pickCreative(campaign, event.format) : null;

  return {
    event,
    campaign,
    creative,
    ...pack(opts.origin, event.id, campaign),
  };
}

export async function clickAd(
  eventId: string,
  opts?: { simulated?: boolean },
): Promise<{ event: AuctionEvent | null; campaign: Campaign | null; destination: string | null }> {
  const event = await findEvent(eventId);
  if (!event || event.outcome !== "won" || !event.campaignId) {
    return { event, campaign: null, destination: null };
  }
  const campaign = await findCampaign(event.campaignId);
  if (!campaign) return { event, campaign: null, destination: null };

  if (event.clicked) {
    return { event, campaign, destination: campaign.destination };
  }

  const converted = shouldConvert(campaign, event);
  const nextEvent: AuctionEvent = {
    ...event,
    clicked: true,
    converted,
    simulated: opts?.simulated ?? event.simulated ?? false,
  };
  const nextCampaign = applyClick(campaign, todayISO(), event.price, converted);
  await saveCampaign(nextCampaign);
  await saveEvent(nextEvent);
  return { event: nextEvent, campaign: nextCampaign, destination: nextCampaign.destination };
}

export async function runAd(
  eventId: string,
  opts?: { simulated?: boolean; live?: boolean; task?: PageTask },
): Promise<{
  event: AuctionEvent | null;
  campaign: Campaign | null;
  proof: Campaign["proof"] | null;
  billed: number;
  output: string;
  live: boolean;
}> {
  const event = await findEvent(eventId);
  if (!event || event.outcome !== "won" || !event.campaignId) {
    return { event, campaign: null, proof: null, billed: 0, output: "", live: false };
  }
  const campaign = await findCampaign(event.campaignId);
  if (!campaign?.proof?.spec) {
    return { event, campaign, proof: null, billed: 0, output: "", live: false };
  }

  const task = clipTask(
    opts?.task ?? { title: event.taskTitle ?? event.siteHost ?? "", url: event.pageUrl ?? "" },
  );

  if (event.ran) {
    return {
      event,
      campaign,
      proof: campaign.proof,
      billed: 0,
      output: event.runOutput || bindSpec(campaign.proof.sample, task),
      live: Boolean(event.runLive),
    };
  }

  const { executeSpec } = await import("./execute-spec.server");
  const exec = await executeSpec({
    spec: campaign.proof.spec,
    sample: campaign.proof.sample,
    task,
    live: Boolean(opts?.live) && !opts?.simulated,
  });

  const marked = { ...event, ran: true };
  const converted = shouldConvert(campaign, marked);
  const billed = runPrice(event.price, campaign.cpcBid);
  const nextEvent: AuctionEvent = {
    ...marked,
    converted: event.converted || converted,
    simulated: opts?.simulated ?? event.simulated ?? false,
    runOutput: exec.output,
    runLive: exec.live,
    taskTitle: task.title || event.taskTitle,
  };
  const nextCampaign = applyRun(campaign, todayISO(), event.price, converted && !event.converted);
  await saveCampaign(nextCampaign);
  await saveEvent(nextEvent);
  return {
    event: nextEvent,
    campaign: nextCampaign,
    proof: nextCampaign.proof ?? campaign.proof,
    billed,
    output: exec.output,
    live: exec.live,
  };
}

export async function pumpVisitors(n: number, origin: string) {
  const editorial = PUBLISHERS.filter((p) => p.articles.length);
  for (let i = 0; i < n; i++) {
    const useWeb = Math.random() < 0.22;
    const publisher = useWeb
      ? resolvePublisher({
          host: "multinicheai.com",
          tags: ["founders", "productivity", "chatgpt", "ops", "marketing"],
          format: Math.random() < 0.5 ? "display" : "social",
          slotId: Math.random() < 0.5 ? "s_web_display" : "s_web_infeed",
        })
      : (() => {
          const pool = editorial.length && Math.random() < 0.72 ? editorial : PUBLISHERS;
          return pool[Math.floor(Math.random() * pool.length)]!;
        })();
    const slot = publisher.slots[Math.floor(Math.random() * publisher.slots.length)]!;
    const pageviewId = `pv_${Date.now().toString(36)}_${i}_${Math.random().toString(36).slice(2, 7)}`;
    const query = publisher.slug === "findr" ? randomQuery() : undefined;
    await serveAd({
      publisherId: publisher.id.startsWith("web_") ? undefined : publisher.id,
      host: publisher.id.startsWith("web_") ? publisher.domain : undefined,
      tags: publisher.tags,
      slotId: slot.id,
      format: slot.format,
      pageviewId,
      query,
      pageUrl: publisher.id.startsWith("web_") ? `https://${publisher.domain}/` : undefined,
      origin,
      simulated: true,
      engage: true,
    });
  }
  return {
    campaigns: await listCampaigns(),
    tape: await listTape(),
    sites: await listOpenSites(),
  };
}

function randomQuery() {
  const q = [
    "deep work prompts",
    "inbox automation make.com",
    "claude agent for founders",
    "github pr digest",
    "content calendar zapier",
    "focus block ai",
    "make.com email triage",
  ];
  return q[Math.floor(Math.random() * q.length)]!;
}

export async function loadBook() {
  return {
    campaigns: await listCampaigns(),
    tape: await listTape(),
    sites: await listOpenSites(),
  };
}
