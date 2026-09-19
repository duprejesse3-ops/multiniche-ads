import { NextResponse } from 'next/server';
import { readState } from '../../../lib/store.js';

export async function GET() {
  const state = await readState();
  return NextResponse.json({
    stores: state.stores.map(({ credentials, ...rest }) => rest), // never send credentials to the client
    metrics: state.metrics,
    insights: state.insights.filter((i) => !i.dismissed).slice(-40).reverse(),
    contentPushes: state.contentPushes.slice(-100),
    hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY)
  });
}
