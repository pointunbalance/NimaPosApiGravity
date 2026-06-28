import React from 'react';
import { X } from 'lucide-react';

interface PickupPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: any[];
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
}

export const PickupPersonModal: React.FC<PickupPersonModalProps> = ({
  isOpen,
  onClose,
  students,
  formData,
  setFormData,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-black text-slate-800">
            {formData.id ? 'تعديل شخص مفوض' : 'إضافة شخص مفوض بالاستلام'}
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                اختر الطفل <span className="text-rose-500">*</span>
              </label>
              <select 
                required 
                value={formData.studentId} 
                onChange={e => setFormData({ ...formData, studentId: Number(e.target.value) })} 
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none"
              >
                <option value={0} disabled>-- اختر الطفل --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                اسم الشخص بالكامل <span className="text-rose-500">*</span>
              </label>
              <input 
                required 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                صلة القرابة <span className="text-rose-500">*</span>
              </label>
              <input 
                required 
                type="text" 
                value={formData.relation} 
                onChange={e => setFormData({ ...formData, relation: e.target.value })} 
                placeholder="الوالد، الوالدة، الخال.." 
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                رقم الهاتف <span className="text-rose-500">*</span>
              </label>
              <input 
                required 
                type="text" 
                value={formData.phone} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                dir="ltr" 
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">الرقم القومي (اختياري)</label>
              <input 
                type="text" 
                value={formData.nationalId || ''} 
                onChange={e => setFormData({ ...formData, nationalId: e.target.value })} 
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                dir="ltr" 
              />
            </div>

            <div className="col-span-2 flex items-center gap-3 bg-rose-50 p-3 rounded-xl border border-rose-100 mt-2">
              <input 
                type="checkbox" 
                id="is_allowed_modal" 
                checked={!!formData.isAllowed} 
                onChange={e => setFormData({ ...formData, isAllowed: e.target.checked })} 
                className="w-5 h-5 accent-rose-600 rounded cursor-pointer" 
              />
              <label htmlFor="is_allowed_modal" className="text-sm font-bold text-rose-900 cursor-pointer">
                تصريح بالاستلام (إزالة التحديد تمنع الشخص من استلام الطفل)
              </label>
            </div>
          </div>
          <div className="pt-6 flex justify-end">
            <button 
              type="submit" 
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 flex-1 flex items-center justify-center gap-2"
            >
              حفظ البيانات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AbsencePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  absenceReasonText: string;
  setAbsenceReasonText: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AbsencePromptModal: React.FC<AbsencePromptModalProps> = ({
  isOpen,
  onClose,
  absenceReasonText,
  setAbsenceReasonText,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-black text-slate-800">إثبات غياب الطالب</h3>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4 text-sm">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">سبب الغياب (اختياري)</label>
            <input
              type="text"
              placeholder="مرض، سفر، عطلة..."
              value={absenceReasonText}
              onChange={e => setAbsenceReasonText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
            >
              تأكيد الغياب
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
