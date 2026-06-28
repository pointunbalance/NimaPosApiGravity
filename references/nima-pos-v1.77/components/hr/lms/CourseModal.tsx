import React, { useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TrainingCourse } from '../../../types';

const courseSchema = z.object({
  title: z.string().min(1, 'عنوان الدورة مطلوب'),
  description: z.string().optional(),
  instructor: z.string().optional(),
  startDate: z.string().min(1, 'تاريخ البداية مطلوب'),
  endDate: z.string().min(1, 'تاريخ النهاية مطلوب'),
  status: z.enum(['upcoming', 'ongoing', 'completed']).default('upcoming'),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: TrainingCourse | null;
  onSubmit: (data: Partial<TrainingCourse>) => Promise<void>;
}

export const CourseModal: React.FC<CourseModalProps> = ({ isOpen, onClose, course, onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      instructor: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      status: 'upcoming'
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (course) {
        reset({
          title: course.title,
          description: course.description || '',
          instructor: course.instructor || '',
          startDate: new Date(course.startDate).toISOString().split('T')[0],
          endDate: new Date(course.endDate).toISOString().split('T')[0],
          status: course.status
        });
      } else {
        reset({
          title: '',
          description: '',
          instructor: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          status: 'upcoming'
        });
      }
    }
  }, [isOpen, course, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: CourseFormValues) => {
    await onSubmit({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {course ? 'تعديل دورة تدريبية' : 'إضافة دورة جديدة'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              عنوان الدورة <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الوصف
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              المدرب
            </label>
            <input
              {...register('instructor')}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ البداية <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ النهاية <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
              {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الحالة
            </label>
            <select
              {...register('status')}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="upcoming">قادمة</option>
              <option value="ongoing">جارية</option>
              <option value="completed">مكتملة</option>
            </select>
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
