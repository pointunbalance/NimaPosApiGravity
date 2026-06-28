import React from 'react';

interface AssetsKPIsProps {
  analytics: {
    totalCost: number;
    totalAccumulated: number;
    totalBookValue: number;
  };
  formatCurrency: (val: number) => string;
}

const AssetsKPIs: React.FC<AssetsKPIsProps> = ({ analytics, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700 flex flex-col print:border-black print:shadow-none print:bg-white">
        <p className="text-slate-400 dark:text-gray-500 text-xs font-bold uppercase mb-2 print:text-black">إجمالي تكلفة الأصول (التاريخية)</p>
        <h3 className="text-3xl font-black text-slate-800 dark:text-white print:text-black">{formatCurrency(analytics.totalCost)}</h3>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700 flex flex-col print:border-black print:shadow-none print:bg-white">
        <p className="text-slate-400 dark:text-gray-500 text-xs font-bold uppercase mb-2 print:text-black">مجمع الإهلاك (المتراكم)</p>
        <h3 className="text-3xl font-black text-red-600 dark:text-red-400 print:text-black">-{formatCurrency(analytics.totalAccumulated)}</h3>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700 flex flex-col relative overflow-hidden print:border-black print:shadow-none print:bg-white">
        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500 print:hidden"></div>
        <p className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase mb-2 print:text-black">القيمة الدفترية الحالية (Net Book Value)</p>
        <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-300 print:text-black">{formatCurrency(analytics.totalBookValue)}</h3>
      </div>
    </div>
  );
};

export default AssetsKPIs;
