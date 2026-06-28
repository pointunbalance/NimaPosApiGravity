import React from 'react';
import { X, MapPin, DollarSign } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  isEdit: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (data: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  classes: any[];
  students: any[];
  EVENT_TYPES: any;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  isEdit,
  onClose,
  formData,
  setFormData,
  handleSubmit,
  classes,
  students,
  EVENT_TYPES,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl my-8 overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl sticky top-0 z-10">
          <h2 className="text-xl font-black text-slate-800">{isEdit ? 'تعديل الحدث' : 'إضافة حدث جديد'}</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh]">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-full">
                <label className="block text-sm font-bold text-slate-700 mb-2">عنوان الحدث *</label>
                <input
                  required
                  type="text"
                  placeholder="مثال: رحلة الأهرامات، حفل تخرج..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">النوع</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold text-slate-700"
                >
                  {Object.entries(EVENT_TYPES).map(([key, val]: [string, any]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">التاريخ *</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-mono text-sm text-slate-700"
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-sm font-bold text-slate-700 mb-2">الوقت *</label>
                  <input
                    required
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-mono text-sm text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <h3 className="font-black text-indigo-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" /> تفاصيل المشاركين والرسوم
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-bold text-indigo-900 mb-2">الفصول المشاركة (اختياري)</label>
                  <select
                    multiple
                    value={formData.classes.map(String)}
                    onChange={(e) => {
                      const vals = Array.from(e.target.selectedOptions, (option) => parseInt(option.value));
                      setFormData({ ...formData, classes: vals });
                    }}
                    className="w-full h-24 px-4 py-3 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-sm p-2 text-slate-700"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-indigo-600 mt-1">اضغط Ctrl/Cmd لتحديد أكثر من فصل</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-indigo-900 mb-2">الأطفال المشاركين (اختياري)</label>
                  <select
                    multiple
                    value={formData.students.map(String)}
                    onChange={(e) => {
                      const vals = Array.from(e.target.selectedOptions, (option) => parseInt(option.value));
                      setFormData({ ...formData, students: vals });
                    }}
                    className="w-full h-24 px-4 py-3 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-sm p-2 text-slate-700"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-indigo-900 mb-2">تكلفة الحدث / الرسوم المطلوبة (اختياري)</label>
                <div className="relative">
                  <DollarSign className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                  <input
                    type="number"
                    min="0"
                    value={formData.cost || ''}
                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                    className="w-full pr-12 pl-4 py-3 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-slate-700"
                    placeholder="0"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-indigo-400">ج.م</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات والتفاصيل</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="أي تفاصيل تضاف للحدث مثل تعليمات الملابس أو موقع الرحلة..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 resize-none font-medium text-slate-700"
              ></textarea>
            </div>

            <div>
              <label className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isNotificationSent}
                  onChange={(e) => setFormData({ ...formData, isNotificationSent: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded transition"
                />
                <span>
                  <strong className="block text-emerald-900 font-bold mb-0.5">تم إرسال إشعار / دعوة للأهالي</strong>
                  <span className="block text-xs font-medium text-emerald-700">تواصلت الإدارة مع أولياء الأمور بخصوص هذا الحدث</span>
                </span>
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md"
            >
              {isEdit ? 'حفظ التعديلات' : 'إضافة الحدث'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default EventModal;
