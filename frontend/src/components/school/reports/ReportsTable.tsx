import React from 'react';
import { PieChart } from 'lucide-react';
import { reportsList } from './useSchoolReports';

interface ReportsTableProps {
  selectedReport: string;
  reportData: any[];
  startDate: string;
  endDate: string;
}

export const ReportsTable: React.FC<ReportsTableProps> = ({
  selectedReport,
  reportData,
  startDate,
  endDate,
}) => {
  const currentReportName = reportsList.find((r) => r.id === selectedReport)?.name || 'تقرير';

  return (
    <div className="p-6 flex-1 overflow-auto print-area">
      <div className="print-only hidden mb-8 pb-4 border-b-2 border-slate-800 text-center">
        <h1 className="text-2xl font-black mb-2">{currentReportName}</h1>
        <p className="text-slate-600">تاريخ الطباعة: {new Date().toLocaleString('ar-EG')}</p>
        {startDate &&
          endDate &&
          [
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
            <p className="text-slate-600 mt-1">
              عن الفترة: {startDate} إلى {endDate}
            </p>
          )}
      </div>

      {reportData.length > 0 ? (
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {Object.keys(reportData[0]).map((key) => (
                <th key={key} className="px-4 py-3 font-bold border-b border-slate-200">
                  {key === 'code'
                    ? 'الكود'
                    : key === 'name'
                    ? 'الاسم'
                    : key === 'level'
                    ? 'المستوى'
                    : key === 'classroom'
                    ? 'الفصل'
                    : key === 'parentPhone'
                    ? 'رقم ولي الأمر'
                    : key === 'childName'
                    ? 'اسم الطفل'
                    : key === 'date'
                    ? 'التاريخ'
                    : key === 'status'
                    ? 'الحالة'
                    : key === 'amount'
                    ? 'المبلغ'
                    : key === 'amountDue'
                    ? 'المستحق'
                    : key === 'receipt'
                    ? 'الإيصال'
                    : key === 'feeName'
                    ? 'البند'
                    : key === 'method'
                    ? 'الطريقة'
                    : key === 'type'
                    ? 'النوع'
                    : key === 'details'
                    ? 'التفاصيل'
                    : key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reportData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                {Object.values(row).map((val: any, jdx) => (
                  <td key={jdx} className="px-4 py-3 font-medium text-slate-800">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <PieChart className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-bold">لا توجد بيانات مطابقة لمعايير التقرير</p>
          <p className="text-sm">قم بتعديل الفلاتر أو تحديد فترة مختلفة</p>
        </div>
      )}
    </div>
  );
};
export default ReportsTable;
