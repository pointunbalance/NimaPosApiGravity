import React, { useMemo } from 'react';
import { X, Calendar as CalendarIcon, Phone, User, Activity, Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

interface GapFillingModalProps {
    isOpen: boolean;
    onClose: () => void;
    cancelledApp: any;
    onFillSlot: (newPatientId: number, oldDate: string, oldTime: string) => Promise<void>;
}

export const ClinicAppointmentsGapModal: React.FC<GapFillingModalProps> = ({
    isOpen,
    onClose,
    cancelledApp,
    onFillSlot
}) => {
    // get future / waiting appointments for the same doctor
    const appointments = useLiveQuery(() => 
        db.appointments.filter(a => 
            a.doctorId === cancelledApp?.doctorId && 
            a.status === 'scheduled' && 
            a.date >= cancelledApp.date &&
            a.id !== cancelledApp.id
        ).toArray()
    , [cancelledApp]) || [];

    const patients = useLiveQuery(() => db.customers.toArray()) || [];

    const suggestedPatients = useMemo(() => {
        if (!cancelledApp) return [];
        // We will just return the future scheduled appointments, optionally prioritized by tags or random heuristic (for now sort by date asc)
        return appointments.map(app => {
            const p = patients.find(p => p.id === app.customerId);
            return {
                ...app,
                patientDetails: p
            }
        }).sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
    }, [appointments, patients, cancelledApp]);

    const handleCallSimulation = async (appId: number, phone: string) => {
        alert(`[محاكاة مكالمة]: جاري الاتصال بالمريض على الرقم ${phone} لاقتراح تقديم الموعد...`);
    };

    if (!isOpen || !cancelledApp) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                    <div>
                        <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-600" />
                            اقتراح ذكي (تقليل الفجوات - Gap Filling)
                        </h3>
                        <p className="text-xs font-bold text-indigo-700 mt-1">تفريغ مساحة يوم ({cancelledApp.date} {cancelledApp.time})</p>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <p className="text-sm font-bold text-slate-700 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm leading-relaxed">
                        نظراً لإلغاء الموعد الحالي، يقترح النظام التواصل مع أحد المرضى التاليين (الذين لديهم مواعيد مستقبلية أو على قوائم الانتظار) لتقديم موعدهم واستغلال الوقت.
                    </p>

                    <div className="space-y-4">
                        {suggestedPatients.map((app, index) => (
                            <div key={app.id} className="border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm hover:shadow-md transition-shadow gap-4">
                                <div className="flex items-center gap-4 w-full">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800">{app.patientDetails?.name || 'مريض غير معروف'}</h4>
                                        <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1">
                                            <CalendarIcon className="w-3 h-3"/> موعده الأصلي: {app.date} | {app.time}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2 shrink-0">
                                        {app.patientDetails?.phone && (
                                            <button 
                                                onClick={() => handleCallSimulation(app.id!, app.patientDetails!.phone!)}
                                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                            >
                                                <Phone className="w-3 h-3" /> اتصال
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => onFillSlot(app.id!, cancelledApp.date, cancelledApp.time)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                        >
                                            <Clock className="w-3 h-3" /> جلب لهذا الموعد المُلغى
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {suggestedPatients.length === 0 && (
                            <div className="text-center py-8 text-slate-500 text-sm font-bold">
                                لا يوجد مواعيد مستقبلية مقترحة لتقديمها.
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-colors">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};
