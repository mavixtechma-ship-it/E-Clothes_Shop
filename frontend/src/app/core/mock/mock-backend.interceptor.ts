import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, delay, filter, forkJoin, from, map, of, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { randomToken, verifyCredentials } from '../auth/password';
import {
  Category,
  CreateOrderRequest,
  ORDER_STATUSES,
  Order,
  OrderStatus,
  Product,
  ProductInput,
  ReportSummary,
  ShippingZone,
  VisitsByDay,
} from '../models';
import { MockDb, MockSession, MockSessions, visitStats } from './mock-db';

/*
 * Mock backend. Answers every ApiService endpoint under environment.apiUrl
 * (`/mock-api`) from the seed JSON in src/assets/mock, keeping writes in memory.
 *
 * It behaves like a real server would have to:
 *  - verifies logins (PBKDF2 via WebCrypto) and issues random session tokens
 *  - 401 for admin endpoints without a valid token, 403 for writes by `viewer`
 *  - re-validates every payload and RE-COMPUTES order prices, shipping and
 *    discounts from the catalogue (client totals are never trusted)
 * In a real deployment all of this must live on the server: anything in the
 * browser, including this file, can be read and bypassed.
 */

const PREFIX = environment.apiUrl;
const LATENCY = 180;
const PROMOS: Record<string, number> = { LOOM10: 0.1 };
const TOP_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const BOTTOM_SIZES = ['28', '30', '32', '34', '36', '38', '40'];
const MAX_UPLOAD = 2 * 1024 * 1024;
const UPLOAD_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

let db$: Observable<MockDb> | null = null;
const sessions = new MockSessions();
const failedLogins = new Map<string, { count: number; until: number }>();

function load(next: HttpHandlerFn): Observable<MockDb> {
  if (!db$) {
    const get = <T>(file: string) =>
      next(new HttpRequest<null>('GET', `assets/mock/${file}`, null, { responseType: 'json' })).pipe(
        // The handler emits a Sent event first; keep only the response body.
        filter((e): e is HttpResponse<T> => e instanceof HttpResponse),
        map((e) => e.body as T),
      );
    db$ = forkJoin({
      categories: get<Category[]>('categories.json'),
      products: get<Product[]>('products.json'),
      zones: get<ShippingZone[]>('shipping-zones.json'),
      orders: get<Order[]>('orders.json'),
      visits: get<{ totalViews: number; viewsByDay: VisitsByDay[] }>('visits.json'),
    }).pipe(
      map((d) => ({ ...d, nextImageId: 10_000 }) as MockDb),
      shareReplay(1),
    );
  }
  return db$;
}

// ---------- response helpers ----------
const ok = <T>(body: T, status = 200): Observable<HttpEvent<T>> =>
  of(new HttpResponse<T>({ status, body: structuredClone(body) })).pipe(delay(LATENCY));

const fail = (status: number, message: string, url: string): Observable<never> =>
  throwError(
    () =>
      new HttpErrorResponse({
        status,
        statusText: message,
        url,
        error: { message },
      }),
  ).pipe(delay(LATENCY)) as Observable<never>;

class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
const bad = (msg: string): never => {
  throw new ApiError(400, msg);
};

// ---------- validation ----------
const str = (v: unknown, field: string, min: number, max: number): string => {
  if (typeof v !== 'string') bad(`${field} is required`);
  const s = (v as string).trim();
  if (s.length < min || s.length > max) bad(`${field} must be ${min}-${max} characters`);
  return s;
};
const optStr = (v: unknown, field: string, max: number): string | undefined =>
  v === undefined || v === null || v === '' ? undefined : str(v, field, 0, max);
const int = (v: unknown, field: string, min: number, max: number): number => {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) bad(`${field} must be a whole number ${min}-${max}`);
  return v as number;
};

function validateProduct(body: unknown, db: MockDb): ProductInput & { category: string } {
  if (!body || typeof body !== 'object') bad('Invalid body');
  const b = body as Record<string, unknown>;
  const categoryId = int(b['categoryId'], 'categoryId', 1, 1_000_000);
  const category = db.categories.find((c) => c.id === categoryId);
  if (!category) bad('Unknown category');
  const colorHex = str(b['colorHex'], 'colorHex', 7, 7);
  if (!/^#[0-9a-fA-F]{6}$/.test(colorHex)) bad('colorHex must look like #1A2B3C');
  const allowed = [...TOP_SIZES, ...BOTTOM_SIZES];
  const sizes = Array.isArray(b['sizes']) ? (b['sizes'] as unknown[]) : bad('sizes must be a list');
  if (!sizes.length || !sizes.every((s) => typeof s === 'string' && allowed.includes(s))) bad('Invalid sizes');
  if (typeof b['featured'] !== 'boolean') bad('featured must be true/false');
  return {
    name: str(b['name'], 'name', 2, 80),
    categoryId,
    category: category!.name,
    price: int(b['price'], 'price', 1, 200_000),
    colorHex: colorHex.toUpperCase(),
    colorName: optStr(b['colorName'], 'colorName', 40),
    material: optStr(b['material'], 'material', 120),
    description: optStr(b['description'], 'description', 1000),
    sizes: [...new Set(sizes as string[])],
    stock: int(b['stock'], 'stock', 0, 99_999),
    featured: b['featured'] as boolean,
  };
}

function createOrder(body: unknown, db: MockDb): Order {
  if (!body || typeof body !== 'object') bad('Invalid body');
  const req = body as CreateOrderRequest;
  const c = (req.customer ?? {}) as unknown as Record<string, unknown>;
  const email = str(c['email'], 'email', 5, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad('Invalid email');
  const phone = str(c['phone'], 'phone', 6, 24);
  if (!/^[0-9+\-\s()]+$/.test(phone)) bad('Invalid phone');
  const zone = db.zones.find((z) => z.area === c['governorate']);
  if (!zone) bad('Unknown delivery area');

  if (!Array.isArray(req.items) || req.items.length < 1 || req.items.length > 20) bad('1-20 items required');
  const items = req.items.map((it) => {
    const product = db.products.find((p) => p.id === it?.productId);
    if (!product) bad('Unknown product');
    const p = product!;
    if (typeof it.size !== 'string' || !p.sizes.includes(it.size)) bad(`Size not available for ${p.name}`);
    const qty = int(it.qty, 'qty', 1, 10);
    return { product: p, size: it.size, qty };
  });
  // stock check across lines of the same product
  const need = new Map<number, number>();
  items.forEach((i) => need.set(i.product.id, (need.get(i.product.id) ?? 0) + i.qty));
  for (const [pid, qty] of need) {
    const p = db.products.find((x) => x.id === pid)!;
    if (p.stock < qty) throw new ApiError(409, `Only ${p.stock} left of ${p.name}`);
  }

  // Prices, shipping and discount are always recomputed here — never trusted from the client.
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const code = typeof req.promoCode === 'string' ? req.promoCode.trim().toUpperCase() : '';
  const rate = PROMOS[code] ?? 0;
  const discount = Math.round(subtotal * rate);
  for (const [pid, qty] of need) db.products.find((x) => x.id === pid)!.stock -= qty;

  const order: Order = {
    id: Math.max(0, ...db.orders.map((o) => o.id)) + 1,
    orderNumber: 'LL-' + (crypto.getRandomValues(new Uint32Array(1))[0] % 90000 + 10000),
    customer: {
      name: str(c['name'], 'name', 2, 80),
      email,
      phone,
      address: str(c['address'], 'address', 4, 160),
      city: str(c['city'], 'city', 2, 60),
      governorate: zone!.area,
    },
    items: items.map((i) => ({ productId: i.product.id, name: i.product.name, size: i.size, qty: i.qty, price: i.product.price })),
    subtotal,
    shippingFee: zone!.fee,
    discount,
    total: subtotal + zone!.fee - discount,
    status: 'Paid',
    promoCode: rate ? code : undefined,
    createdAt: new Date().toISOString(),
  };
  db.orders.push(order);
  return order;
}

function report(db: MockDb): ReportSummary {
  const live = db.orders.filter((o) => o.status !== 'Cancelled');
  const revenue = live.reduce((s, o) => s + o.total, 0);
  const byCat = new Map<string, { revenue: number; units: number }>();
  const byProduct = new Map<number, { name: string; unitsSold: number; revenue: number }>();
  for (const o of live) {
    for (const it of o.items) {
      const p = db.products.find((x) => x.id === it.productId);
      const cat = p?.category ?? 'Other';
      const c = byCat.get(cat) ?? { revenue: 0, units: 0 };
      c.revenue += it.price * it.qty;
      c.units += it.qty;
      byCat.set(cat, c);
      if (it.productId) {
        const b = byProduct.get(it.productId) ?? { name: it.name, unitsSold: 0, revenue: 0 };
        b.unitsSold += it.qty;
        b.revenue += it.price * it.qty;
        byProduct.set(it.productId, b);
      }
    }
  }
  const latest = db.orders.reduce((m, o) => Math.max(m, Date.parse(o.createdAt)), 0) || Date.now();
  const revenueByDay = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(latest - (29 - i) * 86_400_000).toISOString().slice(0, 10);
    const dayOrders = live.filter((o) => o.createdAt.slice(0, 10) === d);
    return { date: d, revenue: dayOrders.reduce((s, o) => s + o.total, 0), orders: dayOrders.length };
  });
  return {
    totalProducts: db.products.length,
    inStock: db.products.reduce((s, p) => s + p.stock, 0),
    catalogValue: db.products.reduce((s, p) => s + p.stock * p.price, 0),
    revenue,
    orders: db.orders.length,
    averageOrder: live.length ? Math.round(revenue / live.length) : 0,
    revenueByCategory: [...byCat]
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.revenue - a.revenue),
    lowStock: db.products
      .filter((p) => p.stock <= 5)
      .sort((a, b) => a.stock - b.stock)
      .map((p) => ({ id: p.id, name: p.name, stock: p.stock })),
    bestSellers: [...byProduct]
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
      .slice(0, 5),
    revenueByDay,
    ordersByStatus: ORDER_STATUSES.map((status) => ({
      status,
      count: db.orders.filter((o) => o.status === status).length,
    })),
  };
}

// ---------- router ----------
type Auth = MockSession | null;

function handle(req: HttpRequest<unknown>, db: MockDb, path: string[], auth: Auth): Observable<HttpEvent<unknown>> {
  const m = req.method;
  const [res, idRaw, sub, subId] = path;
  const id = idRaw !== undefined ? Number(idRaw) : NaN;
  const requireAuth = () => {
    if (!auth) throw new ApiError(401, 'Sign in required');
  };
  const requireAdmin = () => {
    requireAuth();
    if (auth!.role !== 'admin') throw new ApiError(403, 'Read-only account: changes are not allowed');
  };

  // ---- public ----
  if (res === 'categories' && m === 'GET' && !idRaw) {
    return ok(
      [...db.categories]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((c) => ({ ...c, count: db.products.filter((p) => p.categoryId === c.id).length })),
    );
  }
  if (res === 'shipping-zones' && m === 'GET') return ok(db.zones);

  if (res === 'products' && !idRaw && m === 'GET') {
    const cat = req.params.get('category')?.toLowerCase();
    const size = req.params.get('size');
    const q = req.params.get('q')?.trim().toLowerCase();
    return ok(
      db.products.filter(
        (p) =>
          (!cat || p.category.toLowerCase() === cat) &&
          (!size || p.sizes.includes(size)) &&
          (!q || [p.name, p.category, p.colorName ?? '', p.material ?? ''].some((s) => s.toLowerCase().includes(q))),
      ),
    );
  }
  if (res === 'products' && idRaw && !sub && m === 'GET') {
    const p = db.products.find((x) => x.id === id);
    if (!p) throw new ApiError(404, 'Product not found');
    return ok(p);
  }
  if (res === 'orders' && !idRaw && m === 'POST') return ok(createOrder(req.body, db), 201);
  if (res === 'visits' && !idRaw && m === 'POST') {
    const today = new Date().toISOString().slice(0, 10);
    const days = db.visits.viewsByDay;
    if (days[days.length - 1]?.date === today) {
      days[days.length - 1].count++;
    } else {
      days.push({ date: today, count: 1 });
      if (days.length > 30) days.shift();
    }
    db.visits.totalViews++;
    return ok({ ok: true }, 201);
  }

  // ---- signed-in (admin or viewer) ----
  if (res === 'orders' && !idRaw && m === 'GET') {
    requireAuth();
    return ok([...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }
  if (res === 'reports' && idRaw === 'summary' && m === 'GET') {
    requireAuth();
    return ok(report(db));
  }
  if (res === 'visits' && idRaw === 'count' && m === 'GET') {
    requireAuth();
    return ok(visitStats(db));
  }

  // ---- admin-only writes ----
  if (res === 'orders' && idRaw && sub === 'status' && m === 'PATCH') {
    requireAdmin();
    const order = db.orders.find((o) => o.id === id);
    if (!order) throw new ApiError(404, 'Order not found');
    const status = (req.body as { status?: unknown })?.status;
    if (!ORDER_STATUSES.includes(status as OrderStatus)) bad('Invalid status');
    order.status = status as OrderStatus;
    return ok(order);
  }
  if (res === 'products' && !idRaw && m === 'POST') {
    requireAdmin();
    const input = validateProduct(req.body, db);
    const product: Product = {
      ...input,
      id: Math.max(0, ...db.products.map((p) => p.id)) + 1,
      images: [],
      createdAt: new Date().toISOString(),
    };
    db.products.push(product);
    return ok(product, 201);
  }
  if (res === 'products' && idRaw && !sub && (m === 'PUT' || m === 'DELETE')) {
    requireAdmin();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx < 0) throw new ApiError(404, 'Product not found');
    if (m === 'DELETE') {
      db.products[idx].images.forEach((i) => i.url.startsWith('blob:') && URL.revokeObjectURL(i.url));
      db.products.splice(idx, 1);
      return ok(null, 204);
    }
    db.products[idx] = { ...db.products[idx], ...validateProduct(req.body, db) };
    return ok(db.products[idx]);
  }
  if (res === 'products' && idRaw && sub === 'images') {
    requireAdmin();
    const product = db.products.find((p) => p.id === id);
    if (!product) throw new ApiError(404, 'Product not found');
    if (m === 'POST' && !subId) {
      const file = req.body instanceof FormData ? req.body.get('file') : null;
      if (!(file instanceof File)) bad('No file');
      const f = file as File;
      if (!UPLOAD_TYPES.includes(f.type)) bad('Only PNG, JPEG or WebP images');
      if (f.size > MAX_UPLOAD) bad('Image must be 2 MB or less');
      const image = {
        id: db.nextImageId++,
        url: URL.createObjectURL(f),
        sortOrder: product.images.length + 1,
        isPrimary: product.images.length === 0,
      };
      product.images.push(image);
      return ok(image, 201);
    }
    if (m === 'DELETE' && subId) {
      const imgId = Number(subId);
      const img = product.images.find((i) => i.id === imgId);
      if (!img) throw new ApiError(404, 'Image not found');
      if (img.url.startsWith('blob:')) URL.revokeObjectURL(img.url);
      product.images = product.images.filter((i) => i.id !== imgId);
      return ok(null, 204);
    }
  }
  throw new ApiError(404, 'Not found');
}

function login(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
  const b = (req.body ?? {}) as Record<string, unknown>;
  const username = typeof b['username'] === 'string' ? b['username'].trim().toLowerCase().slice(0, 64) : '';
  const password = typeof b['password'] === 'string' ? b['password'].slice(0, 256) : '';
  if (!username || !password) return fail(400, 'Username and password are required', req.url);

  const lock = failedLogins.get(username);
  if (lock && lock.until > Date.now()) {
    return fail(429, 'Too many attempts. Try again in a minute.', req.url);
  }
  return from(verifyCredentials(username, password)).pipe(
    switchMap((account) => {
      if (!account) {
        const f = failedLogins.get(username) ?? { count: 0, until: 0 };
        f.count++;
        if (f.count >= 5) {
          f.count = 0;
          f.until = Date.now() + 60_000;
        }
        failedLogins.set(username, f);
        return fail(401, 'Invalid username or password', req.url);
      }
      failedLogins.delete(username);
      const token = randomToken();
      const expiresAt = Date.now() + environment.sessionMinutes * 60_000;
      sessions.add(token, { username: account.username, role: account.role, expiresAt });
      return ok({ token, username: account.username, role: account.role, expiresAt });
    }),
  );
}

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url !== PREFIX && !req.url.startsWith(PREFIX + '/')) return next(req);

  const path = req.url.slice(PREFIX.length).split('?')[0].split('/').filter(Boolean).map(decodeURIComponent);
  if (path[0] === 'auth' && path[1] === 'login' && req.method === 'POST') return login(req);

  const header = req.headers.get('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const auth = sessions.get(token);

  return load(next).pipe(
    switchMap((db) => {
      try {
        return handle(req, db, path, auth);
      } catch (e) {
        if (e instanceof ApiError) return fail(e.status, e.message, req.url);
        return fail(500, 'Unexpected error', req.url);
      }
    }),
  );
};
