import React, { useState, useEffect } from 'react';
import { Clock, XCircle } from 'lucide-react';
import { WorkShift } from '../../types';

interface ShiftModalProps {
  isOpen: boolean;
  editingShift: WorkShift | null;
  onClose: () => void;
  onSave: (formData: any) => Promise<void>;
  daysOfWeek: string[];
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  editingShift,
  onClose,
  onSave,
  daysOfWeek,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    startTime: '08:00',
    endTime: '16:00',
    gracePeriodMinutes: 15,
    department: 'all',
    daysOff: [] as number[],
    isActive: true,
  });

  useEffect(() => {
    if (editingShift) {
      setFormData({
        name: editingShift.name,
        startTime: editingShift.startTime,
        endTime: editingShift.endTime,
        gracePeriodMinutes: editingShift.gracePeriodMinutes || 0,
        department: 'all',
        daysOff: editingShift.daysOff || [],
        isActive: editingShift.isActive,
      });
    } else {
      setFormData({
        name: '',
        startTime: '08:00',
        endTime: '16:00',
        gracePeriodMinutes: 15,
        department: 'all',
        daysOff: [5, 6], // Default to Friday, Saturday
        isActive: true,
      });
    }
  }, [editingShift, isOpen]);

  if (!isOpen) return null;

  const toggleDayOff = (dayIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      daysOff: prev.daysOff.includes(dayIndex)
        ? prev.daysOff.filter((d) => d !== dayIndex)
        : [...prev.daysOff, dayIndex],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand-600" />
            {editingShift ? 'تعديل وردية' : 'إضافة وردية جديدة'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="shiftForm" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">اسم الوردية</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="مثال: الوردية الصباحية"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">وقت الحضور</label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">وقت الانصراف</label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                فترة التسامح قبل تسجيل التأخير (بالدقائق)
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.gracePeriodMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, gracePeriodMinutes: Number(e.target.value) })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                عدد الدقائق المسموح بها بعد وقت الحضور قبل اعتبار الموظف متأخراً.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3">أيام العطل الأسبوعية للوردية</label>
              <div className="flex flex-wrap gap-2 text-sm">
                {daysOfWeek.map((day, idx) => {
                  const isSelected = formData.daysOff.includes(idx);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDayOff(idx)}
                      className={`px-4 py-2 rounded-xl font-medium transition ${
                        isSelected
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="mr-3 text-sm font-medium text-slate-700">
                  حالة الوردية (مفعلة / معطلة)
                </span>
              </label>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
          >
            إلغاء
          </button>
          <button
            type="submit"
            form="shiftForm"
            className="px-6 py-2 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
          >
            حفظ الوردية
          </button>
        </div>
      </div>
    </div>
  );
};
