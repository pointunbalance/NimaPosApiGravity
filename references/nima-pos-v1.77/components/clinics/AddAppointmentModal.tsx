import React, { useState, useEffect } from 'react';
import { X, User, Calendar as CalendarIcon, Clock, HeartPulse, FileText, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { AppointmentService } from '../../services/AppointmentService';

interface AddAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (appointment: any) => Promise<void>;
}

export const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({
    isOpen,
    onClose,
    onSave
}) => {
    const doctors = useLiveQuery(() => db.doctors.toArray(), []) || [];
    const patients = useLiveQuery(() => db.customers.toArray(), []) || [];
    const branches = useLiveQuery(() => db.clinicBranches.toArray(), []) || [];

    const [customerId, setCustomerId] = useState<number | ''>('');
    const [doctorId, setDoctorId] = useState<number | ''>('');
    const [branchId, setBranchId] = useState<number | ''>(1);
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState<string>('');
    const [type, setType] = useState<"new" | "consultation" | "operation" | "urgent">('new');
    const [symptoms, setSymptoms] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    
    // Patient Reliability logic
    const [isUnreliable, setIsUnreliable] = useState(false);
    const [depositConfirmed, setDepositConfirmed] = useState(false);

    useEffect(() => {
        if (!customerId) {
            setIsUnreliable(false);
            setDepositConfirmed(false);
            return;
        }
        db.appointments.where('customerId').equals(Number(customerId)).toArray().then(apps => {
            if (apps.length >= 2) {
                 const bad = apps.filter(a => a.status === 'no_show' || a.status === 'cancelled').length;
                 const badRatio = bad / apps.length;
                 if (badRatio >= 0.4) {
                     setIsUnreliable(true);
                 } else {
                     setIsUnreliable(false);
                 }
            } else {
                setIsUnreliable(false);
            }
        });
    }, [customerId]);

    useEffect(() => {
        if (doctorId && date && time) {
            // Attempt to soft lock
            AppointmentService.acquireLock(Number(doctorId), date, time).catch(err => {
                setErrorMsg(err.message);
                setTime(''); // revert selection if locked
            });
        }
    }, [doctorId, date, time]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        if (!customerId || !doctorId || !date || !time) return;

        setIsSubmitting(true);
        try {
            if (isUnreliable && !depositConfirmed) {
                setErrorMsg('هذا المريض لديه سجل عالٍ من التغيب والإلغاء (درجة موثوقية منخفضة). يرجى تأكيد استلام عربون قبل الحجز.');
                setIsSubmitting(false);
                return;
            }

            if (isUnreliable && time >= '17:00' && time <= '22:00') {
                setErrorMsg('نظراً لاختبار السلوك السابق للمريض، النظام يمنع جدولة مواعيده في ساعات الذروة (5 - 10 مساءً) للحد من هدر الإيرادات.');
                setIsSubmitting(false);
                return;
            }

            // Validate slots to prevent overlapping for the same doctor on the same date
            const existingAppointments = await db.appointments
                .where('date')
                .equals(date)
                .toArray();
            
            const doctorAppointments = existingAppointments.filter(
                a => a.doctorId === Number(doctorId) && a.status !== 'cancelled' && a.status !== 'no_show'
            );

            // Buffer time constraint: 15 minutes = 15 * 60 * 1000 = 900000ms
            const BUFFER_MS = 15 * 60 * 1000;
            const newAppTime = new Date(`${date}T${time}`).getTime();

            for (const app of doctorAppointments) {
                const existingAppTime = new Date(`${date}T${app.time}`).getTime();
                const diff = Math.abs(newAppTime - existingAppTime);
                
                if (diff < BUFFER_MS) {
                    setErrorMsg(`يوجد تعارض في المواعيد، يجب أن يكون هناك فاصل 15 دقيقة على الأقل عن الموعد (${app.time})`);
                    setIsSubmitting(false);
                    return;
                }
            }

            await onSave({
                customerId: Number(customerId),
                doctorId: Number(doctorId),
                branchId: Number(branchId),
                date,
                time,
                type,
                status: 'scheduled',
                symptoms,
                notes
            });
            onClose();
        } catch (err) {
            console.error(err);
            setErrorMsg('حدث خطأ أثناء حفظ الموعد');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200"
                >
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
                                <CalendarIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">حجز موعد جديد</h2>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">تسجيل موعد مريض بالعيادة</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {errorMsg && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-200 text-sm font-bold flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                {errorMsg}
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Patient Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-400" />
                                    المريض
                                </label>
                                <select
                                    required
                                    value={customerId}
                                    onChange={e => setCustomerId(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium"
                                >
                                    <option value="">اختر المريض...</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} - {p.phone}</option>
                                    ))}
                                </select>
                            </div>

                            {isUnreliable && (
                                <div className="col-span-1 md:col-span-2 bg-orange-50 border border-orange-200 p-4 rounded-xl flex flex-col gap-3">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                                        <div>
                                            <p className="text-orange-900 font-bold text-sm">تنبيه ذكي: سلوك المريض (Patient Reliability)</p>
                                            <p className="text-orange-800 text-xs mt-1">
                                                لاحظ النظام أن هذا المريض يقوم بإلغاء مواعيده أو لا يحضر في {'>'} 40٪ من الحالات. تم حظر الحجز في وقت الذروة، ويُشترط طلب عربون مقدم.
                                            </p>
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer bg-white p-3 rounded-lg border border-orange-100 shadow-sm w-fit">
                                        <input
                                            type="checkbox"
                                            checked={depositConfirmed}
                                            onChange={e => setDepositConfirmed(e.target.checked)}
                                            className="w-4 h-4 text-orange-600 rounded border-orange-300 focus:ring-orange-500"
                                        />
                                        <span className="text-sm font-bold text-orange-900">تم تحصيل العربون / تأكيد الحجز</span>
                                    </label>
                                </div>
                            )}

                            {/* Doctor Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <HeartPulse className="w-4 h-4 text-slate-400" />
                                    الطبيب المعالج
                                </label>
                                <select
                                    required
                                    value={doctorId}
                                    onChange={e => setDoctorId(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium"
                                >
                                    <option value="">اختر الطبيب...</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>د. {d.name} ({d.specialization})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Branch Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <HeartPulse className="w-4 h-4 text-slate-400" />
                                    الفرع
                                </label>
                                <select
                                    required
                                    value={branchId}
                                    onChange={e => setBranchId(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium"
                                >
                                    <option value="">اختر الفرع...</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                                    تاريخ الموعد
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium"
                                />
                            </div>

                            {/* Time */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    وقت الموعد
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium"
                                />
                            </div>

                            {/* Type */}
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Check className="w-4 h-4 text-slate-400" />
                                    نوع الحجز
                                </label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {[
                                        { id: 'new', label: 'كشف جديد', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                                        { id: 'consultation', label: 'استشارة', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                                        { id: 'operation', label: 'عملية', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                                        { id: 'urgent', label: 'مستعجل', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setType(t.id as any)}
                                            className={`p-3 rounded-xl border-2 font-bold text-sm transition-all text-center ${
                                                type === t.id ? t.color + ' ring-2 ring-offset-1 ' + t.color.split(' ')[0].replace('bg', 'ring') : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                الأعراض / سبب الزيارة
                            </label>
                            <textarea
                                rows={2}
                                value={symptoms}
                                onChange={e => setSymptoms(e.target.value)}
                                placeholder="صف الأعراض أو سبب الزيارة باختصار..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium resize-none"
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
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
                                {isSubmitting ? 'جاري الحفظ...' : 'تأكيد الحجز'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
