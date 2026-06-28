import React, { useEffect } from 'react';
import { User } from '../../types';
import { CircleUser, X, Banknote, FileText, Save, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const employeeSchema = z.object({
  name: z.string().min(1, 'الاسم الكامل مطلوب'),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('البريد الإلكتروني غير صالح').optional().or(z.literal('')),
  address: z.string().optional(),
  baseSalary: z.number().min(0, 'الراتب يجب أن يكون 0 أو أكثر').optional(),
  paymentMethod: z.enum(['cash', 'bank']).optional(),
  bankAccount: z.string().optional(),
  startDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  notes: z.string().optional(),
  pin: z.string().optional(),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
  workShiftId: z.number().optional().nullable(),
  shiftStartTime: z.string().optional(),
  shiftEndTime: z.string().optional(),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: User | null;
  onSave: (data: EmployeeFormData) => Promise<void>;
  workShifts?: import('../../types').WorkShift[];
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  editingUser,
  onSave,
  workShifts = []
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      jobTitle: '',
      phone: '',
      email: '',
      address: '',
      baseSalary: 0,
      paymentMethod: 'cash',
      bankAccount: '',
      startDate: '',
      contractEndDate: '',
      notes: '',
      pin: '',
      role: 'cashier',
      isActive: true,
    }
  });

  const paymentMethod = watch('paymentMethod');
  const pin = watch('pin');

  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        reset({
          name: editingUser.name,
          jobTitle: editingUser.jobTitle || '',
          phone: editingUser.phone || '',
          email: editingUser.email || '',
          address: editingUser.address || '',
          baseSalary: editingUser.baseSalary || 0,
          paymentMethod: editingUser.paymentMethod || 'cash',
          bankAccount: editingUser.bankAccount || '',
          startDate: editingUser.startDate ? new Date(editingUser.startDate).toISOString().split('T')[0] : '',
          contractEndDate: editingUser.contractEndDate ? new Date(editingUser.contractEndDate).toISOString().split('T')[0] : '',
          notes: editingUser.notes || '',
          pin: editingUser.pin || '',
          role: editingUser.role || 'cashier',
          isActive: editingUser.isActive ?? true,
          workShiftId: editingUser.workShiftId || null,
        });
      } else {
        reset({
          name: '',
          jobTitle: '',
          phone: '',
          email: '',
          address: '',
          baseSalary: 0,
          paymentMethod: 'cash',
          bankAccount: '',
          startDate: '',
          contractEndDate: '',
          notes: '',
          pin: Math.floor(1000 + Math.random() * 9000).toString(),
          role: 'cashier',
          isActive: true,
          workShiftId: null,
        });
      }
    }
  }, [isOpen, editingUser, reset]);

  if (!isOpen) return null;

  const onSubmitForm = async (data: EmployeeFormData) => {
    await onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CircleUser className="w-6 h-6 text-brand-600" />
            {editingUser ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="employee-form" onSubmit={handleSubmit(onSubmitForm)} className="space-y-8">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                <CircleUser className="w-5 h-5 text-slate-400" />
                المعلومات الأساسية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الكامل <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    {...register('name')}
                    className={`w-full bg-slate-50 border p-2.5 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none ${errors.name ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المسمى الوظيفي</label>
                  <input 
                    type="text" 
                    {...register('jobTitle')}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                  <input 
                    type="tel" 
                    dir="ltr"
                    {...register('phone')}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-left"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    dir="ltr"
                    {...register('email')}
                    className={`w-full bg-slate-50 border p-2.5 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-left ${errors.email ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">العنوان</label>
                  <input 
                    type="text" 
                    {...register('address')}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* HR & Payroll */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                <Banknote className="w-5 h-5 text-slate-400" />
                الرواتب والعقود
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الراتب الأساسي</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      {...register('baseSalary')}
                      className={`w-full bg-slate-50 border p-2.5 pl-12 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none ${errors.baseSalary ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">د.ع</span>
                  </div>
                  {errors.baseSalary && <p className="text-red-500 text-xs mt-1">{errors.baseSalary.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">طريقة الدفع</label>
                  <select 
                    {...register('paymentMethod')}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="cash">نقدي (Cash)</option>
                    <option value="bank">تحويل بنكي (Bank Transfer)</option>
                  </select>
                </div>
                {paymentMethod === 'bank' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">رقم الحساب البنكي / IBAN</label>
                    <input 
                      type="text" 
                      dir="ltr"
                      {...register('bankAccount')}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-left"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ المباشرة</label>
                  <input 
                    type="date" 
                    {...register('startDate')}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ انتهاء العقد</label>
                  <input 
                    type="date" 
                    {...register('contractEndDate')}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">وردية العمل</label>
                  <select 
                    {...register('workShiftId', { setValueAs: v => v ? Number(v) : null })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="">بدون وردية محددة</option>
                    {workShifts.map(ws => (
                      <option key={ws.id} value={ws.id}>{ws.name} ({ws.startTime} - {ws.endTime})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">وقت بدء العمل (اختياري)</label>
                  <input 
                    type="time" 
                    {...register('shiftStartTime')}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">وقت نهاية العمل (اختياري)</label>
                  <input 
                    type="time" 
                    {...register('shiftEndTime')}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* System Access */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                <FileText className="w-5 h-5 text-slate-400" />
                ملاحظات إضافية
              </h3>
              <textarea 
                rows={3}
                {...register('notes')}
                placeholder="أي ملاحظات إضافية حول الموظف..."
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none"
              />
              
              {!editingUser && (
                <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-xl text-sm flex items-start gap-3 border border-blue-100">
                  <CircleUser className="w-5 h-5 shrink-0 text-blue-500" />
                  <div>
                    <p className="font-bold mb-1">معلومات الدخول للنظام</p>
                    <p>تم إنشاء رمز دخول (PIN) افتراضي لهذا الموظف: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-blue-200">{pin}</strong></p>
                    <p className="text-blue-600 mt-1">يمكن تعديل الصلاحيات ورمز الدخول لاحقاً من قسم "المستخدمين والصلاحيات".</p>
                  </div>
                </div>
              )}
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose} 
            disabled={isSubmitting}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-white transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>
          <button 
            type="submit"
            form="employee-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ بيانات الموظف'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeModal;
