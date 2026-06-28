import React, { useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TrainingEnrollment, User } from '../../../types';

const enrollmentSchema = z.object({
  employeeId: z.number().min(1, 'الموظف مطلوب'),
  status: z.enum(['enrolled', 'in_progress', 'completed', 'failed']).default('enrolled'),
  progress: z.number().min(0).max(100).default(0),
  notes: z.string().optional()
});

type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment: TrainingEnrollment | null;
  users: User[];
  onSubmit: (data: Partial<TrainingEnrollment>) => Promise<void>;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({ isOpen, onClose, enrollment, users, onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentSchema) as any,
    defaultValues: {
      employeeId: 0,
      status: 'enrolled',
      progress: 0,
      notes: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (enrollment) {
        reset({
          employeeId: enrollment.employeeId,
          status: enrollment.status,
          progress: enrollment.progress,
          notes: enrollment.notes || ''
        });
      } else {
        reset({
          employeeId: 0,
          status: 'enrolled',
          progress: 0,
          notes: ''
        });
      }
    }
  }, [isOpen, enrollment, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: EnrollmentFormValues) => {
    await onSubmit({
      ...data,
      enrollmentDate: enrollment?.enrollmentDate || new Date()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {enrollment ? 'تعديل تسجيل' : 'تسجيل موظف جديد'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الموظف <span className="text-red-500">*</span>
            </label>
            <select
              {...register('employeeId', { valueAsNumber: true })}
              disabled={!!enrollment}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <option value={0} disabled>اختر الموظف</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الحالة
            </label>
            <select
              {...register('status')}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="enrolled">مسجل</option>
              <option value="in_progress">قيد التقدم</option>
              <option value="completed">مكتمل</option>
              <option value="failed">لم يجتز</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              نسبة التقدم (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              {...register('progress', { valueAsNumber: true })}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
            />
            {errors.progress && <p className="text-red-500 text-xs mt-1">{errors.progress.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>حفظ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
