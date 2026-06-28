import { FormEvent, useState } from "react";

import { createQuotation, getQuotations } from "../app/api/quotations";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

export function QuotationsPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data, loading, error } = useAsyncValue(session ? () => getQuotations(session.token) : null, [session?.token, refreshKey]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createQuotation(session.token, {
        customer_name: customerName,
        total_amount: Number(totalAmount) || 0,
        expiry_date: expiryDate || undefined,
        notes
      }, session.user.username);
      setRefreshKey((v) => v + 1);
      setCustomerName("");
      setTotalAmount("");
      setExpiryDate("");
      setNotes("");
      setMessage(`تم إنشاء عرض السعر رقم ${created.id} بنجاح.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="عروض الأسعار" subtitle="واجهة عاملة لإنشاء العروض ومتابعة حالتها ضمن خريطة المرجع." />
      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Quick Quotation</span>
          <h3>إنشاء عرض سعر</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>اسم العميل</span><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></label>
              <label><span>الإجمالي</span><input inputMode="decimal" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} /></label>
              <label><span>تاريخ الانتهاء</span><input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></label>
              <label><span>ملاحظات</span><input value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
            </div>
            <button className="primary-button" disabled={!customerName || !totalAmount} type="submit">إنشاء العرض</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>
      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل العروض" message="نقرأ قائمة عروض الأسعار الحالية." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل العروض" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>العميل</th><th>الإجمالي</th><th>الحالة</th><th>الانتهاء</th></tr></thead>
              <tbody>
                {data?.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.customer_name}</td>
                    <td>{(item.total_amount ?? 0).toLocaleString("ar-EG")} ج.م</td>
                    <td>{item.status || "draft"}</td>
                    <td>{item.expiry_date || "-"}</td>
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
