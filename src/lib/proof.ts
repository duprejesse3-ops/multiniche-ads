import { CATALOG, type CatalogSku } from "./catalog";
import type { AgentOffer, Campaign, PageTask, Proof } from "./types";

export function proofFromSku(sku: CatalogSku): Proof {
  return {
    sku: sku.id,
    spec: sku.spec,
    sample: sku.sample,
    license: sku.license,
  };
}

export function findSkuForCampaign(c: Campaign): CatalogSku | undefined {
  const hay = `${c.product} ${c.name}`.toLowerCase();
  return CATALOG.find((s) => hay.includes(s.name.toLowerCase()));
}

export function attachProof(c: Campaign): Campaign {
  if (c.proof?.spec) return c;
  const sku = findSkuForCampaign(c);
  if (!sku?.spec) return c;
  return { ...c, proof: proofFromSku(sku), aov: c.aov || sku.price };
}

export function runPrice(eventPrice: number, bid: number) {
  return Math.round(Math.min(bid, Math.max(0.15, eventPrice * 0.45)) * 100) / 100;
}

export function clipTask(raw: unknown): PageTask {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const excerpt = String(o.excerpt ?? o.text ?? o.body ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return {
    title: String(o.title ?? "").slice(0, 160),
    url: String(o.url ?? o.pageUrl ?? "").slice(0, 400),
    excerpt: excerpt.slice(0, 700),
  };
}

export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function bindSpec(sample: string, task: PageTask): string {
  const where = task.title.trim() || hostOf(task.url) || "this page";
  const clip = task.excerpt.slice(0, 160);
  const lines = [`On “${where}”`];
  if (clip) lines.push(clip + (task.excerpt.length > 160 ? "…" : ""));
  lines.push(sample);
  return lines.join("\n");
}

export function asOffer(opts: {
  campaign: Campaign;
  clickUrl: string;
  runUrl: string;
}): AgentOffer | null {
  const proof = opts.campaign.proof;
  if (!proof?.spec) return null;
  return {
    type: "SpecOffer",
    protocol: "multiniche-ads/1",
    brand: opts.campaign.brand,
    product: opts.campaign.product,
    sku: proof.sku,
    price: opts.campaign.aov,
    currency: "USD",
    runCost: 0,
    priceNote: "Running this spec is free. price is what the product costs to buy and keep.",
    license: proof.license,
    sample: proof.sample,
    spec: proof.spec,
    destination: opts.campaign.destination,
    clickUrl: opts.clickUrl,
    runUrl: opts.runUrl,
    acceptsTask: true,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}
