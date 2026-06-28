import React from 'react';
import { Wallet, Building2, Landmark } from 'lucide-react';

interface BalanceSheetReportProps {
  balanceSheetData: any;
  incomeStatementData: any;
  formatCurrency: (amount: number) => string;
  goToLedger: (accountId: number) => void;
}

const BalanceSheetReport: React.FC<BalanceSheetReportProps> = ({
  balanceSheetData,
  incomeStatementData,
  formatCurrency,
  goToLedger
}) => {
  if (!balanceSheetData || !incomeStatementData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 print:block">
        {/* Assets Column */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden h-fit mb-6 print:shadow-none print:border print:break-inside-avoid">
            <div className="p-6 border-b border-slate-100 bg-blue-50/50 print:bg-white print:border-b-2">
                <h2 className="font-extrabold text-xl text-blue-900 flex items-center gap-2">
                    <Wallet className="w-6 h-6" /> الأصول (Assets)
                </h2>
            </div>
            <div className="p-6 space-y-2">
                {balanceSheetData.assets.map((a: any) => (
                    <div key={a.id} onClick={() => goToLedger(a.id!)} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                        <span className="font-bold text-slate-700">{a.name}</span>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(a.closingBalance)}</span>
                    </div>
                ))}
            </div>
            <div className="p-6 bg-blue-50 border-t border-blue-100 flex justify-between items-center print:bg-white print:border-t-2 print:border-black">
                <span className="font-bold text-blue-800">إجمالي الأصول</span>
                <span className="font-black text-xl text-blue-900">{formatCurrency(balanceSheetData.totalAssets)}</span>
            </div>
        </div>

        {/* Liabilities & Equity Column */}
        <div className="space-y-6 print:space-y-6">
            {/* Liabilities */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border print:break-inside-avoid">
                <div className="p-6 border-b border-slate-100 bg-red-50/50 print:bg-white print:border-b-2">
                    <h2 className="font-extrabold text-xl text-red-900 flex items-center gap-2">
                        <Building2 className="w-6 h-6" /> الخصوم (Liabilities)
                    </h2>
                </div>
                <div className="p-6 space-y-2">
                    {balanceSheetData.liabilities.length === 0 && <p className="text-center text-gray-400 italic py-2">لا توجد خصوم مسجلة</p>}
                    {balanceSheetData.liabilities.map((l: any) => (
                        <div key={l.id} onClick={() => goToLedger(l.id!)} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                            <span className="font-bold text-slate-700">{l.name}</span>
                            <span className="font-mono font-bold text-slate-900">{formatCurrency(Math.abs(l.closingBalance))}</span>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-red-50 border-t border-red-100 flex justify-between items-center print:bg-white print:border-t-2 print:border-black">
                    <span className="font-bold text-red-800">إجمالي الخصوم</span>
                    <span className="font-black text-lg text-red-900">{formatCurrency(balanceSheetData.totalLiabilities)}</span>
                </div>
            </div>

            {/* Equity */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border print:break-inside-avoid">
                <div className="p-6 border-b border-slate-100 bg-purple-50/50 print:bg-white print:border-b-2">
                    <h2 className="font-extrabold text-xl text-purple-900 flex items-center gap-2">
                        <Landmark className="w-6 h-6" /> حقوق الملكية (Equity)
                    </h2>
                </div>
                <div className="p-6 space-y-2">
                    {balanceSheetData.equity.map((e: any) => (
                        <div key={e.id} onClick={() => goToLedger(e.id!)} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                            <span className="font-bold text-slate-700">{e.name}</span>
                            <span className="font-mono font-bold text-slate-900">{formatCurrency(Math.abs(e.closingBalance))}</span>
                        </div>
                    ))}
                    {/* Net Profit Row */}
                    <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100 print:border print:bg-white">
                        <span className="font-bold text-emerald-800">صافي ربح الفترة (المرحل)</span>
                        <span className="font-mono font-bold text-emerald-900">{formatCurrency(incomeStatementData.netProfit)}</span>
                    </div>
                </div>
                <div className="p-4 bg-purple-50 border-t border-purple-100 flex justify-between items-center print:bg-white print:border-t-2 print:border-black">
                    <span className="font-bold text-purple-800">إجمالي حقوق الملكية</span>
                    <span className="font-black text-lg text-purple-900">{formatCurrency(balanceSheetData.totalEquity)}</span>
                </div>
            </div>

            {/* Validation Check */}
            <div className={`p-4 rounded-2xl text-center font-bold text-sm border print:border-black ${
                Math.abs(balanceSheetData.totalAssets - (balanceSheetData.totalLiabilities + balanceSheetData.totalEquity)) < 1 
                ? 'bg-green-100 text-green-800 border-green-200' 
                : 'bg-red-100 text-red-800 border-red-200'
            }`}>
                {Math.abs(balanceSheetData.totalAssets - (balanceSheetData.totalLiabilities + balanceSheetData.totalEquity)) < 1 
                    ? 'الميزانية متوازنة ✅' 
                    : `الميزانية غير متوازنة ❌ (الفرق: ${formatCurrency(balanceSheetData.totalAssets - (balanceSheetData.totalLiabilities + balanceSheetData.totalEquity))})`
                }
            </div>
        </div>
    </div>
  );
};

export default BalanceSheetReport;
