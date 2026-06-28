import { apiRequest } from "./client";

export type AccountRow = {
  id: number;
  code: string;
  name: string;
  type: string;
  description?: string | null;
};

export type JournalEntryLine = {
  id?: number;
  account_id: number;
  account_name?: string | null;
  debit: number;
  credit: number;
  description?: string | null;
  cost_center_id?: number | null;
};

export type JournalEntryRow = {
  id: number;
  date: string;
  reference?: string | null;
  description: string;
  status: string;
  total_amount?: number;
  created_by?: string | null;
  lines?: JournalEntryLine[];
};

export type GeneralLedgerResponse = {
  account: AccountRow;
  entries: Array<{
    id?: number;
    date?: string | null;
    reference?: string | null;
    description?: string | null;
    debit?: number;
    credit?: number;
    balance?: number;
  }>;
};

export type CheckRow = {
  id: number;
  number: string;
  amount: number;
  bank_name: string;
  issue_date: string;
  due_date: string;
  type: string;
  payee_name?: string | null;
  payee_id?: number | null;
  notes?: string | null;
  status?: string | null;
};

export type CostCenterRow = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  budget?: number | null;
};

export type AssetRow = {
  id: number;
  name: string;
  cost: number;
  value: number;
  salvage_value?: number;
  purchase_date: string;
  life_in_years?: number;
  note?: string | null;
  category?: string | null;
  serial_number?: string | null;
  location?: string | null;
  status: string;
  maintenance_interval_days?: number;
};

export type TrialBalanceRow = {
  code?: string | null;
  name?: string | null;
  debit?: number;
  credit?: number;
};

export type IncomeStatementResponse = {
  revenue?: number;
  expenses?: number;
  net_profit?: number;
  items?: Array<{ name?: string; amount?: number; type?: string }>;
};

export type BalanceSheetResponse = {
  assets?: number;
  liabilities?: number;
  equity?: number;
  items?: Array<{ name?: string; amount?: number; type?: string }>;
};

export type CashFlowRow = {
  section?: string | null;
  amount?: number;
  label?: string | null;
};

export type ReconciliationRow = {
  id: number;
  account_id: number;
  statement_date: string;
  statement_balance: number;
  reconciled_entry_ids_json?: string | null;
  status?: string | null;
};

export type AgingBucketRow = {
  name?: string | null;
  code?: string | null;
  bucket_0_30?: number;
  bucket_31_60?: number;
  bucket_61_90?: number;
  bucket_90_plus?: number;
  balance?: number;
};

export type TaxReportResponse = {
  sales_tax?: number;
  purchase_tax?: number;
  net_tax?: number;
  items?: Array<{ label?: string; amount?: number }>;
};

export type BudgetRow = {
  id: number;
  account_id: number;
  account_name?: string | null;
  cost_center_id?: number | null;
  period_type: string;
  fiscal_year_id: number;
  planned_amount: number;
  updated_at?: string | null;
};

export type FiscalYearRow = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status?: string | null;
  closed_at?: string | null;
};

export type FiscalClosingResponse = {
  message?: string;
  closing_entry_id?: number;
  retained_earnings_account_id?: number;
  transferred_amount?: number;
};

export type CurrencyRow = {
  id: number;
  code: string;
  name: string;
  symbol?: string | null;
  exchange_rate: number;
  is_base?: boolean;
  is_active?: boolean;
};

export type CurrencyConversionResponse = {
  result: number;
};

export function getAccounts(token: string, type?: string) {
  const query = type ? `?type=${encodeURIComponent(type)}` : "";
  return apiRequest<AccountRow[]>(`/accounting/accounts${query}`, { token });
}

export function getCurrencies(token: string, activeOnly = false) {
  const query = activeOnly ? "?active_only=true" : "";
  return apiRequest<CurrencyRow[]>(`/accounting/currencies${query}`, { token });
}

export function createCurrency(
  token: string,
  payload: {
    code: string;
    name: string;
    symbol?: string;
    exchange_rate: number;
    is_base?: boolean;
    is_active?: boolean;
  }
) {
  return apiRequest<CurrencyRow>("/accounting/currencies", {
    method: "POST",
    token,
    body: payload
  });
}

export function updateCurrency(
  token: string,
  currencyId: number,
  payload: {
    name?: string;
    symbol?: string;
    exchange_rate?: number;
    is_base?: boolean;
    is_active?: boolean;
  }
) {
  return apiRequest<CurrencyRow>(`/accounting/currencies/${currencyId}`, {
    method: "PUT",
    token,
    body: payload
  });
}

export function convertCurrency(token: string, amount: number, fromId: number, toId: number) {
  return apiRequest<CurrencyConversionResponse>(
    `/accounting/currencies/convert?amount=${encodeURIComponent(String(amount))}&from_id=${encodeURIComponent(String(fromId))}&to_id=${encodeURIComponent(String(toId))}`,
    { token }
  );
}

export function exchangeCurrency(
  token: string,
  payload: {
    from_account_id: number;
    to_account_id: number;
    from_currency_id: number;
    to_currency_id: number;
    from_amount: number;
    to_amount: number;
    exchange_rate: number;
    date?: string;
    reference?: string;
    notes?: string;
  }
) {
  return apiRequest<{ entry_id: number; message: string }>("/accounting/currencies/exchange", {
    method: "POST",
    token,
    body: payload
  });
}

export function createAccount(
  token: string,
  payload: { code: string; name: string; type: string; description?: string }
) {
  return apiRequest<AccountRow>("/accounting/accounts", {
    method: "POST",
    token,
    body: payload
  });
}

export function getJournalEntries(token: string) {
  return apiRequest<{ items: JournalEntryRow[]; pagination?: unknown }>("/accounting/journal-entries", { token });
}

export function getJournalEntry(token: string, id: number) {
  return apiRequest<JournalEntryRow>(`/accounting/journal-entries/${id}`, { token });
}

export function createJournalEntry(
  token: string,
  payload: {
    date: string;
    reference?: string;
    description: string;
    lines: JournalEntryLine[];
    status?: string;
    currency_id?: number;
    exchange_rate?: number;
    created_by?: string;
  }
) {
  return apiRequest<JournalEntryRow>("/accounting/journal-entries", {
    method: "POST",
    token,
    body: payload
  });
}

export function postJournalEntry(token: string, id: number) {
  return apiRequest<{ message: string }>(`/accounting/journal-entries/${id}/post`, {
    method: "POST",
    token
  });
}

export function reverseJournalEntry(token: string, id: number) {
  return apiRequest<{ id: number; message: string }>(`/accounting/journal-entries/${id}/reverse`, {
    method: "POST",
    token
  });
}

export function getGeneralLedger(token: string, accountId: number, dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const query = params.toString();
  return apiRequest<GeneralLedgerResponse>(`/accounting/general-ledger/${accountId}${query ? `?${query}` : ""}`, { token });
}

export function getChecks(token: string) {
  return apiRequest<{ items: CheckRow[]; pagination?: unknown }>("/accounting/checks", { token });
}

export function createCheck(
  token: string,
  payload: {
    number: string;
    amount: number;
    bank_name: string;
    issue_date: string;
    due_date: string;
    type: string;
    payee_name?: string;
    notes?: string;
  }
) {
  return apiRequest<{ id: number }>("/accounting/checks", {
    method: "POST",
    token,
    body: payload
  });
}

export function updateCheckStatus(token: string, checkId: number, payload: { status?: string; notes?: string }) {
  return apiRequest<{ message: string }>(`/accounting/checks/${checkId}/status`, {
    method: "PUT",
    token,
    body: payload
  });
}

export function getCostCenters(token: string) {
  return apiRequest<CostCenterRow[]>("/accounting/cost-centers", { token });
}

export function createCostCenter(
  token: string,
  payload: { name: string; code: string; description?: string; budget?: number }
) {
  return apiRequest<CostCenterRow>("/accounting/cost-centers", {
    method: "POST",
    token,
    body: payload
  });
}

export function getAssets(token: string) {
  return apiRequest<AssetRow[]>("/accounting/assets", { token });
}

export function createAsset(
  token: string,
  payload: {
    name: string;
    cost: number;
    value: number;
    salvage_value?: number;
    purchase_date: string;
    life_in_years?: number;
    note?: string;
    category?: string;
    serial_number?: string;
    location?: string;
    status?: string;
    maintenance_interval_days?: number;
  }
) {
  return apiRequest<AssetRow>("/accounting/assets", {
    method: "POST",
    token,
    body: payload
  });
}

export function depreciateAsset(token: string, assetId: number, amount: number) {
  return apiRequest<AssetRow>(`/accounting/assets/${assetId}/depreciate?amount=${encodeURIComponent(String(amount))}`, {
    method: "POST",
    token
  });
}

export function getTrialBalance(token: string) {
  return apiRequest<TrialBalanceRow[]>("/accounting/reports/trial-balance", { token });
}

export function getIncomeStatement(token: string, dateFrom: string, dateTo: string) {
  return apiRequest<IncomeStatementResponse>(`/accounting/reports/income-statement?date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}`, { token });
}

export function getBalanceSheet(token: string) {
  return apiRequest<BalanceSheetResponse>("/accounting/reports/balance-sheet", { token });
}

export function getCashFlow(token: string, dateFrom: string, dateTo: string) {
  return apiRequest<CashFlowRow[]>(`/accounting/reports/cash-flow?date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}`, { token });
}

export function getReconciliations(token: string) {
  return apiRequest<ReconciliationRow[]>("/accounting/reconciliations", { token });
}

export function createReconciliation(
  token: string,
  payload: { account_id: number; statement_date: string; statement_balance: number; reconciled_entry_ids_json?: string }
) {
  return apiRequest<{ id: number }>("/accounting/reconciliations", {
    method: "POST",
    token,
    body: payload
  });
}

export function updateReconciliation(
  token: string,
  reconciliationId: number,
  payload: { status?: string; reconciled_entry_ids_json?: string; statement_balance?: number }
) {
  return apiRequest<{ message: string }>(`/accounting/reconciliations/${reconciliationId}`, {
    method: "PUT",
    token,
    body: payload
  });
}

export function matchReconciliation(token: string, reconciliationId: number, entryId: number) {
  return apiRequest<{ message: string }>(`/accounting/reconciliations/${reconciliationId}/match?entry_id=${encodeURIComponent(String(entryId))}`, {
    method: "POST",
    token
  });
}

export function getReceivablesAging(token: string) {
  return apiRequest<AgingBucketRow[]>("/accounting/reports/aging/receivables", { token });
}

export function getPayablesAging(token: string) {
  return apiRequest<AgingBucketRow[]>("/accounting/reports/aging/payables", { token });
}

export function getTaxReport(token: string, dateFrom: string, dateTo: string) {
  return apiRequest<TaxReportResponse>(`/accounting/reports/tax?date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}`, { token });
}

export function getBudgets(token: string, costCenterId?: number) {
  const query = costCenterId ? `?cost_center_id=${encodeURIComponent(String(costCenterId))}` : "";
  return apiRequest<BudgetRow[]>(`/accounting/budgets${query}`, { token });
}

export function createBudget(
  token: string,
  payload: {
    account_id: number;
    cost_center_id?: number;
    period_type?: string;
    fiscal_year_id: number;
    planned_amount: number;
  }
) {
  return apiRequest<{ id: number }>("/accounting/budgets", {
    method: "POST",
    token,
    body: payload
  });
}

export function getFiscalYears(token: string) {
  return apiRequest<FiscalYearRow[]>("/accounting/fiscal-years", { token });
}

export function createFiscalYear(
  token: string,
  payload: {
    name: string;
    start_date: string;
    end_date: string;
  }
) {
  return apiRequest<FiscalYearRow>("/accounting/fiscal-years", {
    method: "POST",
    token,
    body: payload
  });
}

export function closeFiscalYear(token: string, fiscalYearId: number) {
  return apiRequest<{ message: string }>(`/accounting/fiscal-years/${fiscalYearId}/close`, {
    method: "POST",
    token
  });
}

export function runFiscalClosing(token: string, dateTo: string) {
  return apiRequest<FiscalClosingResponse>(`/accounting/fiscal-closing?date_to=${encodeURIComponent(dateTo)}`, {
    method: "POST",
    token
  });
}
