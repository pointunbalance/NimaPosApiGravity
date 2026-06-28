import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Palette, Printer as PrinterIcon } from 'lucide-react';
import { Category, Printer } from '../../types';
import { iconMap } from '../../utils/categoryIcons';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

const categorySchema = z.object({
  name: z.string().min(1, 'اسم التصنيف مطلوب'),
  color: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  defaultMargin: z.number().optional(),
  targetPrinterId: z.number().nullable().optional()
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormModalProps {
  isModalOpen: boolean;
  closeModal: () => void;
  category: Category | null;
  colors: string[];
  onSave: (data: CategoryFormValues) => Promise<void>;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isModalOpen,
  closeModal,
  category,
  colors,
  onSave,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: category ? {
      ...category
    } : {
      name: '',
      color: '#6366f1',
      icon: 'grid',
      description: '',
      defaultMargin: 0,
      targetPrinterId: null
    }
  });

  const printers = useLiveQuery(() => db.printers.toArray(), []) || [];

  const [iconSearch, setIconSearch] = React.useState('');
  const selectedIcon = watch('icon');
  const selectedColor = watch('color');

  const filteredIcons = React.useMemo(() => {
    return Object.entries(iconMap).filter(([key]) => 
      key.toLowerCase().includes(iconSearch.toLowerCase())
    );
  }, [iconSearch]);

  const onSubmit = async (data: CategoryFormValues) => {
    await onSave(data);
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
          <h3 className="font-black text-2xl text-slate-800">
            {category ? 'تعديل التصنيف' : 'تصنيف جديد'}
          </h3>
          <button onClick={closeModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6"/></button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">اسم التصنيف <span className="text-red-500">*</span></label>
            <input 
              {...register('name')}
              className={`w-full bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-200'} px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none font-bold text-lg transition-all`}
              placeholder="مثال: إلكترونيات، ملابس، مشروبات..." 
              autoFocus
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Icon Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                اختر أيقونة
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">تظهر في نقطة البيع</span>
              </label>
              <input
                type="text"
                placeholder="بحث عن أيقونة..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="text-sm bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-32 sm:w-48"
              />
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 max-h-48 overflow-y-auto p-2 -mx-2 custom-scrollbar">
              {filteredIcons.map(([key, IconComponent]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setValue('icon', key)}
                  className={`aspect-square flex items-center justify-center rounded-2xl border-2 transition-all duration-200 ${
                    selectedIcon === key 
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-600 shadow-md scale-110' 
                    : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-600'
                  }`}
                  title={key}
                >
                  <IconComponent className="w-6 h-6" />
                </button>
              ))}
              {filteredIcons.length === 0 && (
                <div className="col-span-full text-center text-slate-500 text-sm py-4">
                  لم يتم العثور على أيقونات مطابقة
                </div>
              )}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-500" />
              لون التمييز
            </label>
            <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto p-2 -mx-2 custom-scrollbar">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c)}
                  className={`w-10 h-10 shrink-0 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                    selectedColor === c 
                    ? 'border-slate-900 scale-110 shadow-md' 
                    : 'border-transparent hover:scale-110 hover:shadow-sm'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {selectedColor === c && <div className="w-3 h-3 bg-white rounded-full"></div>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">هامش الربح الافتراضي (%) <span className="text-slate-400 font-normal">(اختياري)</span></label>
            <div className="relative">
              <input 
                type="number"
                min="0"
                step="0.1"
                {...register('defaultMargin', { valueAsNumber: true })}
                className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none font-bold text-lg transition-all pr-10" 
                placeholder="مثال: 15" 
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">سيتم استخدامه لاقتراح سعر البيع للمنتجات في هذا التصنيف.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <PrinterIcon className="w-5 h-5 text-indigo-500" />
              طابعة التوجيه (KOT) <span className="text-slate-400 font-normal">(اختياري للمطاعم)</span>
            </label>
            <select
              {...register('targetPrinterId', { 
                setValueAs: v => v === "" ? null : parseInt(v, 10) 
              })}
              className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none font-bold text-lg transition-all"
            >
              <option value="">بدون طابعة محددة</option>
              {printers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">إذا تم تحديدها، سيتم إرسال أوامر تحضير هذه الأصناف للطابعة المحددة.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">وصف <span className="text-slate-400 font-normal">(اختياري)</span></label>
            <textarea 
              {...register('description')}
              className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none resize-none transition-all text-sm font-medium" 
              rows={3}
              placeholder="أضف وصفاً إضافياً للتصنيف..." 
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-3">
            <button 
              type="button" 
              onClick={closeModal}
              className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'جاري الحفظ...' : (category ? 'حفظ التعديلات' : 'إضافة التصنيف')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryFormModal;
