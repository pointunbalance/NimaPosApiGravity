import { apiRequest } from "./client";

export type SubscriptionPlanRow = {
  id: number;
  name: string;
  price: number;
  interval_months: number;
  is_active?: boolean;
};

export type ActiveSubscriptionRow = {
  id: number;
  customer_id: number;
  plan_id: number;
  customer_name?: string;
  plan_name?: string;
  status?: string;
  start_date?: string | null;
  next_invoice_date?: string | null;
  notes?: string | null;
};

export function getSubscriptionPlans(token: string) {
  return apiRequest<SubscriptionPlanRow[]>("/subscriptions/plans", { token });
}

export function createSubscriptionPlan(
  token: string,
  payload: { name: string; price: number; interval_months: number; is_active?: boolean }
) {
  return apiRequest<{ id: number; message: string }>("/subscriptions/plans", {
    method: "POST",
    token,
    body: payload
  });
}

export function getActiveSubscriptions(token: string) {
  return apiRequest<ActiveSubscriptionRow[]>("/subscriptions/active", { token });
}

export function enrollSubscription(
  token: string,
  payload: { customer_id: number; plan_id: number; start_date?: string; notes?: string }
) {
  return apiRequest<{ id: number; message: string }>("/subscriptions/enroll", {
    method: "POST",
    token,
    body: payload
  });
}

export function runRecurringBilling(token: string) {
  return apiRequest<{ message: string }>("/subscriptions/run-billing", {
    method: "POST",
    token
  });
}
