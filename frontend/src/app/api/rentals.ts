import { apiRawRequest } from "./client";

export type RentalBookingRow = {
  id?: number;
  rental_no: string;
  customer_id?: number | null;
  customer_name: string;
  branch_id: number;
  product_id: number;
  status: string;
  pickup_at: string;
  due_at: string;
  returned_at?: string | null;
  rental_fee: number;
  deposit_amount: number;
  penalty_amount?: number;
  paid_amount?: number;
  notes?: string | null;
};

export function getRentalBookings(token: string, branchId = 1, status?: string) {
  const query = status
    ? `?branch_id=${branchId}&status=${encodeURIComponent(status)}`
    : `?branch_id=${branchId}`;
  return apiRawRequest<RentalBookingRow[]>(`/rentals-pro/bookings${query}`, { token });
}

export function createRentalBooking(
  token: string,
  payload: {
    rental_no: string;
    customer_id?: number;
    customer_name: string;
    branch_id: number;
    product_id: number;
    status?: string;
    pickup_at: string;
    due_at: string;
    rental_fee?: number;
    deposit_amount?: number;
    notes?: string;
  }
) {
  return apiRawRequest<RentalBookingRow>("/rentals-pro/bookings", {
    method: "POST",
    token,
    body: {
      status: "active",
      rental_fee: 0,
      deposit_amount: 0,
      ...payload
    }
  });
}

export function returnRentalBooking(token: string, bookingId: number, penalty = 0, notes?: string) {
  const query = notes
    ? `?penalty=${penalty}&notes=${encodeURIComponent(notes)}`
    : `?penalty=${penalty}`;
  return apiRawRequest<{ status: string; returned_at: string }>(
    `/rentals-pro/bookings/${bookingId}/return${query}`,
    { method: "POST", token }
  );
}

export function getOverdueRentals(token: string, branchId = 1) {
  return apiRawRequest<RentalBookingRow[]>(`/rentals-pro/overdue?branch_id=${branchId}`, { token });
}
