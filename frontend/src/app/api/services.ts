import { apiRawRequest, apiRequest } from "./client";

export type ServiceRow = {
  id: number;
  name: string;
  name_en?: string | null;
  price: number;
  category?: string | null;
  is_active?: number | boolean;
};

export function getServices(token: string) {
  return apiRequest<ServiceRow[]>("/services", { token });
}

export function createService(
  token: string,
  payload: {
    name: string;
    name_en?: string;
    price: number;
    category?: string;
    is_active?: number;
  }
) {
  return apiRequest<ServiceRow>("/services", {
    method: "POST",
    token,
    body: payload
  });
}

export function updateService(
  token: string,
  serviceId: number,
  payload: {
    name?: string;
    name_en?: string;
    price?: number;
    category?: string;
    is_active?: number;
  }
) {
  return apiRequest<ServiceRow>(`/services/${serviceId}`, {
    method: "PUT",
    token,
    body: payload
  });
}

export function deactivateService(token: string, serviceId: number) {
  return apiRequest<{ message: string }>(`/services/${serviceId}`, {
    method: "DELETE",
    token
  });
}
