import React from "react";
import { CostCenter } from "../../types";
import { CostCenterAnalytics } from "./useCostCentersData";
import {
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Building,
} from "lucide-react";

interface CostCentersGridProps {
  analytics: CostCenterAnalytics;
  formatCurrency: (val: number) => string;
  onSelectCenter: (id: number) => void;
  onEdit: (center: CostCenter) => void;
  onDeleteClick: (id: number) => void;
}

const CostCentersGrid: React.FC<CostCentersGridProps> = ({
  analytics,
  formatCurrency,
  onSelectCenter,
  onEdit,
  onDeleteClick,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:grid-cols-2">
      {analytics.filteredCenters.map((center) => {
        const centerStats = analytics.stats.get(center.id!);
        const expense = centerStats?.expense || 0;
        const income = centerStats?.income || 0;
        const netCost = expense - income;
        const budget = center.budget || 0;
        const percent = budget > 0 ? (expense / budget) * 100 : 0;
        const remaining = Math.max(0, budget - expense);
        const isOverBudget = budget > 0 && expense > budget;

        return (
          <div
            key={center.id}
            className={`bg-white p-5 rounded-2xl border transition-all hover:shadow-lg cursor-pointer group print:border-black print:shadow-none ${
              isOverBudget
                ? "border-red-200 ring-1 ring-red-100"
                : "border-slate-200"
            }`}
            onClick={() => onSelectCenter(center.id!)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200 print:border-black print:bg-white">
                  {center.code}
                </span>
                <h3 className="font-bold text-lg text-gray-800 mt-2 line-clamp-1 print:text-black">
                  {center.name}
                </h3>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(center);
                  }}
                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(center.id!);
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Financials */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 print:bg-white print:border-black">
                  <p className="text-[10px] text-slate-400 font-bold mb-1">
                    المصروف
                  </p>
                  <p className="text-sm font-black text-red-600">
                    {formatCurrency(expense)}
                  </p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 print:bg-white print:border-black">
                  <p className="text-[10px] text-slate-400 font-bold mb-1">
                    الإيراد
                  </p>
                  <p className="text-sm font-black text-emerald-600">
                    {formatCurrency(income)}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <p className="text-xs text-slate-500 font-bold">
                    صافي التكلفة
                  </p>
                  <p className="text-lg font-black text-slate-800 print:text-black">
                    {formatCurrency(netCost)}
                  </p>
                </div>
                {budget > 0 && (
                  <>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2 print:border print:border-black print:bg-white">
                      <div
                        className={`h-full rounded-full print:bg-black ${
                          isOverBudget
                            ? "bg-red-500"
                            : percent > 80
                            ? "bg-orange-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">
                        الميزانية: {formatCurrency(budget)}
                      </span>
                      {isOverBudget ? (
                        <span className="text-red-600 font-bold flex items-center gap-1 print:text-black">
                          <AlertTriangle className="w-3 h-3" /> تجاوز
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold flex items-center gap-1 print:text-black">
                          <CheckCircle2 className="w-3 h-3" /> متبقي{" "}
                          {formatCurrency(remaining)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-50 print:border-black">
                <span className="text-xs text-slate-400 font-medium">
                  {centerStats?.count || 0} عملية مسجلة
                </span>
                <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline print:hidden">
                  التفاصيل <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {analytics.filteredCenters.length === 0 && (
        <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed border-slate-200 rounded-3xl print:hidden">
          <Building className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>لا توجد مراكز تكلفة مطابقة. ابدأ بإضافة مركز جديد.</p>
        </div>
      )}
    </div>
  );
};

export default CostCentersGrid;
