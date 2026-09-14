import { createFileRoute } from "@tanstack/react-router";
import { asFormat, corsPreflight, requestOrigin, withCors } from "@/lib/ads-http";

export const Route = createFileRoute("/api/ads/offer")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      GET: async ({ request }) => {
        const { serveAd } = await import("@/lib/exchange.server");
        const url = new URL(request.url);
        const origin = requestOrigin(request);
        const tagsRaw = url.searchParams.get("tags") ?? "";
        const tags = tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        const result = await serveAd({
          publisherId: url.searchParams.get("publisher") ?? undefined,
          host: url.searchParams.get("site") ?? url.searchParams.get("agent") ?? "agent.local",
          tags: tags.length ? tags : ["founders", "productivity", "chatgpt", "ops"],
          slotId: url.searchParams.get("slot") || "s_agent_offer",
          format: asFormat(url.searchParams.get("format")),
          pageviewId: url.searchParams.get("pageview") || `ag_${Date.now().toString(36)}`,
          query: url.searchParams.get("q") ?? undefined,
          pageUrl: url.searchParams.get("url") ?? undefined,
          origin,
        });
        return withCors(
          Response.json({
            ok: true,
            protocol: "multiniche-ads/1",
            fill: result.event.outcome === "won",
            eventId: result.event.id,
            quality: result.event.quality,
            auctionPrice: result.event.price,
            offer: result.offer,
            runUrl: result.runUrl,
            clickUrl: result.clickUrl,
          }),
        );
      },
    },
  },
});
