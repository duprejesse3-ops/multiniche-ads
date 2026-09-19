import { NextResponse } from 'next/server';
import { readState, writeState } from '../../../../lib/store.js';
import * as shopify from '../../../../lib/integrations/shopify.js';
import * as customStore from '../../../../lib/integrations/customStore.js';

function dateNDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// Backfills a small batch of days per call (default 7) rather than 30 in one
// shot — a serverless function has a short time limit (10s on Vercel's
// Hobby plan), and 30 sequential API calls can run past that. Click
// "Backfill more" from the dashboard to pull further batches.
export async function POST(request) {
  const { storeId, days = 7, offset = 0 } = await request.json();
  const state = await readState();
  const store = state.stores.find((s) => s.id === storeId);
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

  const integration = store.platform === 'shopify' ? shopify : customStore;
  let ok = 0;
  let failed = 0;

  for (let i = offset + days; i > offset; i--) {
    const date = dateNDaysAgo(i);
    try {
      const metrics = await integration.pullDay(store, date);
      state.metrics = state.metrics.filter((m) => !(m.store_id === store.id && m.date === date));
      state.metrics.push({ store_id: store.id, store_name: store.name, niche_tag: store.niche_tag, date, ...metrics });
      ok++;
    } catch (err) {
      failed++;
    }
  }

  await writeState(state);
  return NextResponse.json({ ok, failed, nextOffset: offset + days });
}
