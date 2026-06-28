import { apiRequest } from "./client";

export type ProductRow = {
  id: number;
  sku?: string | null;
  name: string;
  category?: string | null;
  price?: number;
  stock_qty?: number;
  is_active?: boolean;
};

export type PaginatedItems<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export type CreateProductPayload = {
  sku: string;
  name: string;
  price: number;
  cost_price?: number;
  stock_qty?: number;
  barcode?: string;
  category?: string;
};

export type UpdateProductPayload = {
  name?: string;
  price?: number;
  stock_qty?: number;
  category?: string;
  is_active?: boolean;
};

export function getProducts(token: string) {
  return apiRequest<PaginatedItems<ProductRow>>("/products?limit=12", { token });
}

export function createProduct(token: string, payload: CreateProductPayload) {
  return apiRequest<ProductRow>("/products", {
    method: "POST",
    token,
    body: {
      name_en: "",
      price_wholesale: 0,
      price_half_wholesale: 0,
      price_other: 0,
      reorder_level: 5,
      type: "simple",
      composition_json: "[]",
      ...payload
    }
  });
}

export function updateProduct(token: string, productId: number, payload: UpdateProductPayload) {
  return apiRequest<ProductRow>(`/products/${productId}`, {
    method: "PUT",
    token,
    body: payload
  });
}
