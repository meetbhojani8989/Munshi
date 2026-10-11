import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { LedgerService, NotFoundError } from '@/lib/ledger';
import { handleSquareEvent, UnmappedError, validSquareSignature } from '@/lib/pos';

// POST /api/pos/webhook?businessId= -> PosWebhookResult
// Called by the point of sale, not by a signed-in user. When SQUARE_WEBHOOK_SIGNATURE_KEY is set, the
// x-square-hmacsha256-signature header must match; without it the endpoint is open (demo mode).
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (key && !validSquareSignature(key, process.env.SQUARE_WEBHOOK_URL || req.url, raw, req.headers.get('x-square-hmacsha256-signature')))
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  try {
    let payload: unknown;
    try { payload = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 }); }
    return NextResponse.json(await handleSquareEvent(new LedgerService(), req.nextUrl.searchParams.get('businessId'), payload));
  } catch (e) {
    if (e instanceof ZodError) return NextResponse.json({ error: `${e.issues[0].path.join('.')}: ${e.issues[0].message}` }, { status: 400 });
    if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 });
    if (e instanceof UnmappedError) return NextResponse.json({ error: e.message }, { status: 422 });
    // The till already took the money, so a sale we cannot post (sold out here) is a conflict to resolve, not a retry.
    if (e instanceof Error && e.message === 'Insufficient stock') return NextResponse.json({ error: 'Insufficient stock to post this sale' }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
