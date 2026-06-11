// Mirrors the Go backend's swagger definitions (domain.* and dto.*).

export interface Category {
  id: number;
  name: string;
  parent_id?: number;
}

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  position: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: string;
  category_id: number;
  category?: Category;
  seller_id: number;
  images?: ProductImage[];
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  price: number;
}

export interface Cart {
  id: number;
  user_id: number;
  items?: CartItem[];
  created_at?: string;
  updated_at?: string;
}

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  user_id: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_intent_id?: string;
  total_amount: number;
  shipping_address: string;
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
}

export interface Address {
  id: number;
  user_id: number;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  user_type: string;
  verified: boolean;
  created_at?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface Meta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface APIResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T;
  meta: Meta;
}

export interface ProductFilters {
  category_id?: number;
  min_price?: number;
  max_price?: number;
  search?: string;
  page?: number;
  limit?: number;
}
