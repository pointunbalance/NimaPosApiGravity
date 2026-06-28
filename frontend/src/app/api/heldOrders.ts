import { apiRequest } from "./client";

export type HeldOrderRow = {
  id: number;
  date?: string;
  items_json?: string;
  items?: unknown[];
  customer_id?: number | null;
  note?: string | null;
};

export type CreateHeldOrderPayload = {
  items_json: string;
  customer_id?: number | null;
  note?: string;
};

type HeldOrdersListResponse = {
  items: HeldOrderRow[];
  count: number;
};

export async function getHeldOrders(token: string) {
  const response = await apiRequest<HeldOrdersListResponse>("/held-orders", { token });
  return response.items;
}

export async function createHeldOrder(token: string, payload: CreateHeldOrderPayload) {
  let items: unknown[] = [];

  try {
    const parsed = JSON.parse(payload.items_json);
    items = Array.isArray(parsed) ? parsed : [];
  } catch {
    items = [];
  }

  return apiRequest<HeldOrderRow>("/held-orders", {
    method: "POST",
    token,
    body: {
      items,
      customer_id: payload.customer_id,
      note: payload.note
    }
  });
}

export function deleteHeldOrder(token: string, heldOrderId: number) {
  return apiRequest<{ message: string }>(`/held-orders/${heldOrderId}`, {
    method: "DELETE",
    token
  });
}
