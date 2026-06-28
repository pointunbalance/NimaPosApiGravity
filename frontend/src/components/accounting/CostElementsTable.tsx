import React from "react";
import { Search, Filter } from "lucide-react";
import { CostElement } from "./useCostAccountingData";

interface CostElementsTableProps {
  filteredElements: CostElement[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onEdit: (item: CostElement) => void;
  onDelete: (id: number) => void;
}

const CostElementsTable: React.FC<CostElementsTableProps> = ({
  filteredElements,
  searchQuery,
  setSearchQuery,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden font-bold">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث عن عنصر تكلفة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
          />
        </div>
        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Filter className="w-5 h-5" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
            <tr>
              <th className="px-6 py-3">الرمز</th>
              <th className="px-6 py-3">الاسم</th>
              <th className="px-6 py-3">النوع</th>
              <th className="px-6 py-3">السلوك</th>
              <th className="px-6 py-3">مركز التكلفة الافتراضي</th>
              <th className="px-6 py-3 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {filteredElements.map((item, idx) => (
              <tr key={item.id ?? idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900">{item.code}</td>
                <td className="px-6 py-4">{item.name}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      item.type === "مباشرة" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      item.behavior === "متغيرة" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {item.behavior}
                  </span>
                </td>
                <td className="px-6 py-4">{item.defaultCenter}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-indigo-600 hover:text-indigo-900 transition-colors font-bold"
                    >
                      تعديل
                    </button>
                    {item.id && (
                      <button
                        onClick={() => onDelete(Number(item.id))}
                        className="text-red-500 hover:text-red-700 transition-colors font-bold"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredElements.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">
                  لا توجد عناصر تكلفة مسجلة تطابق البحث.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostElementsTable;
