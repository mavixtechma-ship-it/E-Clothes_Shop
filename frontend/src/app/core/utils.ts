/**
 * Only allow images we know are safe to render: bundled assets and blob: URLs
 * created in this tab for uploads. Anything else (remote hosts, javascript:,
 * data:) is dropped and the UI falls back to the placeholder.
 */
export function safeImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith('assets/') && !url.includes('..')) return url;
  if (url.startsWith('blob:')) {
    try {
      return new URL(url.slice(5)).origin === location.origin ? url : null;
    } catch {
      return null;
    }
  }
  return null;
}

const egp = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
/** Whole-EGP money formatting (number only, caller adds the unit). */
export function formatEgp(value: number | null | undefined): string {
  return egp.format(Math.round(value ?? 0));
}

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
export function formatCompact(value: number): string {
  return compact.format(value);
}

/** Small, safe storage helpers — storage can throw in private mode. */
export function readJson<T>(storage: 'local' | 'session', key: string, fallback: T): T {
  try {
    const s = storage === 'local' ? localStorage : sessionStorage;
    const raw = s.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(storage: 'local' | 'session', key: string, value: unknown): void {
  try {
    const s = storage === 'local' ? localStorage : sessionStorage;
    if (value === null || value === undefined) s.removeItem(key);
    else s.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — memory only */
  }
}
