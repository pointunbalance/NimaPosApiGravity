import { ApiError, getApiBaseUrl } from "./client";

type ManufacturingEnvelope<T> = {
  ok?: boolean;
  success?: boolean;
  data?: T;
  error?: { message?: string } | null;
  detail?: string;
  message?: string;
};

type ManufacturingOptions = {
  token?: string | null;
  method?: "GET" | "POST";
  body?: unknown;
};

export type BomItemRow = {
  id?: number;
  bom_id?: number;
  component_product_id: number;
  component_name?: string | null;
  quantity: number;
  unit_name?: string | null;
  wastage_percent?: number | null;
  unit_cost?: number | null;
};

export type BomRow = {
  id: number;
  product_id: number;
  product_name?: string | null;
  name: string;
  version?: string | null;
  total_estimated_cost?: number | null;
  items?: BomItemRow[];
};

async function manufacturingRequest<T>(path: string, options: ManufacturingOptions = {}): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  let payload: ManufacturingEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ManufacturingEnvelope<T>;
  } catch {
    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}`, response.status);
    }
  }

  if (!response.ok) {
    throw new ApiError(payload?.detail ?? payload?.error?.message ?? `HTTP ${response.status}`, response.status);
  }

  if (!(payload?.ok ?? payload?.success)) {
    throw new ApiError(payload?.detail ?? payload?.error?.message ?? payload?.message ?? "Unknown API error", response.status);
  }

  return payload?.data as T;
}

export function getBoms(token: string, productId?: number) {
  const query = productId ? `?product_id=${productId}` : "";
  return manufacturingRequest<BomRow[]>(`/manufacturing/boms${query}`, { token });
}

export function getBom(token: string, bomId: number) {
  return manufacturingRequest<BomRow>(`/manufacturing/boms/${bomId}`, { token });
}

export function createBom(
  token: string,
  payload: {
    product_id: number;
    name: string;
    version?: string;
    total_estimated_cost?: number;
    items: Array<{
      component_product_id: number;
      quantity: number;
      unit_name?: string;
      wastage_percent?: number;
      unit_cost?: number;
    }>;
  }
) {
  return manufacturingRequest<BomRow>("/manufacturing/boms", {
    method: "POST",
    token,
    body: payload
  });
}

export function createProductionOrder(
  token: string,
  payload: {
    bom_id: number;
    quantity: number;
  }
) {
  return manufacturingRequest<{ message: string }>("/manufacturing/produce", {
    method: "POST",
    token,
    body: payload
  });
}
