import React from 'react';
import { reportsList } from './useSchoolReports';

interface ReportsSidebarProps {
  selectedReport: string;
  setSelectedReport: (val: string) => void;
}

export const ReportsSidebar: React.FC<ReportsSidebarProps> = ({
  selectedReport,
  setSelectedReport,
}) => {
  const categories = ['الطلاب', 'الحضور والمتابعة', 'الحسابات', 'النشاط الأكاديمي', 'الموارد البشرية', 'الخدمات', 'العيادة'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-6 h-fit no-print">
      {categories.map((cat) => (
        <div key={cat} className="space-y-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-3">{cat}</h3>
          <div className="space-y-1">
            {reportsList
              .filter((r) => r.category === cat)
              .map((report) => {
                const Icon = report.icon;
                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      selectedReport === report.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        selectedReport === report.id ? 'text-indigo-600' : 'text-slate-400'
                      }`}
                    />
                    {report.name}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
};
