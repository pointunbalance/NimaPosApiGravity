import { apiRequest } from "./client";

export type LoginPayload = {
  pin: string;
  branch_id: number;
};

export type AuthUser = {
  id: number;
  username: string;
  role: string;
  is_active?: boolean;
  created_at?: string | null;
};

export type LoginResult = {
  success: boolean;
  token: string;
  expires_in: number;
  user: AuthUser;
};

export type MeResult = {
  user_id: number;
  username: string;
  role: string;
  branch_id: number;
};

export type ActivationStatus = {
  is_active: boolean;
  hardware_id?: string;
  activated_at?: string;
  expires_at?: string;
};

export function login(payload: LoginPayload) {
  return apiRequest<LoginResult>("/auth/login", {
    method: "POST",
    body: payload
  });
}

export function getMe(token: string) {
  return apiRequest<MeResult>("/auth/me", { token });
}

export function getActivationStatus() {
  return apiRequest<ActivationStatus>("/system/activation-status");
}

export function getHealth() {
  return apiRequest<{ status: string; database: string }>("/system/health");
}
