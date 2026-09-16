import { createFileRoute } from "@tanstack/react-router";
import { withCors } from "@/lib/ads-http";

const BODY = `# MultiNicheADS — agent protocol

Google sells a click. ChatGPT sells a chat. Both stay inside their walls.
This server sells the first completed job of a digital instrument — on the
page the human is reading, or on the task an agent posts.

Protocol: multiniche-ads/1
House catalog: https://multinicheai.com

## Auction

GET /api/ads/offer?q={intent}&site={your-host}&tags={comma tags}

Returns a SpecOffer from a second-price auction against the live book.
Fields: brand, product, sku, price, currency, runCost, priceNote, license,
spec, sample, destination, clickUrl, runUrl, acceptsTask, expiresAt.

Running the spec is free — runCost is always 0. price is what the SKU costs
to actually buy and keep; it is not a charge for running it. The exchange
bills the advertiser per run internally, not you. expiresAt is advisory —
price and availability are always re-verified live when you POST runUrl, so
an expired offer still works, a fresh GET is just the more reliable path.

GET /api/ads/serve — same auction, plus human creative.

## Billable event

The distinctive event is a **run on the task**, not a click. It is free to
run: see runCost/priceNote on the offer above. "Billed once" below refers to
the exchange's internal billing of the advertiser, not you.

POST /api/ads/run
Content-Type: application/json
{ "e": "{eventId}", "title": "...", "url": "...", "excerpt": "the page or your own job, <=700 chars" }

Executes the SKU's first prompt on that task. Returns output, spec, license.
Live when the desk can run it; otherwise bound to the page. Billed once.

GET /api/ads/run?e={eventId} — bound completion, no live call.

A click still 302s via GET /api/ads/click?e={eventId}.

## Humans

Embed on any page:

  <div data-mn-ad data-site="example.com" data-format="display" data-tags="founders,ops"></div>
  <script async src="{origin}/tag.js"></script>

The unit includes “Run it on this page”. The page is the task. They can keep the spec.

## House catalog

Digital instruments from https://multinicheai.com — prompt packs, automations, agent configs.
One-time. Yours to keep.

## Copyright

© 2026 MULTINICHE AI. All rights reserved.
The protocol and this server are proprietary. A catalog purchase is not a license
to copy the exchange.
`;

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () =>
        withCors(
          new Response(BODY, {
            status: 200,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "public, max-age=120",
            },
          }),
        ),
    },
  },
});
