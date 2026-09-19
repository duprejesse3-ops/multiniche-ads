import { NextResponse } from 'next/server';
import { readState, writeState } from '../../../lib/store.js';
import { pullAllStores } from '../../../lib/pullAll.js';

export const maxDuration = 30;

export async function POST() {
  const state = await readState();
  const result = await pullAllStores(state);
  await writeState(state);
  return NextResponse.json(result);
}
