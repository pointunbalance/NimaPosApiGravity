import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { 
  TrendingUp, TrendingDown, Wallet, 
  ArrowUpRight, ArrowDownRight, Calendar, ArrowRightLeft 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts';

export const CashFlowDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const transactions = useLiveQuery(() => db.treasuryTransactions.toArray(), []);

  const flowData = useMemo(() => {
    if (!transactions) return null;

    const start = new Date(dateRange.start).getTime();
    const end = new Date(dateRange.end).setHours(23, 59, 59, 999);

    const filtered = transactions.filter(t => {
      const d = new Date(t.date).getTime();
      return d >= start && d <= end;
    });

    const inflow = filtered.filter(t => t.type === 'inflow');
    const outflow = filtered.filter(t => t.type === 'outflow');

    const totalInflow = inflow.reduce((sum, t) => sum + t.amount, 0);
    const totalOutflow = outflow.reduce((sum, t) => sum + t.amount, 0);
    const netCashFlow = totalInflow - totalOutflow;

    // Daily breakdown for chart
    const dailyMap = new Map();
    filtered.forEach(t => {
      const dateStr = new Date(t.date).toLocaleDateString('ar-EG');
      if (!dailyMap.has(dateStr)) dailyMap.set(dateStr, { date: dateStr, inflow: 0, outflow: 0 });
      if (t.type === 'inflow') dailyMap.get(dateStr).inflow += t.amount;
      else dailyMap.get(dateStr).outflow += t.amount;
    });

    const chartData = Array.from(dailyMap.values()).map(d => ({
      ...d,
      net: d.inflow - d.outflow
    }));

    return {
      totalInflow,
      totalOutflow,
      netCashFlow,
      chartData,
      recentTransactions: filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
    };
  }, [transactions, dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0
    }).format(amount).replace('SAR', 'ر.س');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!flowData) return;
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Cash Flow Dashboard Report\n";
    csvContent += `Period,${dateRange.start} to ${dateRange.end}\n\n`;
    
    csvContent += "Type,Amount\n";
    csvContent += `Total Inflow,${flowData.totalInflow}\n`;
    csvContent += `Total Outflow,${flowData.totalOutflow}\n`;
    csvContent += `Net Cash Flow,${flowData.netCashFlow}\n\n`;
    
    csvContent += "Recent Transactions\n";
    csvContent += "Date,Type,Description,Amount\n";
    flowData.recentTransactions.forEach(t => {
      csvContent += `${new Date(t.date).toLocaleDateString("en-US")},${t.type === 'inflow' ? 'Inflow' : 'Outflow'},${t.description.replace(/,/g, " ")},${t.amount}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cash_flow_${dateRange.start}_${dateRange.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 font-['Tajawal'] bg-slate-50 h-full overflow-y-auto print:p-0 print:bg-white" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <ArrowRightLeft className="w-8 h-8 text-indigo-600" />
            لوحة التدفقات النقدية
          </h1>
          <p className="text-slate-500 mt-1">Cash Flow Dashboard</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
            <Calendar className="w-5 h-5 text-slate-400" />
            <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent border-none outline-none font-bold text-slate-700 text-sm" />
            <span className="text-slate-400">-</span>
            <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent border-none outline-none font-bold text-slate-700 text-sm" />
          </div>
          <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm text-sm flex items-center gap-2">
            تصدير CSV
          </button>
          <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold transition-colors shadow-sm text-sm flex items-center gap-2">
            طباعة
          </button>
        </div>
      </div>

      {flowData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-bold">التدفقات النقدية الداخلة (Inflow)</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">{formatCurrency(flowData.totalInflow)}</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                  <ArrowDownRight className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-bold">التدفقات النقدية الخارجة (Outflow)</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">{formatCurrency(flowData.totalOutflow)}</h3>
                </div>
              </div>
            </div>

            <div className={`rounded-3xl p-6 shadow-sm border flex items-center ${flowData.netCashFlow >= 0 ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-red-600 border-red-700 text-white'}`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold opacity-80">صافي التدفق النقدي (Net)</p>
                  <h3 className="text-3xl font-black mt-1" dir="ltr">{formatCurrency(flowData.netCashFlow)}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="col-span-1 lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6">التحليل اليومي للتدفقات النقدية</h3>
              <div className="h-80" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={flowData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontFamily: 'Tajawal', fontSize: 12}} />
                    <YAxis tickFormatter={(val) => val / 1000 + 'k'} tick={{fontFamily: 'Tajawal', fontSize: 12}} />
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{fontFamily: 'Tajawal', borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend wrapperStyle={{fontFamily: 'Tajawal', fontWeight: 'bold'}} />
                    <Bar dataKey="inflow" name="داخل (Inflow)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="outflow" name="خارج (Outflow)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="net" name="الصافي (Net)" stroke="#6366f1" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6">أحدث الحركات النقدية</h3>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {flowData.recentTransactions.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${t.type === 'inflow' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {t.type === 'inflow' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{t.description || (t.type === 'inflow' ? 'مقبوضات' : 'مدفوعات')}</p>
                        <p className="text-xs text-slate-500 mt-1">{new Date(t.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className={`font-mono font-bold ${t.type === 'inflow' ? 'text-emerald-600' : 'text-red-600'}`} dir="ltr">
                      {t.type === 'inflow' ? '+' : '-'}{formatCurrency(t.amount)}
                    </div>
                  </div>
                ))}
                {flowData.recentTransactions.length === 0 && (
                  <div className="text-center text-slate-500 py-8">لا توجد حركات نقدية مسجلة</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
