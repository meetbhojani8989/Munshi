import fs from 'node:fs';
import path from 'node:path';
import { seed, type Business } from './core';

// ---- Local store: businesses held in memory and mirrored to a JSON file ----
// Serverless hosts (Vercel, Amplify, Lambda) only allow writes under /tmp.
const serverless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const file = process.env.MUNSHI_DATA_FILE || path.join(serverless ? '/tmp' : process.cwd(), 'data', 'businesses.json');
let cache: Business[] | null = null;
let cachedAt = 0; // mtime of the file the cache was read from or written to
const mtime = () => { try { return fs.statSync(file).mtimeMs; } catch { return 0; } };

export function loadBusinesses(): Business[] {
  // Re-read when another process or module instance (seed script, another route bundle) wrote the file.
  const stamp = mtime();
  if (cache && stamp === cachedAt) return cache;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (Array.isArray(parsed) && parsed.every(x => x && typeof x.id === 'string')) { cachedAt = stamp; return cache = parsed; }
  } catch {}
  if (cache) return cache;
  cachedAt = stamp;
  return cache = seed();
}
export function saveBusinesses(businesses: Business[]) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(businesses));
  fs.renameSync(temp, file);
  cache = businesses;
  cachedAt = mtime();
}
export function resetBusinesses() { const businesses = seed(); saveBusinesses(businesses); return businesses; }

// ---- Store interface used by LedgerService and the API routes ----
export interface BusinessStore {
  list(): Promise<Business[]>;
  get(id: string): Promise<Business | null>;
  /** Persist one business, replacing the stored copy with the same id. */
  save(business: Business): Promise<void>;
  /** Replace everything with fresh demo data. */
  reset(): Promise<Business[]>;
}

export const fileStore: BusinessStore = {
  async list() { return loadBusinesses(); },
  async get(id) { return loadBusinesses().find(b => b.id === id) ?? null; },
  async save(business) {
    const all = loadBusinesses();
    const at = all.findIndex(b => b.id === business.id);
    if (at < 0) all.push(business); else all[at] = business;
    saveBusinesses(all);
  },
  async reset() { return resetBusinesses(); },
};

// Loaded on first use so the local store never pulls in mongoose.
const mongo = async () => new (await import('./models')).MongoBusinessStore();
const mongoStore: BusinessStore = {
  list: async () => (await mongo()).list(),
  get: async id => (await mongo()).get(id),
  save: async business => (await mongo()).save(business),
  reset: async () => (await mongo()).reset(),
};

export type StoreKind = 'mongo' | 'file';
/** MongoDB when MONGODB_URI is set, otherwise the local store. MUNSHI_STORE=mongo|file overrides. */
export function storeKind(): StoreKind {
  const forced = process.env.MUNSHI_STORE;
  if (forced === 'mongo' || forced === 'file') return forced;
  return process.env.MONGODB_URI ? 'mongo' : 'file';
}
export const getStore = (): BusinessStore => (storeKind() === 'mongo' ? mongoStore : fileStore);

/** A store that lives only in memory, for tests. */
export function memoryStore(businesses: Business[] = seed()): BusinessStore {
  let all = businesses;
  return {
    async list() { return all; },
    async get(id) { return all.find(b => b.id === id) ?? null; },
    async save(business) { all = all.some(b => b.id === business.id) ? all.map(b => (b.id === business.id ? business : b)) : [...all, business]; },
    async reset() { return all = seed(); },
  };
}
