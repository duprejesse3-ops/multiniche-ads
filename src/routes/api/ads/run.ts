import { createFileRoute } from "@tanstack/react-router";
import { corsPreflight, withCors } from "@/lib/ads-http";
import { clipTask } from "@/lib/proof";

async function handleRun(request: Request) {
  const { runAd } = await import("@/lib/exchange.server");
  const url = new URL(request.url);
  let eventId = url.searchParams.get("e") ?? "";
  let live = false;
  let task = clipTask({
    title: url.searchParams.get("title") ?? "",
    url: url.searchParams.get("url") ?? "",
    excerpt: url.searchParams.get("excerpt") ?? "",
  });

  if (request.method === "POST") {
    live = true;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    eventId = String(body.e ?? body.eventId ?? eventId);
    task = clipTask({ ...body, url: body.url ?? body.pageUrl });
  }

  if (!eventId) {
    return withCors(Response.json({ ok: false, error: "Missing run id" }, { status: 400 }));
  }

  const result = await runAd(eventId, { live, task });
  if (!result.proof) {
    return withCors(
      Response.json({ ok: false, fill: false, error: "No spec on this fill" }, { status: 404 }),
    );
  }
  return withCors(
    Response.json({
      ok: true,
      ran: true,
      billed: result.billed,
      live: result.live,
      output: result.output,
      sample: result.output,
      spec: result.proof.spec,
      sku: result.proof.sku,
      license: result.proof.license,
      taskTitle: result.event?.taskTitle ?? task.title,
      event: result.event,
      campaign: result.campaign,
    }),
  );
}

export const Route = createFileRoute("/api/ads/run")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      GET: async ({ request }) => handleRun(request),
      POST: async ({ request }) => handleRun(request),
    },
  },
});
