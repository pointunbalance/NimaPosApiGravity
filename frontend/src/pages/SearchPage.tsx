import { useState } from "react";

import { globalSearch } from "../app/api/search";
import { useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

export function SearchPage() {
  const { session } = useAuth();
  const [query, setQuery] = useState("");

  const { data, loading, error } = useAsyncValue(
    session && query.trim().length > 0 ? () => globalSearch(session.token, query.trim(), 10) : null,
    [session?.token, query]
  );

  return (
    <div className="page-stack">
      <PageHeader title="البحث الشامل" subtitle="بحث موحد في المنتجات والعملاء والموردين والفواتير." />

      <section className="surface-panel">
        <div className="form-grid">
          <label className="form-field-span-2"><span>كلمة البحث</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="اسم عميل، منتج، مورد أو رقم فاتورة" /></label>
        </div>
      </section>

      {!query.trim() ? (
        <QueryFeedback title="ابدأ البحث" message="اكتب كلمة أو رقمًا لعرض النتائج من جميع الكيانات." />
      ) : loading ? (
        <QueryFeedback title="جارٍ البحث" message="نقرأ النتائج من محركات البحث الداخلية." />
      ) : error ? (
        <QueryFeedback title="تعذر تنفيذ البحث" message={error} tone="error" />
      ) : data ? (
        <>
          <section className="stats-grid">
            <article className="stat-card"><span className="eyebrow">إجمالي النتائج</span><strong>{data.total_results}</strong><p>من جميع المصادر المتاحة.</p></article>
            <article className="stat-card"><span className="eyebrow">المنتجات</span><strong>{data.products.length}</strong><p>نتائج مطابقة داخل الكتالوج.</p></article>
            <article className="stat-card"><span className="eyebrow">العملاء</span><strong>{data.customers.length}</strong><p>نتائج مطابقة في قاعدة العملاء.</p></article>
          </section>

          <section className="settings-layout">
            <article className="surface-panel">
              <span className="eyebrow">Products</span>
              <div className="table-shell">
                <table>
                  <thead><tr><th>#</th><th>الاسم</th><th>SKU</th><th>السعر</th><th>المخزون</th></tr></thead>
                  <tbody>
                    {data.products.map((item) => (
                      <tr key={`p-${item.id}`}>
                        <td>{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.sku || "-"}</td>
                        <td>{(item.price ?? 0).toLocaleString("ar-EG")} ج.م</td>
                        <td>{item.stock_qty ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="surface-panel">
              <span className="eyebrow">Customers & Suppliers</span>
              <div className="table-shell">
                <table>
                  <thead><tr><th>النوع</th><th>#</th><th>الاسم</th><th>الكود</th><th>الهاتف</th></tr></thead>
                  <tbody>
                    {data.customers.map((item) => (
                      <tr key={`c-${item.id}`}>
                        <td>عميل</td>
                        <td>{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.code || "-"}</td>
                        <td>{item.phone || "-"}</td>
                      </tr>
                    ))}
                    {data.suppliers.map((item) => (
                      <tr key={`s-${item.id}`}>
                        <td>مورد</td>
                        <td>{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.code || "-"}</td>
                        <td>{item.phone || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          <section className="surface-panel">
            <span className="eyebrow">Invoices</span>
            <div className="table-shell">
              <table>
                <thead><tr><th>#</th><th>التاريخ</th><th>الدفع</th><th>الصافي</th></tr></thead>
                <tbody>
                  {data.invoices.map((item) => (
                    <tr key={`i-${item.id}`}>
                      <td>{item.id}</td>
                      <td>{item.created_at || "-"}</td>
                      <td>{item.payment_method || "-"}</td>
                      <td>{(item.net_total ?? 0).toLocaleString("ar-EG")} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
