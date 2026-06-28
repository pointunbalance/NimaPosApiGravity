import React from 'react';
import { X } from 'lucide-react';

interface GymStaffFormModalProps {
  isOpen: boolean;
  isEdit: boolean;
  rolesList: string[];
  formData: {
    name: string;
    phone: string;
    role: string;
    pin: string;
    baseSalary: number;
    isActive: boolean;
  };
  setFormData: (data: any) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export const GymStaffFormModal: React.FC<GymStaffFormModalProps> = ({
  isOpen,
  isEdit,
  rolesList,
  formData,
  setFormData,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 font-sans text-right" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-row-reverse">
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-black text-slate-800">
            {isEdit ? 'تعديل سجلات وبيانات الموظف' : 'تسجيل موظف وطاقم جديد بالنادي'}
          </h2>
        </div>

        {/* Modal form */}
        <form onSubmit={onSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 mb-1.5">الاسم الكامل (أوكراني مسيحي فقط)</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="مثال: ياروسلاف كوزا"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-505 focus:outline-none text-xs font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5">رقم الهاتف</label>
              <input 
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+380..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-left focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs font-semibold"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5">رمز الدخول للأجهزة (PIN)</label>
              <input 
                type="text" 
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-center font-mono tracking-widest focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs font-bold"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5">التخصص والمسمى الوظيفي</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs font-bold bg-white"
              >
                {rolesList.map((role, idx) => (
                  <option key={idx} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5">الراتب الأساسي</label>
              <input 
                type="number"
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs font-bold"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 flex-row-reverse justify-end text-right">
            <input 
              type="checkbox" 
              id="isActiveGym"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="isActiveGym" className="text-xs font-bold text-slate-500 cursor-pointer select-none">
              تفعيل الموظف بالبواب والورديات وصلاحية الدخول
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-5 border-t border-slate-100 text-xs flex-row-reverse">
            <button 
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg transition-colors cursor-pointer"
            >
              حفظ وتوثيق القيد
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 font-bold rounded-lg transition-colors cursor-pointer"
            >
              إلغاء التراجع
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default GymStaffFormModal;
