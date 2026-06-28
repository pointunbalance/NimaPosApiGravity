import React from 'react';
import { UserCheck, FileText } from 'lucide-react';

interface LatestActivityTablesProps {
  latestStudents: any[];
  latestFinancials: any[];
}

export const LatestActivityTables: React.FC<LatestActivityTablesProps> = ({
  latestStudents,
  latestFinancials,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Latest Students */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
        <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-500" />
          آخر الأطفال المسجلين
        </h3>
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3 font-bold">اسم الطفل</th>
              <th className="p-3 font-bold">الكود</th>
              <th className="p-3 font-bold">تاريخ التسجيل</th>
            </tr>
          </thead>
          <tbody>
            {latestStudents.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center p-4 text-slate-400">
                  لا يوجد أطفال
                </td>
              </tr>
            ) : (
              latestStudents.map((child, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="p-3 font-bold text-slate-800">{child.name}</td>
                  <td className="p-3 text-slate-500 font-mono">{child.code}</td>
                  <td className="p-3 text-emerald-600 font-medium">حديث</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Latest Transactions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
        <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          آخر العمليات المالية
        </h3>
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3 font-bold">الوصف</th>
              <th className="p-3 font-bold">المبلغ</th>
              <th className="p-3 font-bold">النوع</th>
            </tr>
          </thead>
          <tbody>
            {latestFinancials.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center p-4 text-slate-400">
                  لا توجد عمليات
                </td>
              </tr>
            ) : (
              latestFinancials.map((entry, i) => {
                const isDebit =
                  entry.lines && entry.lines.length > 0 ? entry.lines[0].debit > 0 : false;
                return (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="p-3 font-bold text-slate-800 truncate max-w-[150px]">
                      {entry.description}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700">
                      {entry.totalAmount || 0}
                    </td>
                    <td className="p-3">
                      {isDebit ? (
                        <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded text-xs">
                          مدين (مصروف)
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs">
                          دائن (إيراد)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
