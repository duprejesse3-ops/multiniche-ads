import { createFileRoute } from "@tanstack/react-router";
import { asFormat, corsPreflight, requestOrigin, withCors } from "@/lib/ads-http";

export const Route = createFileRoute("/api/ads/serve")({
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
          host: url.searchParams.get("site") ?? undefined,
          tags: tags.length ? tags : undefined,
          slotId: url.searchParams.get("slot") || "s_web_display",
          format: asFormat(url.searchParams.get("format")),
          pageviewId: url.searchParams.get("pageview") || `pv_${Date.now().toString(36)}`,
          query: url.searchParams.get("q") ?? undefined,
          pageUrl: url.searchParams.get("url") ?? undefined,
          origin,
        });
        return withCors(
          Response.json({
            ok: true,
            fill: result.event.outcome === "won",
            eventId: result.event.id,
            format: result.event.format,
            brand: result.campaign?.brand ?? result.event.brand ?? "",
            headline: result.creative?.headline ?? result.event.headline ?? "",
            subhead: result.creative?.subhead ?? "",
            body: result.creative?.body ?? "",
            cta: result.creative?.cta ?? "Learn more",
            imageUrl: result.creative?.imageUrl ?? null,
            owned: result.campaign?.owned ?? false,
            host: result.campaign?.owned
              ? "multinicheai.com"
              : (result.event.siteHost ?? ""),
            price: result.event.price,
            quality: result.event.quality,
            clickUrl: result.clickUrl,
            event: result.event,
            campaign: result.campaign,
          }),
        );
      },
    },
  },
});
