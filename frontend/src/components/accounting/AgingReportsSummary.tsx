import React from "react";
import { BarChart3, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

interface AgingReportsSummaryProps {
  chartData: Array<{ name: string; value: number; color: string }>;
  totals: { total: number; "0-30": number; "31-60": number; "61-90": number; "90+": number };
  formatCurrency: (amount: number) => string;
}

const AgingReportsSummary: React.FC<AgingReportsSummaryProps> = ({
  chartData,
  totals,
  formatCurrency,
}) => {
  const percentage90 = totals.total > 0 ? ((totals["90+"] / totals.total) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:grid-cols-3">
      {/* Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 lg:col-span-2 print:border-black print:shadow-none print:bg-white">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 print:text-black">
          <BarChart3 className="w-5 h-5 text-indigo-500 print:hidden" />
          توزيع الديون زمنياً
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#f1f5f9"
              />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={80}
                tick={{ fontSize: 12, fontWeight: "bold" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  backgroundColor: "#1f2937",
                  color: "#f3f4f6",
                }}
                formatter={(val: number) => formatCurrency(val)}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4 font-bold">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-center print:border-black print:shadow-none print:bg-white">
          <p className="text-sm text-slate-400 font-bold mb-2 uppercase print:text-black">
            الإجمالي الكلي
          </p>
          <p className="text-3xl font-black text-slate-800 print:text-black">
            {formatCurrency(totals.total)}
          </p>
        </div>
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-center print:bg-white print:border-black print:shadow-none">
          <div className="flex items-center justify-center gap-2 mb-2 text-red-600 print:text-black">
            <AlertTriangle className="w-5 h-5 print:hidden" />
            <p className="text-sm font-bold uppercase">ديون متعثرة (+90 يوم)</p>
          </div>
          <p className="text-2xl font-black text-red-700 print:text-black">
            {formatCurrency(totals["90+"])}
          </p>
          <p className="text-xs text-red-500 mt-1 print:text-black">
            تمثل {percentage90}% من الإجمالي
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgingReportsSummary;
