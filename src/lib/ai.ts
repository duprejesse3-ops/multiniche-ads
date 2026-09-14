import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Objective, Platform } from "./types";

const PLATFORMS = ["search", "social", "display", "video"] as const;
const OBJECTIVES = ["awareness", "traffic", "conversions", "leads"] as const;

function apiKey() {
  return process.env.XAI_API_KEY;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("The desk returned an unreadable draft.");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

async function chat(opts: {
  system: string;
  user: string;
  maxTokens: number;
  temperature: number;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const key = apiKey();
  if (!key) return { ok: false, error: "AI is not available in this environment." };

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `The desk could not write (${res.status}).` };
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content ?? "";
  if (!text) return { ok: false, error: "The desk returned an empty draft." };
  return { ok: true, text };
}

const ComposeInput = z.object({
  brand: z.string().trim().min(1).max(80),
  product: z.string().trim().min(1).max(140),
  offer: z.string().trim().max(180).optional().default(""),
  objective: z.enum(OBJECTIVES),
  platforms: z.array(z.enum(PLATFORMS)).min(1).max(4),
  dailyBudget: z.number().min(10).max(100000),
  notes: z.string().trim().max(500).optional().default(""),
});

const CreativeDraft = z.object({
  format: z.enum(PLATFORMS),
  headline: z.string().min(1).max(120),
  subhead: z.string().max(80).optional().default(""),
  body: z.string().min(1).max(400),
  cta: z.string().min(1).max(40),
});

const AudienceDraft = z.object({
  name: z.string().min(1).max(60),
  description: z.string().min(1).max(220),
  size: z.string().min(1).max(16),
  affinity: z.number().min(0).max(100),
  tags: z.array(z.string()).max(5).default([]),
});

const ComposeOutput = z.object({
  name: z.string().min(1).max(80),
  strategy: z.string().min(1).max(600),
  targeting: z.string().min(1).max(400),
  creatives: z.array(CreativeDraft).min(1).max(4),
  audiences: z.array(AudienceDraft).min(1).max(4),
});

export type ComposeResult = z.infer<typeof ComposeOutput>;

export const composeCampaign = createServerFn({ method: "POST" })
  .validator((input: z.input<typeof ComposeInput>) => ComposeInput.parse(input))
  .handler(async ({ data }): Promise<{ ok: true; draft: ComposeResult } | { ok: false; error: string }> => {
    const result = await chat({
      temperature: 0.7,
      maxTokens: 1100,
      system:
        "You are the senior media planner for Multiniche AI (multinicheai.com). The store sells digital prompt packs, automation blueprints, doc templates, and agent configs — instruments, not courses. Voice: spec sheet, not a pitch. Specific, restrained, no hype, no emoji, no hashtags. Search ads use multinicheai.com. Mention try-before-pay (watch it run / live proof) when it fits. One-time purchase; Claude, ChatGPT, Gemini. Return JSON only.",
      user: `Compose a campaign.
Brand: ${data.brand}
Product: ${data.product}
Offer: ${data.offer || "none"}
Objective: ${data.objective}
Platforms: ${data.platforms.join(", ")}
Daily budget USD: ${data.dailyBudget}
Planner notes: ${data.notes || "none"}

JSON shape:
{
  "name": "short campaign name",
  "strategy": "2-3 sentences of media strategy",
  "targeting": "1-2 sentences of targeting",
  "creatives": [
    { "format": "search|social|display|video", "headline": "", "subhead": "", "body": "", "cta": "" }
  ],
  "audiences": [
    { "name": "", "description": "", "size": "e.g. 2.4M", "affinity": 0-100, "tags": ["",""] }
  ]
}
Rules: one creative per requested platform, in that order. Headlines must be distinctive, not generic slogans. Prefer CTAs like Run it on this page, Get the pack, Open the catalog, See the proof, Keep the spec. Video body is a 15s script with VO / Super / End card. Size is a plausible reach estimate.`,
    });
    if (!result.ok) return result;
    try {
      const draft = ComposeOutput.parse(extractJson(result.text));
      draft.creatives = draft.creatives.filter((c) =>
        (data.platforms as Platform[]).includes(c.format),
      );
      if (draft.creatives.length === 0) {
        return { ok: false, error: "The desk did not return creatives for those placements." };
      }
      return { ok: true, draft };
    } catch {
      return { ok: false, error: "The desk returned a draft we could not use. Try again." };
    }
  });

const VariantsInput = z.object({
  brand: z.string().trim().min(1).max(80),
  product: z.string().trim().min(1).max(140),
  format: z.enum(PLATFORMS),
  tone: z.string().trim().max(40).optional().default("restrained"),
  notes: z.string().trim().max(400).optional().default(""),
});

const VariantsOutput = z.object({
  variants: z.array(CreativeDraft).min(2).max(4),
});

export type VariantResult = z.infer<typeof VariantsOutput>;

export const composeVariants = createServerFn({ method: "POST" })
  .validator((input: z.input<typeof VariantsInput>) => VariantsInput.parse(input))
  .handler(async ({ data }): Promise<{ ok: true; variants: VariantResult["variants"] } | { ok: false; error: string }> => {
    const result = await chat({
      temperature: 0.75,
      maxTokens: 800,
      system:
        "You are a copy lead for Multiniche AI (multinicheai.com). Spec-sheet advertising for prompt packs, automations, and agent configs. Distinctive, no clichés, no emoji, no hashtags. JSON only.",
      user: `Write 3 ${data.format} ad variants.
Brand: ${data.brand}
Product: ${data.product}
Tone: ${data.tone}
Notes: ${data.notes || "none"}
JSON: { "variants": [{ "format": "${data.format}", "headline": "", "subhead": "", "body": "", "cta": "" }] }
Each variant should take a different angle. Video body = 15s script.`,
    });
    if (!result.ok) return result;
    try {
      const parsed = VariantsOutput.parse(extractJson(result.text));
      return {
        ok: true,
        variants: parsed.variants.map((v) => ({ ...v, format: data.format as Platform })),
      };
    } catch {
      return { ok: false, error: "The studio could not set the type. Try again." };
    }
  });

const BriefInput = z.object({
  snapshot: z.string().min(1).max(2500),
});

export const writeDeskBrief = createServerFn({ method: "POST" })
  .validator((input: z.input<typeof BriefInput>) => BriefInput.parse(input))
  .handler(async ({ data }): Promise<{ ok: true; text: string } | { ok: false; error: string }> => {
    const result = await chat({
      temperature: 0.4,
      maxTokens: 420,
      system:
        "You are the head of media for Multiniche AI writing a morning desk brief. Catalog of prompt packs, automations, agents. Calm, specific, no cheerleading, no emoji. 3 short paragraphs max.",
      user: `Write today's desk brief from this book of business:\n${data.snapshot}`,
    });
    if (!result.ok) return result;
    return { ok: true, text: result.text.trim() };
  });

const OptimizeInput = z.object({
  snapshot: z.string().min(1).max(2500),
});

const OptimizeOutput = z.object({
  summary: z.string().min(1).max(400),
  actions: z
    .array(z.object({ title: z.string().max(80), detail: z.string().max(240) }))
    .min(2)
    .max(4),
});

export const optimizeCampaign = createServerFn({ method: "POST" })
  .validator((input: z.input<typeof OptimizeInput>) => OptimizeInput.parse(input))
  .handler(async ({ data }) => {
    const result = await chat({
      temperature: 0.35,
      maxTokens: 550,
      system:
        "You are a performance lead for Multiniche AI. Digital products, $12–$34 packs plus Agent Studio credits. Recommend concrete, budget-aware actions. No emoji. JSON only.",
      user: `Optimize this campaign:\n${data.snapshot}
JSON: { "summary": "", "actions": [{ "title": "", "detail": "" }] }`,
    });
    if (!result.ok) return result;
    try {
      return { ok: true as const, note: OptimizeOutput.parse(extractJson(result.text)) };
    } catch {
      return { ok: false as const, error: "Could not parse the optimization note." };
    }
  });

const ExpandInput = z.object({
  name: z.string().min(1).max(60),
  description: z.string().min(1).max(240),
  product: z.string().min(1).max(140),
});

const ExpandOutput = z.object({
  audiences: z.array(AudienceDraft).min(2).max(4),
});

export const expandAudience = createServerFn({ method: "POST" })
  .validator((input: z.input<typeof ExpandInput>) => ExpandInput.parse(input))
  .handler(async ({ data }) => {
    const result = await chat({
      temperature: 0.55,
      maxTokens: 500,
      system:
        "You are an audience planner for Multiniche AI. Buyable segments among founders, marketers, developers, writers, sales/CS. No emoji. JSON only.",
      user: `Source segment: ${data.name} — ${data.description}
Product: ${data.product}
JSON: { "audiences": [{ "name": "", "description": "", "size": "", "affinity": 0, "tags": [] }] }
Give 3 lookalikes or adjacent segments, not clones.`,
    });
    if (!result.ok) return result;
    try {
      return { ok: true as const, ...ExpandOutput.parse(extractJson(result.text)) };
    } catch {
      return { ok: false as const, error: "Could not expand that segment." };
    }
  });

const ImageInput = z.object({
  brand: z.string().min(1).max(80),
  product: z.string().min(1).max(140),
  headline: z.string().min(1).max(120),
  format: z.enum(PLATFORMS),
});

export const generateCreativeImage = createServerFn({ method: "POST" })
  .validator((input: z.input<typeof ImageInput>) => ImageInput.parse(input))
  .handler(async ({ data }): Promise<{ ok: true; url: string } | { ok: false; error: string }> => {
    const key = apiKey();
    if (!key) return { ok: false, error: "AI is not available in this environment." };

    const prompt = `Premium advertising photograph, no text, no logos, no watermark, no caption. Quiet desk, laptop, notebook, practical warm light — a person doing real work, not a stock "AI" pose. Product being sold is a digital instrument: ${data.product}. Brand world: Multiniche AI, spec sheet not lifestyle. Mood of the line "${data.headline}". Shot as a ${data.format} ad still. Photoreal, shallow depth, filmic color, 4:5 crop energy.`;

    const res = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "grok-imagine-image",
        prompt,
        n: 1,
        resolution: "1k",
        response_format: "url",
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `Image desk unavailable (${res.status}).` };
    }
    const body = (await res.json()) as { data?: { url?: string }[] };
    const url = body.data?.[0]?.url;
    if (!url) return { ok: false, error: "No still came back." };
    return { ok: true, url };
  });

export type { Objective, Platform };
