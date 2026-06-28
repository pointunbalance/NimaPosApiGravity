import { apiRequest } from "./client";
import type { PaginatedItems } from "./products";

export type ExpenseRow = {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  payment_method?: string;
  attachment?: string;
};

export type ExpenseCategorySummary = {
  category: string;
  count: number;
  total: number;
};

export type ExpenseSummary = {
  count: number;
  total: number;
  by_category: ExpenseCategorySummary[];
};

export type CreateExpensePayload = {
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  payment_method?: string;
  attachment?: string;
};

export type UpdateExpensePayload = Partial<CreateExpensePayload>;

export function getExpenses(token: string) {
  return apiRequest<PaginatedItems<ExpenseRow>>("/expenses?limit=12", { token });
}

export function getExpenseCategories(token: string) {
  return apiRequest<ExpenseCategorySummary[]>("/expenses/categories/list", { token });
}

export function getExpenseSummary(token: string) {
  return apiRequest<ExpenseSummary>("/expenses/summary/totals", { token });
}

export function createExpense(token: string, payload: CreateExpensePayload) {
  return apiRequest<ExpenseRow>("/expenses", {
    method: "POST",
    token,
    body: payload
  });
}

export function updateExpense(token: string, expenseId: number, payload: UpdateExpensePayload) {
  return apiRequest<ExpenseRow>(`/expenses/${expenseId}`, {
    method: "PUT",
    token,
    body: payload
  });
}
