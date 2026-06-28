import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Mic, MicOff, Activity, Clock, FileText, Pill, Save, AlertCircle, User, Thermometer, Heart, Weight, Stethoscope, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { syncService } from '../../services/SyncService';

// SpeechRecognition Types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const PhysicianCockpit = () => {
    const { success, error } = useToast();
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
    const [clinicalNotes, setClinicalNotes] = useState('');
    const [isListening, setIsListening] = useState(false);
    
    // For Speech Recognition
    const recognitionRef = useRef<any>(null);

    const appointments = useLiveQuery(() => db.appointments.where('status').anyOf(['checked_in', 'in_progress']).toArray()) || [];
    const patients = useLiveQuery(() => db.customers.toArray()) || [];

    const activeAppointment = appointments.find(a => a.id === selectedAppointmentId);
    const activePatient = patients.find(p => p.id === selectedPatientId);

    // Patient History
    const patientHistory = useLiveQuery(() => {
        if (!selectedPatientId) return [];
        return db.appointments.where('customerId').equals(selectedPatientId).toArray();
    }, [selectedPatientId]) || [];

    useEffect(() => {
        if (appointments.length > 0 && !selectedAppointmentId) {
             const firstQueue = appointments[0];
             setSelectedAppointmentId(firstQueue.id!);
             setSelectedPatientId(firstQueue.customerId!);
             setClinicalNotes(firstQueue.notes || '');
        }
    }, [appointments]);

    useEffect(() => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'ar-SA'; // Arabic

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                
                if (finalTranscript) {
                    setClinicalNotes(prev => prev + ' ' + finalTranscript + ' ');
                }
            };
            
            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                     error('الرجاء السماح بصلاحيات الميكروفون لاستخدام الإملاء الصوتي');
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            error('متصفحك لا يدعم خاصية الإملاء الصوتي');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error(err);
                setIsListening(false);
            }
        }
    };

    const handleSaveConsultation = async () => {
        if (!selectedAppointmentId) return;
        try {
            await db.appointments.update(selectedAppointmentId, {
                notes: clinicalNotes,
                status: 'completed',
                actualEndTime: new Date().toISOString()
            });
            await syncService.queueChange('update', 'appointments', {
                id: selectedAppointmentId,
                notes: clinicalNotes,
                status: 'completed',
                actualEndTime: new Date().toISOString()
            });
            success('تم حفظ الاستشارة وإنهاء الموعد بنجاح');
            setSelectedAppointmentId(null);
            setSelectedPatientId(null);
            setClinicalNotes('');
        } catch (err) {
            error('حدث خطأ أثناء حفظ الاستشارة');
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-100">
            {/* Sidebar Queue */}
            <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto flex flex-col shrink-0 z-10 shadow-lg">
                <div className="p-4 bg-slate-900 text-white sticky top-0">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-400" /> طابور الانتظار (العيادة)
                    </h2>
                </div>
                <div className="flex-1 p-3 space-y-2">
                    {appointments.map(app => {
                        const pat = patients.find(p => p.id === app.customerId);
                        const isSelected = app.id === selectedAppointmentId;
                        return (
                            <button
                                key={app.id}
                                onClick={() => {
                                    setSelectedAppointmentId(app.id!);
                                    setSelectedPatientId(app.customerId!);
                                    setClinicalNotes(app.notes || '');
                                }}
                                className={`w-full text-right p-4 rounded-xl border transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200 shadow-md ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-slate-800">{pat?.name || 'مريض غير معروف'}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${app.status === 'in_progress' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {app.status === 'in_progress' ? 'في العيادة' : 'في الانتظار'}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" />
                                    موعد: {app.time}
                                </div>
                            </button>
                        );
                    })}
                    {appointments.length === 0 && (
                        <div className="text-center py-10 text-slate-400 font-bold text-sm">لا يوجد مرضى في طابور الانتظار</div>
                    )}
                </div>
            </div>

            {/* Main Cockpit Area */}
            <div className="flex-1 flex flex-col overflow-y-auto w-full relative">
                 {/* Smart Header Overlay */}
                 <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
                      <div>
                          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                              <Stethoscope className="w-7 h-7 text-indigo-600" />
                              لوحة معلومات الطبيب (Cockpit)
                          </h1>
                          <p className="text-sm font-bold text-slate-500 mt-1">واجهة موحدة تجمع التاريخ المرضي، المؤشرات، وكتابة الملاحظات الصوتية</p>
                      </div>
                      
                      {activeAppointment && (
                          <button onClick={handleSaveConsultation} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5" /> إنهاء وحفظ
                          </button>
                      )}
                 </div>

                 {activeAppointment && activePatient ? (
                     <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
                         {/* Left/Main Column - Consultation */}
                         <div className="lg:col-span-8 flex flex-col gap-6">
                             {/* Patient Identity Card */}
                             <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-6">
                                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                                      <User className="w-8 h-8" />
                                  </div>
                                  <div className="flex-1">
                                      <h2 className="text-xl font-bold text-slate-800">{activePatient.name}</h2>
                                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600 font-medium">
                                          <span>رقم الملف: <strong className="text-slate-800">#{activePatient.id}</strong></span>
                                          <span>تاريخ الزيارة: <strong className="text-slate-800">{activeAppointment.date}</strong></span>
                                      </div>
                                  </div>
                             </div>

                             {/* Vitals Summary Card */}
                             <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl p-5 border border-rose-100 shadow-sm">
                                 <h3 className="font-bold text-rose-900 flex items-center gap-2 mb-4">
                                     <Activity className="w-5 h-5 text-rose-500" />
                                     المؤشرات الحيوية اليوم (Vitals Triage)
                                 </h3>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                     <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-sm">
                                         <div className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1"><Thermometer className="w-3 h-3 text-orange-500"/> درجة الحرارة</div>
                                         <div className="text-lg font-black text-slate-800">{activeAppointment.vitals?.temperature || '--'} <span className="text-xs text-slate-500 font-medium">°C</span></div>
                                     </div>
                                     <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-sm">
                                         <div className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1"><Heart className="w-3 h-3 text-rose-500"/> النبض</div>
                                         <div className="text-lg font-black text-slate-800">{activeAppointment.vitals?.heartRate || '--'} <span className="text-xs text-slate-500 font-medium">bpm</span></div>
                                     </div>
                                     <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-sm">
                                         <div className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1"><Activity className="w-3 h-3 text-red-500"/> الضغط</div>
                                         <div className="text-lg font-black text-slate-800">{activeAppointment.vitals?.bloodPressure || '--'} <span className="text-xs text-slate-500 font-medium">mmHg</span></div>
                                     </div>
                                     <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-sm">
                                         <div className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1"><Weight className="w-3 h-3 text-cyan-500"/> الوزن</div>
                                         <div className="text-lg font-black text-slate-800">{activeAppointment.vitals?.weight || '--'} <span className="text-xs text-slate-500 font-medium">kg</span></div>
                                     </div>
                                 </div>
                             </div>

                             {/* Consultation Notes + AI Dictation */}
                             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[300px]">
                                 <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                     <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                         <FileText className="w-5 h-5 text-indigo-600" />
                                         الملاحظات السريرية (Clinical Notes)
                                     </h3>
                                     <button 
                                         onClick={toggleListening}
                                         className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${isListening ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                                     >
                                         {isListening ? (
                                             <><MicOff className="w-4 h-4 animate-pulse" /> إيقاف الإملاء الصوتي</>
                                         ) : (
                                             <><Mic className="w-4 h-4" /> إملاء صوتي (Speech-to-Text)</>
                                         )}
                                     </button>
                                 </div>
                                 <div className="p-4 flex-1">
                                     <textarea
                                         value={clinicalNotes}
                                         onChange={e => setClinicalNotes(e.target.value)}
                                         placeholder="اكتب ملاحظات الكشف هنا، أو استخدم الميكروفون للإملاء الصوتي المباشر..."
                                         className="w-full h-full min-h-[250px] resize-none outline-none text-slate-700 leading-relaxed font-medium"
                                     ></textarea>
                                 </div>
                             </div>
                         </div>

                         {/* Right Column - History & Context */}
                         <div className="lg:col-span-4 flex flex-col gap-6">
                              {/* Clinical History Timeline */}
                              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 h-[400px] flex flex-col">
                                  <div className="p-4 bg-slate-50 border-b border-slate-100">
                                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                          <Clock className="w-5 h-5 text-indigo-600" />
                                          التاريخ المرضي (History)
                                      </h3>
                                  </div>
                                  <div className="p-4 overflow-y-auto flex-1 space-y-4">
                                      {patientHistory.filter(h => h.id !== activeAppointment.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(hist => (
                                          <div key={hist.id} className="relative pl-4 border-r-2 border-indigo-100 pb-4 pr-4">
                                              <div className="absolute top-0 right-[-5px] w-2 h-2 bg-indigo-500 rounded-full"></div>
                                              <div className="text-xs font-bold text-indigo-600 mb-1">{hist.date}</div>
                                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm font-medium text-slate-700">
                                                  {hist.notes || 'لا يوجد ملاحظات مسجلة لتلك الزيارة.'}
                                              </div>
                                          </div>
                                      ))}
                                      {patientHistory.filter(h => h.id !== activeAppointment.id).length === 0 && (
                                          <div className="text-center text-slate-400 font-bold text-sm my-10">لا يوجد تاريخ مرضي مسجل.</div>
                                      )}
                                  </div>
                              </div>

                              {/* Active Medications (Mock) */}
                              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                  <div className="p-4 bg-slate-50 border-b border-slate-100">
                                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                          <Pill className="w-5 h-5 text-indigo-600" />
                                          الأدوية الحالية (Medications)
                                      </h3>
                                  </div>
                                  <div className="p-4 space-y-2">
                                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
                                          <AlertCircle className="w-5 h-5 text-amber-500" />
                                          <span className="font-bold text-amber-900 text-sm">Panadol Extra 500mg</span>
                                      </div>
                                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 text-sm font-medium text-slate-600">
                                          يمكن ربط هذه القائمة بالوصفات الطبية السابقة من النظام.
                                      </div>
                                  </div>
                              </div>
                         </div>
                     </div>
                 ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                         <Stethoscope className="w-16 h-16 text-slate-200 mb-4" />
                         <p className="text-lg font-bold">الرجاء اختيار مريض من طابور الانتظار للبدء بالمعاينة</p>
                     </div>
                 )}
            </div>
        </div>
    );
};
