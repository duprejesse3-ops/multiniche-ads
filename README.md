# MultiNicheADS

The open-web **page-native spec exchange** for [MULTINICHE AI](https://multinicheai.com).

Google sells a click. ChatGPT sells a chat. Both stay inside their walls. This server sells the **first completed job of the SKU, on the page they are reading** — humans and agents, same book.

House catalog: prompt packs, automations, agent configs. One-time. Yours to keep.

## What it is

- **Desk** — live book, tape, page-native run rate
- **Compose** — SKU, CPC, destination, the spec they run
- **Inventory** — paste-on-any-site `/tag.js` plus `POST /api/ads/run` for agents
- **Open-web proof** — `/web` has no app chrome; tap **Run it on this page**

This is a **closed network you control**, not Google or Meta inventory. Clicks still 302 to the destination. A run bills a slice of CPC, executes the first prompt on the page (or the agent’s task), and they can keep the spec.

## Agent protocol

```
GET /api/ads/offer?q=deep+work+prompts&site=agent.local
POST /api/ads/run
{ "e": "<eventId>", "title": "the job", "excerpt": "the work to run on" }
GET /llms.txt
```

Returns a `SpecOffer` (`multiniche-ads/1`, `acceptsTask: true`). POST runs the spec on your payload.

## Human tag

```html
<div
  data-mn-ad
  data-site="multinicheai.com"
  data-slot="s_web_display"
  data-format="display"
  data-tags="founders,productivity,chatgpt,ops,marketing">
</div>
<script async src="https://YOUR-EXCHANGE-ORIGIN/tag.js"></script>
```

## Run locally

```bash
npm install
npm run dev
```

Listens on `0.0.0.0:8080`. PGLite in preview; set `DATABASE_URL` for Neon in production.

## Related

- Store: [multinicheai.com](https://multinicheai.com)
- Catalog: [github.com/duprejesse3-ops/Jblessd](https://github.com/duprejesse3-ops/Jblessd)
- Intent hijack: [github.com/duprejesse3-ops/swarm](https://github.com/duprejesse3-ops/swarm)

## Copyright

© 2026 MULTINICHE AI. All rights reserved.

See [LICENSE](LICENSE).
