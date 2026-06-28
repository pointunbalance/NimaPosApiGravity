import { apiRequest } from "./client";

export type UserRow = {
  id: number;
  username: string;
  role: string;
  full_name?: string | null;
  phone?: string | null;
  is_active?: number;
};

export type UsersResponse = {
  items: UserRow[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type UserActivityRow = {
  id?: number;
  type?: string | null;
  action?: string | null;
  details?: string | null;
  amount?: number | null;
  reference_id?: number | null;
  created_at?: string | null;
};

export function getUsers(token: string) {
  return apiRequest<UsersResponse>("/users", { token });
}

export function createUser(
  token: string,
  payload: { username: string; pin: string; role: string; full_name?: string; phone?: string }
) {
  return apiRequest<{ user_id: number; username: string }>("/users", {
    method: "POST",
    token,
    body: payload
  });
}

export function updateUser(
  token: string,
  userId: number,
  payload: { full_name?: string; phone?: string; role?: string; is_active?: number }
) {
  return apiRequest<{ message: string }>(`/users/${userId}`, {
    method: "PUT",
    token,
    body: payload
  });
}

export function deactivateUser(token: string, userId: number) {
  return apiRequest<{ message: string }>(`/users/${userId}`, {
    method: "DELETE",
    token
  });
}

export function resetUserPin(token: string, userId: number, newPin: string) {
  return apiRequest<{ message: string }>(`/users/${userId}/reset-pin?new_pin=${encodeURIComponent(newPin)}`, {
    method: "PUT",
    token
  });
}

export function getUserActivity(token: string, userId: number) {
  return apiRequest<{ items: UserActivityRow[]; pagination?: unknown }>(`/users/${userId}/activity-log`, { token });
}
