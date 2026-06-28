import React from "react";
import { PieChart as PieIcon, BarChart3 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Legend,
  YAxis,
} from "recharts";
import { CostCenterAnalytics } from "./useCostCentersData";

interface CostCentersDashboardProps {
  analytics: CostCenterAnalytics;
  formatCurrency: (val: number) => string;
}

const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f43f5e",
];

const CostCentersDashboard: React.FC<CostCentersDashboardProps> = ({
  analytics,
  formatCurrency,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:grid-cols-3">
      {/* KPI Summary */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between print:border-black print:shadow-none">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">
              إجمالي التكاليف
            </p>
            <h3 className="text-2xl font-black text-red-600">
              {formatCurrency(analytics.totalExpenses)}
            </h3>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">
              إجمالي الإيرادات
            </p>
            <h3 className="text-2xl font-black text-emerald-600">
              {formatCurrency(analytics.totalIncome)}
            </h3>
          </div>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 print:bg-white print:border-black">
          <p className="text-sm font-bold text-slate-500 mb-1">
            صافي التكلفة
          </p>
          <h3 className="text-3xl font-black text-slate-800">
            {formatCurrency(analytics.totalExpenses - analytics.totalIncome)}
          </h3>
        </div>
        <div className="mt-4 print:hidden">
          <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
            الأكثر استهلاكاً للتكاليف
          </p>
          {analytics.chartData.slice(0, 3).map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center mb-2 last:mb-0"
            >
              <span className="text-sm font-medium text-slate-700">
                {item.name}
              </span>
              <span className="text-sm font-bold text-red-600">
                {(
                  (item.value / (analytics.totalExpenses || 1)) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Distribution Pie Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col print:border-black print:shadow-none">
        <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2 print:text-black">
          <PieIcon className="w-4 h-4 text-indigo-500 print:hidden" />{" "}
          توزيع التكاليف
        </h3>
        <div className="flex-1 min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={analytics.chartData.filter((d) => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {analytics.chartData
                  .filter((d) => d.value > 0)
                  .map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => formatCurrency(val)}
                contentStyle={{
                  backgroundColor: "#1f2937",
                  borderColor: "#374151",
                  color: "#f3f4f6",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget vs Actual Bar Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col print:border-black print:shadow-none">
        <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2 print:text-black">
          <BarChart3 className="w-4 h-4 text-emerald-500 print:hidden" />{" "}
          التكلفة مقابل الميزانية
        </h3>
        <div className="flex-1 min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.chartData.filter((d) => d.budget > 0)}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                fontSize={10}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af" }}
              />
              <YAxis hide />
              <Tooltip
                formatter={(val: number) => formatCurrency(val)}
                cursor={{ fill: "#f8fafc", opacity: 0.1 }}
                contentStyle={{
                  backgroundColor: "#1f2937",
                  borderColor: "#374151",
                  color: "#f3f4f6",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "10px", color: "#9ca3af" }} />
              <Bar
                dataKey="value"
                name="فعلي"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                barSize={15}
              />
              <Bar
                dataKey="budget"
                name="ميزانية"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                barSize={15}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CostCentersDashboard;
