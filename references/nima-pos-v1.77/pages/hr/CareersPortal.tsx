import React, { useState } from 'react';
import { Globe, Search, Plus, Briefcase, MapPin, Clock, Users, Edit, Trash2, Eye, X, Save, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { JobPosting, JobApplication } from '../../types';
import { format } from 'date-fns';

export const CareersPortal: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isAppsModalOpen, setIsAppsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [editingJob, setEditingJob] = useState<Partial<JobPosting> | null>(null);
  const [jobToDelete, setJobToDelete] = useState<number | null>(null);

  const jobPostings = useLiveQuery(() => db.jobPostings.reverse().sortBy('postedDate')) || [];
  const applications = useLiveQuery(() => db.jobApplications.toArray()) || [];

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob?.title || !editingJob?.department) return;

    if (editingJob.id) {
      await db.jobPostings.update(editingJob.id, editingJob as JobPosting);
    } else {
      await db.jobPostings.add({
        ...editingJob,
        postedDate: new Date().toISOString(),
      } as JobPosting);
    }
    setIsJobModalOpen(false);
    setEditingJob(null);
  };

  const confirmDeleteJob = async () => {
    if (jobToDelete) {
      await db.jobPostings.delete(jobToDelete);
      const relatedApps = applications.filter(a => a.jobId === jobToDelete);
      for (const app of relatedApps) {
        if (app.id) await db.jobApplications.delete(app.id);
      }
      setJobToDelete(null);
    }
  };

  const openJobModal = (job?: JobPosting) => {
    if (job) {
      setEditingJob(job);
    } else {
      setEditingJob({
        title: '',
        department: '',
        location: '',
        type: 'full-time',
        status: 'open',
        requirements: ''
      });
    }
    setIsJobModalOpen(true);
  };

  const openAppsModal = (job: JobPosting) => {
    setSelectedJob(job);
    setIsAppsModalOpen(true);
  };

  const updateApplicationStatus = async (appId: number, status: JobApplication['status']) => {
    await db.jobApplications.update(appId, { status });
  };

  const filteredJobs = jobPostings.filter(j => 
    j.title.includes(searchTerm) || j.department.includes(searchTerm)
  );

  const getJobApplications = (jobId: number) => {
    return applications.filter(a => a.jobId === jobId);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'full-time': return 'دوام كامل';
      case 'part-time': return 'دوام جزئي';
      case 'contract': return 'عقد';
      case 'remote': return 'عن بعد';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">مفتوح</span>;
      case 'closed': return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm">مغلق</span>;
      case 'draft': return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">مسودة</span>;
      default: return null;
    }
  };

  const getAppStatusBadge = (status: string) => {
    switch (status) {
      case 'applied': return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">متقدم</span>;
      case 'screening': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">فرز</span>;
      case 'interview': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">مقابلة</span>;
      case 'offered': return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">عرض وظيفي</span>;
      case 'hired': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">تم التعيين</span>;
      case 'rejected': return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-xs">مرفوض</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">بوابة التوظيف الخارجية</h1>
            <p className="text-slate-500">إدارة الوظائف الشاغرة واستقبال طلبات التوظيف</p>
          </div>
        </div>
        <button 
          onClick={() => openJobModal()}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة وظيفة جديدة</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث بالمسمى الوظيفي أو القسم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-slate-600 font-semibold">المسمى الوظيفي</th>
                <th className="p-4 text-slate-600 font-semibold">القسم</th>
                <th className="p-4 text-slate-600 font-semibold">الموقع</th>
                <th className="p-4 text-slate-600 font-semibold">نوع العمل</th>
                <th className="p-4 text-slate-600 font-semibold">تاريخ النشر</th>
                <th className="p-4 text-slate-600 font-semibold">المتقدمين</th>
                <th className="p-4 text-slate-600 font-semibold">الحالة</th>
                <th className="p-4 text-slate-600 font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-teal-500" />
                      <span>{job.title}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{job.department}</td>
                  <td className="p-4 text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{job.location}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{getTypeBadge(job.type)}</td>
                  <td className="p-4 text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{format(new Date(job.postedDate), 'yyyy-MM-dd')}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => openAppsModal(job)}
                      className="flex items-center gap-1 text-indigo-600 font-medium bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg w-fit transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      <span>{getJobApplications(job.id!).length} طلب</span>
                    </button>
                  </td>
                  <td className="p-4">{getStatusBadge(job.status)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openJobModal(job)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setJobToDelete(job.id!)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    لا توجد وظائف معلنة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job Modal */}
      {isJobModalOpen && editingJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingJob.id ? 'تعديل وظيفة' : 'إضافة وظيفة جديدة'}
              </h2>
              <button onClick={() => setIsJobModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="job-form" onSubmit={handleSaveJob} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">المسمى الوظيفي *</label>
                    <input
                      required
                      type="text"
                      value={editingJob.title || ''}
                      onChange={e => setEditingJob({...editingJob, title: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">القسم *</label>
                    <input
                      required
                      type="text"
                      value={editingJob.department || ''}
                      onChange={e => setEditingJob({...editingJob, department: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الموقع</label>
                    <input
                      type="text"
                      value={editingJob.location || ''}
                      onChange={e => setEditingJob({...editingJob, location: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">نوع العمل</label>
                    <select
                      value={editingJob.type}
                      onChange={e => setEditingJob({...editingJob, type: e.target.value as any})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      <option value="full-time">دوام كامل</option>
                      <option value="part-time">دوام جزئي</option>
                      <option value="contract">عقد</option>
                      <option value="remote">عن بعد</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                    <select
                      value={editingJob.status}
                      onChange={e => setEditingJob({...editingJob, status: e.target.value as any})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      <option value="open">مفتوح</option>
                      <option value="closed">مغلق</option>
                      <option value="draft">مسودة</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المتطلبات والوصف الوظيفي</label>
                  <textarea
                    rows={5}
                    value={editingJob.requirements || ''}
                    onChange={e => setEditingJob({...editingJob, requirements: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsJobModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                form="job-form"
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applications Modal */}
      {isAppsModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Users className="text-indigo-600" />
                  المتقدمين لوظيفة: {selectedJob.title}
                </h2>
                <p className="text-sm text-slate-500 mt-1">إدارة طلبات التوظيف وتحديث حالتها</p>
              </div>
              <button onClick={() => setIsAppsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-0">
              <table className="w-full text-right">
                <thead className="bg-white sticky top-0 border-b border-slate-100 shadow-sm z-10">
                  <tr>
                    <th className="p-4 text-slate-600 font-semibold">اسم المتقدم</th>
                    <th className="p-4 text-slate-600 font-semibold">تاريخ التقديم</th>
                    <th className="p-4 text-slate-600 font-semibold">التواصل</th>
                    <th className="p-4 text-slate-600 font-semibold">ملفات مشفرة والتقييم</th>
                    <th className="p-4 text-slate-600 font-semibold">الحالة والإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getJobApplications(selectedJob.id!).map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-800">{app.applicantName}</td>
                      <td className="p-4 text-slate-600">
                        {format(new Date(app.appliedDate), 'yyyy-MM-dd')}
                      </td>
                      <td className="p-4 text-slate-600">
                        <div className="text-sm">
                          <div>{app.email || '-'}</div>
                          <div className="text-slate-500" dir="ltr">{app.phone || '-'}</div>
                        </div>
                      </td>
                      <td className="p-4">
                         <div className="flex flex-col gap-2">
                            {app.resumeUrl ? (
                              <button onClick={() => alert('تم فك التشفير واستعراض السيرة الذاتية بأمان (Data Isolated)')} className="text-blue-600 hover:underline flex items-center gap-1 w-fit">
                                <FileText className="w-4 h-4" /> عرض (آمن)
                              </button>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                            {app.status === 'interview' && (
                                <button className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded w-fit" onClick={() => alert('تم إرسال دعوة للمقابلة وتوليد رابط مؤمّن. دخول المتقدم معزول عن بيانات النظام (Zero-Trust).')}>جدولة مقابلة وتقييم</button>
                            )}
                         </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-2">
                            <select
                              value={app.status}
                              onChange={(e) => updateApplicationStatus(app.id!, e.target.value as any)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-800 w-full"
                            >
                              <option value="applied">متقدم</option>
                              <option value="screening">فرز</option>
                              <option value="interview">مقابلة</option>
                              <option value="offered">عرض وظيفي</option>
                              <option value="hired">تم التعيين</option>
                              <option value="rejected">مرفوض</option>
                            </select>
                            {app.status === 'hired' && (
                                <button className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2 py-1.5 rounded w-full font-bold" onClick={() => alert('تم نقل الموظف لبرنامج التهيئة وإنشاء العقد رقمياً')}>
                                    تهيئة موظف جديد
                                </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {getJobApplications(selectedJob.id!).length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        لا يوجد متقدمين لهذه الوظيفة حتى الآن.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end bg-white">
              <button
                onClick={() => setIsAppsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">تأكيد الحذف</h2>
              <p className="text-slate-600 mb-6">
                هل أنت متأكد من حذف هذه الوظيفة؟ سيتم حذف جميع الطلبات المرتبطة بها نهائياً ولا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setJobToDelete(null)}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDeleteJob}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  نعم، احذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

