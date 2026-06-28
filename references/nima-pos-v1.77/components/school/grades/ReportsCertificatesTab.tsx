import React from 'react';
import { Award, BarChart3, Send } from 'lucide-react';

interface ReportsCertificatesTabProps {
  reportClassFilter: number;
  setReportClassFilter: (id: number) => void;
  reportStudentFilter: number;
  setReportStudentFilter: (id: number) => void;
  classes: any[];
  studentsForReports: any[];
  printReport: (studentId: number, date: string, type: string) => void;
  handleSendReport: (studentId: number) => void;
}

export const ReportsCertificatesTab: React.FC<ReportsCertificatesTabProps> = ({
  reportClassFilter,
  setReportClassFilter,
  reportStudentFilter,
  setReportStudentFilter,
  classes,
  studentsForReports,
  printReport,
  handleSendReport,
}) => {
  return (
    <div className="p-6 animate-in fade-in duration-300" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl">
          <h3 className="text-lg font-black text-indigo-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" /> توليد شهادات وتقارير الأطفال
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-indigo-800 mb-2">الفصل / المستوى</label>
              <select
                value={reportClassFilter}
                onChange={(e) => {
                  setReportClassFilter(Number(e.target.value));
                  setReportStudentFilter(0);
                }}
                className="w-full border-indigo-200 bg-white rounded-xl px-4 py-3 font-bold text-slate-800 outline-none"
              >
                <option value={0}>-- اختر الفصل --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {reportClassFilter > 0 && (
              <div>
                <label className="block text-sm font-bold text-indigo-800 mb-2">اسم الطفل</label>
                <select
                  value={reportStudentFilter}
                  onChange={(e) => setReportStudentFilter(Number(e.target.value))}
                  className="w-full border-indigo-200 bg-white rounded-xl px-4 py-3 font-bold text-slate-800 outline-none"
                >
                  <option value={0}>-- اختر الطفل --</option>
                  {studentsForReports.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {reportStudentFilter > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => printReport(reportStudentFilter, new Date().toISOString().split('T')[0], 'daily')}
              type="button"
              className="bg-white border-2 border-indigo-200 hover:border-indigo-600 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition group font-bold text-indigo-950"
            >
              <BarChart3 className="w-8 h-8 text-indigo-400 group-hover:text-indigo-600 transition" />
              <span>طباعة تقرير تتبعي (اليوم)</span>
            </button>
            <button
              onClick={() => printReport(reportStudentFilter, new Date().toISOString().split('T')[0], 'monthly')}
              type="button"
              className="bg-indigo-600 text-white p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/30 font-bold"
            >
              <Award className="w-8 h-8" />
              <span>طباعة الشهادة الشهرية</span>
            </button>

            <div className="col-span-2 pt-4 flex justify-center">
              <button
                onClick={() => handleSendReport(reportStudentFilter)}
                type="button"
                className="bg-emerald-500 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-emerald-600 transition shadow-md shadow-emerald-500/20"
              >
                <Send className="w-5 h-5" /> إرسال التقرير لولي الأمر عبر الواتساب
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ReportsCertificatesTab;
