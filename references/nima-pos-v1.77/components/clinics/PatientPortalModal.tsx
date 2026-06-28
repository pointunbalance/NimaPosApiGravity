import React, { useState } from 'react';
import { X, User, FileText, Calendar, Download, Activity, Smartphone, Bell, ChevronLeft, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

interface PatientPortalModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PatientPortalModal({ isOpen, onClose }: PatientPortalModalProps) {
    const patients = useLiveQuery(() => db.customers.toArray()) || [];
    const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
    const [activeTab, setActiveTab] = useState<'appointments' | 'records' | 'lab'>('appointments');

    const patientAppointments = useLiveQuery(
        () => selectedPatientId ? db.appointments.where('customerId').equals(Number(selectedPatientId)).toArray() : [],
        [selectedPatientId]
    ) || [];

    const patientRecords = useLiveQuery(
        () => selectedPatientId ? db.medicalRecords.where('customerId').equals(Number(selectedPatientId)).toArray() : [],
        [selectedPatientId]
    ) || [];

    if (!isOpen) return null;

    const patient = patients.find(p => p.id === Number(selectedPatientId));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex overflow-hidden shadow-2xl relative">
                
                {/* Left Sidebar (Mobile App Simulation) */}
                <div className="w-80 bg-brand-600 flex flex-col shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
                    
                    <div className="p-6 pb-0 flex flex-col items-center text-center mt-4">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border-2 border-white/30 shadow-inner">
                            <Smartphone className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-xl font-black text-white mb-1">بوابة المريض الذكية</h2>
                        <p className="text-brand-100 text-xs font-medium px-4">
                            محاكاة لتطبيق الموبايل / ويب للمرضى. يمكنهم الاطلاع على النتائج والحجز الذاتي هنا.
                        </p>
                    </div>

                    <div className="mt-8 px-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-brand-100 block">اختر مريضاً لتسجيل الدخول:</label>
                            <select 
                                value={selectedPatientId} 
                                onChange={(e) => setSelectedPatientId(e.target.value ? Number(e.target.value) : "")}
                                className="w-full bg-brand-700/50 border border-brand-500/50 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                            >
                                <option value="" className="text-slate-800">-- لم يسجل الدخول --</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id} className="text-slate-800">{p.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        {patient && (
                            <div className="bg-brand-700/50 rounded-2xl p-4 mt-6 border border-brand-500/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-600 font-bold text-xl uppercase shadow-md shrink-0">
                                        {patient.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-white font-bold">{patient.name}</div>
                                        <div className="text-brand-200 text-xs">{patient.phone}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-brand-100 bg-brand-800/50 px-3 py-2 rounded-lg">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> تمت المصادقة بنجاح
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-auto p-6">
                        <button 
                            onClick={onClose}
                            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors border border-white/20 flex items-center justify-center gap-2 text-sm"
                        >
                            <X className="w-4 h-4" /> إغلاق المحاكاة
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-slate-50 flex flex-col h-full overflow-hidden">
                    {!selectedPatientId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
                                <User className="w-12 h-12" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">يرجى تسجيل دخول مريض</h3>
                            <p className="text-slate-500 max-w-sm">
                                من القائمة الجانبية، اختر مريضاً لتفعيل واجهة الخدمة الذاتية (Self-Service Portal).
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white px-8 py-4 border-b border-slate-200 flex gap-6 shrink-0 relative z-10">
                                {[
                                    { id: 'appointments', icon: Calendar, label: 'مواعيدي القادمة' },
                                    { id: 'records', icon: FileText, label: 'الروشتات الطبية' },
                                    { id: 'lab', icon: Activity, label: 'نتائج التحاليل' },
                                ].map(tab => (
                                    <button 
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 pb-3 pt-1 px-1 font-bold text-sm border-b-2 transition-all ${
                                            activeTab === tab.id ? 'border-brand-500 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        <tab.icon className="w-4 h-4" /> {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 relative">
                                {activeTab === 'appointments' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-black text-slate-800">مواعيدي</h3>
                                            <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md">
                                                + حجز موعد جديد
                                            </button>
                                        </div>
                                        
                                        {patientAppointments.length === 0 ? (
                                            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                                                لا يوجد مواعيد مسجلة.
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {patientAppointments.map(app => (
                                                    <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-xl flex flex-col justify-center items-center shrink-0 border border-brand-100">
                                                                <span className="text-xs font-bold">{app.date.split('-')[1]} - {app.date.split('-')[0]}</span>
                                                                <span className="text-lg font-black">{app.date.split('-')[2]}</span>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-800">موعد {app.type === 'consultation' ? 'استشارة' : app.type === 'operation' ? 'عملية' : 'كشف'}</h4>
                                                                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                                                    <Clock className="w-3.5 h-3.5" /> الساعة {app.time}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                                                app.status === 'scheduled' ? 'bg-amber-100 text-amber-700' :
                                                                app.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                                {app.status === 'scheduled' ? 'في الانتظار' : app.status === 'completed' ? 'مكتمل' : 'محدث'}
                                                            </span>
                                                            {app.status === 'scheduled' && (
                                                                <button className="text-xs text-rose-600 hover:bg-rose-50 px-2 py-1 rounded font-bold underline-offset-2">إلغاء الموعد</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'records' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-black text-slate-800">التاريخ الطبي والروشتات</h3>
                                        {patientRecords.length === 0 ? (
                                            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                                                لا يوجد سجلات طبية مسجلة.
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {patientRecords.map(rec => (
                                                    <div key={rec.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm group">
                                                        <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                                    <FileText className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-slate-800">زيارة يوم {new Date(rec.date).toLocaleDateString('ar-EG')}</h4>
                                                                    <p className="text-xs text-slate-500">تشخيص: {rec.diagnosis.substring(0, 30)}...</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                                                onClick={() => alert('تم تنزيل الروشتة (محاكاة)')}
                                                            >
                                                                <Download className="w-3.5 h-3.5" /> تحميل الروشتة PDF
                                                            </button>
                                                        </div>
                                                        {rec.prescription && (
                                                            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                                                                <div className="font-bold text-slate-700 mb-1 text-xs">الأدوية الموصوفة:</div>
                                                                {rec.prescription}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'lab' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-black text-slate-800">نتائج التحاليل والأشعة</h3>
                                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 relative overflow-hidden">
                                            <div className="absolute left-0 top-0 w-2 h-full bg-blue-500"></div>
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-white text-blue-600 rounded-xl shadow-sm">
                                                    <Activity className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-bold text-slate-800">تحليل صورة دم كاملة (CBC)</h4>
                                                        <span className="text-xs font-bold text-slate-500">{new Date().toISOString().split('T')[0]}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mb-4 text-justify">
                                                        تمت مراجعة النتائج من قبل الطبيب المختص وهي في المعدلات الطبيعية، ولا تتطلب أي تغيير في بروتوكول العلاج الحالي.
                                                    </p>
                                                    <button className="flex items-center gap-2 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm">
                                                        <Download className="w-4 h-4" /> تحميل النتيجة (PDF)
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 text-center py-10">
                                            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                                            <p className="font-medium">لا توجد نتائج أخرى متاحة حالياً.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
