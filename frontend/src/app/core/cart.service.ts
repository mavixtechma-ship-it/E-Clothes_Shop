import { Injectable, computed, signal } from '@angular/core';
import { CartLine, Product } from './models';
import { readJson, writeJson } from './utils';

const CART_KEY = 'loomline.cart';
const MAX_QTY = 10;

function isCartLine(v: unknown): v is CartLine {
  const l = v as CartLine;
  return (
    !!l &&
    typeof l.productId === 'number' &&
    typeof l.name === 'string' &&
    typeof l.size === 'string' &&
    typeof l.price === 'number' &&
    Number.isInteger(l.qty) &&
    l.qty > 0
  );
}

/** Signal-based cart (sessionStorage-backed) + drawer open flag. */
@Injectable({ providedIn: 'root' })
export class CartService {
  private _lines = signal<CartLine[]>(this.read());
  readonly lines = this._lines.asReadonly();
  readonly drawerOpen = signal(false);

  readonly count = computed(() => this._lines().reduce((n, l) => n + l.qty, 0));
  /** Display estimate only — the API recomputes all prices when the order is placed. */
  readonly subtotal = computed(() => this._lines().reduce((n, l) => n + l.price * l.qty, 0));

  add(product: Product, size: string, qty = 1): void {
    const lines = this._lines().map((l) => ({ ...l }));
    const existing = lines.find((l) => l.productId === product.id && l.size === size);
    if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + qty);
    else
      lines.push({
        productId: product.id,
        name: product.name,
        category: product.category,
        color: product.colorHex,
        price: product.price,
        size,
        qty: Math.min(MAX_QTY, qty),
        imageUrl: product.images?.[0]?.url,
      });
    this.commit(lines);
  }

  setQty(productId: number, size: string, qty: number): void {
    if (qty <= 0) return this.remove(productId, size);
    this.commit(
      this._lines().map((l) =>
        l.productId === productId && l.size === size ? { ...l, qty: Math.min(MAX_QTY, qty) } : l,
      ),
    );
  }

  remove(productId: number, size: string): void {
    this.commit(this._lines().filter((l) => !(l.productId === productId && l.size === size)));
  }

  clear(): void {
    this.commit([]);
  }

  private commit(lines: CartLine[]): void {
    this._lines.set(lines);
    writeJson('session', CART_KEY, lines);
  }

  private read(): CartLine[] {
    const raw = readJson<unknown>('session', CART_KEY, []);
    return Array.isArray(raw) ? raw.filter(isCartLine) : [];
  }
}
