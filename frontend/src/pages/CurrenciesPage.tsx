import { FormEvent, useMemo, useState } from "react";

import { convertCurrency, createCurrency, exchangeCurrency, getAccounts, getCurrencies } from "../app/api/accounting";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const today = new Date().toISOString().slice(0, 10);
const initialCurrencyForm = {
  code: "",
  name: "",
  symbol: "",
  exchangeRate: "",
  isBase: false,
  isActive: true
};
const initialConversionForm = {
  amount: "",
  fromId: "",
  toId: ""
};
const initialExchangeForm = {
  fromAccountId: "",
  toAccountId: "",
  fromCurrencyId: "",
  toCurrencyId: "",
  fromAmount: "",
  toAmount: "",
  exchangeRate: "",
  date: today,
  reference: "",
  notes: ""
};

export function CurrenciesPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [currencyForm, setCurrencyForm] = useState(initialCurrencyForm);
  const [conversionForm, setConversionForm] = useState(initialConversionForm);
  const [exchangeForm, setExchangeForm] = useState(initialExchangeForm);
  const [conversionResult, setConversionResult] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: currencies, loading, error } = useAsyncValue(session ? () => getCurrencies(session.token) : null, [session?.token, refreshKey]);
  const { data: accounts } = useAsyncValue(session ? () => getAccounts(session.token) : null, [session?.token]);

  const baseCurrency = useMemo(() => (currencies ?? []).find((item) => item.is_base), [currencies]);

  const handleCreateCurrency = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createCurrency(session.token, {
        code: currencyForm.code,
        name: currencyForm.name,
        symbol: currencyForm.symbol,
        exchange_rate: Number(currencyForm.exchangeRate) || 1,
        is_base: currencyForm.isBase,
        is_active: currencyForm.isActive
      });
      setCurrencyForm(initialCurrencyForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تمت إضافة العملة ${created.code}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleConvert = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await convertCurrency(
        session.token,
        Number(conversionForm.amount) || 0,
        Number(conversionForm.fromId),
        Number(conversionForm.toId)
      );
      setConversionResult(result.result);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleExchange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await exchangeCurrency(session.token, {
        from_account_id: Number(exchangeForm.fromAccountId),
        to_account_id: Number(exchangeForm.toAccountId),
        from_currency_id: Number(exchangeForm.fromCurrencyId),
        to_currency_id: Number(exchangeForm.toCurrencyId),
        from_amount: Number(exchangeForm.fromAmount) || 0,
        to_amount: Number(exchangeForm.toAmount) || 0,
        exchange_rate: Number(exchangeForm.exchangeRate) || 1,
        date: exchangeForm.date,
        reference: exchangeForm.reference,
        notes: exchangeForm.notes
      });
      setExchangeForm(initialExchangeForm);
      setMessage(result.message || `تم تسجيل عملية صرف برقم ${result.entry_id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="العملات" subtitle="إدارة العملات وأسعار الصرف وتنفيذ التحويلات اليدوية بين الحسابات." />

      <section className="stats-grid">
        <article className="stat-card">
          <span className="eyebrow">Currencies</span>
          <strong>{(currencies?.length ?? 0).toLocaleString("ar-EG")}</strong>
          <p>عدد العملات المسجلة داخل النظام.</p>
        </article>
        <article className="stat-card">
          <span className="eyebrow">Base Currency</span>
          <strong>{baseCurrency?.code || "-"}</strong>
          <p>العملة الأساسية المستخدمة كمرجع لسعر الصرف.</p>
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">New Currency</span>
          <h3>إضافة عملة</h3>
          <form className="auth-form" onSubmit={handleCreateCurrency}>
            <div className="form-grid">
              <label><span>الكود</span><input value={currencyForm.code} onChange={(event) => setCurrencyForm((value) => ({ ...value, code: event.target.value.toUpperCase() }))} /></label>
              <label><span>الاسم</span><input value={currencyForm.name} onChange={(event) => setCurrencyForm((value) => ({ ...value, name: event.target.value }))} /></label>
              <label><span>الرمز</span><input value={currencyForm.symbol} onChange={(event) => setCurrencyForm((value) => ({ ...value, symbol: event.target.value }))} /></label>
              <label><span>سعر الصرف</span><input inputMode="decimal" value={currencyForm.exchangeRate} onChange={(event) => setCurrencyForm((value) => ({ ...value, exchangeRate: event.target.value }))} /></label>
              <label><span>أساسية</span><select value={currencyForm.isBase ? "true" : "false"} onChange={(event) => setCurrencyForm((value) => ({ ...value, isBase: event.target.value === "true" }))}><option value="false">no</option><option value="true">yes</option></select></label>
              <label><span>نشطة</span><select value={currencyForm.isActive ? "true" : "false"} onChange={(event) => setCurrencyForm((value) => ({ ...value, isActive: event.target.value === "true" }))}><option value="true">yes</option><option value="false">no</option></select></label>
            </div>
            <button className="primary-button" type="submit" disabled={!currencyForm.code || !currencyForm.name || !currencyForm.exchangeRate}>حفظ العملة</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Convert</span>
          <h3>تحويل عملة</h3>
          <form className="auth-form" onSubmit={handleConvert}>
            <div className="form-grid">
              <label><span>المبلغ</span><input inputMode="decimal" value={conversionForm.amount} onChange={(event) => setConversionForm((value) => ({ ...value, amount: event.target.value }))} /></label>
              <label>
                <span>من</span>
                <select value={conversionForm.fromId} onChange={(event) => setConversionForm((value) => ({ ...value, fromId: event.target.value }))}>
                  <option value="">اختر</option>
                  {(currencies ?? []).map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}
                </select>
              </label>
              <label>
                <span>إلى</span>
                <select value={conversionForm.toId} onChange={(event) => setConversionForm((value) => ({ ...value, toId: event.target.value }))}>
                  <option value="">اختر</option>
                  {(currencies ?? []).map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}
                </select>
              </label>
            </div>
            <button className="secondary-button compact-pill" type="submit" disabled={!conversionForm.amount || !conversionForm.fromId || !conversionForm.toId}>احسب</button>
          </form>
          {conversionResult !== null ? <QueryFeedback title="نتيجة التحويل" message={`${conversionResult.toLocaleString("ar-EG")} وحدة بالعملة الهدف.`} /> : null}
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Manual Exchange</span>
          <h3>قيد صرف يدوي</h3>
          <form className="auth-form" onSubmit={handleExchange}>
            <div className="form-grid">
              <label>
                <span>من حساب</span>
                <select value={exchangeForm.fromAccountId} onChange={(event) => setExchangeForm((value) => ({ ...value, fromAccountId: event.target.value }))}>
                  <option value="">اختر الحساب</option>
                  {(accounts ?? []).map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}
                </select>
              </label>
              <label>
                <span>إلى حساب</span>
                <select value={exchangeForm.toAccountId} onChange={(event) => setExchangeForm((value) => ({ ...value, toAccountId: event.target.value }))}>
                  <option value="">اختر الحساب</option>
                  {(accounts ?? []).map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}
                </select>
              </label>
              <label>
                <span>من عملة</span>
                <select value={exchangeForm.fromCurrencyId} onChange={(event) => setExchangeForm((value) => ({ ...value, fromCurrencyId: event.target.value }))}>
                  <option value="">اختر</option>
                  {(currencies ?? []).map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}
                </select>
              </label>
              <label>
                <span>إلى عملة</span>
                <select value={exchangeForm.toCurrencyId} onChange={(event) => setExchangeForm((value) => ({ ...value, toCurrencyId: event.target.value }))}>
                  <option value="">اختر</option>
                  {(currencies ?? []).map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}
                </select>
              </label>
              <label><span>المبلغ المصدر</span><input inputMode="decimal" value={exchangeForm.fromAmount} onChange={(event) => setExchangeForm((value) => ({ ...value, fromAmount: event.target.value }))} /></label>
              <label><span>المبلغ الهدف</span><input inputMode="decimal" value={exchangeForm.toAmount} onChange={(event) => setExchangeForm((value) => ({ ...value, toAmount: event.target.value }))} /></label>
              <label><span>سعر الصرف</span><input inputMode="decimal" value={exchangeForm.exchangeRate} onChange={(event) => setExchangeForm((value) => ({ ...value, exchangeRate: event.target.value }))} /></label>
              <label><span>التاريخ</span><input type="date" value={exchangeForm.date} onChange={(event) => setExchangeForm((value) => ({ ...value, date: event.target.value }))} /></label>
              <label><span>مرجع</span><input value={exchangeForm.reference} onChange={(event) => setExchangeForm((value) => ({ ...value, reference: event.target.value }))} /></label>
              <label className="form-field-span-2"><span>ملاحظات</span><input value={exchangeForm.notes} onChange={(event) => setExchangeForm((value) => ({ ...value, notes: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!exchangeForm.fromAccountId || !exchangeForm.toAccountId || !exchangeForm.fromCurrencyId || !exchangeForm.toCurrencyId}>تسجيل القيد</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل العملات" message="نقرأ قائمة العملات وأسعار الصرف الحالية." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل العملات" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>الكود</th><th>الاسم</th><th>الرمز</th><th>السعر</th><th>أساسية</th><th>نشطة</th></tr></thead>
              <tbody>
                {(currencies ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{item.symbol || "-"}</td>
                    <td>{(item.exchange_rate ?? 0).toLocaleString("ar-EG")}</td>
                    <td>{item.is_base ? "yes" : "no"}</td>
                    <td>{item.is_active ? "yes" : "no"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
