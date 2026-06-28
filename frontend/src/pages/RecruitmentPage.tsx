import { FormEvent, useMemo, useState } from "react";

import { createHrApplicant, createHrInterview, createHrJob, getHrApplicants, getHrInterviews, getHrJobs, submitHrInterviewFeedback, updateHrApplicantStatus } from "../app/api/hr";
import { getUsers } from "../app/api/users";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useAsyncValue } from "../app/providers/QueryState";
import { PageHeader } from "../components/PageHeader";
import { QueryFeedback } from "../components/QueryFeedback";

const initialJobForm = {
  title: "",
  department: "",
  description: "",
  requirements: "",
  status: "open"
};
const initialApplicantForm = {
  jobId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  resumeUrl: ""
};
const initialInterviewForm = {
  applicantId: "",
  interviewerId: "",
  scheduledAt: "",
  feedback: "",
  rating: "4"
};

export function RecruitmentPage() {
  const { session } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedApplicantId, setSelectedApplicantId] = useState("");
  const [jobForm, setJobForm] = useState(initialJobForm);
  const [applicantForm, setApplicantForm] = useState(initialApplicantForm);
  const [interviewForm, setInterviewForm] = useState(initialInterviewForm);
  const [statusUpdate, setStatusUpdate] = useState("screening");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: jobsResponse, loading, error } = useAsyncValue(session ? () => getHrJobs(session.token) : null, [session?.token, refreshKey]);
  const { data: applicantsResponse } = useAsyncValue(
    session && selectedJobId ? () => getHrApplicants(session.token, Number(selectedJobId)) : null,
    [session?.token, selectedJobId, refreshKey]
  );
  const { data: interviewsResponse } = useAsyncValue(
    session && selectedApplicantId ? () => getHrInterviews(session.token, Number(selectedApplicantId)) : null,
    [session?.token, selectedApplicantId, refreshKey]
  );
  const { data: users } = useAsyncValue(session ? () => getUsers(session.token) : null, [session?.token]);

  const jobs = jobsResponse?.jobs ?? [];
  const applicants = applicantsResponse?.applicants ?? [];
  const interviews = interviewsResponse?.interviews ?? [];
  const selectedApplicant = useMemo(
    () => applicants.find((item) => String(item.id) === selectedApplicantId) ?? null,
    [applicants, selectedApplicantId]
  );

  const handleCreateJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await createHrJob(session.token, {
        title: jobForm.title,
        department: jobForm.department,
        description: jobForm.description,
        requirements: jobForm.requirements,
        status: jobForm.status
      });
      setJobForm(initialJobForm);
      setRefreshKey((value) => value + 1);
      setMessage(`تم إنشاء فرصة توظيف جديدة برقم ${result.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleCreateApplicant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await createHrApplicant(session.token, {
        job_id: Number(applicantForm.jobId),
        first_name: applicantForm.firstName,
        last_name: applicantForm.lastName,
        email: applicantForm.email,
        phone: applicantForm.phone,
        resume_url: applicantForm.resumeUrl
      });
      const jobId = applicantForm.jobId;
      setApplicantForm(initialApplicantForm);
      setSelectedJobId(selectedJobId || jobId);
      setRefreshKey((value) => value + 1);
      setMessage(`تم تسجيل المتقدم برقم ${result.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleStatusUpdate = async () => {
    if (!session || !selectedApplicantId) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await updateHrApplicantStatus(session.token, Number(selectedApplicantId), statusUpdate);
      setRefreshKey((value) => value + 1);
      setMessage(`تم تحديث حالة المتقدم إلى ${statusUpdate}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleScheduleInterview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await createHrInterview(session.token, {
        applicant_id: Number(interviewForm.applicantId),
        interviewer_id: Number(interviewForm.interviewerId),
        scheduled_at: interviewForm.scheduledAt,
        status: "scheduled"
      });
      const applicantId = interviewForm.applicantId;
      setInterviewForm((value) => ({ ...initialInterviewForm, interviewerId: value.interviewerId }));
      setSelectedApplicantId(selectedApplicantId || applicantId);
      setRefreshKey((value) => value + 1);
      setMessage(`تمت جدولة المقابلة برقم ${result.id}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  const handleFeedback = async (interviewId: number) => {
    if (!session || !interviewForm.feedback) return;
    setMessage(null);
    setErrorMessage(null);
    try {
      await submitHrInterviewFeedback(session.token, interviewId, {
        feedback: interviewForm.feedback,
        rating: Number(interviewForm.rating) || 0,
        status: "completed"
      });
      setRefreshKey((value) => value + 1);
      setMessage(`تم حفظ تقييم المقابلة ${interviewId}.`);
    } catch (caught) {
      setErrorMessage(getReadableAuthError(caught));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader title="التوظيف" subtitle="إدارة الشواغر، المتقدمين، والمقابلات من خلال ربط مباشر مع واجهات HR الخلفية." />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Job Posting</span>
          <h3>إنشاء شاغر</h3>
          <form className="auth-form" onSubmit={handleCreateJob}>
            <div className="form-grid">
              <label><span>المسمى</span><input value={jobForm.title} onChange={(event) => setJobForm((value) => ({ ...value, title: event.target.value }))} /></label>
              <label><span>القسم</span><input value={jobForm.department} onChange={(event) => setJobForm((value) => ({ ...value, department: event.target.value }))} /></label>
              <label><span>الحالة</span><select value={jobForm.status} onChange={(event) => setJobForm((value) => ({ ...value, status: event.target.value }))}><option value="open">open</option><option value="closed">closed</option><option value="paused">paused</option></select></label>
              <label className="form-field-span-2"><span>الوصف</span><input value={jobForm.description} onChange={(event) => setJobForm((value) => ({ ...value, description: event.target.value }))} /></label>
              <label className="form-field-span-2"><span>المتطلبات</span><input value={jobForm.requirements} onChange={(event) => setJobForm((value) => ({ ...value, requirements: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!jobForm.title || !jobForm.department}>إنشاء الشاغر</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Applicant Intake</span>
          <h3>إضافة متقدم</h3>
          <form className="auth-form" onSubmit={handleCreateApplicant}>
            <div className="form-grid">
              <label>
                <span>الشاغر</span>
                <select value={applicantForm.jobId} onChange={(event) => setApplicantForm((value) => ({ ...value, jobId: event.target.value }))}>
                  <option value="">اختر الشاغر</option>
                  {jobs.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </label>
              <label><span>الاسم الأول</span><input value={applicantForm.firstName} onChange={(event) => setApplicantForm((value) => ({ ...value, firstName: event.target.value }))} /></label>
              <label><span>الاسم الأخير</span><input value={applicantForm.lastName} onChange={(event) => setApplicantForm((value) => ({ ...value, lastName: event.target.value }))} /></label>
              <label><span>البريد</span><input value={applicantForm.email} onChange={(event) => setApplicantForm((value) => ({ ...value, email: event.target.value }))} /></label>
              <label><span>الهاتف</span><input value={applicantForm.phone} onChange={(event) => setApplicantForm((value) => ({ ...value, phone: event.target.value }))} /></label>
              <label className="form-field-span-2"><span>رابط السيرة</span><input value={applicantForm.resumeUrl} onChange={(event) => setApplicantForm((value) => ({ ...value, resumeUrl: event.target.value }))} /></label>
            </div>
            <button className="secondary-button compact-pill" type="submit" disabled={!applicantForm.jobId || !applicantForm.firstName || !applicantForm.email}>تسجيل المتقدم</button>
          </form>
          {message ? <QueryFeedback title="تم التنفيذ" message={message} /> : null}
          {errorMessage ? <QueryFeedback title="تعذر تنفيذ العملية" message={errorMessage} tone="error" /> : null}
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Jobs</span>
          {loading ? (
            <QueryFeedback title="جارٍ تحميل الشواغر" message="نقرأ فرص التوظيف الحالية." />
          ) : error ? (
            <QueryFeedback title="فشل تحميل الشواغر" message={error} tone="error" />
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>#</th><th>المسمى</th><th>القسم</th><th>الحالة</th><th>إجراء</th></tr></thead>
                <tbody>
                  {jobs.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.title}</td>
                      <td>{item.department}</td>
                      <td>{item.status}</td>
                      <td><button className="secondary-button compact-pill" type="button" onClick={() => setSelectedJobId(String(item.id))}>عرض المتقدمين</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Applicants</span>
          <div className="inline-actions">
            <label>
              <span>الشاغر المفتوح</span>
              <select value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)}>
                <option value="">اختر الشاغر</option>
                {jobs.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>
            <label>
              <span>الحالة الجديدة</span>
              <select value={statusUpdate} onChange={(event) => setStatusUpdate(event.target.value)}>
                <option value="screening">screening</option>
                <option value="interviewing">interviewing</option>
                <option value="offered">offered</option>
                <option value="hired">hired</option>
                <option value="rejected">rejected</option>
              </select>
            </label>
          </div>
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>الاسم</th><th>البريد</th><th>الحالة</th><th>إجراء</th></tr></thead>
              <tbody>
                {applicants.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{`${item.first_name} ${item.last_name}`}</td>
                    <td>{item.email}</td>
                    <td>{item.status}</td>
                    <td>
                      <button className="secondary-button compact-pill" type="button" onClick={() => setSelectedApplicantId(String(item.id))}>مقابلات</button>
                      <button className="secondary-button compact-pill" type="button" onClick={handleStatusUpdate} disabled={selectedApplicantId !== String(item.id)}>{selectedApplicantId === String(item.id) ? "تحديث الحالة" : "اختر أولًا"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">Interview</span>
          <h3>{selectedApplicant ? `جدولة مقابلة لـ ${selectedApplicant.first_name}` : "اختر متقدمًا"}</h3>
          <form className="auth-form" onSubmit={handleScheduleInterview}>
            <div className="form-grid">
              <label>
                <span>المتقدم</span>
                <select value={interviewForm.applicantId} onChange={(event) => setInterviewForm((value) => ({ ...value, applicantId: event.target.value }))}>
                  <option value="">اختر المتقدم</option>
                  {applicants.map((item) => <option key={item.id} value={item.id}>{item.first_name} {item.last_name}</option>)}
                </select>
              </label>
              <label>
                <span>المقابل</span>
                <select value={interviewForm.interviewerId} onChange={(event) => setInterviewForm((value) => ({ ...value, interviewerId: event.target.value }))}>
                  <option value="">اختر المستخدم</option>
                  {(users?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.username}</option>)}
                </select>
              </label>
              <label className="form-field-span-2"><span>موعد المقابلة</span><input type="datetime-local" value={interviewForm.scheduledAt} onChange={(event) => setInterviewForm((value) => ({ ...value, scheduledAt: event.target.value }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!interviewForm.applicantId || !interviewForm.interviewerId || !interviewForm.scheduledAt}>جدولة المقابلة</button>
          </form>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">Feedback</span>
          <div className="form-grid">
            <label><span>التقييم</span><select value={interviewForm.rating} onChange={(event) => setInterviewForm((value) => ({ ...value, rating: event.target.value }))}><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label>
            <label className="form-field-span-2"><span>ملاحظات التقييم</span><input value={interviewForm.feedback} onChange={(event) => setInterviewForm((value) => ({ ...value, feedback: event.target.value }))} /></label>
          </div>
          <div className="table-shell">
            <table>
              <thead><tr><th>#</th><th>الموعد</th><th>الحالة</th><th>التقييم</th><th>إجراء</th></tr></thead>
              <tbody>
                {interviews.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.scheduled_at}</td>
                    <td>{item.status}</td>
                    <td>{item.rating ?? "-"}</td>
                    <td><button className="secondary-button compact-pill" type="button" onClick={() => handleFeedback(item.id)} disabled={!interviewForm.feedback}>حفظ التقييم</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
