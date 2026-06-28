import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

interface CashFlowStatementReportProps {
  cashFlowData: {
    operating: { name: string; amount: number }[];
    investing: { name: string; amount: number }[];
    financing: { name: string; amount: number }[];
    netOperating: number;
    netInvesting: number;
    netFinancing: number;
    netChange: number;
    beginningBalance: number;
    endingBalance: number;
  };
  formatCurrency: (amount: number) => string;
}

const CashFlowStatementReport: React.FC<CashFlowStatementReportProps> = ({ cashFlowData, formatCurrency }) => {
  const renderSection = (title: string, items: { name: string; amount: number }[], netAmount: number, icon: React.ReactNode, colorClass: string) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right">
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-700">{item.name}</td>
                <td className={`p-4 font-bold ${item.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={2} className="p-4 text-center text-slate-500">لا توجد حركات</td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-slate-50 border-t border-slate-200">
            <tr>
              <td className="p-4 font-bold text-slate-800">صافي التدفقات النقدية</td>
              <td className={`p-4 font-bold text-lg ${colorClass}`}>
                {netAmount >= 0 ? '+' : ''}{formatCurrency(netAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 font-medium mb-2">رصيد النقدية أول المدة</h3>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(cashFlowData.beginningBalance)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 font-medium mb-2">صافي التغير في النقدية</h3>
          <p className={`text-2xl font-bold ${cashFlowData.netChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {cashFlowData.netChange >= 0 ? '+' : ''}{formatCurrency(cashFlowData.netChange)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl shadow-sm text-white">
          <h3 className="text-indigo-100 font-medium mb-2">رصيد النقدية آخر المدة</h3>
          <p className="text-3xl font-bold">{formatCurrency(cashFlowData.endingBalance)}</p>
        </div>
      </div>

      {renderSection(
        'التدفقات النقدية من الأنشطة التشغيلية',
        cashFlowData.operating,
        cashFlowData.netOperating,
        <Activity className="w-6 h-6 text-blue-600" />,
        cashFlowData.netOperating >= 0 ? 'text-emerald-600' : 'text-rose-600'
      )}

      {renderSection(
        'التدفقات النقدية من الأنشطة الاستثمارية',
        cashFlowData.investing,
        cashFlowData.netInvesting,
        <ArrowUpRight className="w-6 h-6 text-purple-600" />,
        cashFlowData.netInvesting >= 0 ? 'text-emerald-600' : 'text-rose-600'
      )}

      {renderSection(
        'التدفقات النقدية من الأنشطة التمويلية',
        cashFlowData.financing,
        cashFlowData.netFinancing,
        <ArrowDownRight className="w-6 h-6 text-amber-600" />,
        cashFlowData.netFinancing >= 0 ? 'text-emerald-600' : 'text-rose-600'
      )}
    </div>
  );
};

export default CashFlowStatementReport;
