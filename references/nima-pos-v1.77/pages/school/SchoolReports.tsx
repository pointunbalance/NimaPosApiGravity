import React from 'react';
import { Download, Printer, PieChart } from 'lucide-react';

import { useSchoolReports, reportsList } from '../../components/school/reports/useSchoolReports';
import { ReportsSidebar } from '../../components/school/reports/ReportsSidebar';
import { ReportsTable } from '../../components/school/reports/ReportsTable';

export const SchoolReports = () => {
  const {
    selectedReport,
    setSelectedReport,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    classFilter,
    setClassFilter,
    levelFilter,
    setLevelFilter,
    reportData,
    printReport,
    exportCSV,
    classes,
    levels,
  } = useSchoolReports();

  const currentReportName = reportsList.find((r) => r.id === selectedReport)?.name || 'تقرير';

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">التقارير الشاملة</h1>
          <p className="text-slate-500 mt-1">عرض وطباعة وتصدير كافة تقارير الحضانة والمدرسة</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors cursor-pointer"
          >
            <Download className="w-5 h-5" /> تصدير Excel
          </button>
          <button
            onClick={printReport}
            className="bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-md transition-colors cursor-pointer"
          >
            <Printer className="w-5 h-5" /> طباعة التقرير
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Reports Sidebar */}
        <ReportsSidebar selectedReport={selectedReport} setSelectedReport={setSelectedReport} />

        {/* Report Content */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[700px]">
          {/* Filters */}
          <div className="p-5 border-b border-slate-100 bg-slate-50 shrink-0 no-print">
            <h2 className="text-xl font-black text-slate-800 mb-4">{currentReportName}</h2>
            <div className="flex flex-wrap gap-4 items-end">
              {/* Date Filter (Conditionally show based on report) */}
              {[
                'attendance_daily',
                'absence_monthly',
                'revenues',
                'daily_cash',
                'health_cases',
                'behavior',
                'events_trips',
                'complaints',
                'expenses',
              ].includes(selectedReport) && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">من تاريخ</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">إلى تاريخ</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {/* Level Filter */}
              {!['revenues', 'daily_cash'].includes(selectedReport) && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">المستوى</label>
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500 min-w-[150px]"
                  >
                    <option value={0}>جميع المستويات</option>
                    {levels.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Class Filter */}
              {!['revenues', 'daily_cash'].includes(selectedReport) && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الفصل / المجموعة</label>
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500 min-w-[150px]"
                  >
                    <option value={0}>جميع الفصول</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Report Table View */}
          <ReportsTable
            selectedReport={selectedReport}
            reportData={reportData}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; box-shadow: none; }
          .print-only { display: block !important; }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 1cm; }
        }
      `}</style>
    </div>
  );
};

export default SchoolReports;
