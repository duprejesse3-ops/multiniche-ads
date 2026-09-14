# Multiniche Ads

CPC exchange for [MULTINICHE AI](https://multinicheai.com).

House campaigns sell digital prompt packs, automations, and agent configs. First-party publishers (Findr, Deep Work Digest, Ship Log) auction in-app. The open-web tag pastes on multinicheai.com — or any other page — and runs the same second-price CPC auction against the live book.

This is a **closed network you control**, not Google or Meta inventory. Clicks bill here, then 302 to the destination.

## What it is

- **Desk** — live book, tape, open/pause the exchange
- **Compose** — SKU, CPC bid, destination, creatives
- **Inventory** — copy-paste `/tag.js` snippet + live open-web hosts
- **Open-web proof** — `/web` is a third-party page with no app chrome; units fill from the tag

Paste this on a page (after you publish, the origin is this ad server):

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

`data-site` is the host. `data-format` is `display`, `social`, or `search`. Add as many `data-mn-ad` nodes as you have slots; one script.

## Run locally

```bash
npm install
npm run dev
```

The app listens on `0.0.0.0:8080`. Database is PGLite in preview; set `DATABASE_URL` for Neon in production.

## Related

- Store: [multinicheai.com](https://multinicheai.com)
- Catalog source: [github.com/duprejesse3-ops/Jblessd](https://github.com/duprejesse3-ops/Jblessd)
- Intent hijack: [github.com/duprejesse3-ops/swarm](https://github.com/duprejesse3-ops/swarm)

## Copyright

© 2026 MULTINICHE AI. All rights reserved.

See [LICENSE](LICENSE).
