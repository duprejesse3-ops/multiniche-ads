import { NextResponse } from 'next/server';
import { readState, writeState } from '../../../../lib/store.js';
import { runInsightCycle } from '../../../../lib/runInsightCycle.js';

export const maxDuration = 30;

export async function POST() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set in this project's environment variables." },
      { status: 400 }
    );
  }

  const state = await readState();
  const items = await runInsightCycle(state, apiKey);
  await writeState(state);

  return NextResponse.json({ items });
}
