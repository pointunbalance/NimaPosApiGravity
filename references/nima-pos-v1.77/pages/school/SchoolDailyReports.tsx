import React, { useState } from 'react';
import { FileText, Users, CheckCircle2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { format, differenceInMinutes, parse } from 'date-fns';
import { StudentReportDetail } from '../../components/school/StudentReportDetail';

export const SchoolDailyReports = () => {
    const [trackingDate, setTrackingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [trackingClass, setTrackingClass] = useState<string>('');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    const classes = useLiveQuery(() => db.schoolClassesList?.toArray()) || [];
    const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
    
    const attendance = useLiveQuery(() => db.schoolAttendanceList?.filter(a => a.date === trackingDate).toArray()) || [];
    const meals = useLiveQuery(() => db.schoolStudentMeals?.filter(m => m.date === trackingDate).toArray()) || [];
    const sleeps = useLiveQuery(() => db.schoolStudentSleep?.filter(s => s.date === trackingDate).toArray()) || [];
    const activities = useLiveQuery(() => db.schoolActivities?.filter(a => a.date === trackingDate).toArray()) || [];
    const dailyReports = useLiveQuery(() => db.schoolDailyReports?.filter(r => r.date === trackingDate).toArray()) || [];

    const handleUpdateReport = async (studentId: number, field: string, value: any) => {
        const existing = dailyReports.find(r => r.studentId === studentId);
        
        let newRecord = existing ? { ...existing } : { 
            studentId, 
            classroomId: students.find(s => s.id === studentId)?.classroomId,
            date: trackingDate,
            mood: 'happy',
            teacherNotes: '',
            healthIssues: '',
            photos: [],
            sentToParent: false,
            generatedSummary: ''
        };

        newRecord[field] = value;

        if (existing) {
            await db.schoolDailyReports.update(existing.id, newRecord);
        } else {
            await db.schoolDailyReports.add(newRecord);
        }
    };

    const handleSendReport = async (studentId: number) => {
        const existing = dailyReports.find(r => r.studentId === studentId);
        const reportText = generateSummaryText(studentId);
        
        if (existing) {
            await db.schoolDailyReports.update(existing.id, { sentToParent: true, generatedSummary: reportText });
        } else {
            await db.schoolDailyReports.add({
                studentId,
                classroomId: students.find(s => s.id === studentId)?.classroomId,
                date: trackingDate,
                mood: 'happy',
                teacherNotes: '',
                healthIssues: '',
                photos: [],
                sentToParent: true,
                generatedSummary: reportText
            });
        }
    };

    const formatDuration = (sleepTime?: string, wakeTime?: string) => {
        if (!sleepTime || !wakeTime) return null;
        try {
            const start = parse(sleepTime, 'HH:mm', new Date());
            const end = parse(wakeTime, 'HH:mm', new Date());
            const mins = differenceInMinutes(end, start);
            if (mins <= 0) return null;
            const hours = Math.floor(mins / 60);
            const remainingMins = mins % 60;
            let result = '';
            if (hours > 0) result += `${hours} س `;
            if (remainingMins > 0) result += `${remainingMins} د`;
            return result.trim();
        } catch {
            return null;
        }
    };

    const generateSummaryText = (studentId: number) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return '';

        const att = attendance.find(a => a.studentId === studentId);
        const meal = meals.find(m => m.studentId === studentId);
        const slp = sleeps.find(s => s.studentId === studentId);
        const act = activities.filter(a => a.studentIds?.includes(studentId) || a.classroomId === student.classroomId);
        const report = dailyReports.find(r => r.studentId === studentId) || {};

        let text = `${student.name} حضر اليوم`;
        if (att && att.inTime) text += ` الساعة ${att.inTime}`;
        else text += ` بشكل منتظم`;

        if (act && act.length > 0) {
            text += `، شارك في ${act.map(a => a.name || a.type).join(' و ')}`;
        }

        if (meal && meal.meals) {
            const lunch = meal.meals['lunch']?.status;
            const snack = meal.meals['snack']?.status;
            
            if (lunch === 'جيد' || lunch === 'متوسط') {
                text += `، تناول وجباته بشكل ${lunch}`;
            } else if (lunch === 'ضعيف' || lunch === 'لم يأكل') {
                 text += `، لم يأكل وجبته بشكل جيد اليوم`;
            } else if (snack === 'جيد') {
                 text += `، تناول السناك بشكل جيد`;
            }
        }

        if (slp && slp.sleepTime && slp.wakeTime) {
            const duration = formatDuration(slp.sleepTime, slp.wakeTime);
            if (duration) {
                text += `، نام لمدة ${duration}`;
                if (slp.status) text += ` (${slp.status})`;
            }
        }

        if (report.mood === 'happy') text += `، وكان سعيداً ومتعاوناً`;
        else if (report.mood === 'sad') text += `، وكان يبدو منزعجاً بعض الشيء اليوم`;

        text += `.`;

        if (report.teacherNotes) {
            text += `\nملاحظة المعلمة: ${report.teacherNotes}`;
        }
        
        if (report.healthIssues) {
            text += `\nملاحظة صحية: ${report.healthIssues}`;
        }

        return text;
    };

    return (
        <div className="p-6" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="bg-sky-100 p-3 rounded-2xl">
                        <FileText className="w-8 h-8 text-sky-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800">التقرير اليومي للطفل</h1>
                        <p className="text-slate-500 font-medium">متابعة شاملة ليوم الطفل وإرسال تقارير لأولياء الأمور</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end mb-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ اليوم</label>
                    <input type="date" value={trackingDate} onChange={e => setTrackingDate(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-sky-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">الفصل</label>
                    <select value={trackingClass} onChange={e => setTrackingClass(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-sky-500 outline-none min-w-[200px]">
                        <option value="">-- اختر الفصل للبدء --</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {!trackingClass ? (
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center">
                    <Users className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-black text-slate-700 mb-2">اختر الفصل الدراسي</h3>
                    <p className="text-slate-500 font-medium max-w-sm">اختر الفصل لاستعراض تقارير الأطفال اليومية. يتم تجميع البيانات تلقائياً منالحضور، التغذية، والنوم.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm h-[calc(100vh-250px)] flex flex-col">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-black text-slate-800">قائمة الأطفال</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {students.filter(s => s.classroomId === Number(trackingClass)).map(student => {
                                const report = dailyReports.find(r => r.studentId === student.id);
                                const isSent = report?.sentToParent;
                                
                                return (
                                    <button 
                                        key={student.id}
                                        onClick={() => setSelectedStudent(student)}
                                        className={`w-full text-right p-3 rounded-xl transition-colors flex items-center justify-between ${selectedStudent?.id === student.id ? 'bg-sky-50 border border-sky-200' : 'hover:bg-slate-50 border border-transparent'}`}
                                    >
                                        <span className="font-bold text-slate-700">{student.name}</span>
                                        {isSent && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                    </button>
                                );
                            })}
                            {students.filter(s => s.classroomId === Number(trackingClass)).length === 0 && (
                                <div className="p-4 text-center text-slate-500 font-bold">لا يوجد أطفال</div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        {selectedStudent ? (
                            <StudentReportDetail
                                student={selectedStudent}
                                attendance={attendance}
                                meals={meals}
                                sleeps={sleeps}
                                activities={activities}
                                report={dailyReports.find(r => r.studentId === selectedStudent.id) || { mood: 'happy', teacherNotes: '', healthIssues: '', sentToParent: false }}
                                generatedText={generateSummaryText(selectedStudent.id)}
                                onUpdateReport={handleUpdateReport}
                                onSendReport={handleSendReport}
                                formatDuration={formatDuration}
                            />
                        ) : (
                            <div className="bg-slate-50 border border-slate-200 rounded-3xl h-[calc(100vh-250px)] flex flex-col items-center justify-center p-12 text-center">
                                <FileText className="w-16 h-16 text-slate-300 mb-4" />
                                <h3 className="text-xl font-black text-slate-700 mb-2">اختر طفلاً</h3>
                                <p className="text-slate-500 font-medium max-w-sm">قم باختيار طفل من القائمة الجانبية لاستعراض تقريره اليومي والموافقة على إرساله لولي الأمر.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchoolDailyReports;
