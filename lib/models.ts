import mongoose, { Schema, model, models, type Model } from 'mongoose';
import { seed } from './core';
import type { Business, Entry, Invoice, Item, Sale } from './core';
import type { BusinessStore } from './store';

const opts = { timestamps: true };
const objectRef = { type: Schema.Types.ObjectId, index: true, required: true };
// The ledger collections key on the domain's string ids ("cafe", "cafe-0") so documents round-trip
// to lib/types unchanged. `seq` keeps array order: higher is newer, except items where it is the list position.
const owned = { businessId: { type: String, required: true }, id: { type: String, required: true }, seq: { type: Number, default: 0 } };
const mixedList = { type: [Schema.Types.Mixed], default: [] };
const line = new Schema({ id: String, name: String, qty: Number, price: Number, cost: Number }, { _id: false });
const journalLine = new Schema({ account: String, debit: Number, credit: Number }, { _id: false });
const legacyLine = new Schema({ itemId: String, name: String, qty: Number, price: Number, cost: Number }, { _id: false });

const schemas = {
  User: new Schema({ name: String, email: { type: String, index: true, unique: true }, image: String }, opts),
  Business: new Schema({
    id: { type: String, required: true, unique: true }, seq: { type: Number, default: 0 }, ownerId: Schema.Types.ObjectId,
    name: String, type: String, address: String, currency: String, eventDay: Boolean, cash: Number,
    suggestions: mixedList, orders: mixedList, experiments: mixedList, outcomes: mixedList,
    arena: { type: Schema.Types.Mixed }, // agent arena runs and long-term lessons memory
  }, opts),
  Item: new Schema({ ...owned, name: String, category: String, price: Number, cost: Number, stock: Number, reorder: Number, units: Number, unit: String }, opts),
  Invoice: new Schema({ ...owned, vendor: String, vendorId: Schema.Types.ObjectId, date: String, items: [line], imageUrl: String, tax: Number, total: Number, paid: Boolean }, opts),
  Sale: new Schema({ ...owned, date: String, time: String, items: [line], total: Number, channel: String, payment: String }, opts),
  JournalEntry: new Schema({ ...owned, date: String, source: String, memo: String, lines: [journalLine] }, opts),
  // Not used by the ledger yet.
  Vendor: new Schema({ businessId: objectRef, name: String, email: String, phone: String, items: [String] }, opts),
  Account: new Schema({ businessId: objectRef, code: String, name: String, type: String }, opts),
  InventoryMovement: new Schema({ businessId: objectRef, itemId: Schema.Types.ObjectId, qty: Number, unitCost: Number, source: String }, opts),
  Prediction: new Schema({ businessId: objectRef, action: String, reason: String, impact: Number, confidence: Number, category: String, checkAfter: Date }, opts),
  Outcome: new Schema({ businessId: objectRef, predictionId: Schema.Types.ObjectId, actual: Number, verdict: String, lesson: String }, opts),
  Experiment: new Schema({ businessId: objectRef, itemId: Schema.Types.ObjectId, testPrice: Number, baselinePrice: Number, startsAt: Date, endsAt: Date, status: String }, opts),
  Order: new Schema({ businessId: objectRef, channel: String, status: String, items: [legacyLine], customer: String }, opts),
  PurchaseOrder: new Schema({ businessId: objectRef, vendorId: Schema.Types.ObjectId, status: String, items: [legacyLine], total: Number }, opts),
};
for (const name of ['Item', 'Invoice', 'Sale', 'JournalEntry'] as const) {
  schemas[name].index({ businessId: 1, id: 1 }, { unique: true });
  schemas[name].index({ businessId: 1, seq: -1 });
}

export const dbModels = Object.fromEntries(
  Object.entries(schemas).map(([name, schema]) => [name, models[name] || model(name, schema)]),
) as Record<keyof typeof schemas, Model<any>>;

// One connection per process, surviving Next.js hot reloads. Without MONGODB_URI this starts an
// in-memory MongoDB, so the same code runs with no database installed (data is lost on exit).
type MemoryServer = { getUri(): string; stop(): Promise<boolean> };
const g = globalThis as { __munshiDb?: Promise<typeof mongoose>; __munshiMemoryDb?: MemoryServer };
export function connectDatabase() {
  return (g.__munshiDb ??= (async () => {
    if (process.env.MONGODB_URI) return mongoose.connect(process.env.MONGODB_URI);
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    g.__munshiMemoryDb = await MongoMemoryServer.create();
    return mongoose.connect(g.__munshiMemoryDb.getUri());
  })().catch(e => { delete g.__munshiDb; throw e; }));
}
export async function disconnectDatabase() {
  if (!g.__munshiDb) return;
  delete g.__munshiDb;
  await mongoose.disconnect();
  await g.__munshiMemoryDb?.stop();
  delete g.__munshiMemoryDb;
}

const { Business: BusinessDoc, Item: ItemDoc, Invoice: InvoiceDoc, Sale: SaleDoc, JournalEntry: EntryDoc } = dbModels;
const ledgerDocs = [BusinessDoc, ItemDoc, InvoiceDoc, SaleDoc, EntryDoc];
const plain = <T>({ _id, __v, businessId, seq, createdAt, updatedAt, ownerId, ...rest }: any): T => rest;
const children = async <T>(m: Model<any>, businessId: string, order: 1 | -1) =>
  (await m.find({ businessId }).sort({ seq: order, _id: order }).lean()).map(d => plain<T>(d));

/** Businesses in MongoDB, one document per business plus one per item, invoice, sale and journal entry. */
export class MongoBusinessStore implements BusinessStore {
  private async hydrate(doc: any): Promise<Business> {
    const [items, invoices, sales, entries] = await Promise.all([
      children<Item>(ItemDoc, doc.id, 1), children<Invoice>(InvoiceDoc, doc.id, -1),
      children<Sale>(SaleDoc, doc.id, -1), children<Entry>(EntryDoc, doc.id, -1),
    ]);
    return { ...plain<Omit<Business, 'items' | 'invoices' | 'sales' | 'entries'>>(doc), items, invoices, sales, entries };
  }

  async list() {
    await connectDatabase();
    const docs = await BusinessDoc.find().sort({ seq: 1, _id: 1 }).lean();
    if (!docs.length) return this.reset(); // an empty database starts with the demo data, like the file store
    return Promise.all(docs.map(d => this.hydrate(d)));
  }

  async get(id: string) {
    await connectDatabase();
    let doc = await BusinessDoc.findOne({ id }).lean();
    if (!doc && !(await BusinessDoc.estimatedDocumentCount())) { await this.reset(); doc = await BusinessDoc.findOne({ id }).lean(); }
    return doc ? this.hydrate(doc) : null;
  }

  async save(b: Business) {
    await connectDatabase();
    const { items, invoices, sales, entries, ...fields } = b;
    await BusinessDoc.updateOne({ id: b.id }, { $set: fields }, { upsert: true });
    // Items and invoices are few and change in place (stock, cost, paid), so they are rewritten.
    const rewrite = (m: Model<any>, rows: { id: string }[], seqOf: (i: number) => number) => rows.length
      ? m.bulkWrite(rows.map((row, i) => ({ replaceOne: { filter: { businessId: b.id, id: row.id }, replacement: { ...row, businessId: b.id, seq: seqOf(i) }, upsert: true } })))
      : null;
    // Sales and journal entries are append-only, so only the ones not stored yet are inserted.
    const append = async (m: Model<any>, rows: { id: string }[]) => {
      const stored = new Set<string>(await m.distinct('id', { businessId: b.id }));
      const fresh = rows.filter(r => !stored.has(r.id));
      if (fresh.length) await m.insertMany(fresh.map((row, i) => ({ ...row, businessId: b.id, seq: stored.size + fresh.length - 1 - i })));
    };
    await Promise.all([
      rewrite(ItemDoc, items, i => i), rewrite(InvoiceDoc, invoices, i => invoices.length - 1 - i),
      append(SaleDoc, sales), append(EntryDoc, entries),
    ]);
  }

  async reset() {
    await connectDatabase();
    await Promise.all(ledgerDocs.map(m => m.deleteMany({})));
    const businesses = seed();
    await BusinessDoc.bulkWrite(businesses.map((b, seq) => ({ updateOne: { filter: { id: b.id }, update: { $set: { seq } }, upsert: true } })));
    for (const b of businesses) await this.save(b);
    return businesses;
  }
}
