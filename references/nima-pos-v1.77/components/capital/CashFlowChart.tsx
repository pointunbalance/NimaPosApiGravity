import React from 'react';
import { BarChart3 } from 'lucide-react';
import { 
  ResponsiveContainer, Tooltip as RechartsTooltip, 
  Bar, XAxis, YAxis, CartesianGrid, Legend, Area, ComposedChart, Line
} from 'recharts';

interface CashFlowChartProps {
  trendData: any[];
  formatCurrency: (amount: number) => string;
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ trendData, formatCurrency }) => {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 xl:col-span-2">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          تحليل التدفق النقدي (آخر 14 يوم نشاط)
        </h3>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trendData} margin={{top: 10, right: 10, left: 0, bottom: 0}}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
            <RechartsTooltip 
              contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)', backgroundColor: 'var(--tooltip-bg, #fff)', color: 'var(--tooltip-color, #333)'}}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
            <Area type="monotone" dataKey="income" name="الدخل (المبيعات)" stroke="#10b981" fill="url(#colorIncome)" strokeWidth={3} />
            <Bar dataKey="expense" name="المصروفات" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
            <Line type="monotone" dataKey="net" name="الصافي" stroke="#6366f1" strokeWidth={2} dot={{r: 3}} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CashFlowChart;
