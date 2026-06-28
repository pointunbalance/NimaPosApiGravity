import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { useNavigate } from 'react-router-dom';
import { Check, X, Camera, Coffee, Moon, ArrowLeft, CalendarCheck, Clock, Search, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';

export const TeacherAppDashboard = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // In a real app we filter by classroomId associated with this teacher
    const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
    const attendance = useLiveQuery(() => db.schoolAttendanceList?.filter(a => a.date === today).toArray()) || [];

    const handleQuickAttendance = async (studentId: number, status: 'present' | 'absent') => {
        const existing = attendance.find(a => a.studentId === studentId);
        if (existing) {
            await db.schoolAttendanceList.update(existing.id, { status, time: new Date().toISOString() } as any);
        } else {
            await db.schoolAttendanceList.add({
                studentId,
                date: today,
                status,
                time: new Date().toISOString()
            });
        }
    };

    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-800">أطفال الفصل</h2>
                        <p className="text-slate-500 text-sm font-medium">{students.length} طفل مسجل</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 text-sm border border-emerald-100">
                        <CalendarCheck className="w-4 h-4"/> اليوم: {today}
                    </div>
                </div>
                
                <div className="relative">
                    <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="ابحث باسم الطفل..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all" 
                    />
                </div>
            </div>

            <div className="space-y-3">
                {filteredStudents.map(student => {
                    const att = attendance.find(a => a.studentId === student.id);
                    return (
                        <div key={student.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1" onClick={() => navigate(`/teacher-app/student/${student.id}`)}>
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-bold border border-slate-200 flex-shrink-0">
                                    {student.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{student.name}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${att ? (att.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700') : 'bg-slate-100 text-slate-500'}`}>
                                            {att ? (att.status === 'present' ? <><Check className="w-3 h-3"/> حاضر</> : <><X className="w-3 h-3"/> غائب</>) : <><Clock className="w-3 h-3"/> لم يسجل</>}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Quick Actions */}
                            <div className="flex items-center gap-1">
                                {!att && (
                                    <>
                                        <button onClick={() => handleQuickAttendance(student.id, 'present')} className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center border border-emerald-100 transition">
                                            <Check className="w-5 h-5"/>
                                        </button>
                                        <button onClick={() => handleQuickAttendance(student.id, 'absent')} className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center border border-rose-100 transition">
                                            <X className="w-5 h-5"/>
                                        </button>
                                    </>
                                )}
                                <button onClick={() => navigate(`/teacher-app/student/${student.id}`)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 mr-1 flex items-center justify-center border border-slate-200 transition">
                                    <ChevronLeft className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    );
                })}
                {filteredStudents.length === 0 && (
                     <div className="text-center py-12 text-slate-400 bg-white rounded-3xl border border-slate-200 border-dashed">
                        <p className="font-bold">لا يوجد أطفال متطابقين</p>
                    </div>
                )}
            </div>
        </div>
    );
};
