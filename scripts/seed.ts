// Resets the demo data in whichever store is configured: MongoDB when MONGODB_URI is set, else data/businesses.json.
import fs from 'node:fs';
for (const f of ['.env.local', '.env']) if (fs.existsSync(f)) process.loadEnvFile(f);

async function main() {
  const { balances } = await import('../lib/core');
  const { getStore, storeKind } = await import('../lib/store');
  const kind = storeKind();
  console.log(`Seeding ${kind === 'mongo' ? (process.env.MONGODB_URI ? 'MongoDB' : 'in-memory MongoDB (discarded on exit)') : 'local file store'}`);
  const businesses = await getStore().reset();
  for (const b of businesses) {
    const book = balances(b);
    const drift = Object.values(book).reduce((s, n) => s + n, 0);
    const stock = b.items.reduce((s, i) => s + i.stock * i.cost, 0);
    if (Math.abs(drift) > 0.01) throw Error(`${b.name}: books are out of balance by ${drift.toFixed(2)}`);
    if (Math.abs(stock - (book.Inventory || 0)) > 0.01) throw Error(`${b.name}: Inventory account ${book.Inventory} does not match stock at cost ${stock}`);
    console.log(`${b.name}: ${b.items.length} items, ${b.sales.length} sales, ${b.invoices.length} invoices, ${b.entries.length} journal entries, cash ${b.cash.toFixed(2)}, books balanced`);
  }
  if (kind === 'mongo') await (await import('../lib/models')).disconnectDatabase();
}
main().catch(e => { console.error(e); process.exit(1); });
