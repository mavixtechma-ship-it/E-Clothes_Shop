// Generates the Loomline demo dataset (deterministic, seeded) and the local
// product illustrations.
//
//   src/assets/mock/*.json       categories, products, shipping zones, orders, visits
//   src/assets/products/*.svg    two flat-lay illustrations per product
//
// Everything is fictional: customer names, e-mails (example.com) and phone numbers
// (555-01xx, a range reserved for fiction) are invented.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const mockDir = resolve(here, '../src/assets/mock');
const imgDir = resolve(here, '../src/assets/products');
mkdirSync(mockDir, { recursive: true });
mkdirSync(imgDir, { recursive: true });

// ---------- seeded RNG ----------
let seed = 20261022;
function rnd() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));

// ---------- catalogue ----------
const categories = [
  { id: 1, name: 'Tees', slug: 'tees', sortOrder: 1, blurb: 'Heavy cottons and merino basics.' },
  { id: 2, name: 'Shirts', slug: 'shirts', sortOrder: 2, blurb: 'Oxfords, linens and overshirts.' },
  { id: 3, name: 'Knitwear', slug: 'knitwear', sortOrder: 3, blurb: 'Lambswool, merino and cotton knits.' },
  { id: 4, name: 'Denim', slug: 'denim', sortOrder: 4, blurb: 'Rigid, selvedge and washed denim.' },
  { id: 5, name: 'Trousers', slug: 'trousers', sortOrder: 5, blurb: 'Chinos, cords and tailored wool.' },
  { id: 6, name: 'Outerwear', slug: 'outerwear', sortOrder: 6, blurb: 'Chore coats, field jackets, overcoats.' },
];

const TOPS = ['S', 'M', 'L', 'XL', 'XXL'];
const BOTTOMS = ['30', '32', '34', '36', '38'];

const raw = [
  // [category, name, colorName, hex, price, material, stock, featured]
  ['Tees', 'Everyday Crew Tee', 'Chalk', '#EDE8DF', 450, '100% combed cotton, 220 gsm', 64, true],
  ['Tees', 'Heavyweight Pocket Tee', 'Navy', '#263354', 590, 'Organic cotton jersey, 280 gsm', 41, false],
  ['Tees', 'Slub Henley Tee', 'Olive', '#6B6B47', 620, 'Slub cotton', 4, false],
  ['Tees', 'Merino Travel Tee', 'Charcoal', '#3A3D42', 1250, '17.5 micron merino wool', 18, true],
  ['Tees', 'Breton Stripe Tee', 'Ecru', '#E9E1CF', 690, 'Cotton interlock', 27, false],
  ['Shirts', 'Oxford Button-Down', 'Sky', '#A9C3DD', 1150, 'Cotton oxford cloth', 35, true],
  ['Shirts', 'Linen Camp Collar', 'Sand', '#D8C7A5', 1290, 'European linen', 22, false],
  ['Shirts', 'Chambray Work Shirt', 'Indigo', '#4A5F86', 1190, 'Cotton chambray', 3, false],
  ['Shirts', 'Flannel Overshirt', 'Moss', '#56614A', 1490, 'Brushed cotton flannel', 16, false],
  ['Shirts', 'Poplin Dress Shirt', 'White', '#F4F4F2', 1090, 'Two-ply cotton poplin', 48, false],
  ['Knitwear', 'Lambswool Crew', 'Oat', '#CDBE9F', 1850, 'Lambswool', 14, true],
  ['Knitwear', 'Cable Knit Roll Neck', 'Cream', '#EFE6D2', 2290, 'Wool-cashmere blend', 9, false],
  ['Knitwear', 'Cotton Half-Zip', 'Slate', '#5B6573', 1590, 'Cotton rib', 25, false],
  ['Knitwear', 'Merino Cardigan', 'Forest', '#2F4A3A', 2150, 'Extra-fine merino', 2, false],
  ['Knitwear', 'Waffle Knit Polo', 'Stone', '#A59E92', 1390, 'Cotton waffle knit', 0, false],
  ['Denim', 'Rigid Straight Jean', 'Raw Indigo', '#253250', 1690, '14 oz rigid denim', 30, true],
  ['Denim', 'Tapered Selvedge Jean', 'Mid Wash', '#5C7AA3', 2450, '13.5 oz selvedge denim', 12, false],
  ['Denim', 'Relaxed Carpenter Jean', 'Ecru', '#E3DAC6', 1790, '12 oz undyed denim', 19, false],
  ['Denim', 'Slim Black Jean', 'Washed Black', '#2B2B2E', 1590, 'Stretch denim', 44, false],
  ['Denim', 'Loose Light Wash Jean', 'Bleach', '#9DB4CF', 1650, '12 oz cotton denim', 5, false],
  ['Trousers', 'Pleated Wool Trouser', 'Charcoal', '#3B3E44', 2390, 'Tropical wool', 11, true],
  ['Trousers', 'Easy Drawstring Chino', 'Khaki', '#B9A47C', 1290, 'Cotton twill', 52, false],
  ['Trousers', 'Cord Five-Pocket', 'Tobacco', '#7A5A3A', 1490, '8-wale corduroy', 17, false],
  ['Trousers', 'Travel Tech Pant', 'Graphite', '#4A4E55', 1790, 'Nylon-elastane', 23, false],
  ['Trousers', 'Linen Beach Trouser', 'Natural', '#DCD2BE', 1190, 'Washed linen', 1, false],
  ['Outerwear', 'Canvas Chore Coat', 'Navy', '#22304C', 2890, 'Cotton duck canvas', 13, true],
  ['Outerwear', 'Waxed Field Jacket', 'Olive', '#555A3B', 3790, 'Waxed cotton', 6, false],
  ['Outerwear', 'Wool Overcoat', 'Camel', '#B48A5A', 3990, 'Wool-melton blend', 8, true],
  ['Outerwear', 'Quilted Liner Jacket', 'Black', '#232427', 2190, 'Recycled nylon, light fill', 21, false],
  ['Outerwear', 'Harrington Jacket', 'Stone', '#B8AF9E', 2490, 'Cotton gabardine', 15, false],
];

const descriptions = {
  Tees: 'Cut a touch longer in the body with a set-in sleeve that sits right on the shoulder. Garment-washed so it is soft from day one.',
  Shirts: 'A relaxed regular fit with a soft collar, single-needle stitching and corozo buttons. Built to be worn tucked or loose.',
  Knitwear: 'Fully fashioned panels, ribbed trims and a mid weight that layers under a coat without bulk.',
  Denim: 'Five-pocket construction with a mid rise, bar-tacked stress points and a copper shank button.',
  Trousers: 'A clean mid rise with a slightly tapered leg. Side-adjusters at the waist so you can skip the belt.',
  Outerwear: 'Roomy enough for a knit underneath, with deep patch pockets and a fully taped interior.',
};

const products = raw.map(([category, name, colorName, colorHex, price, material, stock, featured], i) => {
  const id = i + 1;
  const isBottom = category === 'Denim' || category === 'Trousers';
  return {
    id,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    category,
    categoryId: categories.find((c) => c.name === category).id,
    price,
    colorHex,
    colorName,
    material,
    description: descriptions[category],
    sizes: isBottom ? BOTTOMS : TOPS,
    stock,
    featured,
    images: [
      { id: id * 10 + 1, url: `assets/products/p${id}-1.svg`, sortOrder: 1, isPrimary: true },
      { id: id * 10 + 2, url: `assets/products/p${id}-2.svg`, sortOrder: 2 },
    ],
    createdAt: new Date(Date.UTC(2026, 5, 1 + i * 2)).toISOString(),
  };
});

const shippingZones = [
  ['Cairo', 85], ['Giza', 85], ['New Cairo', 85], ['6th of October', 85], ['Sheikh Zayed', 85],
  ['Alexandria', 90], ['Ismailia', 100], ['Mansoura', 100], ['Tanta', 100], ['Fayoum', 105],
  ['Beni Suef', 105], ['Minya', 110], ['Asyut', 120], ['Luxor', 150], ['Aswan', 150],
].map(([area, fee], i) => ({ id: i + 1, area, fee }));

// ---------- orders ----------
const first = ['Omar', 'Karim', 'Youssef', 'Hassan', 'Adam', 'Ziad', 'Malik', 'Tarek', 'Nabil', 'Samir', 'Rami', 'Fady', 'Sherif', 'Amir', 'Khaled', 'Nour', 'Laila', 'Mariam', 'Salma', 'Hana'];
const last = ['Haddad', 'Mansour', 'Fakhry', 'Saleh', 'Nassar', 'Barakat', 'Lotfy', 'Rizk', 'Shawky', 'Zaki', 'Hamdy', 'Wahba'];
const districts = ['Garden District', 'Old Town', 'Riverside', 'North Hills', 'Market Quarter', 'Palm Gardens'];
const streets = ['Maple Lane', 'Garden Street', 'Palm Avenue', 'River Road', 'Cedar Close', 'Olive Court', 'Station Street', 'Market Row'];

const END = Date.UTC(2026, 9, 21, 18, 0, 0); // 21 Oct 2026
const DAY = 86400000;
const orders = [];
for (let i = 0; i < 40; i++) {
  const f = pick(first);
  const l = pick(last);
  const zone = pick(shippingZones);
  const daysAgo = Math.floor((39 - i) * 1.45 + rnd() * 1.2);
  const created = new Date(END - daysAgo * DAY - int(0, 10) * 3600000 - int(0, 59) * 60000);
  const lineCount = int(1, 3);
  const items = [];
  for (let k = 0; k < lineCount; k++) {
    const p = pick(products);
    if (items.some((it) => it.productId === p.id)) continue;
    items.push({ productId: p.id, name: p.name, size: pick(p.sizes), qty: int(1, 2), price: p.price });
  }
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const promo = rnd() < 0.2;
  const discount = promo ? Math.round(subtotal * 0.1) : 0;
  let status;
  if (daysAgo > 12) status = rnd() < 0.1 ? 'Cancelled' : 'Delivered';
  else if (daysAgo > 6) status = pick(['Shipped', 'Delivered', 'Shipped']);
  else if (daysAgo > 2) status = pick(['Processing', 'Shipped']);
  else status = pick(['Paid', 'Processing', 'Paid']);
  orders.push({
    id: i + 1,
    orderNumber: `LL-${String(10240 + i * 7)}`,
    customer: {
      name: `${f} ${l}`,
      email: `${f}.${l}`.toLowerCase() + '@example.com',
      phone: `555-01${String(int(0, 99)).padStart(2, '0')}`,
      address: `${int(2, 180)} ${pick(streets)}`,
      city: pick(districts),
      governorate: zone.area,
    },
    items,
    subtotal,
    shippingFee: zone.fee,
    discount,
    total: subtotal + zone.fee - discount,
    status,
    promoCode: promo ? 'LOOM10' : undefined,
    createdAt: created.toISOString(),
  });
}

// ---------- visits ----------
const viewsByDay = [];
for (let d = 29; d >= 0; d--) {
  const date = new Date(END - d * DAY);
  const weekend = [5, 6].includes(date.getUTCDay());
  viewsByDay.push({ date: date.toISOString().slice(0, 10), count: int(140, 260) + (weekend ? 90 : 0) + (29 - d) * 3 });
}
const visits = { totalViews: viewsByDay.reduce((s, v) => s + v.count, 0) + 18420, viewsByDay };

const write = (name, data) => writeFileSync(resolve(mockDir, name), JSON.stringify(data, null, 2) + '\n');
write('categories.json', categories);
write('products.json', products);
write('shipping-zones.json', shippingZones);
write('orders.json', orders);
write('visits.json', visits);

// ---------- SVG illustrations ----------
function shade(hex, delta) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v));
  const r = c((n >> 16) + delta), g = c(((n >> 8) & 255) + delta), b = c((n & 255) + delta);
  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

function garment(category, body) {
  const s = shade(body, -60), m = shade(body, -26), a = shade(body, 22);
  const base = `fill="${body}" stroke="${s}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;
  const tee = 'M70 46 L96 34 Q100 42 104 34 L130 46 L150 66 L136 82 L128 74 L128 168 Q100 176 72 168 L72 74 L64 82 L50 66 Z';
  const legs = 'M78 46 L122 46 L128 60 L124 120 L120 200 L104 200 L100 118 L96 200 L80 200 L76 120 L72 60 Z';
  switch (category) {
    case 'Tees':
      return `<path ${base} d="${tee}"/><path d="M96 36 Q100 48 104 36" fill="none" stroke="${s}" stroke-width="2"/><line x1="100" y1="74" x2="100" y2="160" stroke="${m}" stroke-width="1.5" opacity=".5"/>`;
    case 'Shirts':
      return `<path ${base} d="${tee}"/><path d="M92 40 L100 54 L108 40" fill="none" stroke="${s}" stroke-width="2" stroke-linejoin="round"/><line x1="100" y1="54" x2="100" y2="160" stroke="${m}" stroke-width="1.6" opacity=".55"/><circle cx="100" cy="80" r="2" fill="${m}"/><circle cx="100" cy="104" r="2" fill="${m}"/><circle cx="100" cy="128" r="2" fill="${m}"/>`;
    case 'Knitwear': {
      let ribs = '';
      for (let r = 0; r < 7; r++) ribs += `<line x1="${78 + 7 * r}" y1="92" x2="${78 + 7 * r}" y2="172"/>`;
      return `<path ${base} d="M64 52 L96 40 Q100 50 104 40 L136 52 L158 78 L140 96 L130 86 L130 176 Q100 184 70 176 L70 86 L60 96 L42 78 Z"/><g stroke="${m}" stroke-width="1.4" opacity=".45">${ribs}</g><path d="M96 42 Q100 56 104 42" fill="none" stroke="${s}" stroke-width="2"/>`;
    }
    case 'Denim':
      return `<path ${base} d="${legs}"/><line x1="100" y1="60" x2="100" y2="196" stroke="${m}" stroke-width="1.6" opacity=".5"/><path d="M78 52 L122 52" stroke="${m}" stroke-width="2" opacity=".5"/><rect x="82" y="58" width="12" height="9" rx="2" fill="none" stroke="${m}" stroke-width="1.4" opacity=".55"/><circle cx="100" cy="56" r="2.4" fill="${a}"/>`;
    case 'Trousers':
      return `<path ${base} d="${legs}"/><line x1="100" y1="60" x2="100" y2="196" stroke="${m}" stroke-width="1.6" opacity=".5"/><path d="M84 92 Q80 96 82 104" fill="none" stroke="${m}" stroke-width="1.4" opacity=".5"/><path d="M116 92 Q120 96 118 104" fill="none" stroke="${m}" stroke-width="1.4" opacity=".5"/>`;
    default:
      return `<path ${base} d="M62 48 L96 38 L100 52 L104 38 L138 48 L156 80 L140 96 L132 88 L132 196 Q100 204 68 196 L68 88 L60 96 L44 80 Z"/><line x1="100" y1="52" x2="100" y2="192" stroke="${m}" stroke-width="2.5"/><circle cx="92" cy="110" r="2.6" fill="${m}"/><circle cx="92" cy="140" r="2.6" fill="${m}"/><circle cx="92" cy="170" r="2.6" fill="${m}"/><path d="M62 48 L84 62 M138 48 L116 62" stroke="${m}" stroke-width="1.6" fill="none" opacity=".5"/>`;
  }
}

for (const p of products) {
  const bg = luminance(p.colorHex) > 0.72 ? '#E4DCCD' : '#F1ECE3';
  const front = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" role="img" aria-label="${p.name}">
<rect width="400" height="500" fill="${bg}"/>
<ellipse cx="200" cy="452" rx="120" ry="12" fill="#000" opacity=".07"/>
<g transform="translate(40 30) scale(1.6)">${garment(p.category, p.colorHex)}</g>
</svg>
`;
  const s = shade(p.colorHex, -24);
  const hi = shade(p.colorHex, 18);
  let weave = '';
  for (let y = 0; y < 500; y += 14) weave += `<line x1="0" y1="${y}" x2="400" y2="${y + 40}" stroke="${s}" stroke-width="3" opacity=".25"/>`;
  const ink = luminance(p.colorHex) > 0.55 ? '#1D2433' : '#F6F2EA';
  const detail = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" role="img" aria-label="${p.name} fabric detail">
<rect width="400" height="500" fill="${p.colorHex}"/>
${weave}
<rect x="24" y="24" width="352" height="452" fill="none" stroke="${hi}" stroke-width="2" stroke-dasharray="7 6" opacity=".7"/>
<g transform="translate(132 196)">
<rect width="136" height="92" rx="6" fill="#F6F2EA" stroke="#1D2433" stroke-opacity=".15"/>
<text x="68" y="40" font-family="Georgia, serif" font-size="22" fill="#1D2433" text-anchor="middle">Loomline</text>
<text x="68" y="64" font-family="Arial, sans-serif" font-size="11" letter-spacing="2" fill="#5B6573" text-anchor="middle">${p.colorName.toUpperCase()}</text>
</g>
<text x="200" y="440" font-family="Arial, sans-serif" font-size="12" letter-spacing="3" fill="${ink}" opacity=".75" text-anchor="middle">${p.material.toUpperCase().replace(/&/g, '&amp;')}</text>
</svg>
`;
  writeFileSync(resolve(imgDir, `p${p.id}-1.svg`), front);
  writeFileSync(resolve(imgDir, `p${p.id}-2.svg`), detail);
}

console.log(`Wrote ${categories.length} categories, ${products.length} products, ${orders.length} orders, ${products.length * 2} SVGs.`);
