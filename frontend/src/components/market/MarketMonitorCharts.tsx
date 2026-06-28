import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend 
} from 'recharts';

interface MarketMonitorChartsProps {
  marketTrendsData: any[];
  salesCorrelationData: any[];
}

const MarketMonitorCharts: React.FC<MarketMonitorChartsProps> = ({ marketTrendsData, salesCorrelationData }) => {
  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Market Trends Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">مؤشرات السلع العالمية (تنبؤات)</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={marketTrendsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="oil" name="النفط" stroke="#EF4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="gold" name="الذهب" stroke="#F59E0B" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="wheat" name="القمح" stroke="#10B981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="electronics" name="الإلكترونيات" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales Correlation Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">مقارنة طلب السوق مع مبيعاتنا</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesCorrelationData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
              <Tooltip 
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Legend />
              <Bar dataKey="marketDemand" name="الطلب في السوق" fill="#818CF8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ourSales" name="مبيعاتنا" fill="#34D399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MarketMonitorCharts;
