import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Campaign, Platform } from "./types";

const SaveInput = z.object({
  id: z.string().min(1),
  name: z.string(),
  brand: z.string(),
  product: z.string(),
  status: z.enum(["draft", "active", "paused", "ended"]),
  objective: z.enum(["awareness", "traffic", "conversions", "leads"]),
  platforms: z.array(z.enum(["search", "social", "display", "video"])),
  dailyBudget: z.number(),
  cpcBid: z.number(),
  destination: z.string(),
  owned: z.boolean(),
  aov: z.number(),
  strategy: z.string(),
  targeting: z.string(),
  creatives: z.array(z.any()),
  audiences: z.array(z.any()),
  stats: z.array(z.any()),
  createdAt: z.string(),
});

const ServeInput = z.object({
  publisherId: z.string().optional(),
  host: z.string().optional(),
  tags: z.array(z.string()).optional(),
  slotId: z.string().min(1),
  format: z.enum(["search", "social", "display", "video"]),
  pageviewId: z.string().min(1),
  query: z.string().optional(),
  pageUrl: z.string().optional(),
  simulated: z.boolean().optional(),
  engage: z.boolean().optional(),
});

export const loadDesk = createServerFn({ method: "GET" }).handler(async () => {
  const { loadBook } = await import("./exchange.server");
  return loadBook();
});

export const saveCampaignFn = createServerFn({ method: "POST" })
  .validator((input: z.input<typeof SaveInput>) => SaveInput.parse(input))
  .handler(async ({ data }) => {
    const { saveCampaign } = await import("./exchange.server");
    return saveCampaign(data as Campaign);
  });

export const pumpVisitorsFn = createServerFn({ method: "POST" })
  .validator((input: { n: number; origin: string }) =>
    z.object({ n: z.number().min(1).max(80), origin: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { pumpVisitors } = await import("./exchange.server");
    return pumpVisitors(data.n, data.origin);
  });

export const serveAdFn = createServerFn({ method: "POST" })
  .validator((input: z.input<typeof ServeInput> & { origin: string }) =>
    ServeInput.extend({ origin: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { serveAd } = await import("./exchange.server");
    const { origin, ...rest } = data;
    return serveAd({ ...rest, format: rest.format as Platform, origin });
  });
