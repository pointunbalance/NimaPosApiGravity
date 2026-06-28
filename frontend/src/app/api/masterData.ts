import { apiRequest } from "./client";

export type WorkCenterRow = {
  id: number;
  name: string;
  warehouse_id?: number | null;
};

export function getWorkCenters(token: string, warehouseId?: number) {
  const query = warehouseId ? `?warehouse_id=${warehouseId}` : "";
  return apiRequest<WorkCenterRow[]>(`/master-data/locations${query}`, { token });
}

export function createWorkCenter(token: string, payload: { name: string; warehouse_id?: number }) {
  const params = new URLSearchParams();
  params.set("name", payload.name);
  if (payload.warehouse_id) {
    params.set("warehouse_id", String(payload.warehouse_id));
  }

  return apiRequest<{ id: number; name: string; warehouse_id?: number }>(`/master-data/locations?${params.toString()}`, {
    method: "POST",
    token
  });
}
