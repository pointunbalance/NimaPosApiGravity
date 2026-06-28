import { apiRequest } from "./client";

export type BackupRow = {
  filename: string;
  size_bytes: number;
  created_at?: string;
  path?: string;
};

export function createBackup(token: string) {
  return apiRequest<BackupRow>("/backup/create", {
    method: "POST",
    token
  });
}

export function getBackups(token: string) {
  return apiRequest<BackupRow[]>("/backup/list", { token });
}

export function restoreBackup(token: string, filename: string) {
  return apiRequest<{ message: string }>("/backup/restore", {
    method: "POST",
    token,
    body: { filename }
  });
}

export function runBackupMaintenance(token: string) {
  return apiRequest<{ message: string; db_size_bytes: number }>("/backup/maintenance", {
    method: "POST",
    token
  });
}
