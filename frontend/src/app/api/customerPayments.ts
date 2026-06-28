import { apiRequest } from "./client";
import type { PaginatedItems } from "./products";

export type CustomerPaymentRow = {
  id: number;
  customer_id: number;
  amount: number;
  date?: string;
  type: string;
  note?: string;
  recorded_by?: string;
};

export type CreateCustomerPaymentPayload = {
  customer_id: number;
  amount: number;
  type: string;
  note?: string;
  recorded_by?: string;
};

export function getCustomerPayments(token: string, customerId: number) {
  return apiRequest<PaginatedItems<CustomerPaymentRow>>(`/customer-payments/${customerId}?limit=12`, { token });
}

type CreateCustomerPaymentResponse = {
  payment_id: number;
  message: string;
};

export async function createCustomerPayment(token: string, payload: CreateCustomerPaymentPayload) {
  const response = await apiRequest<CreateCustomerPaymentResponse>("/customer-payments", {
    method: "POST",
    token,
    body: payload
  });

  return {
    id: response.payment_id,
    amount: payload.amount,
    type: payload.type,
    message: response.message
  };
}
