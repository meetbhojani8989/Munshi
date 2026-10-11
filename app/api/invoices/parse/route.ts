import { api } from '@/lib/api';
import { matchItem, parseInvoiceFile } from '@/lib/ocr';
import type { InvoiceDraft } from '@/lib/types';

// POST /api/invoices/parse (multipart form with a "file"; no file returns the sample invoice) -> InvoiceDraft
// Reads the invoice with AWS Textract when AWS_REGION is set, otherwise with on-device OCR.
// Nothing is posted: the owner reviews the draft and sends it to POST /api/invoices.
export const POST = api(async ({ req, ledger, businessId }): Promise<InvoiceDraft> => {
  const file = req.headers.get('content-type')?.includes('multipart/form-data') ? (await req.formData()).get('file') : null;
  const draft = await parseInvoiceFile(file instanceof Blob ? new Uint8Array(await file.arrayBuffer()) : new Uint8Array());
  const items = await ledger.items(businessId);
  return { ...draft, lines: draft.lines.map(l => ({ itemId: matchItem(items, l.name)?._id, ...l })) };
});
