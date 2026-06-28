import React from 'react';
import { X, Save } from 'lucide-react';

interface CreateComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: any;
  setForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  students: any[];
  employees: any[];
  COMPLAINT_TYPES: any[];
  PRIORITIES: any[];
}

export const CreateComplaintModal: React.FC<CreateComplaintModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
  students,
  employees,
  COMPLAINT_TYPES,
  PRIORITIES
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto" dir="rtl">
        <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                <h2 className="text-xl font-black text-slate-800">إضافة شكوى / ملاحظة</h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <form onSubmit={onSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">نوع الملاحظة</label>
                        <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-bold outline-none">
                            {COMPLAINT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">درجة الأهمية</label>
                        <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-bold outline-none">
                            {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">العنوان / الموضوع</label>
                    <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-medium outline-none" placeholder="اكتب ملخصاً قصيراً..." />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">التفاصيل والتوضيح</label>
                    <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-medium resize-none outline-none" rows={4} placeholder="اكتب تفاصيل الشكوى أو الملاحظة بشكل كامل..."></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {form.type === 'student_issue' && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">الطفل المعني</label>
                            <select value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-medium outline-none">
                                <option value="">-- اختر الطفل --</option>
                                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}
                    {form.type === 'employee_issue' && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">الموظف المعني</label>
                            <select value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-medium outline-none">
                                <option value="">-- اختر الموظف --</option>
                                {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                        </div>
                    )}
                    {form.type === 'parent_complaint' && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">اسم ولي الأمر المشتكي</label>
                            <input type="text" value={form.parentId} onChange={e => setForm({...form, parentId: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-medium outline-none" placeholder="اسم ولي الأمر ورقم الهاتف..." />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">المسؤول عن المتابعة والحل</label>
                        <input type="text" value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-medium outline-none" placeholder="المدير، مشرفة القسم..." />
                    </div>
                </div>
                
                <div className="pt-6 border-t border-slate-100 flex gap-4">
                    <button type="button" onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">إلغاء</button>
                    <button type="submit" className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-sm shadow-red-200">
                        تسجيل الشكوى
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

interface ResolutionModalProps {
  complaint: any;
  onClose: () => void;
  resolutionForm: any;
  setResolutionForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  STATUSES: any[];
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({
  complaint,
  onClose,
  resolutionForm,
  setResolutionForm,
  onSubmit,
  STATUSES
}) => {
  if (!complaint) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto" dir="rtl">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                <h2 className="text-xl font-black text-slate-800">متابعة ومعالجة الشكوى</h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 mb-1">{complaint.title}</h3>
                <p className="text-sm text-slate-600">{complaint.description}</p>
            </div>

            <form onSubmit={onSubmit} className="p-6 space-y-5">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">تحديث الحالة</label>
                    <select value={resolutionForm.status} onChange={e => setResolutionForm({...resolutionForm, status: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold outline-none">
                        {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ المعالجة / الرد</label>
                    <input type="date" value={resolutionForm.replyDate} onChange={e => setResolutionForm({...resolutionForm, replyDate: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm outline-none" />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">نتيجة المعالجة والملاحظات</label>
                    <textarea required value={resolutionForm.resolutionNote} onChange={e => setResolutionForm({...resolutionForm, resolutionNote: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium resize-none outline-none" rows={4} placeholder="اكتب ما تم اتخاذه من إجراءات لحل المشكلة..."></textarea>
                </div>
                
                <div className="pt-4 flex gap-4">
                    <button type="button" onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">إلغاء</button>
                    <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200 flex items-center justify-center gap-2">
                        <Save className="w-4 h-4"/> تحديث البيانات
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};
