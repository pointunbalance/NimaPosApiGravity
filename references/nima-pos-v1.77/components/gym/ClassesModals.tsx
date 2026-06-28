import React from 'react';
import { X } from 'lucide-react';
import { ClassType, CATEGORIES_OPTIONS, WEEK_DAYS } from './types';

interface ClassesModalsProps {
  isModalOpen: boolean;
  setIsModalOpen: (val: boolean) => void;
  isEdit: boolean;
  classForm: Partial<ClassType>;
  setClassForm: React.Dispatch<React.SetStateAction<Partial<ClassType>>>;
  trainers: any[];
  currency: string;
  onSaveClass: (e: React.FormEvent) => void;
  isTrainerModalOpen: boolean;
  setIsTrainerModalOpen: (val: boolean) => void;
  trainerNameInput: string;
  setTrainerNameInput: (val: string) => void;
  trainerSpecInput: string;
  setTrainerSpecInput: (val: string) => void;
  trainerPhoneInput: string;
  setTrainerPhoneInput: (val: string) => void;
  onQuickAddTrainer: (e: React.FormEvent) => void;
}

export const ClassesModals: React.FC<ClassesModalsProps> = ({
  isModalOpen,
  setIsModalOpen,
  isEdit,
  classForm,
  setClassForm,
  trainers,
  currency,
  onSaveClass,
  isTrainerModalOpen,
  setIsTrainerModalOpen,
  trainerNameInput,
  setTrainerNameInput,
  trainerSpecInput,
  setTrainerSpecInput,
  trainerPhoneInput,
  setTrainerPhoneInput,
  onQuickAddTrainer,
}) => {
  return (
    <>
      {/* Class Addition/Edition Dialog Modal Box */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" dir="rtl">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-150 flex justify-between items-center bg-slate-50/50 flex-row-reverse">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 flex-row-reverse">
                <span className="p-1 px-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black">
                  {isEdit ? 'تعديل وثيقة الحصة' : 'جدولة حصة جديدة'}
                </span>
                <h2 className="text-base font-black text-slate-800">
                  {isEdit ? 'تعديل إعدادات وتواقيت الحصة الجماعية' : 'إدراج وجدولة تمرين رياضي جماعي جديد'}
                </h2>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={onSaveClass} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-right">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">اسم الحصة / السجل الرياضي المجدول *</label>
                  <input 
                    type="text" 
                    value={classForm.name || ''}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                    required
                    placeholder="مثال: فتنس وحرق دهون متكامل"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">تصنيف ونوع النشاط الجماعي *</label>
                  <select
                    value={classForm.category || 'كارديو ولياقة بدنية'}
                    onChange={(e) => setClassForm({ ...classForm, category: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-xs font-bold bg-white"
                  >
                    {CATEGORIES_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Trainer Selector */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => setIsTrainerModalOpen(true)}
                    className="text-[10px] text-indigo-600 font-black hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>➕ إضافة مدرب غير متاح بالقائمة وتغذيته للخيارات</span>
                  </button>
                  <label className="block text-xs font-black text-indigo-700">حجز وتعيين المدرب المشرف المسؤول *</label>
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {trainers.length === 0 ? (
                    <div className="space-y-2">
                      <p className="text-[10px] text-amber-700 font-bold">⚠️ لا يوجد مدربين بسجل المؤسسة. يرجى كتابة اسم المدرب المؤقت أدناه:</p>
                      <input 
                        type="text"
                        value={classForm.trainerId || ''}
                        onChange={(e) => setClassForm({ ...classForm, trainerId: e.target.value })}
                        placeholder="الكابتن تاراس كوزا"
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  ) : (
                    <select
                      value={classForm.trainerId || ''}
                      onChange={(e) => setClassForm({ ...classForm, trainerId: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none"
                    >
                      <option value="">-- اختر من المدربين المتاحين بسجلات النادي --</option>
                      {trainers.map((t: any) => (
                        <option key={t.id} value={t.name}>{t.name} ({t.specialization || 'لياقة'})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Capacity settings & Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">السعة الاستيعابية القصوى *</label>
                  <input 
                    type="number" 
                    value={classForm.capacity ?? 20}
                    onChange={(e) => setClassForm({ ...classForm, capacity: Number(e.target.value) })}
                    required
                    min={1}
                    max={100}
                    placeholder="20"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:outline-none text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">قاعة التمرين / الصالة المخصصة</label>
                  <input 
                    type="text" 
                    value={classForm.room || ''}
                    onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                    placeholder="مثال: القاعة الزرقاء B"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">رسوم الحجز لحضور الحصة ({currency})</label>
                  <input 
                    type="number" 
                    value={classForm.price ?? 0}
                    onChange={(e) => setClassForm({ ...classForm, price: Number(e.target.value) })}
                    min={0}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:outline-none text-xs font-mono text-amber-600 font-black"
                  />
                  <span className="text-[9px] text-slate-400 block mt-1">اتركه صفر لتكون مشمولة لكل الأعضاء تلقائياً.</span>
                </div>
              </div>

              {/* Schedule Days Matrix */}
              <div className="bg-indigo-50/20 p-4 rounded-2xl border border-indigo-100/40 space-y-3">
                <span className="text-xs font-black text-indigo-700 block">⚙️ تحديد أيام التمرين بالأسبوع وساعة الانعقاد:</span>
                
                <div className="flex flex-wrap gap-2 flex-row-reverse justify-start">
                  {WEEK_DAYS.map(day => {
                    const isSelected = classForm.days?.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => {
                          const currentDays = classForm.days || [];
                          if (currentDays.includes(day)) {
                            setClassForm({ ...classForm, days: currentDays.filter(d => d !== day) });
                          } else {
                            setClassForm({ ...classForm, days: [...currentDays, day] });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1.5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">وقت بدء تفعيل الحصة *</label>
                    <input 
                      type="time"
                      value={classForm.time || '17:00'}
                      onChange={(e) => setClassForm({ ...classForm, time: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">الحالة الهيكلية للحصة</label>
                    <select
                      value={classForm.status || 'نشطة'}
                      onChange={(e) => setClassForm({ ...classForm, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    >
                      <option value="نشطة">🟢 نشطة ومجدولة بانتظام</option>
                      <option value="معلقة">🔴 معلقة حالياً ومخفية لظرف طارئ</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-5 border-t border-slate-150">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold text-xs cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-extrabold text-xs shadow-md shadow-indigo-100 cursor-pointer"
                >
                  {isEdit ? 'حفظ وتعديل 💾' : 'إنشاء وجدولة رسمية 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Trainer nesting modal dialogue */}
      {isTrainerModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-150 flex justify-between items-center bg-slate-50/50 flex-row-reverse">
              <button 
                type="button" 
                onClick={() => setIsTrainerModalOpen(false)}
                className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
              >
                ✕
              </button>
              <h3 className="font-extrabold text-slate-800 text-xs">👤 إضافة مدرب جديد على الطاير</h3>
            </div>

            <form onSubmit={onQuickAddTrainer} className="p-5 space-y-4 text-right">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 mb-1">اسم الكابتن/المدرب بالكامل *</label>
                <input 
                  type="text" 
                  value={trainerNameInput}
                  onChange={(e) => setTrainerNameInput(e.target.value)}
                  placeholder="مثال: الكابتن أندراش شيفتشينكو"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 mb-1">تخصص التدريب الأساسي</label>
                <input 
                  type="text" 
                  value={trainerSpecInput}
                  onChange={(e) => setTrainerSpecInput(e.target.value)}
                  placeholder="مثال: يوجا ولياقة كارديو"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 mb-1 font-sans">رقم جوال المدرب</label>
                <input 
                  type="text" 
                  value={trainerPhoneInput}
                  onChange={(e) => setTrainerPhoneInput(e.target.value)}
                  placeholder="380xxxxxxxxxx"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-left"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTrainerModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm cursor-pointer"
                >
                  حفظ وتسجيل بقاعدة النادي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
