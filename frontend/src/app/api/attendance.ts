import { apiRawRequest } from "./client";

export type AttendanceRow = {
  id: number;
  user_id: number;
  user_name?: string | null;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  hours_worked?: number;
  overtime_hours?: number;
  status: string;
  notes?: string | null;
  branch_id?: number;
  created_at?: string;
};

export type AttendanceCreatePayload = {
  user_id: number;
  user_name?: string;
  date: string;
  check_in?: string;
  status?: string;
  notes?: string;
  branch_id?: number;
};

export type AttendanceStats = {
  total_days?: number;
  present_days?: number;
  absent_days?: number;
  late_days?: number;
  total_hours?: number;
  overtime_hours?: number;
};

export function getAttendance(token: string) {
  return apiRawRequest<AttendanceRow[]>("/attendance/", { token });
}

export function createAttendance(token: string, payload: AttendanceCreatePayload) {
  return apiRawRequest<{ id: number; message: string }>("/attendance/", {
    method: "POST",
    token,
    body: payload
  });
}

export function checkOutAttendance(token: string, id: number) {
  return apiRawRequest<{ ok: boolean; check_out: string; hours: number; overtime: number }>(`/attendance/${id}/check-out`, {
    method: "PUT",
    token
  });
}

export function getAttendanceStats(token: string, userId: number, month: string) {
  return apiRawRequest<AttendanceStats>(`/attendance/stats/${userId}/${month}`, { token });
}
