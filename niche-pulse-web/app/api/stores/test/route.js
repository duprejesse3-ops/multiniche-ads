import { NextResponse } from 'next/server';
import * as shopify from '../../../../lib/integrations/shopify.js';
import * as customStore from '../../../../lib/integrations/customStore.js';

export async function POST(request) {
  const body = await request.json();
  const integration = body.platform === 'shopify' ? shopify : customStore;
  const today = new Date().toISOString().slice(0, 10);
  try {
    const metrics = await integration.pullDay(body, today);
    return NextResponse.json({ ok: true, metrics });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
