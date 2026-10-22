/** Data contracts shared by the storefront, the admin and the mock backend. */

export interface Category {
  id: number;
  name: string;
  slug?: string;
  sortOrder?: number;
  blurb?: string;
  count?: number;
}

export interface ProductImage {
  id: number;
  url: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug?: string;
  category: string;
  categoryId: number;
  /** Whole EGP. */
  price: number;
  colorHex: string;
  colorName?: string;
  material?: string;
  description?: string;
  sizes: string[];
  stock: number;
  featured: boolean;
  images: ProductImage[];
  createdAt?: string;
}

/** Payload for create/update. */
export interface ProductInput {
  name: string;
  categoryId: number;
  price: number;
  colorHex: string;
  colorName?: string;
  material?: string;
  description?: string;
  sizes: string[];
  stock: number;
  featured: boolean;
}

export interface ProductQuery {
  category?: string;
  size?: string;
  search?: string;
}

export interface ShippingZone {
  id?: number;
  area: string;
  fee: number;
}

export interface CartLine {
  productId: number;
  name: string;
  category: string;
  color: string;
  price: number;
  size: string;
  qty: number;
  imageUrl?: string;
}

export interface OrderItemInput {
  productId: number;
  size: string;
  qty: number;
}

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  governorate: string;
}

export interface CreateOrderRequest {
  customer: OrderCustomer;
  items: OrderItemInput[];
  promoCode?: string;
}

export type OrderStatus = 'Paid' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
export const ORDER_STATUSES: readonly OrderStatus[] = ['Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export interface OrderItem {
  productId?: number;
  name: string;
  size: string;
  qty: number;
  price: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount?: number;
  total: number;
  status: OrderStatus;
  promoCode?: string;
  createdAt: string;
}

export interface VisitsByDay {
  date: string;
  count: number;
}

export interface VisitStats {
  totalViews: number;
  today: number;
  viewsByDay?: VisitsByDay[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export type Role = 'admin' | 'viewer';

export interface LoginResponse {
  token: string;
  username: string;
  role: Role;
  expiresAt: number;
}

export interface CategoryRevenue {
  category: string;
  revenue: number;
  units: number;
}

export interface LowStockItem {
  id: number;
  name: string;
  stock: number;
}

export interface BestSeller {
  productId: number;
  name: string;
  unitsSold: number;
  revenue: number;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
  orders: number;
}

export interface ReportSummary {
  totalProducts: number;
  inStock: number;
  catalogValue: number;
  revenue: number;
  orders: number;
  averageOrder: number;
  revenueByCategory: CategoryRevenue[];
  lowStock: LowStockItem[];
  bestSellers: BestSeller[];
  revenueByDay: RevenueByDay[];
  ordersByStatus: { status: OrderStatus; count: number }[];
}
