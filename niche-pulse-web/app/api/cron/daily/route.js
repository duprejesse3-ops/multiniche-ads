import { NextResponse } from 'next/server';
import { readState, writeState } from '../../../../lib/store.js';
import { pullAllStores } from '../../../../lib/pullAll.js';
import { runInsightCycle } from '../../../../lib/runInsightCycle.js';

export const maxDuration = 60;

// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when
// it invokes this route on schedule (see vercel.json). This check stops
// anyone else from hitting the endpoint and burning your Anthropic credits.
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const state = await readState();
  const pullResult = await pullAllStores(state);

  let insightItems = [];
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    insightItems = await runInsightCycle(state, apiKey);
  }

  await writeState(state);

  return NextResponse.json({ pull: pullResult, insightsGenerated: insightItems.length });
}
