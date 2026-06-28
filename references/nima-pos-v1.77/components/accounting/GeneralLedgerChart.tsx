import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GeneralLedgerChartProps {
  chartData: any[];
  formatCurrency: (amount: number) => string;
}

export const GeneralLedgerChart: React.FC<GeneralLedgerChartProps> = ({ chartData, formatCurrency }) => {
  if (chartData.length <= 1) return null;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 print:hidden h-80">
      <h3 className="text-sm font-bold text-slate-600 mb-6">تطور الرصيد خلال الفترة</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => new Intl.NumberFormat('ar-IQ', {notation: "compact", compactDisplay: "short"}).format(val)} />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1f2937', color: '#f3f4f6' }}
            formatter={(value: number) => [formatCurrency(value), 'الرصيد']}
            labelStyle={{ fontWeight: 'bold', color: '#f3f4f6', marginBottom: '4px' }}
            itemStyle={{ color: '#f3f4f6' }}
          />
          <Line type="monotone" dataKey="balance" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6, strokeWidth: 0}} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
