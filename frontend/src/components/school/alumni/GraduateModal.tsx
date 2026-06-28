import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Award } from 'lucide-react';
import { db } from '../../../db';
import { useToast } from '../../../context/ToastContext';

interface GraduateModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onGraduated: () => void;
}

export const GraduateModal: React.FC<GraduateModalProps> = ({
  isOpen,
  onClose,
  student,
  onGraduated
}) => {
  const { success, error: toastError } = useToast();
  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    track: 'عام',
    status: 'مستعد للمرحلة الجامعية'
  });

  useEffect(() => {
    setFormData({
      year: new Date().getFullYear().toString(),
      track: 'عام',
      status: 'مستعد للمرحلة الجامعية'
    });
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Add record to schoolAlumni
      await db.schoolAlumni.add({
        name: student.name,
        year: formData.year,
        track: formData.track,
        status: formData.status
      });

      // 2. Update student status in schoolStudents to 'متخرج'
      await db.schoolStudents.update(student.id, {
        status: 'متخرج'
      });

      success(`تهانينا! تم تخريج الطالب ${student.name} بنجاح وإضافته لشؤون الخريجين.`);
      onGraduated();
      onClose();
    } catch (err) {
      console.error(err);
      toastError('حدث خطأ أثناء إجراء عملية التخريج');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-indigo-900">إجراء حفل وتخريج طالب</h2>
              <p className="text-xs text-indigo-700 font-bold mt-0.5">الطالب: {student.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-indigo-400 hover:bg-indigo-100 rounded-full transition-colors outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-2.5 text-amber-800 text-xs font-bold leading-relaxed">
            <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              سيؤدي هذا الإجراء إلى تغيير حالة الطالب في السجلات النشطة إلى <span className="text-amber-900 font-black">"متخرج"</span> وإنشاء سجل خريج دائم له في لوحة الخريجين.
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">سنة التخرج</label>
            <input
              type="text"
              required
              value={formData.year}
              onChange={(e) => setFormData({...formData, year: e.target.value})}
              placeholder="مثال: 2026"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">المسار أو التخصص</label>
            <select
              value={formData.track}
              onChange={(e) => setFormData({...formData, track: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-slate-800"
            >
              <option value="عام">عام</option>
              <option value="علمي">علمي</option>
              <option value="أدبي">أدبي</option>
              <option value="مونتيسوري">مونتيسوري / طفولة مبكرة</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">الحالة التالية (الجامعة أو العمل)</label>
            <input
              type="text"
              required
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              placeholder="مثال: مقبول بجامعة تارس شفتشينكو"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-medium text-slate-800"
            />
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
              className="px-6 py-2.5 bg-indigo-600 font-bold text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1"
            >
              <GraduationCap className="w-5 h-5" />
              تخريج رسمي
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
