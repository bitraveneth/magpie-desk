type Entry = { at: number; value: unknown };

const store = new Map<string, Entry>();
const ttl = 30_000;

export async function remember<T>(key: string, load: () => Promise<T>): Promise<T> {
  const found = store.get(key);
  if (found && Date.now() - found.at < ttl) return found.value as T;
  const value = await load();
  store.set(key, { at: Date.now(), value });
  return value;
}

export function forgetReads() {
  store.clear();
}
