import React from 'react';
import { Receipt, FileText } from 'lucide-react';

interface TaxesTabProps {
  stats: {
    totalSales: number;
    totalTaxCollected: number;
    totalOrders: number;
  };
  formatCurrency: (amount: number) => string;
}

const TaxesTab: React.FC<TaxesTabProps> = ({ stats, formatCurrency }) => {
  const taxableSales = stats.totalSales - stats.totalTaxCollected;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-xs font-bold uppercase">إجمالي المبيعات (شامل الضريبة)</p>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><FileText className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-800">{formatCurrency(stats.totalSales)}</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-xs font-bold uppercase">المبيعات الخاضعة للضريبة</p>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FileText className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-800">{formatCurrency(taxableSales)}</h3>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-3xl shadow-lg text-white flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <p className="text-orange-100 text-xs font-bold uppercase">الضريبة المحصلة</p>
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg"><Receipt className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-extrabold">{formatCurrency(stats.totalTaxCollected)}</h3>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-slate-800">ملخص الإقرار الضريبي</h3>
        </div>
        <div className="p-6">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">البيان</th>
                <th className="px-6 py-4">القيمة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-700">إجمالي المبيعات الخاضعة للضريبة</td>
                <td className="px-6 py-4 text-slate-600">{formatCurrency(taxableSales)}</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-700">إجمالي ضريبة القيمة المضافة المحصلة</td>
                <td className="px-6 py-4 text-slate-600">{formatCurrency(stats.totalTaxCollected)}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="px-6 py-4 font-extrabold text-slate-800">الإجمالي الشامل للضريبة</td>
                <td className="px-6 py-4 font-extrabold text-slate-800">{formatCurrency(stats.totalSales)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaxesTab;
