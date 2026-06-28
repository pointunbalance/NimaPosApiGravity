import React, { useEffect } from 'react';
import { X, Hash, DollarSign, MapPin } from 'lucide-react';
import { FixedAsset } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const assetSchema = z.object({
  name: z.string().min(1, 'اسم الأصل مطلوب'),
  category: z.string().min(1, 'الفئة مطلوبة'),
  serialNumber: z.string().optional(),
  cost: z.coerce.number().min(0, 'التكلفة يجب أن تكون أكبر من أو تساوي صفر'),
  salvageValue: z.coerce.number().min(0, 'قيمة الخردة يجب أن تكون أكبر من أو تساوي صفر'),
  lifeInYears: z.coerce.number().min(1, 'العمر الافتراضي يجب أن يكون سنة واحدة على الأقل'),
  purchaseDate: z.string().min(1, 'تاريخ الشراء مطلوب'),
  location: z.string().optional(),
});

export type AssetFormData = z.infer<typeof assetSchema>;

export interface ExtendedAsset extends FixedAsset {
  category?: string;
  serialNumber?: string;
  location?: string;
}

interface AssetModalProps {
  isOpen: boolean;
  closeModal: () => void;
  editingAsset: ExtendedAsset | null;
  handleSave: (data: AssetFormData) => void;
}

const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  closeModal,
  editingAsset,
  handleSave
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema) as any,
    defaultValues: {
      name: '',
      category: 'equipment',
      serialNumber: '',
      cost: 0,
      salvageValue: 0,
      lifeInYears: 5,
      purchaseDate: new Date().toISOString().split('T')[0],
      location: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (editingAsset) {
        reset({
          name: editingAsset.name,
          category: editingAsset.category || 'equipment',
          serialNumber: editingAsset.serialNumber || '',
          cost: editingAsset.cost,
          salvageValue: editingAsset.salvageValue,
          lifeInYears: editingAsset.lifeInYears,
          purchaseDate: new Date(editingAsset.purchaseDate).toISOString().split('T')[0],
          location: editingAsset.location || ''
        });
      } else {
        reset({
          name: '',
          category: 'equipment',
          serialNumber: '',
          cost: 0,
          salvageValue: 0,
          lifeInYears: 5,
          purchaseDate: new Date().toISOString().split('T')[0],
          location: ''
        });
      }
    }
  }, [isOpen, editingAsset, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-slate-50 rounded-t-3xl">
          <h3 className="font-bold text-xl text-slate-800">{editingAsset ? 'تعديل أصل' : 'إضافة أصل جديد'}</h3>
          <button onClick={closeModal} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-5 h-5 text-gray-500"/></button>
        </div>
        
        <form onSubmit={handleSubmit(handleSave)} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">اسم الأصل</label>
            <input 
              {...register('name')}
              className={`w-full border p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold ${errors.name ? 'border-red-500' : 'border-slate-200'}`} 
              placeholder="مثال: لابتوب Dell XPS" 
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">الفئة</label>
              <select 
                {...register('category')}
                className={`w-full border p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm cursor-pointer ${errors.category ? 'border-red-500' : 'border-slate-200'}`}
              >
                <option value="equipment">معدات</option>
                <option value="electronics">أجهزة إلكترونية</option>
                <option value="furniture">أثاث</option>
                <option value="vehicles">سيارات</option>
                <option value="buildings">مباني</option>
                <option value="tools">أدوات</option>
                <option value="other">أخرى</option>
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">الرقم التسلسلي (اختياري)</label>
              <div className="relative">
                <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  {...register('serialNumber')}
                  className="w-full border border-slate-200 p-3 pr-9 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm" 
                  placeholder="SN-12345" 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">تكلفة الشراء</label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="number" 
                  step="0.01"
                  onFocus={(e) => e.target.select()} 
                  {...register('cost')}
                  className={`w-full border p-3 pr-9 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold ${errors.cost ? 'border-red-500' : 'border-slate-200'}`} 
                  placeholder="0.00" 
                />
              </div>
              {errors.cost && <p className="text-red-500 text-xs mt-1">{errors.cost.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">قيمة الخردة (Salvage)</label>
              <input 
                type="number" 
                step="0.01"
                onFocus={(e) => e.target.select()} 
                {...register('salvageValue')}
                className={`w-full border p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold ${errors.salvageValue ? 'border-red-500' : 'border-slate-200'}`} 
                placeholder="0.00" 
              />
              {errors.salvageValue && <p className="text-red-500 text-xs mt-1">{errors.salvageValue.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">العمر الافتراضي (سنوات)</label>
              <input 
                type="number" 
                onFocus={(e) => e.target.select()} 
                {...register('lifeInYears')}
                className={`w-full border p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold ${errors.lifeInYears ? 'border-red-500' : 'border-slate-200'}`} 
                placeholder="5" 
              />
              {errors.lifeInYears && <p className="text-red-500 text-xs mt-1">{errors.lifeInYears.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">تاريخ الشراء</label>
              <input 
                type="date" 
                {...register('purchaseDate')}
                className={`w-full border p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-600 ${errors.purchaseDate ? 'border-red-500' : 'border-slate-200'}`} 
              />
              {errors.purchaseDate && <p className="text-red-500 text-xs mt-1">{errors.purchaseDate.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">الموقع / الفرع (اختياري)</label>
            <div className="relative">
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                {...register('location')}
                className="w-full border border-slate-200 p-3 pr-9 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="المكتب الرئيسي - الطابق الثاني" 
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-3">
            <button type="button" onClick={closeModal} className="flex-1 py-3 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">إلغاء</button>
            <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors">حفظ الأصل</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetModal;
