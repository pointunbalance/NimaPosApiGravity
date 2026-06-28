import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { db } from '../../db';

interface VoidItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, managerId?: number, managerName?: string) => Promise<void>;
    itemName: string;
}

export const VoidItemModal: React.FC<VoidItemModalProps> = ({ isOpen, onClose, onConfirm, itemName }) => {
    const currentUserData = localStorage.getItem('nima_user');
    const user = currentUserData ? JSON.parse(currentUserData) : null;

    const [reason, setReason] = useState('');
    const [pin, setPin] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const predefinedReasons = [
        "إلغاء من العميل",
        "خطأ في الإدخال",
        "نفاد الكمية",
        "تأخير من المطبخ",
        "أخرى"
    ];

    const handleConfirm = async () => {
        if (!reason) {
            setErrorMsg('يجب إدخال سبب الإلغاء');
            return;
        }

        setIsSubmitting(true);
        setErrorMsg('');

        try {
            let managerId = undefined;
            let managerName = undefined;

            // If the current user isn't an admin/manager, require a manager PIN
            const isManager = user?.role === 'admin' || user?.role === 'manager';
            
            if (!isManager) {
                if (!pin) {
                    setErrorMsg('مطلوب رمز مرور المدير (PIN) لإلغاء الطلب');
                    setIsSubmitting(false);
                    return;
                }
                
                const managerUser = await db.users.get({ pin: pin });
                if (!managerUser || (managerUser.role !== 'admin' && managerUser.role !== 'manager')) {
                    setErrorMsg('رمز المرور غير صحيح أو غير مصرح له');
                    setIsSubmitting(false);
                    return;
                }
                
                managerId = managerUser.id;
                managerName = managerUser.name;
            }

            await onConfirm(reason, managerId, managerName);
            
            // reset state
            setReason('');
            setPin('');
            setErrorMsg('');
            onClose();
        } catch (err) {
            console.error(err);
            setErrorMsg('حدث خطأ أثناء إلغاء الصنف');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col" style={{ direction: 'rtl' }}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-red-50 text-red-900">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">إلغاء صنف: {itemName}</h2>
                            <p className="text-xs opacity-70">يتطلب صلاحية مدير</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    {errorMsg && (
                        <div className="p-3 bg-red-100 text-red-700 text-sm font-bold rounded-lg mb-4 text-center">
                            {errorMsg}
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">سبب الإلغاء</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {predefinedReasons.map(r => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setReason(r)}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${reason === r ? 'bg-red-50 text-red-700 border-red-200 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold placeholder:font-normal"
                            placeholder="سبب آخر..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    {!(user?.role === 'admin' || user?.role === 'manager') && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">رمز مرور المدير (PIN)</label>
                            <input 
                                type="password" 
                                inputMode="numeric"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold tracking-widest text-center text-xl"
                                placeholder={"* * * *"}
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        تراجع
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        تأكيد الإلغاء
                    </button>
                </div>
            </div>
        </div>
    );
};
