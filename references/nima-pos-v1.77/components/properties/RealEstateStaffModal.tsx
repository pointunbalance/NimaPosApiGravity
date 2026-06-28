import React, { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';

interface RealEstateStaffModalProps {
  isOpen: boolean;
  isEdit: boolean;
  rolesList: string[];
  initialData: {
    name: string;
    phone: string;
    role: string;
    pin: string;
    baseSalary: number;
    isActive: boolean;
  };
  onClose: () => void;
  onSave: (data: {
    name: string;
    phone: string;
    role: string;
    pin: string;
    baseSalary: number;
    isActive: boolean;
  }) => Promise<void>;
}

export const RealEstateStaffModal: React.FC<RealEstateStaffModalProps> = ({
  isOpen,
  isEdit,
  rolesList,
  initialData,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-indigo-100/50">
        <div className="p-6 border-b border-indigo-50 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-lg font-black text-slate-800">
            {isEdit ? 'تعديل بيانات الموظف' : 'إضافة موظف عقاري جديد'}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl transition-all"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">الاسم الرباعي (مثال: تاراس بوهدان)</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              placeholder="تاراس بوهدان"
              className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">رقم الهاتف</label>
              <input 
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-800 text-right"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">رمز الدخول (PIN)</label>
              <input 
                type="text" 
                value={formData.pin}
                onChange={(e) => setFormData({...formData, pin: e.target.value})}
                required
                className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-800 text-center tracking-widest"
                dir="ltr"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">التخصص / المسمى</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                required
                className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-700 cursor-pointer"
              >
                {rolesList.map((role, idx) => (
                  <option key={idx} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">الراتب الأساسي</label>
              <input 
                type="number"
                value={formData.baseSalary}
                onChange={(e) => setFormData({...formData, baseSalary: Number(e.target.value)})}
                className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-800"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="w-4 h-4 text-indigo-600 border-indigo-200 rounded focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="text-xs font-bold text-slate-700 cursor-pointer">
              تفعيل حساب الموظف (يمكنه تسجيل الدخول للنظام)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-indigo-50">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-black text-sm transition-all"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white rounded-xl font-black shadow-md shadow-indigo-500/10 flex items-center gap-2 text-sm transition-all"
            >
              <Save size={18} className="stroke-[2.5]" />
              حفظ البيانات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RealEstateStaffModal;
