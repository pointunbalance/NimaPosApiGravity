import { apiRequest } from "./client";
import type { PaginatedItems } from "./products";

export type CustomerRow = {
  id: number;
  code?: string;
  name: string;
  tier?: string;
  balance?: number;
  wallet_balance?: number;
  total_purchases?: number;
  phone?: string;
};

export type CreateCustomerPayload = {
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
};

export type UpdateCustomerPayload = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  balance?: number;
};

export function getCustomers(token: string) {
  return apiRequest<PaginatedItems<CustomerRow>>("/customers?limit=12", { token });
}

export function createCustomer(token: string, payload: CreateCustomerPayload) {
  return apiRequest<CustomerRow>("/customers", {
    method: "POST",
    token,
    body: {
      name_en: "",
      balance: 0,
      wallet_balance: 0,
      credit_limit: 0,
      ...payload
    }
  });
}

export function updateCustomer(token: string, customerId: number, payload: UpdateCustomerPayload) {
  return apiRequest<CustomerRow>(`/customers/${customerId}`, {
    method: "PUT",
    token,
    body: payload
  });
}
