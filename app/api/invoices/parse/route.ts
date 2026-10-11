import { api } from '@/lib/api';
import { ocrProvider } from '@/lib/providers';

// POST /api/invoices/parse (multipart form with a "file", or no body for the sample invoice)
// -> { vendor, date, lines, tax, total }: the draft the owner confirms and sends to POST /api/invoices.
// Uses AWS Textract when AWS_REGION is set, otherwise the mock OCR provider.
export const POST = api(async ({ req, ledger, businessId }) => {
  const file = req.headers.get('content-type')?.includes('multipart/form-data') ? (await req.formData()).get('file') : null;
  const bytes = file instanceof Blob ? new Uint8Array(await file.arrayBuffer()) : new Uint8Array();
  const parsed = await ocrProvider.parseInvoice(bytes);
  const items = await ledger.items(businessId);
  const lines = parsed.items.map(l => ({ itemId: items.find(i => i.name.toLowerCase() === l.name.toLowerCase())?._id, name: l.name, qty: l.qty, unitPrice: l.cost }));
  return { vendor: parsed.vendor, date: parsed.date, lines, tax: parsed.tax, total: parsed.total };
});
