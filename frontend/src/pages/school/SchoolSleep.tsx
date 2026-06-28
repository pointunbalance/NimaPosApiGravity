import React, { useState } from 'react';
import { Moon, Sun, Clock, AlertCircle, Save, CheckCircle2, MessageCircle, Users, Pill } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { format, differenceInMinutes, parse } from 'date-fns';

const SLEEP_STATUS_COLORS = {
    'هادئ': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'متقطع': 'bg-amber-100 text-amber-700 border-amber-200',
    'لم ينم': 'bg-slate-100 text-slate-700 border-slate-200',
};

export const SchoolSleep = () => {
    const [trackingDate, setTrackingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [trackingClass, setTrackingClass] = useState<string>('');

    const classes = useLiveQuery(() => db.schoolClassesList?.toArray()) || [];
    const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
    const sleepRecords = useLiveQuery(() => db.schoolStudentSleep?.filter(s => s.date === trackingDate).toArray()) || [];

    const handleUpdateSleep = async (
        studentId: number, 
        field: string, 
        value: string
    ) => {
        const existing = sleepRecords.find(s => s.studentId === studentId);
        
        let newRecord = existing ? { ...existing } : { 
            studentId, 
            classroomId: students.find(s => s.id === studentId)?.classroomId,
            date: trackingDate,
            sleepTime: '',
            wakeTime: '',
            status: 'هادئ',
            notes: '',
            reportedToParent: false
        };

        newRecord[field] = value;

        if (existing) {
            await db.schoolStudentSleep.update(existing.id, newRecord);
        } else {
            await db.schoolStudentSleep.add(newRecord);
        }
    };

    const handleSendReport = async (studentId: number) => {
        const existing = sleepRecords.find(s => s.studentId === studentId);
        if (existing) {
            await db.schoolStudentSleep.update(existing.id, { reportedToParent: true });
        }
    };

    const calculateDuration = (sleepTime?: string, wakeTime?: string) => {
        if (!sleepTime || !wakeTime) return '-';
        try {
            const start = parse(sleepTime, 'HH:mm', new Date());
            const end = parse(wakeTime, 'HH:mm', new Date());
            const mins = differenceInMinutes(end, start);
            
            if (mins <= 0) return '0 دقيقة (تأكد من الوقت)';
            
            const hours = Math.floor(mins / 60);
            const remainingMins = mins % 60;
            
            let result = '';
            if (hours > 0) result += `${hours} س `;
            if (remainingMins > 0) result += `${remainingMins} د`;
            
            return result === '' ? '0 د' : result.trim();
        } catch {
            return '-';
        }
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 p-3 rounded-2xl">
                        <Moon className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800">النوم والراحة</h1>
                        <p className="text-slate-500 font-medium">سجل أوقات النوم والقيلولة، حالات النوم، والملاحظات للأطفال</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end mb-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ اليوم</label>
                    <input type="date" value={trackingDate} onChange={e => setTrackingDate(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">الفصل</label>
                    <select value={trackingClass} onChange={e => setTrackingClass(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-w-[200px]">
                        <option value="">-- اختر الفصل للبدء --</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {!trackingClass ? (
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center">
                    <Users className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-black text-slate-700 mb-2">اختر الفصل الدراسي</h3>
                    <p className="text-slate-500 font-medium max-w-sm">الرجاء اختيار فصل دراسي من القائمة بالأعلى للبدء في تسجيل ومتابعة أوقات راحة الأطفال.</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="p-4 font-bold text-slate-600">اسم الطفل</th>
                                    <th className="p-4 font-bold text-slate-600 text-center">وقت النوم</th>
                                    <th className="p-4 font-bold text-slate-600 text-center">وقت الاستيقاظ</th>
                                    <th className="p-4 font-bold text-slate-600 text-center">المدة</th>
                                    <th className="p-4 font-bold text-slate-600 text-center">الحالة</th>
                                    <th className="p-4 font-bold text-slate-600 w-1/4">ملاحظات</th>
                                    <th className="p-4 font-bold text-slate-600 text-center">تقرير الأهل</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.filter(s => s.classroomId === Number(trackingClass)).map(student => {
                                    const record = sleepRecords.find(s => s.studentId === student.id) || { sleepTime: '', wakeTime: '', status: 'هادئ', notes: '', reportedToParent: false };
                                    
                                    return (
                                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4">
                                                <span className="font-bold text-slate-800">{student.name}</span>
                                            </td>
                                            
                                            <td className="p-4">
                                                <div className="flex justify-center">
                                                    <input 
                                                        type="time" 
                                                        value={record.sleepTime}
                                                        onChange={(e) => handleUpdateSleep(student.id!, 'sleepTime', e.target.value)}
                                                        className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                                    />
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <div className="flex justify-center">
                                                    <input 
                                                        type="time" 
                                                        value={record.wakeTime}
                                                        onChange={(e) => handleUpdateSleep(student.id!, 'wakeTime', e.target.value)}
                                                        className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                                    />
                                                </div>
                                            </td>

                                            <td className="p-4 text-center font-bold text-indigo-700 dir-ltr text-xs">
                                                {calculateDuration(record.sleepTime, record.wakeTime)}
                                            </td>

                                            <td className="p-4">
                                                <div className="flex justify-center">
                                                    <select 
                                                        value={record.status}
                                                        onChange={(e) => handleUpdateSleep(student.id!, 'status', e.target.value)}
                                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none appearance-none cursor-pointer text-center ${(SLEEP_STATUS_COLORS as any)[record.status] || SLEEP_STATUS_COLORS['لم ينم']}`}
                                                    >
                                                        <option value="هادئ">هادئ</option>
                                                        <option value="متقطع">متقطع</option>
                                                        <option value="لم ينم">لم ينم</option>
                                                    </select>
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <input 
                                                    type="text" 
                                                    placeholder="مثال: استيقظ يبكي قليلاً..."
                                                    value={record.notes} 
                                                    onChange={(e) => handleUpdateSleep(student.id!, 'notes', e.target.value)}
                                                    className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-md px-2 py-1 text-sm font-medium text-slate-600 placeholder:text-slate-300"
                                                />
                                            </td>

                                            <td className="p-4">
                                                <div className="flex justify-center">
                                                    {record.reportedToParent ? (
                                                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                                            <CheckCircle2 className="w-3 h-3" /> تم الإرسال
                                                        </span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleSendReport(student.id!)}
                                                            className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
                                                            disabled={!record.sleepTime || !record.wakeTime}
                                                            title={(!record.sleepTime || !record.wakeTime) ? 'الرجاء إدخال أوقات الراحة أولاً' : 'إرسال التقرير'}
                                                        >
                                                            <MessageCircle className="w-3 h-3" /> إرسال للأهل
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {students.filter(s => s.classroomId === Number(trackingClass)).length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">لا يوجد أطفال مسجلين في هذا الفصل.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchoolSleep;
