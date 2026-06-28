import React from 'react';
import { X } from 'lucide-react';

interface LegalStaffModalProps {
  isOpen: boolean;
  isEdit: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  formData: {
    name: string;
    phone: string;
    role: string;
    pin: string;
    baseSalary: number;
    isActive: boolean;
  };
  setFormData: (data: any) => void;
  rolesList: string[];
}

export const LegalStaffModal: React.FC<LegalStaffModalProps> = ({
  isOpen,
  isEdit,
  onClose,
  onSave,
  formData,
  setFormData,
  rolesList,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-right" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center flex-row-reverse">
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-800">
            {isEdit ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
          </h2>
        </div>
        <form onSubmit={onSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">الاسم رباعي (مثال: أندري، ميكولا، تاراس) *</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              placeholder="مثال: ياروسلاف بوهدان"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-right"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">رقم الهاتف</label>
              <input 
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-left focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">رمز الدخول (PIN)</label>
              <input 
                type="text" 
                value={formData.pin}
                onChange={(e) => setFormData({...formData, pin: e.target.value})}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-center font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                dir="ltr"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">التخصص / المسمى الوظيفي</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-right"
              >
                {rolesList.map((role, idx) => (
                  <option key={idx} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">الراتب الأساسي</label>
              <input 
                type="number"
                value={formData.baseSalary}
                onChange={(e) => setFormData({...formData, baseSalary: Number(e.target.value)})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-right"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 justify-start flex-row-reverse">
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
              تفعيل حساب الموظف (يمكنه تسجيل الدخول للنظام إذا كان مسموحاً)
            </label>
            <input 
              type="checkbox" 
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 flex-row-reverse">
            <button 
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold"
            >
              حفظ البيانات
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-bold"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default LegalStaffModal;
