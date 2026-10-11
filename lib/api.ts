// Shared wrapper for Person A's API routes: sign-in check, input parsing and error responses.
import { NextRequest, NextResponse } from 'next/server';
import { ZodError, z } from 'zod';
import { auth } from '@/auth';
import { LedgerService, NotFoundError } from './ledger';
import { OcrError } from './ocr';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Dates must be YYYY-MM-DD').optional();
const count = (max: number) => z.coerce.number().int().min(0).max(max).optional();
const querySchema = z.object({ from: isoDate, to: isoDate, asOf: isoDate, limit: count(1000), offset: count(1e6), days: z.coerce.number().int().min(1).max(365).optional(), status: z.enum(['paid', 'unpaid']).optional() });

type Context = {
  req: NextRequest;
  ledger: LedgerService;
  businessId: string | null; // ?businessId= or body.businessId; null means the demo café
  params: Record<string, string>;
  query: z.infer<typeof querySchema>;
  body: any; // the JSON body without businessId; routes validate it with the schemas in lib/types
};

export function api(handler: (c: Context) => Promise<unknown>, status = 200) {
  return async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    try {
      if (!(await auth())) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
      const search = req.nextUrl.searchParams;
      let body: any;
      if (req.method !== 'GET' && req.headers.get('content-type')?.includes('json')) {
        const text = await req.text();
        try { if (text.trim()) body = JSON.parse(text); } catch { throw new ZodError([{ code: 'custom', path: [], message: 'Body must be JSON' }]); }
      }
      const { businessId = null, ...rest } = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
      const result = await handler({
        req, ledger: new LedgerService(), params: (await ctx.params) ?? {}, body: body === undefined ? undefined : rest,
        businessId: search.get('businessId') || (typeof businessId === 'string' ? businessId : null),
        query: querySchema.parse(Object.fromEntries([...search].filter(([, v]) => v !== ''))),
      });
      return NextResponse.json(result, { status });
    } catch (e) {
      if (e instanceof ZodError) {
        const issue = e.issues[0];
        return NextResponse.json({ error: [issue.path.join('.'), issue.message].filter(Boolean).join(': ') }, { status: 400 });
      }
      if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 });
      if (e instanceof OcrError) return NextResponse.json({ error: e.message }, { status: 400 });
      const rule = e instanceof Error && /^(Insufficient stock|Unbalanced entry|Invalid invoice line|Invoice |Item not found)/.test(e.message);
      if (!rule) console.error(e);
      return NextResponse.json({ error: rule ? (e as Error).message : 'Something went wrong' }, { status: rule ? 400 : 500 });
    }
  };
}
