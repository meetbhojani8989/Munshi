// OcrService: turns an uploaded supplier invoice into a draft the owner reviews before posting.
// AWS Textract when AWS_REGION is set; otherwise on-device OCR (tesseract.js), so it works with no keys.
// With no file at all it returns the sample invoice used by the "Use sample invoice" button.
import os from 'node:os';
import path from 'node:path';
import type { ExpenseDocument } from '@aws-sdk/client-textract';
import type { InvoiceDraft } from './types';

type Draft = Omit<InvoiceDraft, 'lines'> & { lines: { name: string; qty: number; unitPrice: number }[] };

const cents = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const today = () => new Date().toISOString().slice(0, 10);
const money = (s: string | undefined) => { const n = Number((s ?? '').replace(/[^0-9.\-]/g, '')); return Number.isFinite(n) ? n : 0; };
const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** The first date in the text as YYYY-MM-DD (US month/day order), or null. */
export function findDate(text: string): string | null {
  const iso = (y: number, m: number, d: number) =>
    m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y < 100 ? 2000 + y : y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null;
  let m = text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = text.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4}|\d{2})\b/);
  if (m) return iso(+m[3], +m[1], +m[2]);
  m = text.match(/\b([A-Za-z]{3})[a-z]*\.? (\d{1,2}),? (\d{4})\b/);
  if (m && months.includes(m[1].toLowerCase())) return iso(+m[3], months.indexOf(m[1].toLowerCase()) + 1, +m[2]);
  m = text.match(/\b(\d{1,2}) ([A-Za-z]{3})[a-z]*\.?,? (\d{4})\b/);
  if (m && months.includes(m[2].toLowerCase())) return iso(+m[3], months.indexOf(m[2].toLowerCase()) + 1, +m[1]);
  return null;
}

const NUMBER = /^[$€£]?(\d{1,3}(,\d{3})+|\d+)(\.\d+)?$/;
const NOT_AN_ITEM = /\b(sub\s?total|total|tax|vat|gst|balance|amount due|invoice|receipt|date|due|terms|bill to|ship to|phone|tel|fax|page|payment|thank|discount|shipping|delivery fee|change|cash|card|visa|mastercard)\b/i;
const TABLE_HEADER = /\b(description|item|product)\b.*\b(qty|quantity|price|amount|total)\b|\b(qty|quantity)\b.*\b(description|item|price|amount)\b/i;

/** Reads vendor, date, line items, tax and total out of OCR text. Heuristic: the owner reviews the result. */
export function parseInvoiceText(text: string): Draft {
  const all = text.split(/\r?\n/).map(l => l.replace(/[|_]+/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
  const vendor = all.find(l => /[A-Za-z]{3}/.test(l) && !NOT_AN_ITEM.test(l) && !TABLE_HEADER.test(l))?.replace(/[^\w&.,' -]/g, '').trim() || 'Unknown vendor';
  const lastMoney = (l: string) => money(l.match(/[$€£]?\d[\d,]*\.\d{2}(?!\d)/g)?.at(-1) ?? l.split(' ').filter(t => NUMBER.test(t)).at(-1));

  // When the table has a header row, items are the rows between it and the totals.
  const header = all.findIndex(l => TABLE_HEADER.test(l));
  let body = header >= 0 ? all.slice(header + 1) : all.slice(1);
  if (header >= 0) { const end = body.findIndex(l => /\b(sub\s?total|total)\b/i.test(l)); if (end >= 0) body = body.slice(0, end); }

  const lines: Draft['lines'] = [];
  for (const l of body) {
    if (NOT_AN_ITEM.test(l) || findDate(l)) continue;
    const tokens = l.replace(/\s[x×@]\s/gi, ' ').split(' ');
    let end = tokens.length;
    while (end > 0 && NUMBER.test(tokens[end - 1])) end--;
    const nums = tokens.slice(end).map(money);
    let words = tokens.slice(0, end);
    // A real line carries a price like 4.25 or $4; bare whole numbers alone are zip codes, phone numbers or years.
    if (!nums.length || !/[$€£]|\.\d{2}\b/.test(tokens.slice(end).join(' '))) continue;
    // "2 Oat Milk 4.80": a leading whole number is the quantity.
    let leadingQty = 0;
    if (words.length > 1 && /^\d{1,4}$/.test(words[0])) { leadingQty = Number(words[0]); words = words.slice(1); }
    const name = words.join(' ').replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9)%.]+$/g, '');
    if (!/[A-Za-z]{2}/.test(name)) continue;
    let qty = 1, unitPrice = 0;
    if (leadingQty) { qty = leadingQty; unitPrice = nums.length > 1 ? nums.at(-2)! : nums[0] / qty; }
    else if (nums.length >= 3) { const [q, u, a] = nums.slice(-3); qty = q; unitPrice = Math.abs(q * u - a) < 0.02 || !q ? u : a / q; }
    else if (nums.length === 2) { qty = nums[0]; unitPrice = /\s[x×@]\s/i.test(l) ? nums[1] : nums[1] / (nums[0] || 1); }
    else unitPrice = nums[0];
    if (!(qty > 0) || qty > 100000 || unitPrice < 0) continue;
    lines.push({ name, qty, unitPrice: cents(unitPrice) });
  }

  const taxLine = all.find(l => /\b(tax|vat|gst)\b/i.test(l) && /\d/.test(l.replace(/\(.*?\)/g, '')));
  const tax = taxLine ? lastMoney(taxLine.replace(/\(.*?\)/g, '')) : 0;
  const totalLine = all.filter(l => /\b(total|amount due|balance due)\b/i.test(l) && !/sub\s?total/i.test(l) && /\d/.test(l)).at(-1);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const warnings = lines.length ? [] : ['No line items could be read. Add them by hand, or try a sharper, straight-on photo.'];
  return { vendor, date: findDate(text) ?? today(), lines, tax: cents(tax), total: cents(totalLine ? lastMoney(totalLine) : subtotal + tax), source: 'ocr', warnings };
}

/** Maps an AWS Textract AnalyzeExpense document to a draft. */
export function parseTextractExpense(doc: ExpenseDocument | undefined): Draft {
  const summary = (...types: string[]) => doc?.SummaryFields?.find(f => types.includes(f.Type?.Text ?? ''))?.ValueDetection?.Text;
  const lines: Draft['lines'] = [];
  for (const group of doc?.LineItemGroups ?? []) for (const item of group.LineItems ?? []) {
    const field = (type: string) => item.LineItemExpenseFields?.find(f => f.Type?.Text === type)?.ValueDetection?.Text;
    const name = (field('ITEM') ?? '').replace(/\s+/g, ' ').trim(), amount = money(field('PRICE'));
    const qty = money(field('QUANTITY')) || 1, unitPrice = money(field('UNIT_PRICE')) || amount / qty;
    if (name) lines.push({ name, qty, unitPrice: cents(unitPrice) });
  }
  const tax = money(summary('TAX')), subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  return {
    vendor: summary('VENDOR_NAME', 'NAME')?.replace(/\s+/g, ' ').trim() || 'Unknown vendor',
    date: findDate(summary('INVOICE_RECEIPT_DATE') ?? '') ?? today(),
    lines, tax: cents(tax), total: cents(money(summary('TOTAL', 'AMOUNT_DUE')) || subtotal + tax), source: 'textract',
    warnings: lines.length ? [] : ['Textract found no line items. Add them by hand.'],
  };
}

export const sampleInvoice = (): Draft => ({
  vendor: 'Keystone Produce', date: today(), lines: [{ name: 'Chicken Wrap', qty: 12, unitPrice: 2.35 }], tax: 1.68, total: 29.88, source: 'sample', warnings: [],
});

async function textract(bytes: Uint8Array): Promise<Draft> {
  const { TextractClient, AnalyzeExpenseCommand } = await import('@aws-sdk/client-textract');
  const result = await new TextractClient({ region: process.env.AWS_REGION }).send(new AnalyzeExpenseCommand({ Document: { Bytes: bytes } }));
  return parseTextractExpense(result.ExpenseDocuments?.[0]);
}

async function localOcr(bytes: Uint8Array): Promise<Draft> {
  let image = Buffer.from(bytes);
  const sharp = await import('sharp').then(m => m.default, () => null);
  if (sharp) {
    // Straighten, enlarge and boost contrast; phone photos read far better this way. A file sharp cannot
    // decode is not an image, and must not reach the OCR worker (it would throw outside this request).
    try { image = await sharp(image).rotate().resize({ width: 2000 }).grayscale().normalize().png().toBuffer(); }
    catch { throw new OcrError('That file is not an image Munshi can read. Upload a JPG or PNG photo of the invoice.'); }
  }
  const { createWorker } = await import('tesseract.js');
  // The English model (about 10 MB) is downloaded once and cached here.
  const worker = await createWorker('eng', 1, { cachePath: process.env.MUNSHI_OCR_CACHE || path.join(os.tmpdir(), 'munshi-ocr') });
  try {
    const { data } = await worker.recognize(image);
    const draft = parseInvoiceText(data.text);
    if (draft.lines.length && data.confidence < 60) draft.warnings.push('The image was hard to read. Check every field before posting.');
    return draft;
  } finally { await worker.terminate(); }
}

const isPdf = (bytes: Uint8Array) => bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // "%PDF"

/** Thrown for files that cannot be read; the message is safe to show to the owner. */
export class OcrError extends Error {}

export async function parseInvoiceFile(bytes: Uint8Array): Promise<Draft> {
  if (!bytes.length) return sampleInvoice();
  if (bytes.length > 10 * 1024 * 1024) throw new OcrError('That file is over 10 MB. Upload a smaller photo.');
  let cloudFailed = false;
  if (process.env.AWS_REGION) {
    try { return await textract(bytes); } catch (e) { console.error('Textract failed, using on-device OCR', e); cloudFailed = true; }
  }
  if (isPdf(bytes)) throw new OcrError(cloudFailed ? 'AWS Textract could not read that PDF. Upload a photo or screenshot instead.' : 'PDFs need AWS Textract, which is not configured. Upload a photo or screenshot of the invoice instead.');
  try {
    const draft = await localOcr(bytes);
    if (cloudFailed) draft.warnings.push('AWS Textract was unavailable, so this was read on-device.');
    return draft;
  } catch (e) {
    if (e instanceof OcrError) throw e;
    console.error('On-device OCR failed', e);
    throw new OcrError('That image could not be read. Upload a JPG or PNG photo of the invoice.');
  }
}

/** The stock item an invoice line refers to: the same name, ignoring pack sizes such as "12ct" or "2lb". */
export function matchItem<T extends { name: string }>(items: T[], name: string): T | undefined {
  const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(' ').filter(w => w.length > 1);
  const wanted = words(name), core = wanted.filter(w => !/\d/.test(w)).join(' ');
  if (!wanted.length) return undefined;
  return items.find(i => words(i.name).join(' ') === wanted.join(' ')) ?? (core ? items.find(i => words(i.name).join(' ') === core) : undefined);
}
