# Niche Pulse — Web (PWA)

The mobile-friendly, installable version of Niche Pulse — a Next.js app instead
of the Electron desktop app, so it runs as a website you can add to your
phone's home screen like an app.

## Why this exists

The desktop Electron version (in the other `niche-pulse` folder) can't run on
a phone. This is the same core idea — cross-store AI insights, niche ranking,
content-push logging — rebuilt as a Next.js app deployable to Vercel.

## What's already set up in your Vercel account

I got partway through deploying this via Claude's Vercel connector before it
hit a permission wall that wouldn't clear (repeated "No approval received" on
the actual deploy step — not something retrying fixed, and nothing was
pending in your Vercel account's Integrations page either). What *did* go
through, and is already live in your account:

- **Project created**: `niche-pulse` (id `prj_Y35jJvi1jcSK0jzRq0eXepdobqtr`)
- **Private Blob store**: created and linked — `BLOB_READ_WRITE_TOKEN` is
  already set as an environment variable on the project
- **`CRON_SECRET`**: already set as a sensitive env var (protects the
  `/api/cron/daily` endpoint from being called by anyone else)

So you don't need to recreate any of that — just deploy the code into the
existing project.

## Deploy it yourself (5 minutes)

You'll need [Node.js](https://nodejs.org) installed. Then, from this folder:

```bash
npm install -g vercel
cd niche-pulse-web
vercel login
```

`vercel login` opens your browser to sign in with your actual Vercel account
— a completely separate path from the connector that was failing.

Link this folder to the existing project (don't let it create a new one):

```bash
vercel link
```

When prompted:
- "Link to existing project?" → **Yes**
- Pick **niche-pulse** from the list

Then deploy to production:

```bash
vercel --prod
```

That's it — it builds and deploys, and gives you the live URL
(something like `niche-pulse-<yourname>.vercel.app`).

## One more thing to add: your Anthropic API key

AI insights need it. Either:

**Via CLI:**
```bash
vercel env add ANTHROPIC_API_KEY production
```
(paste your key when prompted, then `vercel --prod` again to redeploy with it)

**Or via the Vercel dashboard:**
Project → Settings → Environment Variables → Add → key `ANTHROPIC_API_KEY`,
your key as the value, target: Production.

## Using it on your phone

1. Open the deployed URL in your phone's browser
2. **iOS Safari**: Share button → "Add to Home Screen"
3. **Android Chrome**: menu (⋮) → "Add to Home Screen" / "Install app"

You'll get a real home-screen icon that opens full-screen, no browser chrome.

## Note on the daily cron

`vercel.json` schedules `/api/cron/daily` for 13:00 UTC once a day — that's
the Hobby plan limit (no hourly cron on this plan). It pulls each connected
store's data for that day and runs the AI insight pass. You can also trigger
both manually any time from the dashboard's "Refresh now" / "Generate
insights" buttons.

## Everything else

Same architecture notes as before — see the code comments in `lib/store.js`
(private Blob JSON storage, not a real database — fine at this scale),
`lib/integrations/shopify.js` (ShopifyQL sessions attempt is best-effort,
unverified against a live store), and `app/api/stores/backfill/route.js`
(pulls history in small batches to stay under serverless time limits).
