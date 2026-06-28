import React from 'react';
import { Layers, X, DollarSign, Users, Calendar, AlertCircle } from 'lucide-react';

interface FeeType {
  id?: number;
  name: string;
  type: 'tuition' | 'transport' | 'books' | 'activities';
  amount: number;
  isActive: number;
}

interface StudentSubscription {
  id?: number;
  studentId: number;
  feeTypeId: number;
  totalRequired: number;
  totalPaid: number;
  remainingAmount: number;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid';
  notes?: string;
}

interface SchoolFeeTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode: boolean;
  formData: Partial<FeeType>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<FeeType>>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const SchoolFeeTypeModal: React.FC<SchoolFeeTypeModalProps> = ({
  isOpen,
  onClose,
  isEditMode,
  formData,
  setFormData,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/55">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>{isEditMode ? 'تعديل باقة رسوم' : 'إضافة نوع رسوم جديد'}</span>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم باقة الرسوم</label>
            <input 
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: الرسوم الدراسية للفصل الأول"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition font-semibold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">فئة الرسوم</label>
              <select
                value={formData.type || 'tuition'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-bold"
              >
                <option value="tuition">رسوم الدراسة والتعليم</option>
                <option value="transport">خدمات النقل والمواصلات</option>
                <option value="books">حقيبة الكتب والقرطاسية</option>
                <option value="activities">أنشطة لا منهجية وخدمات أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">المبلغ المحدد (ج.م)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="number"
                  required
                  min="1"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition font-black text-slate-800"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">الحالة الافتراضية</label>
            <select
              value={formData.isActive ?? 1}
              onChange={(e) => setFormData({ ...formData, isActive: Number(e.target.value) })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-bold"
            >
              <option value={1}>نشطة ومتاحة للاشتراك</option>
              <option value={0}>متوقفة مؤقتاً</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-200 font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 font-bold text-white rounded-xl hover:bg-indigo-700 transition"
            >
              حفظ البيانات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SchoolAssignFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: any[];
  feeTypes: any[];
  formData: Partial<StudentSubscription>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<StudentSubscription>>>;
  getFeeTypePrice: (id: number) => number;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const SchoolAssignFeeModal: React.FC<SchoolAssignFeeModalProps> = ({
  isOpen,
  onClose,
  students,
  feeTypes,
  formData,
  setFormData,
  getFeeTypePrice,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/55">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>إسناد رسوم دراسية لطالب جديد</span>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">اختر الطالب المستحق</label>
            <select
              required
              value={formData.studentId || ''}
              onChange={(e) => setFormData({ ...formData, studentId: Number(e.target.value) })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-bold"
            >
              <option value="">اختر طالب...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code || s.id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">باقة الرسوم المطلوبة</label>
            <select
              required
              value={formData.feeTypeId || ''}
              onChange={(e) => {
                const fId = Number(e.target.value);
                const defaultPrice = getFeeTypePrice(fId);
                setFormData({ 
                  ...formData, 
                  feeTypeId: fId,
                  totalRequired: defaultPrice
                });
              }}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-bold"
            >
              <option value="">اختر باقة رسوم...</option>
              {feeTypes.filter(f => f.isActive === 1).map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.amount} ج.م)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">المبلغ المستحق (ج.م)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="number"
                  required
                  min="1"
                  value={formData.totalRequired || ''}
                  onChange={(e) => setFormData({ ...formData, totalRequired: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition font-black text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 font-mono">تاريخ الاستحقاق</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="date"
                  required
                  value={formData.dueDate || ''}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">ملاحظات / غرض الرسوم</label>
            <textarea 
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="ملاحظات توضيحية حول الاستحقاق أو الخصم..."
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition font-semibold text-slate-800"
            />
          </div>

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 font-bold leading-normal">
              بمجرد الضغط على تأكيد وإسناد، سيقوم النظام تلقائياً بتوليد قيد استحقاق مالي مزدوج يثبت مديونية الطالب في الذمم المدينة (المجموعة 1030) ويثبت الإيراد المالي في حساب الإيرادات التشغيلية للتعليم (الرمز 4010).
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-200 font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 font-bold text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/15"
            >
              تأكيد وإسناد الرسوم
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
