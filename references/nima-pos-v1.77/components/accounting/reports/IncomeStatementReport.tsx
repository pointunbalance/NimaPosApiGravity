import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface IncomeStatementReportProps {
  incomeStatementData: any;
  expenseChartData: any[];
  formatCurrency: (amount: number) => string;
  currencyCode: string;
  goToLedger: (accountId: number) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const IncomeStatementReport: React.FC<IncomeStatementReportProps> = ({
  incomeStatementData,
  expenseChartData,
  formatCurrency,
  currencyCode,
  goToLedger
}) => {
  if (!incomeStatementData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Statement Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden print:shadow-none print:border print:col-span-3">
            <div className="p-6 space-y-8">
                {/* Revenue */}
                <div>
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" /> الإيرادات (Revenues)
                    </h3>
                    <div className="space-y-2">
                        {incomeStatementData.revenues.map((r: any) => (
                            <div key={r.id} onClick={() => goToLedger(r.id!)} className="flex justify-between items-center text-sm cursor-pointer hover:bg-slate-50 p-2 rounded group">
                                <span className="font-bold text-slate-600 group-hover:text-indigo-600">{r.name}</span>
                                <span className="font-mono text-slate-700">{formatCurrency(r.periodCredit - r.periodDebit)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed border-slate-300 font-bold text-emerald-700 text-lg bg-emerald-50/50 p-2 rounded">
                            <span>إجمالي الإيرادات</span>
                            <span>{formatCurrency(incomeStatementData.totalRevenue)}</span>
                        </div>
                    </div>
                </div>

                {/* Expenses */}
                <div>
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                        <TrendingDown className="w-4 h-4 text-red-600" /> المصروفات (Expenses)
                    </h3>
                    <div className="space-y-2">
                        {incomeStatementData.expenses.map((e: any) => (
                            <div key={e.id} onClick={() => goToLedger(e.id!)} className="flex justify-between items-center text-sm cursor-pointer hover:bg-slate-50 p-2 rounded group">
                                <span className="font-bold text-slate-600 group-hover:text-indigo-600">{e.name}</span>
                                <span className="font-mono text-slate-700">{formatCurrency(e.periodDebit - e.periodCredit)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed border-slate-300 font-bold text-red-700 text-lg bg-red-50/50 p-2 rounded">
                            <span>إجمالي المصروفات</span>
                            <span>({formatCurrency(incomeStatementData.totalExpenses)})</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 text-white p-6 flex justify-between items-center text-xl print:bg-white print:text-black print:border-t-2 print:border-black">
                <span className="font-medium">صافي الربح / الخسارة</span>
                <span className={`font-black ${incomeStatementData.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} print:text-black`}>
                    {formatCurrency(incomeStatementData.netProfit)} {currencyCode}
                </span>
            </div>
        </div>

        {/* Charts (Hidden on Print) */}
        <div className="flex flex-col gap-6 print:hidden">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" /> أعلى المصروفات
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={expenseChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {expenseChartData?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip 
                                formatter={(val: number) => formatCurrency(val)} 
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                itemStyle={{ color: '#f3f4f6' }}
                            />
                            <Legend wrapperStyle={{ color: '#9ca3af' }}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
};

export default IncomeStatementReport;
