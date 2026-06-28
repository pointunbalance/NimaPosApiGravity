import React from "react";
import { format } from "date-fns";
import { Edit2, Trash2, DollarSign, TrendingUp, Activity, Calendar } from "lucide-react";
import { FeasibilityStudy } from "../../types";

interface FeasibilityStudyCardProps {
  study: FeasibilityStudy;
  currencyCode: string;
  onEdit: (study: FeasibilityStudy) => void;
  onDelete: (id: number) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "under_review":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "approved":
      return "معتمدة";
    case "rejected":
      return "مرفوضة";
    case "under_review":
      return "قيد المراجعة";
    default:
      return "مسودة";
  }
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "high":
      return "text-red-600 bg-red-50";
    case "medium":
      return "text-amber-600 bg-amber-50";
    case "low":
      return "text-emerald-600 bg-emerald-50";
    default:
      return "text-slate-600 bg-slate-50";
  }
};

const getRiskText = (risk: string) => {
  switch (risk) {
    case "high":
      return "مرتفعة";
    case "medium":
      return "متوسطة";
    case "low":
      return "منخفضة";
    default:
      return risk;
  }
};

export const FeasibilityStudyCard: React.FC<FeasibilityStudyCardProps> = ({
  study,
  currencyCode,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col hover:border-indigo-300 transition-all shadow-sm hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 line-clamp-1">
            {study.title}
          </h3>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-bold ${getStatusColor(
                study.status
              )}`}
            >
              {getStatusText(study.status)}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-bold border ${getRiskColor(
                study.riskLevel
              )}`}
            >
              مخاطر {getRiskText(study.riskLevel)}
            </span>
          </div>
        </div>
        <div className="flex gap-1 bg-slate-50 p-1 rounded-xl shrink-0">
          <button
            onClick={() => onEdit(study)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => study.id && onDelete(study.id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {study.description && (
        <p className="text-slate-500 text-sm mb-5 line-clamp-2 min-h-[2.5rem]">
          {study.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5 flex-1">
        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <DollarSign className="w-4 h-4 text-rose-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              التكلفة المتوقعة
            </span>
          </div>
          <div className="text-base font-black text-slate-800">
            {study.expectedCost?.toLocaleString()}{" "}
            <span className="text-[10px] text-slate-400 font-bold">
              {currencyCode}
            </span>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              الإيراد المتوقع
            </span>
          </div>
          <div className="text-base font-black text-slate-800">
            {study.expectedRevenue?.toLocaleString()}{" "}
            <span className="text-[10px] text-slate-400 font-bold">
              {currencyCode}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                study.roi && study.roi >= 20
                  ? "bg-emerald-100 text-emerald-700"
                  : study.roi && study.roi > 0
                  ? "bg-blue-100 text-blue-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400">
                عائد الاستثمار (ROI)
              </div>
              <div className="font-bold text-slate-800 flex items-center gap-1">
                {study.roi?.toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="text-left">
            <div className="text-[11px] font-bold text-slate-400">
              فترة الاسترداد
            </div>
            <div className="font-bold text-slate-800">
              {study.paybackPeriod} أشهر
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-50 text-[11px] font-bold text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              تحديث:{" "}
              {study.updatedAt
                ? format(new Date(study.updatedAt), "yyyy/MM/dd")
                : "غير متوفر"}
            </span>
          </div>
          {study.projectId ? (
            <span className="bg-indigo-50 text-indigo-600 px-2 flex items-center py-0.5 rounded-md">
              مرتبط بمشروع
            </span>
          ) : (
            <span>دراسة حرة</span>
          )}
        </div>
      </div>
    </div>
  );
};
