import React from "react";
import { FolderGit2, Banknote, Building2, ArrowUpRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ProjectAccountingOverviewProps {
  totalActive: number;
  totalRevenue: number;
  totalActual: number;
  defaultProjects: Array<{ name: string; budget: number; actual: number; revenue: number }>;
}

const ProjectAccountingOverview: React.FC<ProjectAccountingOverviewProps> = ({
  totalActive,
  totalRevenue,
  totalActual,
  defaultProjects,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-bold">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm">مشاريع نشطة</p>
            <h4 className="text-2xl font-bold text-slate-800">{totalActive}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm">إجمالي الإيرادات المثبتة</p>
            <h4 className="text-2xl font-bold text-slate-800">
              {(totalRevenue / 1000000).toFixed(1)}M ر.س
            </h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm">إجمالي التكاليف الفعلية</p>
            <h4 className="text-2xl font-bold text-slate-800">
              {(totalActual / 1000000).toFixed(1)}M ر.س
            </h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm">المستخلصات المعتمدة</p>
            <h4 className="text-2xl font-bold text-slate-800">
              {((totalRevenue * 0.8) / 1000000).toFixed(1)}M ر.س
            </h4>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">
          أداء المشاريع (الموازنة مقابل الفعلي والإيرادات)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={defaultProjects}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontWeight: "bold" }} />
              <YAxis tick={{ fontWeight: "bold" }} />
              <Tooltip
                contentStyle={{ borderRadius: "12px" }}
                formatter={(value: any) => `${value.toLocaleString()} ر.س`}
              />
              <Legend wrapperStyle={{ fontWeight: "bold" }} />
              <Bar dataKey="budget" name="الموازنة التقديرية" fill="#94a3b8" />
              <Bar dataKey="actual" name="التكاليف الفعلية" fill="#f59e0b" />
              <Bar dataKey="revenue" name="الإيرادات المثبتة" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProjectAccountingOverview;
