import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const quickCustomerSchema = z.object({
    name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    phone: z.string().min(8, 'رقم الهاتف يجب أن يكون 8 أرقام على الأقل'),
});

type QuickCustomerFormData = z.infer<typeof quickCustomerSchema>;

interface QuickCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    handleQuickCustomerAdd: (data: { name: string; phone: string }) => void;
}

export const QuickCustomerModal: React.FC<QuickCustomerModalProps> = ({
    isOpen, onClose, handleQuickCustomerAdd
}) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<QuickCustomerFormData>({
        resolver: zodResolver(quickCustomerSchema),
        defaultValues: { name: '', phone: '' }
    });

    useEffect(() => {
        if (isOpen) {
            reset({ name: '', phone: '' });
        }
    }, [isOpen, reset]);

    const onSubmit = (data: QuickCustomerFormData) => {
        handleQuickCustomerAdd(data);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="font-bold text-xl mb-4 text-center text-gray-800">إضافة عميل سريع</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <input 
                            type="text" 
                            {...register('name')}
                            className={`w-full border p-3 rounded-xl outline-none transition-colors ${errors.name ? 'border-red-500 focus:border-red-500' : 'focus:border-indigo-500'}`} 
                            placeholder="اسم العميل" 
                            autoFocus 
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                        <input 
                            type="text" 
                            {...register('phone')}
                            className={`w-full border p-3 rounded-xl outline-none transition-colors ${errors.phone ? 'border-red-500 focus:border-red-500' : 'focus:border-indigo-500'}`} 
                            placeholder="رقم الهاتف" 
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
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
