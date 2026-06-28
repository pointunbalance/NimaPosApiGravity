import { apiRequest } from "./client";

export type SettingRow = {
  key: string;
  value: string;
};

export function getAllSettings(token: string) {
  return apiRequest<SettingRow[]>("/settings", { token });
}

export function getSetting(token: string, key: string) {
  return apiRequest<SettingRow>(`/settings/${key}`, { token });
}

export function updateSetting(token: string, key: string, value: string) {
  return apiRequest<SettingRow>(`/settings/${key}`, {
    method: "PUT",
    token,
    body: { value }
  });
}
