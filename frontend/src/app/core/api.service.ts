import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Category,
  CreateOrderRequest,
  LoginRequest,
  LoginResponse,
  Order,
  OrderStatus,
  Product,
  ProductImage,
  ProductInput,
  ProductQuery,
  ReportSummary,
  ShippingZone,
  VisitStats,
} from './models';

const seg = (v: number | string) => encodeURIComponent(String(v));

/** Every HTTP call lives here. All URLs are under environment.apiUrl (/mock-api). */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ---- Catalogue (public) ----
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.base}/categories`);
  }

  getProducts(query: ProductQuery = {}): Observable<Product[]> {
    let params = new HttpParams();
    if (query.category) params = params.set('category', query.category);
    if (query.size) params = params.set('size', query.size);
    if (query.search) params = params.set('q', query.search);
    return this.http.get<Product[]>(`${this.base}/products`, { params });
  }

  getProduct(productId: number | string): Observable<Product> {
    return this.http.get<Product>(`${this.base}/products/${seg(productId)}`);
  }

  getShippingZones(): Observable<ShippingZone[]> {
    return this.http.get<ShippingZone[]>(`${this.base}/shipping-zones`);
  }

  // ---- Orders ----
  createOrder(body: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.base}/orders`, body);
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/orders`);
  }

  setOrderStatus(orderId: number, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${this.base}/orders/${seg(orderId)}/status`, { status });
  }

  // ---- Auth ----
  login(body: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, body);
  }

  // ---- Products (admin) ----
  createProduct(body: ProductInput): Observable<Product> {
    return this.http.post<Product>(`${this.base}/products`, body);
  }

  updateProduct(productId: number, body: ProductInput): Observable<Product> {
    return this.http.put<Product>(`${this.base}/products/${seg(productId)}`, body);
  }

  deleteProduct(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/products/${seg(productId)}`);
  }

  uploadImage(productId: number, file: File): Observable<ProductImage> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<ProductImage>(`${this.base}/products/${seg(productId)}/images`, form);
  }

  deleteImage(productId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/products/${seg(productId)}/images/${seg(imageId)}`);
  }

  // ---- Reports & visits ----
  getReport(): Observable<ReportSummary> {
    return this.http.get<ReportSummary>(`${this.base}/reports/summary`);
  }

  trackVisit(): Observable<unknown> {
    return this.http.post(`${this.base}/visits`, {});
  }

  getVisitorCount(): Observable<VisitStats> {
    return this.http.get<VisitStats>(`${this.base}/visits/count`);
  }
}
