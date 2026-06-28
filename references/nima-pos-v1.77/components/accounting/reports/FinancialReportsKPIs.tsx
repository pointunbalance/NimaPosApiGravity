import React from 'react';

interface FinancialReportsKPIsProps {
  incomeStatementData: any;
  balanceSheetData: any;
  formatCurrency: (amount: number) => string;
}

const FinancialReportsKPIs: React.FC<FinancialReportsKPIsProps> = ({
  incomeStatementData,
  balanceSheetData,
  formatCurrency
}) => {
  if (!incomeStatementData || !balanceSheetData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 print:grid-cols-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col">
            <p className="text-xs font-bold text-emerald-600 uppercase mb-1">صافي الربح (فترة)</p>
            <h3 className="text-2xl font-black text-emerald-800">{formatCurrency(incomeStatementData.netProfit)}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 flex flex-col">
            <p className="text-xs font-bold text-blue-600 uppercase mb-1">إجمالي الأصول</p>
            <h3 className="text-2xl font-black text-blue-800">{formatCurrency(balanceSheetData.totalAssets)}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 flex flex-col">
            <p className="text-xs font-bold text-red-600 uppercase mb-1">إجمالي الالتزامات</p>
            <h3 className="text-2xl font-black text-red-800">{formatCurrency(balanceSheetData.totalLiabilities)}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100 flex flex-col">
            <p className="text-xs font-bold text-indigo-600 uppercase mb-1">هامش الربح</p>
            <h3 className="text-2xl font-black text-indigo-800">
                {incomeStatementData.totalRevenue > 0 
                    ? ((incomeStatementData.netProfit / incomeStatementData.totalRevenue) * 100).toFixed(1) 
                    : 0}%
            </h3>
        </div>
    </div>
  );
};

export default FinancialReportsKPIs;
