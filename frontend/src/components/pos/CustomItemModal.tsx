import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const customItemSchema = z.object({
    name: z.string().min(1, 'الاسم مطلوب'),
    price: z.coerce.number().min(0.01, 'السعر يجب أن يكون أكبر من صفر'),
});

type CustomItemFormData = z.infer<typeof customItemSchema>;

interface CustomItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    addCustomItem: (data: { name: string; price: number }) => void;
}

export const CustomItemModal: React.FC<CustomItemModalProps> = ({
    isOpen, onClose, addCustomItem
}) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomItemFormData>({
        resolver: zodResolver(customItemSchema) as any,
        defaultValues: { name: 'منتج مخصص', price: undefined }
    });

    useEffect(() => {
        if (isOpen) {
            reset({ name: 'منتج مخصص', price: undefined });
        }
    }, [isOpen, reset]);

    const onSubmit = (data: CustomItemFormData) => {
        addCustomItem(data);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="font-bold text-xl mb-4 text-center text-gray-800">إضافة منتج مخصص</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <input 
                            type="text" 
                            {...register('name')}
                            className={`w-full border p-3 rounded-xl outline-none transition-colors ${errors.name ? 'border-red-500 focus:border-red-500' : 'focus:border-indigo-500'}`} 
                            placeholder="اسم المنتج" 
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                        <input 
                            type="number" 
                            step="0.01"
                            {...register('price', { valueAsNumber: true })}
                            onFocus={(e) => e.target.select()} 
                            className={`w-full border p-3 rounded-xl outline-none transition-colors ${errors.price ? 'border-red-500 focus:border-red-500' : 'focus:border-indigo-500'}`} 
                            placeholder="السعر" 
                            autoFocus 
                        />
                        {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">إلغاء</button>
                        <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">إضافة</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
