import React from 'react';
import { PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface AssetsChartsProps {
  analytics: {
    categoryData: { name: string; value: number }[];
    topAssets: { name: string; cost: number; value: number }[];
  };
  formatCurrency: (val: number) => string;
  getCategoryLabel: (cat?: string) => string;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AssetsCharts: React.FC<AssetsChartsProps> = ({ analytics, formatCurrency, getCategoryLabel }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Value Distribution */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700 flex flex-col">
        <h3 className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> توزيع قيمة الأصول
        </h3>
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={analytics.categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {analytics.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(val:number) => formatCurrency(val)} 
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                itemStyle={{ color: '#f3f4f6' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 flex-wrap mt-2">
          {analytics.categoryData.map((entry, index) => (
            <div key={index} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-gray-400">
              <span className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
              {getCategoryLabel(entry.name)}
            </div>
          ))}
        </div>
      </div>

      {/* Asset Value vs Cost Chart */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700 flex flex-col">
        <h3 className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> القيمة الحالية مقابل التكلفة (أعلى الأصول)
        </h3>
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.topAssets}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="dark:stroke-gray-700" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} className="dark:text-gray-400" />
              <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} className="dark:text-gray-400" />
              <Tooltip 
                formatter={(val:number) => formatCurrency(val)} 
                cursor={{fill: '#f8fafc', className: 'dark:fill-gray-700'}}
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                itemStyle={{ color: '#f3f4f6' }}
              />
              <Legend wrapperStyle={{ color: '#9ca3af' }} />
              <Bar dataKey="cost" name="التكلفة الأصلية" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} className="dark:fill-gray-600" />
              <Bar dataKey="value" name="القيمة الحالية" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AssetsCharts;
