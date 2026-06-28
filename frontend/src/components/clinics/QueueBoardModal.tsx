import React, { useState, useEffect, useMemo } from 'react';
import { X, Clock, AlertTriangle, PlaySquare, User, Beaker, CheckCircle2, Tv } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

interface QueueBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    branchId: number;
}

export function QueueBoardModal({ isOpen, onClose, branchId }: QueueBoardModalProps) {
    const today = new Date().toISOString().split('T')[0];
    
    // Live data
    const doctors = useLiveQuery(() => db.doctors.toArray()) || [];
    const patients = useLiveQuery(() => db.customers.toArray()) || [];
    const appointmentsAll = useLiveQuery(() => db.appointments.where('date').equals(today).toArray(), [today]) || [];
    
    const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        if (isOpen) {
            const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60); // update every minute
            return () => clearInterval(timer);
        }
    }, [isOpen]);

    // Average times mapping (fallback to a default if not enough data)
    // 15 mins default
    const [doctorAverages, setDoctorAverages] = useState<Record<number, number>>({});
    useEffect(() => {
        const fetchAverages = async () => {
            const completed = await db.appointments.filter(a => a.status === 'completed' && !!a.actualStartTime && !!a.actualEndTime).toArray();
            const sums: Record<number, {total: number, count: number}> = {};
            completed.forEach(a => {
                const start = new Date(a.actualStartTime!).getTime();
                const end = new Date(a.actualEndTime!).getTime();
                if (end > start) {
                    const diff = end - start;
                    if (!sums[a.doctorId]) sums[a.doctorId] = {total: 0, count: 0};
                    sums[a.doctorId].total += diff;
                    sums[a.doctorId].count++;
                }
            });
            const avgs: Record<number, number> = {};
            Object.keys(sums).forEach(k => {
                avgs[Number(k)] = Math.round(sums[Number(k)].total / sums[Number(k)].count / 60000); // mins
            });
            setDoctorAverages(avgs);
        };
        if (isOpen) fetchAverages();
    }, [isOpen]);

    const appointments = appointmentsAll.filter(a => a.branchId === branchId);

    // Filter and sort the queue for the selected doctor
    const sortedQueue = useMemo(() => {
        if (!selectedDoctorId) return [];
        let drAppts = appointments.filter(a => a.doctorId === Number(selectedDoctorId) && ['scheduled', 'checked_in', 'in_progress', 'waiting_lab'].includes(a.status));
        
        // Sorting logic based on priority:
        // 1. in_progress (always first)
        // 2. urgent (emergency)
        // 3. checked_in
        // 4. scheduled/waiting_lab
        // Within same priority, sort by time
        const getPriority = (app: any) => {
            if (app.status === 'in_progress') return 0;
            if (app.type === 'urgent') return 1;
            if (app.status === 'waiting_lab') return 2;
            if (app.status === 'checked_in') return 3;
            if (app.type === 'consultation') return 4; // fast track
            return 5;
        };

        return drAppts.sort((a, b) => {
            const pA = getPriority(a);
            const pB = getPriority(b);
            if (pA !== pB) return pA - pB;
            // Then sequentially by time
            return a.time.localeCompare(b.time);
        });
    }, [appointments, selectedDoctorId]);

    const calculateWaitTime = (index: number) => {
        const avgMins = doctorAverages[Number(selectedDoctorId)] || 15;
        return index * avgMins;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex overflow-hidden shadow-2xl relative">
                
                {/* Full Screen Mode "Waiting Area Display" */}
                <div className="flex-1 flex flex-col bg-slate-900 border-r border-slate-800">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <Tv className="w-8 h-8 text-blue-400" />
                            <h2 className="text-2xl font-black text-white">لوحة الانتظار (Queue Management)</h2>
                        </div>
                        <div className="text-xl font-bold text-blue-300">
                            {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <div className="flex gap-4 mb-6 relative z-10">
                            <select 
                                value={selectedDoctorId}
                                onChange={(e) => setSelectedDoctorId(e.target.value ? Number(e.target.value) : '')}
                                className="bg-slate-800 border border-slate-700 text-white w-[250px] rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="" className="text-slate-400">اختر العيادة / الطبيب ...</option>
                                {doctors.map(d => (
                                    <option key={d.id} value={d.id} className="text-white">د. {d.name} - {d.specialization}</option>
                                ))}
                            </select>
                            
                            {selectedDoctorId && (
                                <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-4 text-slate-300 font-bold text-sm">
                                    <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> متوسط وقت الكشف: {doctorAverages[Number(selectedDoctorId)] || 15} دقيقة</span>
                                </div>
                            )}
                        </div>

                        {!selectedDoctorId ? (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
                                <Tv className="w-16 h-16 mb-4 opacity-50" />
                                <p className="text-xl font-bold">يرجى اختيار العيادة لعرض شاشة الانتظار</p>
                            </div>
                        ) : sortedQueue.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
                                <CheckCircle2 className="w-16 h-16 mb-4 opacity-50 text-emerald-500" />
                                <p className="text-xl font-bold">لا يوجد مرضى في الانتظار بالعيادة الحالية</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 pb-10">
                                {sortedQueue.map((app, idx) => {
                                    const patient = patients.find(p => p.id === app.customerId);
                                    let isNow = app.status === 'in_progress';
                                    let isNext = idx === (sortedQueue.findIndex(a => a.status !== 'in_progress')) && !isNow;
                                    let waitTime = isNow ? 0 : calculateWaitTime(idx - (sortedQueue.filter(a => a.status === 'in_progress').length));
                                    
                                    return (
                                        <div key={app.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                                            isNow ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/50 scale-[1.02]' : 
                                            isNext ? 'bg-slate-800 border-emerald-500 shadow-md shadow-emerald-900/20' : 
                                            app.type === 'urgent' ? 'bg-rose-900/40 border-rose-800' :
                                            'bg-slate-800/50 border-slate-700'
                                        }`}>
                                            <div className="flex items-center gap-6">
                                                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black ${
                                                    isNow ? 'bg-white text-blue-600' : 'bg-slate-700 text-white'
                                                }`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <h3 className={`text-2xl font-bold ${isNow ? 'text-white' : 'text-slate-200'}`}>
                                                        {patient?.name.replace(/ .*/,'')} *** {/* privacy masking */}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className={`text-sm font-bold opacity-80 ${isNow ? 'text-blue-100' : 'text-slate-400'}`}>
                                                            موعد: {app.time}
                                                        </span>
                                                        {app.type === 'urgent' && (
                                                            <span className="flex items-center gap-1 text-xs font-bold bg-rose-500 text-white px-2 py-0.5 rounded">
                                                                <AlertTriangle className="w-3 h-3" /> طارئ (Priority)
                                                            </span>
                                                        )}
                                                        {app.status === 'waiting_lab' && (
                                                            <span className="flex items-center gap-1 text-xs font-bold bg-purple-500 text-white px-2 py-0.5 rounded">
                                                                <Beaker className="w-3 h-3" /> استشارة بعد التحليل (Priority)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                {isNow ? (
                                                    <div className="flex items-center gap-2 text-xl font-black text-white bg-blue-500 px-4 py-2 rounded-xl border border-blue-400 animate-pulse">
                                                        <PlaySquare className="w-6 h-6" /> تفضل بالدخول
                                                    </div>
                                                ) : isNext ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-1">المريض التالي</span>
                                                        <span className="text-2xl font-black text-white">استعد</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-slate-400 text-xs font-bold mb-1 tracking-wider">وقت الانتظار المتوقع</span>
                                                        <span className="text-xl font-black text-amber-500">{waitTime > 0 ? `~${waitTime}` : '<1'} د</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side Info Box */}
                <div className="w-80 bg-white flex flex-col shrink-0 relative z-20">
                    <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="font-bold text-slate-800">إدارة الدور</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm mb-3">حالة العيادة</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                                    <div className="text-2xl font-black text-blue-700">{sortedQueue.length}</div>
                                    <div className="text-[10px] font-bold text-blue-600 mt-1">منتظر</div>
                                </div>
                                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                                    <div className="text-2xl font-black text-emerald-700">
                                        {appointments.filter(a => String(a.doctorId) === String(selectedDoctorId) && a.status === 'completed').length}
                                    </div>
                                    <div className="text-[10px] font-bold text-emerald-600 mt-1">كشف اليوم</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <h4 className="font-bold text-slate-800 text-sm mb-2">منطق الأولوية (Priority Logic)</h4>
                            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                النظام آلياً يقدم الحالات الطارئة (Urgent) أو الاستشارات المرتجعة من المختبر، ثم يحسب الانتظار الباقي بناءً على متوسط الكشف الفعلي للطبيب.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
