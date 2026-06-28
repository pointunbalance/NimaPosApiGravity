import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { GraduationCap, Clock, CalendarCheck, Utensils, Star, Activity, Receipt, CreditCard, ChevronLeft, CalendarX } from 'lucide-react';
import { format } from 'date-fns';

export const ParentPortalDashboard = () => {
    // Determine the logged in parent's children
    const parentIdStr = localStorage.getItem('parentPortalParentId');
    const parentId = parentIdStr ? Number(parentIdStr) : null;

    const students = useLiveQuery(() => 
        db.schoolStudents?.filter(s => s.guardianId === parentId).toArray()
    ) || [];

    // If no parent id matches, we show dummy data or all for demo purposes
    const activeStudents = parentId ? students : useLiveQuery(() => db.schoolStudents?.limit(2).toArray()) || [];

    const attendance = useLiveQuery(() => db.schoolAttendanceList?.toArray()) || [];
    const meals = useLiveQuery(() => db.schoolStudentMeals?.toArray()) || [];
    const invoices = useLiveQuery(() => db.schoolFees?.toArray()) || [];

    if (activeStudents.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-white rounded-3xl border border-slate-200">
                    <GraduationCap className="w-16 h-16 text-indigo-200 mx-auto mb-4"/>
                    <h2 className="text-xl font-bold text-slate-700">لا يوجد أطفال مسجلين</h2>
                    <p className="text-slate-500 mt-2">يرجى التواصل مع الإدارة لربط بيانات أطفالك بحسابك.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-black text-slate-800 mb-2">متابعة الأبناء</h1>
                <p className="text-slate-500 font-medium">التقارير اليومية، الحضور، والحسابات المالية</p>
            </div>

            {activeStudents.map(student => {
                 const studentAtt = attendance.find(a => a.studentId === student.id && a.date === format(new Date(), 'yyyy-MM-dd'));
                 const studentInvoices = invoices.filter(inv => inv.studentId === student.id);
                 const totalUnpaid = studentInvoices.filter(i => i.status !== 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);

                return (
                    <div key={student.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4 bg-gradient-to-l from-indigo-50/50 to-white">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black text-xl border-4 border-white shadow-sm">
                                    {student.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">{student.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{student.code}</span>
                                        <span className="text-xs font-bold text-indigo-600 flex items-center gap-1"><GraduationCap className="w-3 h-3"/> في الحضانة</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border ${studentAtt ? (studentAtt.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100') : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                    {studentAtt ? (studentAtt.status === 'present' ? <><CalendarCheck className="w-4 h-4"/> حاضر اليوم</> : <><CalendarX className="w-4 h-4"/> غائب اليوم</>) : <><Clock className="w-4 h-4"/> لم يسجل حضور اليوم</>}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Finance Card */}
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl col-span-1 md:col-span-2">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-rose-800 font-bold flex items-center gap-2"><CreditCard className="w-5 h-5"/> الرسوم المستحقة</h3>
                                        <p className="text-xs text-rose-600/80 mt-1">يجب السداد قبل تاريخ الاستحقاق</p>
                                    </div>
                                    <h4 className="text-2xl font-black text-rose-600">{totalUnpaid.toLocaleString()} <span className="text-sm">ج.م</span></h4>
                                </div>
                                 <button className="w-full py-2 bg-white text-rose-600 text-sm font-bold rounded-xl border border-rose-200 hover:bg-rose-100 transition">
                                    عرض تفاصيل الفواتير
                                </button>
                            </div>

                            {/* Reports Card */}
                            <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl">
                                <h3 className="text-sky-800 font-bold flex items-center gap-2 mb-2"><Activity className="w-5 h-5"/> التقرير اليومي</h3>
                                <div className="space-y-2 mt-4">
                                     <div className="flex items-center gap-2 text-sm font-medium text-sky-700"><Star className="w-4 h-4 text-sky-500 fill-sky-200"/> الأداء: ممتاز</div>
                                     <div className="flex items-center gap-2 text-sm font-medium text-sky-700"><Utensils className="w-4 h-4 text-sky-500"/> الوجبات: أكل وجبته بالكامل</div>
                                </div>
                                <button className="w-full py-2 bg-white text-sky-600 text-sm font-bold rounded-xl border border-sky-200 hover:bg-sky-100 transition mt-4">
                                    تقرير مفصل
                                </button>
                            </div>
                            
                            {/* Medical / Status Card */}
                            <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl">
                                <h3 className="text-purple-800 font-bold flex items-center gap-2 mb-2"><Activity className="w-5 h-5"/> الحالة العامة</h3>
                                <div className="space-y-2 mt-4">
                                     <div className="flex items-center justify-between text-sm font-medium text-purple-700">
                                         <span>المزاج:</span>
                                         <span className="font-bold">سعيد ونشيط 😊</span>
                                     </div>
                                     <div className="flex items-center justify-between text-sm font-medium text-purple-700">
                                         <span>النوم:</span>
                                         <span className="font-bold">نام 45 دقيقة 😴</span>
                                     </div>
                                </div>
                                <button className="w-full py-2 bg-white text-purple-600 text-sm font-bold rounded-xl border border-purple-200 hover:bg-purple-100 transition mt-4">
                                    العيادة والصحة
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
