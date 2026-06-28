import { apiRequest } from "./client";

export type BranchRow = {
  id: number;
  code: string;
  name: string;
  is_active?: boolean;
  created_at?: string | null;
};

export function getBranches(token: string) {
  return apiRequest<BranchRow[]>("/branches", { token });
}

export function createBranch(token: string, payload: { code: string; name: string }) {
  return apiRequest<BranchRow>("/branches", {
    method: "POST",
    token,
    body: payload
  });
}

export function updateBranch(
  token: string,
  branchId: number,
  payload: { name?: string; is_active?: boolean }
) {
  return apiRequest<BranchRow>(`/branches/${branchId}`, {
    method: "PUT",
    token,
    body: payload
  });
}
