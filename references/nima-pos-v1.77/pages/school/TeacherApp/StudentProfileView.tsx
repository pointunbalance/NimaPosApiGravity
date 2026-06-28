import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { ArrowRight, Coffee, Moon, Camera, Star, CheckCircle2, HeartPulse, FileText, Send, User } from 'lucide-react';
import { format } from 'date-fns';

export const StudentProfileView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const student = useLiveQuery(() => db.schoolStudents?.get(Number(id)));
    const today = format(new Date(), 'yyyy-MM-dd');
    const teacherId = localStorage.getItem('teacherId') || 1;

    const [activeTab, setActiveTab] = useState<'daily'|'health'>('daily');
    const [actionMsg, setActionMsg] = useState('');

    const logMeal = async (type: string, amount: string) => {
        await db.schoolStudentMeals.add({
            studentId: Number(id),
            date: today,
            mealType: type, // breakfast, lunch, snack
            amountConsumed: amount, // all, half, none
            notes: ''
        });
        showActionMsg('تم تسجيل الوجبة بنجاح');
    };

    const logSleep = async (duration: number) => {
        await db.schoolStudentSleep.add({
            studentId: Number(id),
            date: today,
            durationMins: duration,
            startTime: new Date().toISOString(),
            notes: ''
        });
        showActionMsg('تم تسجيل وقت النوم');
    };

    const [dailyNote, setDailyNote] = useState('');
    const saveDailyReport = async () => {
        if(!dailyNote) return;
        await db.schoolDailyReports.add({
            studentId: Number(id),
            date: today,
            teacherId: Number(teacherId),
            mood: 'happy',
            notes: dailyNote,
            status: 'draft'
        });
        setDailyNote('');
        showActionMsg('تم حفظ التقرير اليومي');
    };

    const showActionMsg = (msg: string) => {
        setActionMsg(msg);
        setTimeout(() => setActionMsg(''), 3000);
    };

    if (!student) return <div className="p-8 text-center text-slate-500 font-bold">جاري التحميل...</div>;

    return (
        <div className="max-w-xl mx-auto pb-12">
            {/* Header */}
            <div className="bg-white rounded-b-3xl border-b border-slate-200 shadow-sm p-4 mb-6 sticky top-[73px] z-10 sticky-header">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/teacher-app/dashboard')} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition shrink-0">
                        <ArrowRight className="w-5 h-5"/>
                    </button>
                    <div className="flex items-center gap-3">
                         <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 font-black text-xl border-2 border-white shadow-sm">
                            <User className="w-6 h-6"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 leading-tight">{student.name}</h2>
                            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-1 inline-block">حاضر اليوم</span>
                        </div>
                    </div>
                </div>
            </div>

            {actionMsg && (
                <div className="mx-4 mb-4 bg-emerald-600 text-white p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 shadow-lg shadow-emerald-200">
                    <CheckCircle2 className="w-5 h-5"/> {actionMsg}
                </div>
            )}

            <div className="mx-4 flex bg-slate-200 p-1 rounded-xl mb-6">
                <button onClick={() => setActiveTab('daily')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'daily' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    التسجيل اليومي
                </button>
                <button onClick={() => setActiveTab('health')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'health' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    سجل الصحة والملاحظات
                </button>
            </div>

            {activeTab === 'daily' && (
                <div className="px-4 space-y-6">
                    {/* Meals */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Coffee className="w-5 h-5 text-amber-500"/> الوجبات</h3>
                        <div className="grid grid-cols-3 gap-2">
                             <div className="col-span-3 flex justify-between gap-2 mb-2">
                                <span className="text-xs font-bold text-slate-500 flex-1 flex items-center justify-center">الكل</span>
                                <span className="text-xs font-bold text-slate-500 flex-1 flex items-center justify-center">النصف</span>
                                <span className="text-xs font-bold text-slate-500 flex-1 flex items-center justify-center">لم يأكل</span>
                             </div>
                            
                            <div className="col-span-3 font-bold text-sm text-slate-700 mt-2 mb-1">الإفطار</div>
                            <button onClick={() => logMeal('breakfast','all')} className="py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm hover:bg-emerald-100 transition">😋 الكل</button>
                            <button onClick={() => logMeal('breakfast','half')} className="py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-bold text-sm hover:bg-amber-100 transition">😐 النصف</button>
                            <button onClick={() => logMeal('breakfast','none')} className="py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold text-sm hover:bg-rose-100 transition">😫 لا شيء</button>

                            <div className="col-span-3 font-bold text-sm text-slate-700 mt-4 mb-1">الغداء</div>
                            <button onClick={() => logMeal('lunch','all')} className="py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm hover:bg-emerald-100 transition">😋 الكل</button>
                            <button onClick={() => logMeal('lunch','half')} className="py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-bold text-sm hover:bg-amber-100 transition">😐 النصف</button>
                            <button onClick={() => logMeal('lunch','none')} className="py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold text-sm hover:bg-rose-100 transition">😫 لا شيء</button>
                        </div>
                    </div>

                    {/* Sleep */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Moon className="w-5 h-5 text-indigo-500"/> وقت القيلولة / النوم</h3>
                        <div className="flex gap-2 mb-3">
                             <button onClick={() => logSleep(30)} className="flex-1 py-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-bold hover:bg-indigo-100 transition">30 دقيقة</button>
                             <button onClick={() => logSleep(45)} className="flex-1 py-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-bold hover:bg-indigo-100 transition">45 دقيقة</button>
                             <button onClick={() => logSleep(60)} className="flex-1 py-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-bold hover:bg-indigo-100 transition">ساعة</button>
                        </div>
                    </div>

                    {/* Notes & Evaluation */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-sky-500"/> ملاحظة لولي الأمر</h3>
                         <textarea 
                            value={dailyNote}
                            onChange={(e) => setDailyNote(e.target.value)}
                            placeholder="اكتبي ملخص يوم الطفل، مهارة تعلمها..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                            rows={3}
                         ></textarea>
                         <button onClick={saveDailyReport} className="mt-3 w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition flex items-center justify-center gap-2">
                             <Send className="w-4 h-4"/> إرسال التقرير لولي الأمر
                         </button>
                    </div>

                    {/* Camera */}
                    <button onClick={() => showActionMsg('تم رفع الصورة بنجاح')} className="w-full bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-300 transition flex flex-col items-center justify-center gap-2 text-slate-600">
                         <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                             <Camera className="w-6 h-6"/>
                         </div>
                         <span className="font-bold">التقاط صورة للطفل</span>
                    </button>
                </div>
            )}

            {activeTab === 'health' && (
                 <div className="px-4 space-y-4">
                     <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex flex-col gap-3">
                         <h3 className="font-bold text-rose-800 flex items-center gap-2"><HeartPulse className="w-5 h-5"/> ملاحظات صحية هامة</h3>
                         <p className="text-sm font-bold text-rose-700 leading-relaxed bg-white/50 p-3 rounded-xl border border-rose-100">
                             الطفل لديه حساسية من الفول السوداني، يرجى التأكد من عدم وجوده في أي وجبة خارجية.
                         </p>
                     </div>
                     
                     <div className="bg-sky-50 border border-sky-100 p-5 rounded-3xl flex flex-col gap-3 mt-4">
                         <h3 className="font-bold text-sky-800 flex items-center gap-2"><User className="w-5 h-5"/> جهات الاتصال في الطوارئ</h3>
                         <div className="bg-white p-3 rounded-xl border border-sky-100 divide-y divide-sky-50">
                             <div className="py-2 flex justify-between">
                                 <span className="text-sm font-bold text-slate-700">الأم (سفيتلانا أندرييفنا)</span>
                                 <span className="text-sm font-bold text-sky-600" dir="ltr">010xxxxxxx</span>
                             </div>
                             <div className="py-2 flex justify-between">
                                 <span className="text-sm font-bold text-slate-700">الأب (ميكولا أندرييف)</span>
                                 <span className="text-sm font-bold text-sky-600" dir="ltr">011xxxxxxx</span>
                             </div>
                         </div>
                     </div>
                 </div>
            )}
        </div>
    );
};
