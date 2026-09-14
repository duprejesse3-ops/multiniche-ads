import { bindSpec } from "./proof";
import type { PageTask } from "./types";

const LIVE_MAX_TOKENS = 160;
const LIVE_TIMEOUT_MS = 22_000;

export async function executeSpec(opts: {
  spec: string;
  sample: string;
  task: PageTask;
  live: boolean;
}): Promise<{ output: string; live: boolean }> {
  const bound = bindSpec(opts.sample, opts.task);
  if (!opts.live) return { output: bound, live: false };

  const key = process.env.XAI_API_KEY;
  const hasTask = opts.task.excerpt.length >= 40 || opts.task.title.trim().length >= 8;
  if (!key || !hasTask) return { output: bound, live: false };

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.3,
        max_tokens: LIVE_MAX_TOKENS,
        messages: [
          {
            role: "system",
            content:
              "You execute a digital instrument against a live page.\n" +
              "The spec is the METHOD — the shape of the job. The page excerpt is the only source of FACTS.\n" +
              "Replace any example names, numbers, calendars, or scenarios inside the spec with what the page actually says.\n" +
              "Produce the job the spec describes using only page facts. If a figure the method wants is missing, skip that line — do not copy the spec's sample.\n" +
              "Output only the completed job. No pitch, no preamble, no markdown fences. Max 70 words.\n\nSpec:\n" +
              opts.spec,
          },
          {
            role: "user",
            content: `The page is the task.\nTitle: ${opts.task.title || "(untitled)"}\nURL: ${opts.task.url || "(none)"}\nExcerpt:\n${opts.task.excerpt || "(empty)"}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(LIVE_TIMEOUT_MS),
    });
    if (!res.ok) return { output: bound, live: false };
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = (body.choices?.[0]?.message?.content ?? "").trim();
    if (!text) return { output: bound, live: false };
    return { output: text.slice(0, 900), live: true };
  } catch {
    return { output: bound, live: false };
  }
}
