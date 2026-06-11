import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type {
  Address,
  APIResponse,
  Cart,
  Category,
  Order,
  PaginatedResponse,
  Product,
  ProductFilters,
  TokenPair,
  User,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:9000";

const TOKEN_KEY = "verso.tokens";

export function loadTokens(): TokenPair | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as TokenPair) : null;
  } catch {
    return null;
  }
}

export function saveTokens(pair: TokenPair) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(pair));
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const tokens = loadTokens();
  if (tokens?.access_token) {
    config.headers.Authorization = `Bearer ${tokens.access_token}`;
  }
  return config;
});

// Single-flight refresh: concurrent 401s wait on the same promise.
let refreshing: Promise<TokenPair | null> | null = null;

async function refreshTokens(): Promise<TokenPair | null> {
  const tokens = loadTokens();
  if (!tokens?.refresh_token) return null;
  try {
    const res = await axios.post<APIResponse<TokenPair>>(`${BASE_URL}/user/refresh`, {
      refresh_token: tokens.refresh_token,
    });
    saveTokens(res.data.data);
    return res.data.data;
  } catch {
    clearTokens();
    window.dispatchEvent(new Event("verso:logout"));
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !original.url?.includes("/user/login") &&
      !original.url?.includes("/user/refresh")
    ) {
      original._retried = true;
      refreshing ??= refreshTokens().finally(() => {
        refreshing = null;
      });
      const pair = await refreshing;
      if (pair) {
        original.headers.Authorization = `Bearer ${pair.access_token}`;
        return api.request(original);
      }
    }
    return Promise.reject(error);
  },
);

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (err.code === "ERR_NETWORK") return "Cannot reach the server. Is the API running?";
  }
  return err instanceof Error ? err.message : "Something went wrong";
}

// ----- Auth -----

export const AuthAPI = {
  register: (input: { email: string; password: string; phone: string }) =>
    api.post<APIResponse<TokenPair>>("/user/register", input).then((r) => r.data.data),
  login: (input: { email: string; password: string }) =>
    api.post<APIResponse<TokenPair>>("/user/login", input).then((r) => r.data.data),
  logout: () => {
    const tokens = loadTokens();
    return api.post("/user/logout", { refresh_token: tokens?.refresh_token });
  },
  logoutAll: () => api.post("/user/me/logout-all"),
  profile: () => api.get<APIResponse<User>>("/user/me/profile").then((r) => r.data.data),
  updateProfile: (input: { first_name?: string; last_name?: string }) =>
    api.post<APIResponse<User>>("/user/me/profile", input).then((r) => r.data.data),
  requestVerifyCode: () => api.get("/user/me/verify"),
  verify: (code: string) => api.post("/user/me/verify", { code }),
  becomeSeller: () => api.post("/user/me/become-seller"),
};

// ----- Catalog -----

export const CatalogAPI = {
  products: (filters: ProductFilters = {}) => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== "" && v !== null),
    );
    return api.get<PaginatedResponse<Product[]>>("/products", { params }).then((r) => r.data);
  },
  product: (id: number | string) =>
    api.get<APIResponse<Product>>(`/products/${id}`).then((r) => r.data.data),
  categories: () =>
    api.get<APIResponse<Category[]>>("/categories").then((r) => r.data.data ?? []),
};

// ----- Cart -----

export const CartAPI = {
  get: () => api.get<APIResponse<Cart>>("/user/me/cart").then((r) => r.data.data),
  add: (product_id: number, quantity: number) =>
    api.post<APIResponse<Cart>>("/user/me/cart", { product_id, quantity }).then((r) => r.data.data),
  remove: (itemId: number) => api.delete(`/user/me/cart/${itemId}`),
};

// ----- Orders -----

export const OrderAPI = {
  list: () => api.get<APIResponse<Order[]>>("/user/me/order").then((r) => r.data.data ?? []),
  get: (id: number | string) =>
    api.get<APIResponse<Order>>(`/user/me/order/${id}`).then((r) => r.data.data),
  place: (shipping_address: string) =>
    api.post<APIResponse<Order>>("/user/me/order", { shipping_address }).then((r) => r.data.data),
  paymentIntent: (order_id: number) =>
    api
      .post<APIResponse<{ id: string; client_secret: string }>>("/orders/payment/intent", { order_id })
      .then((r) => r.data.data),
};

// ----- Addresses -----

export const AddressAPI = {
  list: () => api.get<APIResponse<Address[]>>("/user/me/address").then((r) => r.data.data ?? []),
  create: (input: Omit<Address, "id" | "user_id">) =>
    api.post<APIResponse<Address>>("/user/me/address", input).then((r) => r.data.data),
  update: (id: number, input: Omit<Address, "id" | "user_id">) =>
    api.put<APIResponse<Address>>(`/user/me/address/${id}`, input).then((r) => r.data.data),
  remove: (id: number) => api.delete(`/user/me/address/${id}`),
};

// ----- Seller -----

export const SellerAPI = {
  products: (filters: ProductFilters = {}) =>
    api
      .get<PaginatedResponse<Product[]>>("/seller/products", { params: filters })
      .then((r) => r.data),
  createProduct: (input: {
    name: string;
    description: string;
    price: number;
    stock: number;
    category_id: number;
  }) => api.post<APIResponse<Product>>("/seller/product", input).then((r) => r.data.data),
  updateProduct: (
    id: number,
    input: { name?: string; description?: string; price?: number; stock?: number; status?: string },
  ) => api.put<APIResponse<Product>>(`/seller/product/${id}`, input).then((r) => r.data.data),
  deleteProduct: (id: number) => api.delete(`/seller/product/${id}`),
  uploadImage: (id: number, file: File) => {
    const form = new FormData();
    form.append("image", file);
    return api.post<APIResponse<Product>>(`/seller/product/${id}/image`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  createCategory: (input: { name: string; parent_id?: number }) =>
    api.post<APIResponse<Category>>("/seller/category", input).then((r) => r.data.data),
};
