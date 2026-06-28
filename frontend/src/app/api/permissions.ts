import { apiRequest } from "./client";

export type PermissionRow = {
  module: string;
  level: number;
};

export function getUserPermissions(token: string, userId: number) {
  return apiRequest<PermissionRow[]>(`/permissions/${userId}`, { token });
}

export function setUserPermission(token: string, payload: { user_id: number; module: string; level: number }) {
  return apiRequest<{ success: boolean }>("/permissions", {
    method: "POST",
    token,
    body: payload
  });
}
