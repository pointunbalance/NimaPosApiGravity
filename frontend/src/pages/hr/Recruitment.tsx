import React, { useState, useRef } from 'react';
import { db } from '../../db';
import { JobApplication } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { 
  Briefcase, Plus, Search, Filter, UserPlus, FileText, 
  Phone, Mail, Calendar, CheckCircle, XCircle, Clock, X, Save,
  Edit, Trash2, Eye, Download, Printer, AlertTriangle
} from 'lucide-react';

export default function Recruitment() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | JobApplication['status']>('all');
  const [appToDelete, setAppToDelete] = useState<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  
  const [newApp, setNewApp] = useState<Partial<JobApplication>>({
    status: 'applied',
    appliedDate: new Date()
  });

  const applications = useLiveQuery(() => db.jobApplications.reverse().sortBy('appliedDate'));
  const printRef = useRef<HTMLDivElement>(null);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApp.applicantName || !newApp.position) return;

    if (newApp.id) {
      await db.jobApplications.update(newApp.id, {
        applicantName: newApp.applicantName,
        position: newApp.position,
        email: newApp.email,
        phone: newApp.phone,
        resumeUrl: newApp.resumeUrl,
        status: newApp.status as JobApplication['status'],
        notes: newApp.notes
      });
    } else {
      await db.jobApplications.add({
        applicantName: newApp.applicantName,
        position: newApp.position,
        email: newApp.email,
        phone: newApp.phone,
        resumeUrl: newApp.resumeUrl,
        status: newApp.status as JobApplication['status'],
        appliedDate: newApp.appliedDate || new Date(),
        notes: newApp.notes
      });
    }

    setIsModalOpen(false);
    setNewApp({
      status: 'applied',
      appliedDate: new Date()
    });
  };

  const handleEdit = (app: JobApplication) => {
    setNewApp(app);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (appToDelete) {
      await db.jobApplications.delete(appToDelete);
      setAppToDelete(null);
    }
  };

  const handleView = (app: JobApplication) => {
    setSelectedApp(app);
    setIsViewModalOpen(true);
  };

  const updateStatus = async (id: number, status: JobApplication['status']) => {
    await db.jobApplications.update(id, { status });
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredApps = applications?.filter(app => {
    const matchesSearch = app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    if (!filteredApps || filteredApps.length === 0) return;
    
    const headers = ['المرشح', 'الوظيفة', 'تاريخ التقديم', 'رقم الهاتف', 'البريد الإلكتروني', 'الحالة', 'ملاحظات'];
    const csvContent = [
      headers.join(','),
      ...filteredApps.map(app => {
        return [
          `"${app.applicantName}"`,
          `"${app.position}"`,
          `"${format(new Date(app.appliedDate), 'yyyy-MM-dd')}"`,
          `"${app.phone || ''}"`,
          `"${app.email || ''}"`,
          `"${getStatusLabel(app.status)}"`,
          `"${(app.notes || '').replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `المرشحين_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-slate-100 text-slate-800 ';
      case 'screening': return 'bg-blue-100 text-blue-800 ';
      case 'interview': return 'bg-purple-100 text-purple-800 ';
      case 'offered': return 'bg-amber-100 text-amber-800 ';
      case 'hired': return 'bg-emerald-100 text-emerald-800 ';
      case 'rejected': return 'bg-red-100 text-red-800 ';
      default: return 'bg-slate-100 text-slate-800 ';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'applied': return 'متقدم';
      case 'screening': return 'فرز مبدئي';
      case 'interview': return 'مقابلة';
      case 'offered': return 'عرض عمل';
      case 'hired': return 'تم التعيين';
      case 'rejected': return 'مرفوض';
      default: return status;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" ref={printRef}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="text-indigo-600" />
            التوظيف وتتبع المرشحين
          </h1>
          <p className="text-slate-500 text-sm mt-1">إدارة طلبات التوظيف ومراحل المقابلات</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download size={20} />
            تصدير
          </button>
          <button
            onClick={handlePrint}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Printer size={20} />
            طباعة
          </button>
          <button
            onClick={() => {
              setNewApp({ status: 'applied', appliedDate: new Date() });
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            مرشح جديد
          </button>
        </div>
      </div>

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">تقرير المرشحين</h1>
        <p className="text-center text-slate-500">تاريخ الطباعة: {format(new Date(), 'yyyy-MM-dd')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between print:hidden">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="بحث باسم المرشح أو الوظيفة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">جميع الحالات</option>
              <option value="applied">متقدم</option>
              <option value="screening">فرز مبدئي</option>
              <option value="interview">مقابلة</option>
              <option value="offered">عرض عمل</option>
              <option value="hired">تم التعيين</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="p-4 font-medium">المرشح</th>
                <th className="p-4 font-medium">الوظيفة</th>
                <th className="p-4 font-medium">تاريخ التقديم</th>
                <th className="p-4 font-medium">التواصل</th>
                <th className="p-4 font-medium">السيرة الذاتية</th>
                <th className="p-4 font-medium">الحالة</th>
                <th className="p-4 font-medium print:hidden">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredApps?.map(app => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{app.applicantName}</td>
                  <td className="p-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Briefcase size={14} className="text-slate-400" />
                      {app.position}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {format(new Date(app.appliedDate), 'yyyy-MM-dd')}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    <div className="flex flex-col gap-1">
                      {app.phone && <div className="flex items-center gap-1"><Phone size={12} className="text-slate-400"/> <span dir="ltr">{app.phone}</span></div>}
                      {app.email && <div className="flex items-center gap-1"><Mail size={12} className="text-slate-400"/> {app.email}</div>}
                    </div>
                  </td>
                  <td className="p-4">
                    {app.resumeUrl ? (
                      <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm">
                        <FileText size={16} /> عرض
                      </a>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id!, e.target.value as any)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 outline-none cursor-pointer ${getStatusColor(app.status)}`}
                    >
                      <option value="applied">متقدم</option>
                      <option value="screening">فرز مبدئي</option>
                      <option value="interview">مقابلة</option>
                      <option value="offered">عرض عمل</option>
                      <option value="hired">تم التعيين</option>
                      <option value="rejected">مرفوض</option>
                    </select>
                  </td>
                  <td className="p-4 print:hidden">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleView(app)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(app)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setAppToDelete(app.id!)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredApps?.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    لا توجد طلبات توظيف
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Application Modal */}
      {isViewModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="text-indigo-600" />
                تفاصيل المرشح
              </h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">اسم المرشح</h3>
                  <p className="font-bold text-slate-800 text-lg">{selectedApp.applicantName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">الوظيفة المتقدم لها</h3>
                  <p className="font-bold text-slate-800 text-lg">{selectedApp.position}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">تاريخ التقديم</h3>
                  <p className="text-slate-800">{format(new Date(selectedApp.appliedDate), 'yyyy-MM-dd')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">الحالة</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedApp.status)}`}>
                    {getStatusLabel(selectedApp.status)}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">رقم الهاتف</h3>
                  <p className="text-slate-800" dir="ltr">{selectedApp.phone || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">البريد الإلكتروني</h3>
                  <p className="text-slate-800">{selectedApp.email || '-'}</p>
                </div>
              </div>

              {selectedApp.resumeUrl && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">السيرة الذاتية</h3>
                  {selectedApp.resumeUrl.startsWith('data:') ? (
                    <a 
                      href={selectedApp.resumeUrl} 
                      download={`Resume_${selectedApp.applicantName.replace(/\s+/g, '_')}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <Download size={20} />
                      تنزيل السيرة الذاتية
                    </a>
                  ) : (
                    <a 
                      href={selectedApp.resumeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <FileText size={20} />
                      عرض السيرة الذاتية
                    </a>
                  )}
                </div>
              )}

              {selectedApp.notes && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">ملاحظات</h3>
                  <div className="bg-slate-50 p-4 rounded-lg text-slate-800 whitespace-pre-wrap">
                    {selectedApp.notes}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New/Edit Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {newApp.id ? 'تعديل بيانات المرشح' : 'إضافة مرشح جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateApp} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم المرشح *</label>
                <input
                  required
                  type="text"
                  value={newApp.applicantName || ''}
                  onChange={e => setNewApp({...newApp, applicantName: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المسمى الوظيفي *</label>
                <input
                  required
                  type="text"
                  value={newApp.position || ''}
                  onChange={e => setNewApp({...newApp, position: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={newApp.phone || ''}
                    onChange={e => setNewApp({...newApp, phone: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={newApp.email || ''}
                    onChange={e => setNewApp({...newApp, email: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">السيرة الذاتية (ملف PDF أو صورة)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewApp({...newApp, resumeUrl: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  {newApp.resumeUrl && newApp.resumeUrl.startsWith('data:') && (
                     <span title="تم إرفاق الملف"><CheckCircle className="text-emerald-500 w-6 h-6 flex-shrink-0" /></span>
                  )}
                </div>
                {newApp.resumeUrl && !newApp.resumeUrl.startsWith('data:') && (
                   <div className="text-xs text-slate-500 mt-1">يوجد رابط سابق: {newApp.resumeUrl}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                <select
                  value={newApp.status || 'applied'}
                  onChange={e => setNewApp({...newApp, status: e.target.value as any})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="applied">متقدم</option>
                  <option value="screening">فرز مبدئي</option>
                  <option value="interview">مقابلة</option>
                  <option value="offered">عرض عمل</option>
                  <option value="hired">تم التعيين</option>
                  <option value="rejected">مرفوض</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات</label>
                <textarea
                  rows={3}
                  value={newApp.notes || ''}
                  onChange={e => setNewApp({...newApp, notes: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save size={20} />
                  {newApp.id ? 'حفظ التعديلات' : 'حفظ المرشح'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {appToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">تأكيد الحذف</h2>
              <p className="text-slate-600 mb-6">
                هل أنت متأكد من حذف هذا المرشح؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setAppToDelete(null)}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDelete}
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
}
