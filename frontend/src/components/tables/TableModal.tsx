import React, { useEffect } from 'react';
import { Table as TableType } from '../../types';
import { X, Armchair, Loader2, HelpCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const tableSchema = z.object({
  name: z.string().min(1, 'اسم / رقم الطاولة مطلوب'),
  zone: z.string().min(1, 'المنطقة مطلوبة'),
  seats: z.number().min(1, 'يجب أن يكون هناك مقعد واحد على الأقل'),
  status: z.enum(['available', 'occupied', 'reserved', 'requesting_bill']).optional(),
  shape: z.enum(['circle', 'square', 'rectangle']).optional(),
});

export type TableFormData = z.infer<typeof tableSchema>;

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTable: TableType | null;
  onSave: (data: TableFormData) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  suggestedName?: string;
}

const TableModal: React.FC<TableModalProps> = ({
  isOpen,
  onClose,
  editingTable,
  onSave,
  onDelete,
  suggestedName
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<TableFormData>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      name: '',
      zone: 'الصالة الرئيسية',
      seats: 4,
      status: 'available',
      shape: 'square'
    }
  });

  const seats = watch('seats');
  const selectedZone = watch('zone');
  const selectedShape = watch('shape') || 'square';

  useEffect(() => {
    if (isOpen) {
      if (editingTable) {
        reset({
          name: editingTable.name,
          zone: editingTable.zone || 'الصالة الرئيسية',
          seats: editingTable.seats || 4,
          status: editingTable.status || 'available',
          shape: editingTable.shape || 'square'
        });
      } else {
        reset({
          name: suggestedName || '',
          zone: 'الصالة الرئيسية',
          seats: 4,
          status: 'available',
          shape: 'square'
        });
      }
    }
  }, [isOpen, editingTable, reset, suggestedName]);

  if (!isOpen) return null;

  const onSubmitForm = async (data: TableFormData) => {
    await onSave(data);
  };

  const zoneChips = [
    { value: 'الصالة الرئيسية', label: 'الصالة الرئيسية' },
    { value: 'القسم العائلي', label: 'القسم العائلي' },
    { value: 'الحديقة الخارجية', label: 'الحديقة الخارجية' },
    { value: 'جناح VIP', label: 'جناح VIP' }
  ];

  const shapeOptions = [
    { value: 'square', label: 'مربعة' },
    { value: 'circle', label: 'دائرية' },
    { value: 'rectangle', label: 'مستطيلة' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-7 border border-slate-100 animate-in zoom-in-95 duration-200 text-right font-[Tajawal]" dir="rtl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h3 className="text-xl font-black text-slate-850">
            {editingTable ? 'تعديل بيانات الطاولة' : 'إضافة طاولة جديدة'}
          </h3>
          <button 
            onClick={onClose} 
            disabled={isSubmitting} 
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
            {/* Table Name */}
            <div>
                <label className="block text-xs font-extrabold text-slate-600 mb-2">اسم / رقم الطاولة <span className="text-red-500">*</span></label>
                <input 
                    type="text" 
                    {...register('name')}
                    className={`w-full px-5 py-3.5 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none font-bold text-center text-sm transition-all ${errors.name ? 'border-red-500' : 'border-slate-200'}`}
                    placeholder="رقم أو رمز الطاولة (مثلاً: 13)"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Quick Select Region / Zone Selector */}
            <div>
                <label className="block text-xs font-extrabold text-slate-600 mb-2">المنطقة والمرافق (Zone) <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {zoneChips.map((chip) => {
                    const isSelected = selectedZone === chip.value;
                    return (
                      <button
                        key={chip.value}
                        type="button"
                        onClick={() => setValue('zone', chip.value, { shouldValidate: true })}
                        className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border text-center ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-650 shadow-md shadow-indigo-100/30'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
                
                {/* Custom input below */}
                <div className="mt-3">
                  <input
                    type="text"
                    {...register('zone')}
                    placeholder="أو اكتب منطقة مخصصة هنا..."
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-right transition-all ${
                      errors.zone ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.zone && <p className="text-red-500 text-xs mt-1">{errors.zone.message}</p>}
            </div>

            {/* Capacity Controls */}
            <div>
              <label className="block text-xs font-extrabold text-slate-600 mb-2">عدد مقاعد الطاولة (Capacity)</label>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-150 p-3 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setValue('seats', Math.min(20, seats + 1), { shouldValidate: true })}
                  className="w-12 h-12 bg-white hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-200 flex items-center justify-center text-xl font-bold shadow-sm active:scale-95 transition-all select-none"
                >
                  +
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-850 leading-tight font-mono">{seats}</span>
                  <span className="text-[10px] text-slate-400 font-bold mt-0.5">مقاعد مرافقة</span>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('seats', Math.max(1, seats - 1), { shouldValidate: true })}
                  className="w-12 h-12 bg-white hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-200 flex items-center justify-center text-xl font-bold shadow-sm active:scale-95 transition-all select-none"
                >
                  -
                </button>
              </div>
              {errors.seats && <p className="text-red-500 text-xs mt-1">{errors.seats.message}</p>}
            </div>

            {/* Table Shape Selection */}
            <div>
              <label className="block text-xs font-extrabold text-slate-600 mb-2">شكل الطاولة الهندسي (مستندات الخريطة)</label>
              <div className="grid grid-cols-3 gap-2.5">
                {shapeOptions.map((opt) => {
                  const isSelected = selectedShape === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue('shape', opt.value as any, { shouldValidate: true })}
                      className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm'
                          : 'bg-white border-slate-150 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-center h-6">
                        {opt.value === 'square' && <div className={`w-5 h-5 rounded border-2 ${isSelected ? 'border-indigo-600 bg-indigo-500/10' : 'border-slate-400 bg-slate-100'}`} />}
                        {opt.value === 'circle' && <div className={`w-5 h-5 rounded-full border-2 ${isSelected ? 'border-indigo-600 bg-indigo-500/10' : 'border-slate-400 bg-slate-100'}`} />}
                        {opt.value === 'rectangle' && <div className={`w-7 h-4 rounded border-2 ${isSelected ? 'border-indigo-600 bg-indigo-500/10' : 'border-slate-400 bg-slate-100'}`} />}
                      </div>
                      <span className="text-[10px] font-black">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex gap-3 border-t border-slate-100 mt-6">
                <button 
                  type="button" 
                  onClick={onClose} 
                  disabled={isSubmitting} 
                  className="flex-1 py-3.5 border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 disabled:opacity-50 text-sm transition-all"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 py-3.5 bg-indigo-600 text-white font-extrabold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 text-sm transition-all hover:scale-[1.01] active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ التغييرات'}
                </button>
            </div>
            
            {editingTable && onDelete && (
                <button 
                    type="button" 
                    onClick={() => onDelete(editingTable.id!)}
                    disabled={isSubmitting}
                    className="w-full py-3 mt-2 text-red-500 font-bold text-xs hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                >
                    حذف الطاولة نهائياً
                </button>
            )}
        </form>
      </div>
    </div>
  );
};

export default TableModal;
