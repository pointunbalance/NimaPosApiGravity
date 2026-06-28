import { apiRequest } from "./client";
import type { PaginatedItems } from "./products";

export type SupplierRow = {
  id: number;
  code?: string;
  name: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  address?: string;
  balance?: number;
  total_purchases?: number;
  is_active?: boolean;
};

export type SupplierBalanceSummary = {
  supplier_id: number;
  name: string;
  balance: number;
  total_purchases: number;
};

export type CreateSupplierPayload = {
  code: string;
  name: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  address?: string;
  notes?: string;
};

export type UpdateSupplierPayload = {
  name?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  address?: string;
  notes?: string;
};

export function getSuppliers(token: string) {
  return apiRequest<PaginatedItems<SupplierRow>>("/suppliers?limit=12", { token });
}

export function createSupplier(token: string, payload: CreateSupplierPayload) {
  return apiRequest<SupplierRow>("/suppliers", {
    method: "POST",
    token,
    body: { name_en: "", ...payload }
  });
}

export function updateSupplier(token: string, supplierId: number, payload: UpdateSupplierPayload) {
  return apiRequest<SupplierRow>(`/suppliers/${supplierId}`, {
    method: "PUT",
    token,
    body: payload
  });
}

export function getSupplierBalanceSummary(token: string, supplierId: number) {
  return apiRequest<SupplierBalanceSummary>(`/suppliers/${supplierId}/balance-summary`, { token });
}
