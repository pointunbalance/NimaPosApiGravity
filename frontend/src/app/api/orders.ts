import { apiRequest } from "./client";
import type { PaginatedItems } from "./products";

export type OrderRow = {
  id: number;
  customer_name?: string | null;
  net_total?: number;
  payment_method?: string;
  is_void?: number;
  created_at?: string;
};

export type CheckoutPayload = {
  items: Array<{
    product_id: number;
    qty: number;
    unit_price: number;
    name?: string;
  }>;
  payments: Array<{
    method: string;
    amount: number;
  }>;
  customer_id?: number | null;
  notes?: string;
};

export type CheckoutResult = {
  success: boolean;
  invoice_id: number;
};

export type InvoiceDetail = OrderRow & {
  subtotal?: number;
  tax?: number;
  total?: number;
  discount_amount?: number;
  change_due?: number;
  paid_amount?: number;
  items?: Array<{
    id: number;
    product_id: number;
    product_name?: string;
    qty: number;
    unit_price: number;
    net_line_total?: number;
  }>;
  void_reason?: string | null;
};

export type InvoicePrintData = InvoiceDetail & {
  customer_phone?: string | null;
  customer_address?: string | null;
  store?: {
    name?: string;
    vat_number?: string;
    address?: string;
    phone?: string;
  };
  print_settings?: {
    receipt_header?: string;
    receipt_footer?: string;
    invoice_footer?: string;
    printer_width?: string;
    auto_print?: string;
    enable_qr?: string;
  };
};

export function getOrders(token: string) {
  return apiRequest<PaginatedItems<OrderRow>>("/invoices?limit=12", { token });
}

export function getOrderDetails(token: string, invoiceId: number) {
  return apiRequest<InvoiceDetail>(`/invoices/${invoiceId}`, { token });
}

export function getOrderPrintData(token: string, invoiceId: number) {
  return apiRequest<InvoicePrintData>(`/invoices/${invoiceId}/print`, { token });
}

export function checkoutCashSale(token: string, payload: CheckoutPayload) {
  return apiRequest<CheckoutResult>("/invoices/checkout", {
    method: "POST",
    token,
    body: {
      cart_discount_type: "none",
      cart_discount_value: 0,
      currency_id: 1,
      exchange_rate: 1,
      ...payload
    }
  });
}

export function voidOrder(token: string, invoiceId: number, reason: string) {
  return apiRequest<CheckoutResult>(`/invoices/${invoiceId}/void`, {
    method: "POST",
    token,
    body: { reason }
  });
}
