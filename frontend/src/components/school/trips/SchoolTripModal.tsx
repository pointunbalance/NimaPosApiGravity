import React from 'react';
import { X } from 'lucide-react';

interface SchoolTripModalProps {
  isOpen: boolean;
  isEdit: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (data: any) => void;
  employees: any[];
}

export const SchoolTripModal: React.FC<SchoolTripModalProps> = ({
  isOpen,
  isEdit,
  onClose,
  onSave,
  formData,
  setFormData,
  employees,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl shadow-sm z-10 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">
            {isEdit ? 'تعديل بيانات الرحلة' : 'تنظيم رحلة جديدة'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
          <form onSubmit={onSave} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                اسم الرحلة <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                الوجهة <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.destination || ''}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">التاريخ</label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  التكلفة للفرد (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.childCost || 0}
                  onChange={(e) => setFormData({ ...formData, childCost: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  عدد المقاعد الإجمالي
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity || 0}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  المشرف المسؤول <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.supervisorIds?.[0] || ''}
                  onChange={(e) => setFormData({ ...formData, supervisorIds: [Number(e.target.value)] })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  required
                >
                  <option value="" disabled>
                    -- اختر المشرف --
                  </option>
                  {(employees || []).map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                ملاحظات والتفاصيل
              </label>
              <textarea
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
                placeholder="اكتب مسار الرحلة، التعليمات.."
              />
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg cursor-pointer"
              >
                حفظ التغييرات
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SchoolTripModal;
