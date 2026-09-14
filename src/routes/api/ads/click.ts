import { createFileRoute } from "@tanstack/react-router";
import { withCors } from "@/lib/ads-http";

export const Route = createFileRoute("/api/ads/click")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { clickAd } = await import("@/lib/exchange.server");
        const url = new URL(request.url);
        const id = url.searchParams.get("e") ?? "";
        if (!id) {
          return withCors(new Response("Missing click id", { status: 400 }));
        }
        const result = await clickAd(id);
        const dest = result.destination || "https://multinicheai.com";
        return new Response(null, {
          status: 302,
          headers: {
            Location: dest,
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
