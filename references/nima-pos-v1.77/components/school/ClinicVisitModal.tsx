import React, { useState, useEffect } from 'react';
import { X, Activity } from 'lucide-react';

interface ClinicVisitModalProps {
  isOpen: boolean;
  isEdit: boolean;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
  students: any[];
  initialData?: any;
}

export const ClinicVisitModal: React.FC<ClinicVisitModalProps> = ({
  isOpen,
  isEdit,
  onClose,
  onSave,
  students,
  initialData
}) => {
  const [formData, setFormData] = useState({
    studentId: '',
    reason: '',
    temperature: '',
    action: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        studentId: String(initialData.studentId),
        reason: initialData.reason || '',
        temperature: initialData.temperature || '',
        action: initialData.action || '',
        date: initialData.date || new Date().toISOString().split('T')[0],
        notes: initialData.notes || ''
      });
    } else {
      setFormData({
        studentId: '',
        reason: '',
        temperature: '',
        action: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      ...formData,
      studentId: Number(formData.studentId)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <Activity className="w-5 h-5" />
             </div>
             <h2 className="text-xl font-black text-rose-900">
               {isEdit ? 'تعديل السجل الطبي' : 'تسجيل زيارة للعيادة'}
             </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-rose-400 hover:bg-rose-100 rounded-full transition-colors outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">اسم الطفل / الطالب <span className="text-rose-500">*</span></label>
            <select 
              value={formData.studentId}
              onChange={(e) => setFormData({...formData, studentId: e.target.value})}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all font-bold text-slate-800"
            >
               <option value="" disabled>اختر الطفل...</option>
               {students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.code}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2">
               <label className="block text-sm font-bold text-slate-700 mb-2">طبيعة الزيارة / الأعراض <span className="text-rose-500">*</span></label>
               <input 
                 type="text" 
                 value={formData.reason}
                 onChange={(e) => setFormData({...formData, reason: e.target.value})}
                 required
                 placeholder="مثال: ارتفاع في درجة الحرارة، ألم بالبطن"
                 className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all font-medium"
               />
             </div>
             <div>
               <label className="block text-sm font-bold text-slate-700 mb-2">درجة الحرارة (مئوية)</label>
               <input 
                 type="number" step="0.1"
                 value={formData.temperature}
                 onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                 placeholder="37.5"
                 className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all font-mono"
               />
             </div>
             <div>
               <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الزيارة <span className="text-rose-500">*</span></label>
               <input 
                 type="date" 
                 value={formData.date}
                 onChange={(e) => setFormData({...formData, date: e.target.value})}
                 required
                 className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all font-medium"
               />
             </div>
             <div className="col-span-2">
               <label className="block text-sm font-bold text-slate-700 mb-2">الإجراء الطبي المتخذ</label>
               <input 
                 type="text" 
                 value={formData.action}
                 onChange={(e) => setFormData({...formData, action: e.target.value})}
                 placeholder="مثال: إعطاء خافض حرارة والتواصل مع ولي الأمر"
                 className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all font-medium"
               />
             </div>
             <div className="col-span-2">
               <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات إضافية للملف</label>
               <textarea 
                 value={formData.notes}
                 onChange={(e) => setFormData({...formData, notes: e.target.value})}
                 rows={3}
                 placeholder="أي ملاحظات عامة..."
                 className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all font-medium resize-none"
               />
             </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-200 font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-rose-600 font-bold text-white rounded-xl hover:bg-rose-700 transition-colors"
            >
              حفظ السجل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
