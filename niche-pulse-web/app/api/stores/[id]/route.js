import { NextResponse } from 'next/server';
import { readState, writeState } from '../../../../lib/store.js';

export async function DELETE(request, { params }) {
  const id = Number(params.id);
  const state = await readState();
  state.stores = state.stores.filter((s) => s.id !== id);
  await writeState(state);
  return NextResponse.json({ ok: true });
}
