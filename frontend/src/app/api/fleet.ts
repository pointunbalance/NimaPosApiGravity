import { apiRequest } from "./client";

export type VehicleRow = {
  id: number;
  plate_number: string;
  model: string;
  vehicle_type?: string | null;
  payload_capacity_kg?: number | null;
  status?: string | null;
  odometer_reading?: number | null;
  last_service_date?: string | null;
  is_active?: boolean | number;
};

export type VehicleHistoryResponse = {
  assignments: Array<{
    id?: number;
    vehicle_id?: number;
    driver_id?: number;
    driver_name?: string | null;
    notes?: string | null;
    assigned_at?: string | null;
  }>;
  fuel_logs: Array<{
    id?: number;
    vehicle_id?: number;
    date?: string | null;
    liters?: number;
    cost?: number;
    odometer_reading?: number | null;
    receipt_image?: string | null;
  }>;
};

export function getFleetVehicles(token: string) {
  return apiRequest<VehicleRow[]>("/fleet/vehicles", { token });
}

export function createFleetVehicle(
  token: string,
  payload: {
    plate_number: string;
    model: string;
    vehicle_type?: string;
    payload_capacity_kg?: number;
    status?: string;
    odometer_reading?: number;
  }
) {
  return apiRequest<{ vehicle_id: number; message: string }>("/fleet/vehicles", {
    method: "POST",
    token,
    body: payload
  });
}

export function assignFleetDriver(
  token: string,
  payload: {
    vehicle_id: number;
    driver_id: number;
    notes?: string;
  }
) {
  return apiRequest<{ message: string }>("/fleet/assign", {
    method: "POST",
    token,
    body: payload
  });
}

export function logFleetFuel(
  token: string,
  payload: {
    vehicle_id: number;
    date?: string;
    liters: number;
    cost: number;
    odometer_reading?: number;
    receipt_image?: string;
  }
) {
  return apiRequest<{ message: string }>("/fleet/fuel", {
    method: "POST",
    token,
    body: payload
  });
}

export function getFleetVehicleHistory(token: string, vehicleId: number) {
  return apiRequest<VehicleHistoryResponse>(`/fleet/vehicles/${vehicleId}/history`, { token });
}
