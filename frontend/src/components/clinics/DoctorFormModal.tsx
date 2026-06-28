import React, { useState, useEffect } from 'react';
import { X, User, Phone, Check, Briefcase, Mail, DollarSign, Clock, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DoctorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (doctor: any) => Promise<void>;
    initialData?: any;
}

const DAYS_OF_WEEK = [
    { id: 0, name: 'الأحد' },
    { id: 1, name: 'الإثنين' },
    { id: 2, name: 'الثلاثاء' },
    { id: 3, name: 'الأربعاء' },
    { id: 4, name: 'الخميس' },
    { id: 5, name: 'الجمعة' },
    { id: 6, name: 'السبت' },
];

export const DoctorFormModal: React.FC<DoctorFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData
}) => {
    const [name, setName] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [consultationFee, setConsultationFee] = useState('');
    const [workingHours, setWorkingHours] = useState<{dayOfWeek: number, startTime: string, endTime: string}[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setSpecialization(initialData.specialization || '');
            setPhone(initialData.phone || '');
            setEmail(initialData.email || '');
            setConsultationFee(initialData.consultationFee?.toString() || '');
            setWorkingHours(initialData.workingHours || []);
        } else {
            setName('');
            setSpecialization('');
            setPhone('');
            setEmail('');
            setConsultationFee('');
            setWorkingHours([]);
        }
    }, [initialData, isOpen]);

    const handleAddWorkingHour = () => {
        setWorkingHours([...workingHours, { dayOfWeek: 0, startTime: '09:00', endTime: '17:00' }]);
    };

    const handleRemoveWorkingHour = (index: number) => {
        setWorkingHours(workingHours.filter((_, i) => i !== index));
    };

    const handleWorkingHourChange = (index: number, field: string, value: string | number) => {
        const newHours = [...workingHours];
        newHours[index] = { ...newHours[index], [field]: value };
        setWorkingHours(newHours);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !specialization || !phone || !consultationFee) return;

        setIsSubmitting(true);
        try {
            await onSave({
                ...(initialData?.id ? { id: initialData.id } : {}),
                name,
                specialization,
                phone,
                email,
                consultationFee: Number(consultationFee),
                workingHours
            });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 my-8"
                >
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {initialData ? 'تعديل بيانات طبيب' : 'إضافة طبيب جديد'}
                                </h2>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">سجل بيانات الطبيب وتخصصه ومواعيد العمل</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">البيانات الأساسية</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <User className="w-4 h-4 text-slate-400" />
                                        اسم الطبيب
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-slate-400" />
                                        التخصص
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={specialization}
                                        onChange={e => setSpecialization(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        رقم الهاتف
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium text-left"
                                        dir="ltr"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-slate-400" />
                                        قيمة الكشف (ج.م)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={consultationFee}
                                        onChange={e => setConsultationFee(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    البريد الإلكتروني (اختياري)
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium text-left"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-brand-500" />
                                    مواعيد العمل
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleAddWorkingHour}
                                    className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                    إضافة موعد
                                </button>
                            </div>
                            
                            {workingHours.length === 0 ? (
                                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-sm text-slate-500 font-medium">لم يتم إضافة مواعيد عمل للطبيب. انقر على "إضافة موعد" للبدء.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {workingHours.map((hour, index) => (
                                        <div key={index} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            <div className="flex-1 min-w-[120px]">
                                                <select
                                                    value={hour.dayOfWeek}
                                                    onChange={e => handleWorkingHourChange(index, 'dayOfWeek', Number(e.target.value))}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                >
                                                    {DAYS_OF_WEEK.map(day => (
                                                        <option key={day.id} value={day.id}>{day.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2 flex-1">
                                                <span className="text-sm text-slate-500">من</span>
                                                <input
                                                    type="time"
                                                    value={hour.startTime}
                                                    onChange={e => handleWorkingHourChange(index, 'startTime', e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                                                    dir="ltr"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 flex-1">
                                                <span className="text-sm text-slate-500">إلى</span>
                                                <input
                                                    type="time"
                                                    value={hour.endTime}
                                                    onChange={e => handleWorkingHourChange(index, 'endTime', e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                                                    dir="ltr"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveWorkingHour(index)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 sticky bottom-[-24px] bg-white pb-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-8 py-2.5 rounded-xl font-bold bg-brand-600 text-white hover:bg-brand-700 transition-all shadow-lg hover:shadow-xl shadow-brand-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Check className="w-5 h-5" />
                                {isSubmitting ? 'جاري الحفظ...' : 'تأكيد وحفظ'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
