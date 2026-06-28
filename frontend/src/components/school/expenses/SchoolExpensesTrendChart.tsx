import React from 'react';
import { Calendar, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SchoolExpensesTrendChartProps {
  trendData: { name: string; value: number }[];
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  formatCurrency: (amount: number) => string;
}

const SchoolExpensesTrendChart: React.FC<SchoolExpensesTrendChartProps> = ({ trendData, dateRange, setDateRange, formatCurrency }) => {
  return (
    <div className="xl:col-span-1 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            تحليل المصروفات
          </h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip 
                cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--bg-color, #fff)', color: 'var(--text-color, #333)' }}
                formatter={(value: number) => [formatCurrency(value), 'المبلغ']}
                wrapperClassName="dark:!bg-gray-800 dark:!text-white"
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {trendData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === trendData.length - 1 ? '#4f46e5' : '#c7d2fe'} className="" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-indigo-600" />
          تحديد الفترة
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">من تاريخ</label>
            <input 
              type="date" 
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">إلى تاريخ</label>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolExpensesTrendChart;
