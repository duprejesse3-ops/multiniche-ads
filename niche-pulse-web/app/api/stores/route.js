import { NextResponse } from 'next/server';
import { readState, writeState, nextId } from '../../../lib/store.js';

export async function POST(request) {
  const body = await request.json();
  const { name, niche_tag, platform, base_url, credentials } = body;
  if (!name || !base_url || !platform) {
    return NextResponse.json({ error: 'name, base_url and platform are required' }, { status: 400 });
  }

  const state = await readState();
  const id = nextId(state);
  state.stores.push({ id, name, niche_tag: niche_tag || null, platform, base_url, credentials: credentials || {} });
  await writeState(state);

  return NextResponse.json({ id });
}
