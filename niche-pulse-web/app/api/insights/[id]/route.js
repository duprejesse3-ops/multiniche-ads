import { NextResponse } from 'next/server';
import { readState, writeState } from '../../../../lib/store.js';

export async function DELETE(request, { params }) {
  const id = Number(params.id);
  const state = await readState();
  const insight = state.insights.find((i) => i.id === id);
  if (insight) insight.dismissed = true;
  await writeState(state);
  return NextResponse.json({ ok: true });
}
