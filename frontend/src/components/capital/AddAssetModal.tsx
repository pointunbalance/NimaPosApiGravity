import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const assetSchema = z.object({
  assetName: z.string().min(1, 'اسم الأصل مطلوب'),
  assetValue: z.number().min(0, 'القيمة يجب أن تكون أكبر من أو تساوي صفر'),
});

type AssetFormData = z.infer<typeof assetSchema>;

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAsset: (name: string, value: string) => void;
}

const AddAssetModal: React.FC<AddAssetModalProps> = ({ isOpen, onClose, onAddAsset }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      assetName: '',
      assetValue: 0,
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        assetName: '',
        assetValue: 0,
      });
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = (data: AssetFormData) => {
    onAddAsset(data.assetName, data.assetValue.toString());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-800">إضافة أصل ثابت</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">اسم الأصل (مثلاً: جهاز لابتوب، ديكور)</label>
            <input 
              type="text" 
              {...register('assetName')}
              className={`w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 bg-white text-slate-800 ${errors.assetName ? 'border-red-500' : 'border-gray-200'}`} 
              autoFocus 
            />
            {errors.assetName && <p className="text-red-500 text-xs mt-1">{errors.assetName.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">القيمة الحالية</label>
            <input 
              type="number" 
              step="any"
              {...register('assetValue', { valueAsNumber: true })}
              onFocus={(e) => e.target.select()} 
              className={`w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 bg-white text-slate-800 ${errors.assetValue ? 'border-red-500' : 'border-gray-200'}`} 
            />
            {errors.assetValue && <p className="text-red-500 text-xs mt-1">{errors.assetValue.message}</p>}
          </div>
          <button type="submit" className="w-full py-2 bg-violet-600 text-white rounded-lg font-bold hover:bg-violet-700 transition-colors">إضافة</button>
        </form>
      </div>
    </div>
  );
};

export default AddAssetModal;
