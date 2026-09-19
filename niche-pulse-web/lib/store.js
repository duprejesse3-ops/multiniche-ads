import { put, get } from '@vercel/blob';

const STATE_PATH = 'niche-pulse/state.json';

function defaultState() {
  return {
    stores: [],        // { id, name, niche_tag, platform, base_url, credentials }
    metrics: [],        // { store_id, date, revenue, orders, sessions, conversion_rate, ad_spend, ad_revenue }
    insights: [],        // { id, created_at, severity, store_id, title, body, dismissed }
    contentPushes: [],    // { id, niche_tag, pushed_at, note }
    pullLog: [],
    nextId: 1
  };
}

// Everything lives in one JSON document in private Blob storage. This is not
// a real database — no concurrent-write safety beyond last-write-wins — but
// for a single-user dashboard at this scale (a handful of stores, ~90 days
// of daily rows) that's a fine tradeoff for not needing a separate hosted
// Postgres just to run this on Vercel.
export async function readState() {
  try {
    const result = await get(STATE_PATH, { access: 'private' });
    if (!result) return defaultState();
    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text);
    return { ...defaultState(), ...parsed };
  } catch (err) {
    return defaultState();
  }
}

export async function writeState(state) {
  await put(STATE_PATH, JSON.stringify(state), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

export function nextId(state) {
  const id = state.nextId || 1;
  state.nextId = id + 1;
  return id;
}
