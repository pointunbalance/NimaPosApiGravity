import { apiRequest } from "./client";

export type SearchResultProduct = {
  id: number;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  price?: number;
  stock_qty?: number;
};

export type SearchResultCustomer = {
  id: number;
  name: string;
  code?: string | null;
  phone?: string | null;
  balance?: number;
};

export type SearchResultSupplier = {
  id: number;
  name: string;
  code?: string | null;
  phone?: string | null;
};

export type SearchResultInvoice = {
  id: number;
  created_at?: string | null;
  net_total?: number;
  payment_method?: string | null;
};

export type GlobalSearchResponse = {
  products: SearchResultProduct[];
  customers: SearchResultCustomer[];
  suppliers: SearchResultSupplier[];
  invoices: SearchResultInvoice[];
  total_results: number;
};

export function globalSearch(token: string, q: string, limit = 10) {
  return apiRequest<GlobalSearchResponse>(`/search?q=${encodeURIComponent(q)}&limit=${limit}`, { token });
}
