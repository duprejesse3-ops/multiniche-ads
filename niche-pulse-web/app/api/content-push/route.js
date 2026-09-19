import { NextResponse } from 'next/server';
import { readState, writeState, nextId } from '../../../lib/store.js';

export async function POST(request) {
  const { niche_tag, note } = await request.json();
  if (!niche_tag) return NextResponse.json({ error: 'niche_tag is required' }, { status: 400 });

  const state = await readState();
  const id = nextId(state);
  state.contentPushes.push({ id, niche_tag, note: note || null, pushed_at: new Date().toISOString() });
  await writeState(state);

  return NextResponse.json({ ok: true });
}
