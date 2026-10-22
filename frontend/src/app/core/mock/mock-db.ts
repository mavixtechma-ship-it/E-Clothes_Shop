import { Category, Order, Product, ShippingZone, VisitStats, VisitsByDay } from '../models';

/** In-memory dataset. Seeded from src/assets/mock/*.json; writes live until reload. */
export interface MockDb {
  categories: Category[];
  products: Product[];
  zones: ShippingZone[];
  orders: Order[];
  visits: { totalViews: number; viewsByDay: VisitsByDay[] };
  nextImageId: number;
}

export interface MockSession {
  username: string;
  role: 'admin' | 'viewer';
  expiresAt: number;
}

const SESSIONS_KEY = 'loomline.mock.sessions';

/**
 * "Server-side" session registry for the mock API. Kept in sessionStorage so a
 * page refresh does not drop the session the client still holds.
 */
export class MockSessions {
  private map = new Map<string, MockSession>(this.read());

  add(token: string, s: MockSession): void {
    this.prune();
    this.map.set(token, s);
    this.persist();
  }

  get(token: string | null): MockSession | null {
    if (!token) return null;
    const s = this.map.get(token);
    if (!s) return null;
    if (s.expiresAt <= Date.now()) {
      this.map.delete(token);
      this.persist();
      return null;
    }
    return s;
  }

  private prune(): void {
    const now = Date.now();
    for (const [k, v] of this.map) if (v.expiresAt <= now) this.map.delete(k);
  }

  private persist(): void {
    try {
      sessionStorage.setItem(SESSIONS_KEY, JSON.stringify([...this.map]));
    } catch {
      /* memory only */
    }
  }

  private read(): [string, MockSession][] {
    try {
      const raw = sessionStorage.getItem(SESSIONS_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as [string, MockSession][]) : [];
    } catch {
      return [];
    }
  }
}

export function visitStats(db: MockDb): VisitStats {
  const days = db.visits.viewsByDay;
  return {
    totalViews: db.visits.totalViews,
    today: days.length ? days[days.length - 1].count : 0,
    viewsByDay: days.map((d) => ({ ...d })),
  };
}
