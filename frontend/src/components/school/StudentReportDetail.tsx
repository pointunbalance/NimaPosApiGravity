import React from 'react';
import { FileText, CheckCircle2, MessageCircle, Clock, Smile, Frown, Meh, Image as ImageIcon, Send, HeartPulse } from 'lucide-react';

const MOODS = [
    { id: 'happy', label: 'سعيد', icon: Smile, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
    { id: 'normal', label: 'عادي', icon: Meh, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { id: 'sad', label: 'حزين/منزعج', icon: Frown, color: 'text-rose-500 bg-rose-50 border-rose-200' },
];

interface StudentReportDetailProps {
  student: any;
  attendance: any[];
  meals: any[];
  sleeps: any[];
  activities: any[];
  report: any;
  generatedText: string;
  onUpdateReport: (studentId: number, field: string, value: any) => Promise<void>;
  onSendReport: (studentId: number) => Promise<void>;
  formatDuration: (sleepTime?: string, wakeTime?: string) => string | null;
}

export const StudentReportDetail: React.FC<StudentReportDetailProps> = ({
  student,
  attendance,
  meals,
  sleeps,
  report,
  generatedText,
  onUpdateReport,
  onSendReport,
  formatDuration
}) => {
  const att = attendance.find(a => a.studentId === student.id);
  const meal = meals.find(m => m.studentId === student.id);
  const slp = sleeps.find(s => s.studentId === student.id);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-250px)]" dir="rtl">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
                <h2 className="text-xl font-black text-slate-800">{student.name}</h2>
                <p className="text-sm font-medium text-slate-500">مراجعة بيانات اليوم وإضافة الملاحظات</p>
            </div>
            <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-200">
                {MOODS.map(m => (
                    <button 
                        key={m.id}
                        onClick={() => onUpdateReport(student.id, 'mood', m.id)}
                        className={`p-2 rounded-lg transition-colors border ${report.mood === m.id ? m.color : 'text-slate-400 border-transparent hover:bg-slate-200'}`}
                        title={m.label}
                    >
                        <m.icon className="w-5 h-5" />
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <Clock className="w-5 h-5 text-indigo-500 mb-2" />
                    <p className="text-xs font-bold text-slate-500 mb-1">الحضور</p>
                    <p className="text-sm font-black text-slate-800 dir-ltr text-right">{att?.inTime || '--:--'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <Clock className="w-5 h-5 text-indigo-500 mb-2" />
                    <p className="text-xs font-bold text-slate-500 mb-1">الانصراف</p>
                    <p className="text-sm font-black text-slate-800 dir-ltr text-right">{att?.outTime || '--:--'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <FileText className="w-5 h-5 text-emerald-500 mb-2" />
                    <p className="text-xs font-bold text-slate-500 mb-1">الغداء</p>
                    <p className="text-sm font-black text-slate-800">{meal?.meals?.['lunch']?.status || 'لم يسجل'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <FileText className="w-5 h-5 text-blue-500 mb-2" />
                    <p className="text-xs font-bold text-slate-500 mb-1">النوم</p>
                    <p className="text-sm font-black text-slate-800 dir-ltr text-right">
                        {formatDuration(slp?.sleepTime, slp?.wakeTime) || 'لم يسجل'}
                    </p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Send className="w-4 h-4 text-sky-500"/> الرسالة الجاهزة لولي الأمر</label>
                <div className="bg-sky-50 text-sky-900 border border-sky-200 p-4 rounded-xl text-sm font-medium leading-relaxed">
                    {generatedText}
                </div>
                <p className="text-xs text-slate-500 mt-2">يتم إنشاء هذا النص تلقائياً بناءً على البيانات المسجلة، يمكنك إضافة ملاحظات كمعلمة لإرفاقها بالرسالة.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2"><ImageIcon className="w-4 h-4 inline-block ml-1"/> إرفاق صور ومرفقات (اختياري)</label>
                    <input type="file" multiple className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2"><MessageCircle className="w-4 h-4 inline-block ml-1"/> ملاحظات المعلمة (تضاف للرسالة)</label>
                    <textarea 
                        value={report.teacherNotes || ''}
                        onChange={e => onUpdateReport(student.id, 'teacherNotes', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 resize-none font-medium text-sm"
                        rows={3}
                        placeholder="اكتب ملاحظة حول نشاط الطفل، سلوكه، تفاعله..."
                    ></textarea>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2"><HeartPulse className="w-4 h-4 inline-block ml-1 text-rose-500"/> ملاحظة صحية (إن وجدت)</label>
                    <textarea 
                        value={report.healthIssues || ''}
                        onChange={e => onUpdateReport(student.id, 'healthIssues', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 resize-none font-medium text-sm"
                        rows={3}
                        placeholder="مثال: كان يسعل اليوم، تم إعطاؤه دواء الساعة..."
                    ></textarea>
                </div>
            </div>

        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
            {report.sentToParent ? (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl font-bold">
                    <CheckCircle2 className="w-5 h-5"/> تم إرسال التقرير بنجاح
                </div>
            ) : (
                <button 
                    onClick={() => onSendReport(student.id)}
                    className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm shadow-sky-200"
                >
                    <Send className="w-4 h-4"/> إرسال التقرير لولي الأمر
                </button>
            )}
        </div>
    </div>
  );
};
