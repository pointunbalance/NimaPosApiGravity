import React from 'react';
import { PieChart as PieIcon } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';

interface AssetAllocationChartProps {
  assetAllocationData: any[];
  formatCurrency: (amount: number) => string;
  totalAssets: number;
}

const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({ 
  assetAllocationData, 
  formatCurrency, 
  totalAssets 
}) => {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
      <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
        <PieIcon className="w-5 h-5 text-indigo-500" />
        توزيع الأصول
      </h3>
      <div className="h-[250px] w-full relative flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={assetAllocationData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {assetAllocationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{borderRadius: '12px', border: 'none', backgroundColor: 'var(--tooltip-bg, #fff)', color: 'var(--tooltip-color, #333)'}} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Text */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center -mt-6 pointer-events-none">
          <span className="text-[10px] text-slate-400 block uppercase tracking-widest">الإجمالي</span>
          <span className="font-black text-slate-800 text-lg">{formatCurrency(totalAssets)}</span>
        </div>
      </div>
    </div>
  );
};

export default AssetAllocationChart;
