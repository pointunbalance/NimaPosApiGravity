import React from "react";
import { ArrowRightLeft } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface CostAccountingDashboardProps {
  mockCostData: Array<{ name: string; materials: number; labor: number; overhead: number }>;
  pieData: Array<{ name: string; value: number }>;
  colors: string[];
}

const CostAccountingDashboard: React.FC<CostAccountingDashboardProps> = ({
  mockCostData,
  pieData,
  colors,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-bold">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 text-sm font-bold mb-2">إجمالي التكاليف (الشهر الحالي)</h3>
          <div className="text-3xl font-black text-slate-800">
            124,500 <span className="text-sm text-slate-500 font-normal">ر.س</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
            <ArrowRightLeft className="w-4 h-4" />
            <span>+5.2% مقارنة بالشهر السابق</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 text-sm font-bold mb-2">التكاليف المباشرة</h3>
          <div className="text-3xl font-black text-slate-800">
            82,000 <span className="text-sm text-slate-500 font-normal">ر.س</span>
          </div>
          <div className="mt-2 text-sm text-slate-500 font-medium">تمثل 65.8% من إجمالي التكاليف</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 text-sm font-bold mb-2">تراكم التكاليف غير المباشرة</h3>
          <div className="text-3xl font-black text-slate-800">
            42,500 <span className="text-sm text-slate-500 font-normal">ر.س</span>
          </div>
          <div className="mt-2 text-sm text-indigo-600 font-bold">بانتظار التوزيع (Allocation)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">تطور التكاليف (شهرياً)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockCostData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontWeight: "bold" }} />
                <YAxis tick={{ fontWeight: "bold" }} />
                <Tooltip contentStyle={{ borderRadius: "12px" }} />
                <Legend wrapperStyle={{ fontWeight: "bold" }} />
                <Bar dataKey="materials" name="مواد" stackId="a" fill="#0088FE" />
                <Bar dataKey="labor" name="أجور" stackId="a" fill="#00C49F" />
                <Bar dataKey="overhead" name="تكاليف غير مباشرة" stackId="a" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">هيكل التكاليف الحالي</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  className="font-bold text-xs"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostAccountingDashboard;
