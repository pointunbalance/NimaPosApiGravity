import { useState } from "react";

import { createBackup, getBackups, restoreBackup, runBackupMaintenance } from "../app/api/backup";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

export function SystemBackupsPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, loading, error } = useAsyncValue(session ? () => getBackups(session.token) : null, [session?.token, refreshKey]);

  const handleCreate = async () => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const created = await createBackup(session.token);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء نسخة احتياطية: ${created.filename}`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleRestore = async (filename: string) => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await restoreBackup(session.token, filename);
      setMessage(result.message);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleMaintenance = async () => {
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await runBackupMaintenance(session.token);
      setMessage(`${result.message} - الحجم الحالي ${result.db_size_bytes.toLocaleString("ar-EG")} بايت.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="النسخ الاحتياطية" subtitle="إنشاء النسخ الاحتياطية واستعادتها وتشغيل صيانة قاعدة البيانات." />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Actions</span>
          <h3>إجراءات النظام</h3>
          <div className="inline-actions">
            <button className="primary-button" type="button" onClick={handleCreate}>إنشاء نسخة احتياطية</button>
            <button className="secondary-button compact-pill" type="button" onClick={handleMaintenance}>صيانة قاعدة البيانات</button>
          </div>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="surface-panel">
        {loading ? (
          <QueryFeedback title="جارٍ تحميل النسخ" message="نقرأ قائمة النسخ الاحتياطية المتاحة." />
        ) : error ? (
          <QueryFeedback title="فشل تحميل النسخ" message={error} tone="error" />
        ) : (
          <div className="table-shell">
            <table>
              <thead><tr><th>الملف</th><th>الحجم</th><th>تاريخ الإنشاء</th><th>إجراء</th></tr></thead>
              <tbody>
                {(data ?? []).map((item) => (
                  <tr key={item.filename}>
                    <td>{item.filename}</td>
                    <td>{item.size_bytes.toLocaleString("ar-EG")} بايت</td>
                    <td>{item.created_at || "-"}</td>
                    <td><button className="secondary-button compact-pill" type="button" onClick={() => handleRestore(item.filename)}>استعادة</button></td>
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
