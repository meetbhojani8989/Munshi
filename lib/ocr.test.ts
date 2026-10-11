import { describe, it, expect } from 'vitest';
import { findDate, matchItem, parseInvoiceFile, parseInvoiceText, parseTextractExpense } from './ocr';

describe('parseInvoiceText', () => {
  it('reads a table invoice: vendor, date, lines, tax and total', () => {
    const draft = parseInvoiceText(`Centre County Foods LLC
120 Market St, State College, PA 16801
INVOICE #10482 Date: 10/09/2026
Bill to: Nittany Bean & Wrap
Description Qty Unit Price Amount
Oat Milk 1L 6 $2.40 $14.40
Chicken Breast 5lb 4 $11.25 $45.00
Tortilla Wraps 12ct 10 $3.10 $31.00
Subtotal $90.40
Sales Tax (6%) $5.42
Total Due $95.82
Payment terms: Net 15. Thank you for your business!`);
    expect(draft).toMatchObject({ vendor: 'Centre County Foods LLC', date: '2026-10-09', tax: 5.42, total: 95.82, source: 'ocr', warnings: [] });
    expect(draft.lines).toEqual([
      { name: 'Oat Milk 1L', qty: 6, unitPrice: 2.4 },
      { name: 'Chicken Breast 5lb', qty: 4, unitPrice: 11.25 },
      { name: 'Tortilla Wraps 12ct', qty: 10, unitPrice: 3.1 },
    ]);
  });

  it('reads receipt-style lines without a header', () => {
    const draft = parseInvoiceText(`HAPPY VALLEY BAKERY\nOct 3, 2026\n2 Almond Croissant 7.00\nBagel 12 x 0.85\nBanana Bread 4.25\n555 Main Street 16801\nTAX 0.90\nTOTAL 22.35`);
    expect(draft.vendor).toBe('HAPPY VALLEY BAKERY');
    expect(draft.date).toBe('2026-10-03');
    expect(draft.lines).toEqual([
      { name: 'Almond Croissant', qty: 2, unitPrice: 3.5 },
      { name: 'Bagel', qty: 12, unitPrice: 0.85 },
      { name: 'Banana Bread', qty: 1, unitPrice: 4.25 },
    ]);
    expect(draft.tax).toBe(0.9);
    expect(draft.total).toBe(22.35);
  });

  it('warns instead of inventing lines when nothing is readable', () => {
    const draft = parseInvoiceText('~~ ..\n lorem ipsum');
    expect(draft.lines).toEqual([]);
    expect(draft.warnings).toHaveLength(1);
  });
});

describe('parseTextractExpense', () => {
  it('maps summary fields and line items', () => {
    const field = (type: string, text: string) => ({ Type: { Text: type }, ValueDetection: { Text: text } });
    const draft = parseTextractExpense({
      SummaryFields: [field('VENDOR_NAME', 'Centre Dairy'), field('INVOICE_RECEIPT_DATE', 'Oct 9, 2026'), field('TAX', '$1.20'), field('TOTAL', '$1,021.20')],
      LineItemGroups: [{ LineItems: [
        { LineItemExpenseFields: [field('ITEM', 'Whole Milk\n1 gal'), field('QUANTITY', '200'), field('UNIT_PRICE', '$4.10'), field('PRICE', '$820.00')] },
        { LineItemExpenseFields: [field('ITEM', 'Butter'), field('QUANTITY', '40'), field('PRICE', '$200.00')] },
      ] }],
    });
    expect(draft).toMatchObject({ vendor: 'Centre Dairy', date: '2026-10-09', tax: 1.2, total: 1021.2, source: 'textract' });
    expect(draft.lines).toEqual([{ name: 'Whole Milk 1 gal', qty: 200, unitPrice: 4.1 }, { name: 'Butter', qty: 40, unitPrice: 5 }]);
  });
});

describe('helpers', () => {
  it('finds dates in common formats', () => {
    expect(findDate('Due 2026-10-11')).toBe('2026-10-11');
    expect(findDate('9/5/26')).toBe('2026-09-05');
    expect(findDate('5 September 2026')).toBe('2026-09-05');
    expect(findDate('no date here')).toBeNull();
  });
  it('matches invoice lines to stock items', () => {
    const items = [{ name: 'Chicken Wrap' }, { name: 'Iced Latte' }, { name: 'Latte' }];
    expect(matchItem(items, 'chicken wrap')?.name).toBe('Chicken Wrap');
    expect(matchItem(items, 'Chicken Wrap 12ct')?.name).toBe('Chicken Wrap');
    expect(matchItem(items, 'Latte')?.name).toBe('Latte');
    expect(matchItem(items, 'Oat Milk')).toBeUndefined();
    expect(matchItem([{ name: 'Espresso' }], 'Espresso Beans 2lb')).toBeUndefined();
  });
  it('returns the sample when no file is sent and refuses PDFs without Textract', async () => {
    expect((await parseInvoiceFile(new Uint8Array())).source).toBe('sample');
    if (!process.env.AWS_REGION) await expect(parseInvoiceFile(new TextEncoder().encode('%PDF-1.7 ...'))).rejects.toThrow('PDFs need AWS Textract');
  });
});
