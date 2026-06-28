import { FormEvent, useState } from "react";

import { createLmsArticle, getLmsArticle, getLmsArticles, getMyTraining, logTrainingCompletion } from "../app/api/lms";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialForm = {
  title: "",
  category: "SOP",
  content: ""
};

type TrainingPageProps = {
  mode?: "training" | "lms";
};

export function TrainingPage({ mode = "training" }: TrainingPageProps) {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedArticleId, setSelectedArticleId] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [score, setScore] = useState("100");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: articles, loading, error } = useAsyncValue(
    session ? () => getLmsArticles(session.token, categoryFilter || undefined) : null,
    [session?.token, categoryFilter, refreshKey]
  );
  const { data: articleDetails } = useAsyncValue(
    session && selectedArticleId ? () => getLmsArticle(session.token, Number(selectedArticleId)) : null,
    [session?.token, selectedArticleId, refreshKey]
  );
  const { data: trainingLog } = useAsyncValue(session ? () => getMyTraining(session.token) : null, [session?.token, refreshKey]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await createLmsArticle(session.token, {
        title: form.title,
        category: form.category,
        content_markdown: form.content,
        author_id: session.user.id
      });
      setForm(initialForm);
      setRefreshKey((value) => value + 1);
      setMessage("تم إنشاء المادة التدريبية بنجاح.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleComplete = async () => {
    if (!session || !selectedArticleId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await logTrainingCompletion(session.token, {
        user_id: session.user.id,
        article_id: Number(selectedArticleId),
        score: Number(score || 100)
      });
      setRefreshKey((value) => value + 1);
      setMessage("تم تسجيل إكمال التدريب في السجل الشخصي.");
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const title = mode === "lms" ? "LMS" : "التدريب";
  const subtitle =
    mode === "lms"
      ? "إدارة محتوى التعلم الداخلي ومراجعة المواد التدريبية وتسجيل الإكمال."
      : "مركز التدريب والتطوير المؤسسي مع سجل التدريب الشخصي والمحتوى الداخلي.";

  return (
    <div className="page-stack">
      <PageHeader title={title} subtitle={subtitle} />

      <section className="stats-grid">
        <article className="stat-card"><span className="eyebrow">Articles</span><strong>{(articles ?? []).length.toLocaleString("ar-EG")}</strong><p>عدد المواد الظاهرة حسب الفلتر الحالي.</p></article>
        <article className="stat-card"><span className="eyebrow">Completed</span><strong>{(trainingLog ?? []).length.toLocaleString("ar-EG")}</strong><p>سجلات الإكمال الخاصة بالمستخدم الحالي.</p></article>
        <article className="stat-card"><span className="eyebrow">Selected</span><strong>{articleDetails?.title ? 1 : 0}</strong><p>قراءة تفصيلية للمادة المختارة.</p></article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Content Builder</span>
          <h3>إنشاء مادة تدريبية</h3>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label><span>العنوان</span><input value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} /></label>
              <label><span>الفئة</span><select value={form.category} onChange={(event) => setForm((value) => ({ ...value, category: event.target.value }))}><option value="SOP">SOP</option><option value="Policy">Policy</option><option value="Safety">Safety</option><option value="Operations">Operations</option></select></label>
              <label><span>المحتوى</span><textarea rows={6} value={form.content} onChange={(event) => setForm((value) => ({ ...value, content: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!form.title || !form.content}>إنشاء المادة</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Reader</span>
          <h3>مراجعة واعتماد</h3>
          <div className="form-grid">
            <label><span>فلتر الفئة</span><input value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} placeholder="SOP أو Safety" /></label>
            <label>
              <span>المادة</span>
              <select value={selectedArticleId} onChange={(event) => setSelectedArticleId(event.target.value)}>
                <option value="">اختر مادة</option>
                {(articles ?? []).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>
            <label><span>النتيجة</span><input type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} /></label>
          </div>
          <button className="primary-button" type="button" disabled={!selectedArticleId} onClick={handleComplete}>تسجيل الإكمال</button>
          {articleDetails ? (
            <div className="feedback-panel">
              <strong>{articleDetails.title}</strong>
              <p>{articleDetails.content_markdown}</p>
            </div>
          ) : (
            <p>اختر مادة لعرض محتواها هنا.</p>
          )}
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل المحتوى" message="نقرأ المواد التدريبية الحالية." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل المحتوى" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>العنوان</th><th>الفئة</th><th>آخر تحديث</th></tr></thead>
              <tbody>
                {(articles ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.title}</td>
                    <td>{item.category}</td>
                    <td>{item.updated_at || item.created_at || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="surface-panel">
        <span className="eyebrow">My Training</span>
        <div className="table-shell">
          <table>
            <thead><tr><th>المادة</th><th>الفئة</th><th>النتيجة</th><th>تاريخ الإكمال</th></tr></thead>
            <tbody>
              {(trainingLog ?? []).map((item, index) => (
                <tr key={`${item.article_id ?? index}-${index}`}>
                  <td>{item.article_title || item.article_id || "-"}</td>
                  <td>{item.category || "-"}</td>
                  <td>{Number(item.score ?? 0).toLocaleString("ar-EG")}</td>
                  <td>{item.completed_at || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
