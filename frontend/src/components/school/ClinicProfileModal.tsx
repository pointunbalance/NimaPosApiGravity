import React, { useState, useEffect } from 'react';
import { X, HeartPulse, ShieldAlert } from 'lucide-react';
import { db } from '../../db';
import { useToast } from '../../context/ToastContext';

interface ClinicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  initialProfile?: any;
  onSave: () => void;
}

export const ClinicProfileModal: React.FC<ClinicProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  initialProfile,
  onSave
}) => {
  const { success, error: toastError } = useToast();
  const [formData, setFormData] = useState({
    bloodType: '',
    allergies: '',
    chronicDiseases: '',
    vaccines: '',
    emergencyContact: '',
    notes: ''
  });

  useEffect(() => {
    if (initialProfile) {
      setFormData({
        bloodType: initialProfile.bloodType || '',
        allergies: initialProfile.allergies || '',
        chronicDiseases: initialProfile.chronicDiseases || '',
        vaccines: initialProfile.vaccines || '',
        emergencyContact: initialProfile.emergencyContact || '',
        notes: initialProfile.notes || ''
      });
    } else {
      setFormData({
        bloodType: '',
        allergies: '',
        chronicDiseases: '',
        vaccines: '',
        emergencyContact: '',
        notes: ''
      });
    }
  }, [initialProfile, isOpen]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        studentId: student.id,
        bloodType: formData.bloodType,
        allergies: formData.allergies,
        chronicDiseases: formData.chronicDiseases,
        vaccines: formData.vaccines,
        emergencyContact: formData.emergencyContact,
        notes: formData.notes
      };

      if (initialProfile?.id) {
        await db.healthProfiles.update(initialProfile.id, payload);
      } else {
        await db.healthProfiles.add(payload);
      }

      success(`تم حفظ الملف الطبي بنجاح للطالب ${student.name}`);
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      toastError('حدث خطأ أثناء حفظ الملف الطبي');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-rose-900">الملف الطبي الشامل</h2>
              <p className="text-xs text-rose-700 font-bold mt-0.5">للطالب: {student.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-rose-400 hover:bg-rose-100 rounded-full transition-colors outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">فصيلة الدم</label>
              <select
                value={formData.bloodType}
                onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all font-bold text-slate-800"
              >
                <option value="">غير محدد</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">هاتف الاتصال بالطوارئ <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={formData.emergencyContact}
                onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                placeholder="رقم الأب أو الأم"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              الحساسية (أطعمة، أدوية، إلخ)
            </label>
            <input
              type="text"
              value={formData.allergies}
              onChange={(e) => setFormData({...formData, allergies: e.target.value})}
              placeholder="مثال: حساسية الفول السوداني، حساسية البنسلين (اترك فارغاً إن لم يوجد)"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">الأمراض المزمنة أو الحالات الخاصة</label>
            <input
              type="text"
              value={formData.chronicDiseases}
              onChange={(e) => setFormData({...formData, chronicDiseases: e.target.value})}
              placeholder="مثال: ربو خفيف، سكري أطفال (اترك فارغاً إن لم يوجد)"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">حالة التطعيمات واللقاحات</label>
            <input
              type="text"
              value={formData.vaccines}
              onChange={(e) => setFormData({...formData, vaccines: e.target.value})}
              placeholder="مثال: مكتملة حسب العمر، تتبقى جرعة شلل الأطفال"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات طبية وتوصيات خاصة</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              placeholder="مثال: يحتاج لبخاخ الربو عند اللعب الشديد، يرتدي نظارة طبية"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all font-medium resize-none text-sm"
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
              className="px-6 py-2.5 bg-rose-600 font-bold text-white rounded-xl hover:bg-rose-700 transition-colors"
            >
              حفظ الملف الطبي
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
