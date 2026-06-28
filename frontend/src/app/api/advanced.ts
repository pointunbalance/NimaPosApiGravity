import { apiRequest } from "./client";

export type WarehouseRow = {
  id: number;
  name: string;
  address?: string | null;
  is_main?: boolean | number;
};

export type WarehouseInventoryRow = {
  id?: number;
  warehouse_id?: number;
  product_id: number;
  product_name?: string | null;
  sku?: string | null;
  quantity: number;
};

export type BatchRow = {
  id: number;
  product_id: number;
  product_name?: string | null;
  warehouse_id: number;
  quantity: number;
  expiry_date?: string | null;
  batch_number?: string | null;
  received_date?: string | null;
  cost_price?: number;
};

export type SerialRow = {
  id: number;
  product_id: number;
  serial_number: string;
  warehouse_id?: number | null;
  purchase_id?: number | null;
  status?: string;
  order_id?: number | null;
};

export type LoyaltyTransactionRow = {
  id: number;
  customer_id: number;
  points: number;
  type: string;
  order_id?: number | null;
  note?: string | null;
  created_at?: string | null;
};

export type LoyaltyTierRow = {
  id: number;
  name: string;
  min_points: number;
  multiplier: number;
  color?: string | null;
};

export type LoyaltySettingsRow = {
  enabled: boolean;
  points_per_currency: number;
  currency_per_point: number;
  min_points_to_redeem: number;
  welcome_bonus?: number;
  enable_tiers?: boolean;
};

export type InstallmentPlanRow = {
  id: number;
  customer_id: number;
  order_id?: number | null;
  principal_amount: number;
  total_amount: number;
  down_payment?: number;
  installment_count: number;
  installment_amount: number;
  start_date?: string | null;
  status?: string;
  notes?: string | null;
};

export type InstallmentPaymentRow = {
  id: number;
  plan_id: number;
  customer_id: number;
  amount: number;
  principal_part?: number;
  interest_part?: number;
  due_date: string;
  notes?: string | null;
};

export function getWarehouses(token: string) {
  return apiRequest<WarehouseRow[]>("/warehouses", { token });
}

export function createWarehouse(
  token: string,
  payload: {
    name: string;
    address?: string;
    is_main?: boolean;
  }
) {
  return apiRequest<WarehouseRow>("/warehouses", {
    method: "POST",
    token,
    body: payload
  });
}

export function getWarehouseInventory(token: string, warehouseId: number) {
  return apiRequest<WarehouseInventoryRow[]>(`/warehouses/${warehouseId}/inventory`, { token });
}

export function getBatches(token: string, warehouseId?: number, productId?: number) {
  const params = new URLSearchParams();
  if (warehouseId) params.set("warehouse_id", String(warehouseId));
  if (productId) params.set("product_id", String(productId));
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<{ items: BatchRow[]; pagination: { total: number } }>(`/batches${query}`, { token });
}

export function getExpiringBatches(token: string, days = 30) {
  return apiRequest<BatchRow[]>(`/batches/expiring?days=${days}`, { token });
}

export function createBatch(
  token: string,
  payload: {
    product_id: number;
    product_name?: string;
    warehouse_id: number;
    quantity: number;
    expiry_date?: string;
    batch_number?: string;
    received_date: string;
    cost_price?: number;
  }
) {
  return apiRequest<{ id: number }>("/batches", {
    method: "POST",
    token,
    body: payload
  });
}

export function getSerials(token: string, productId?: number, status?: string) {
  const params = new URLSearchParams();
  if (productId) params.set("product_id", String(productId));
  if (status) params.set("status", status);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<{ items: SerialRow[]; pagination: { total: number } }>(`/serials${query}`, { token });
}

export function createSerial(
  token: string,
  payload: {
    product_id: number;
    serial_number: string;
    warehouse_id?: number;
    purchase_id?: number;
  }
) {
  return apiRequest<{ id: number }>("/serials", {
    method: "POST",
    token,
    body: payload
  });
}

export function updateSerialStatus(
  token: string,
  serialId: number,
  payload: {
    status: string;
    order_id?: number;
  }
) {
  return apiRequest<{ message: string }>(`/serials/${serialId}`, {
    method: "PUT",
    token,
    body: payload
  });
}

export function getLoyaltyHistory(token: string, customerId: number) {
  return apiRequest<{ items: LoyaltyTransactionRow[]; pagination: { total: number } }>(`/loyalty/${customerId}`, { token });
}

export function addLoyaltyTransaction(
  token: string,
  payload: {
    customer_id: number;
    points: number;
    type: string;
    order_id?: number;
    note?: string;
  }
) {
  return apiRequest<{ id: number }>(`/loyalty`, {
    method: "POST",
    token,
    body: payload
  });
}

export function bulkLoyaltyPoints(
  token: string,
  payload: {
    customer_ids: number[];
    points: number;
    reason?: string;
  }
) {
  return apiRequest<{ processed: number; message: string }>(`/loyalty/bulk-points`, {
    method: "POST",
    token,
    body: payload
  });
}

export function getLoyaltyTiers(token: string) {
  return apiRequest<LoyaltyTierRow[]>(`/loyalty/tiers`, { token });
}

export function getLoyaltySettings(token: string) {
  return apiRequest<LoyaltySettingsRow>(`/loyalty/settings`, { token });
}

export function getInstallmentPlans(token: string, customerId?: number, status?: string) {
  const params = new URLSearchParams();
  if (customerId) params.set("customer_id", String(customerId));
  if (status) params.set("status", status);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<{ items: InstallmentPlanRow[]; pagination: { total: number } }>(`/installments${query}`, { token });
}

export function getInstallmentPlan(token: string, planId: number) {
  return apiRequest<InstallmentPlanRow & { payments?: InstallmentPaymentRow[] }>(`/installments/${planId}`, { token });
}

export function createInstallmentPlan(
  token: string,
  payload: {
    customer_id: number;
    order_id?: number;
    principal_amount: number;
    total_amount: number;
    down_payment?: number;
    installment_count: number;
    installment_amount: number;
    start_date: string;
    notes?: string;
    interest_type?: string;
    interest_rate?: number;
    total_interest_amount?: number;
    late_fee_enabled?: boolean;
    late_fee_type?: string;
    late_fee_amount?: number;
    grace_period_days?: number;
  }
) {
  return apiRequest<InstallmentPlanRow>(`/installments`, {
    method: "POST",
    token,
    body: payload
  });
}

export function payInstallment(
  token: string,
  planId: number,
  payload: {
    plan_id: number;
    customer_id: number;
    amount: number;
    principal_part?: number;
    interest_part?: number;
    due_date: string;
    notes?: string;
  }
) {
  return apiRequest<{ id: number }>(`/installments/${planId}/pay`, {
    method: "POST",
    token,
    body: payload
  });
}
