import React from "react";
import { Search } from "lucide-react";
import { ProjectItem } from "./useProjectAccountingData";

interface ProjectAccountingTableProps {
  filteredList: ProjectItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onEdit: (proj: ProjectItem) => void;
  onDelete: (id: number) => void;
}

const ProjectAccountingTable: React.FC<ProjectAccountingTableProps> = ({
  filteredList,
  searchTerm,
  setSearchTerm,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden font-bold">
      <div className="p-4 border-b border-slate-200">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث عن مشروع..."
            className="w-full pl-4 pr-10 py-2 border border-slate-200 bg-white text-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
            <tr>
              <th className="px-6 py-3">الرمز</th>
              <th className="px-6 py-3">اسم المشروع</th>
              <th className="px-6 py-3">العميل</th>
              <th className="px-6 py-3">قيمة العقد</th>
              <th className="px-6 py-3">نسبة الإنجاز</th>
              <th className="px-6 py-3">الحالة</th>
              <th className="px-6 py-3 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700 font-bold">
            {filteredList.map((p, index) => (
              <tr key={p.id ?? index} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-950">{p.projectId}</td>
                <td className="px-6 py-4 text-slate-900 font-black">{p.name}</td>
                <td className="px-6 py-4 text-slate-600">{p.customerId}</td>
                <td className="px-6 py-4 text-emerald-600 font-black">
                  {p.budget.toLocaleString()} ر.س
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${p.completionPercentage}%` }}
                      ></div>
                    </div>
                    <span>{p.completionPercentage}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => onEdit(p)}
                      className="text-emerald-600 hover:text-emerald-900 font-bold transition-colors"
                    >
                      تعديل
                    </button>
                    {p.id && (
                      <button
                        onClick={() => onDelete(Number(p.id))}
                        className="text-red-500 hover:text-red-700 font-bold transition-colors"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredList.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">
                  لا توجد مشاريع مسجلة تطابق البحث.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectAccountingTable;
