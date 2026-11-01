type Entry = { at: number; value: unknown };

const globalForReads = globalThis as unknown as { deskReads?: Map<string, Entry>; deskReadWarm?: Promise<void> | null };
const store = globalForReads.deskReads ?? new Map<string, Entry>();
globalForReads.deskReads = store;
const ttl = 5 * 60_000;

function inflight() {
  return globalForReads.deskReadWarm ?? null;
}

function fresh<T>(key: string): T | undefined {
  const found = store.get(key);
  if (!found || Date.now() - found.at >= ttl) return undefined;
  return found.value as T;
}

export function keep<T>(key: string, value: T) {
  store.set(key, { at: Date.now(), value });
}

export function holdReads(work: Promise<void>) {
  const tracked = work.finally(() => {
    if (globalForReads.deskReadWarm === tracked) globalForReads.deskReadWarm = null;
  });
  globalForReads.deskReadWarm = tracked;
  return tracked;
}

export async function remember<T>(key: string, load: () => Promise<T>): Promise<T> {
  const cached = fresh<T>(key);
  if (cached !== undefined) return cached;
  if (inflight()) {
    await inflight();
    const warmed = fresh<T>(key);
    if (warmed !== undefined) return warmed;
  }
  const value = await load();
  keep(key, value);
  return value;
}

export function forgetReads() {
  store.clear();
}
