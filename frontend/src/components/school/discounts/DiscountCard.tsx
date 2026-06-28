import React from "react";
import { Percent, Clock, CheckCircle2, XCircle, User as UserIcon, Check, X } from "lucide-react";
import { format } from "date-fns";

interface DiscountCardProps {
  discount: any;
  student: any;
  typeLabel: string;
  updateStatus: (id: number, status: "approved" | "rejected") => void;
}

export const DiscountCard: React.FC<DiscountCardProps> = ({
  discount,
  student,
  typeLabel,
  updateStatus,
}) => {
  return (
    <div
      className={`bg-white rounded-3xl border overflow-hidden flex flex-col shadow-sm transition-all hover:shadow-md ${
        discount.status === "pending"
          ? "border-amber-200"
          : discount.status === "approved"
          ? "border-emerald-200"
          : "border-rose-200"
      }`}
    >
      <div
        className={`p-5 border-b flex justify-between items-start ${
          discount.status === "pending"
            ? "bg-amber-50/50 border-amber-100"
            : discount.status === "approved"
            ? "bg-emerald-50/50 border-emerald-100"
            : "bg-rose-50/50 border-rose-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              discount.status === "pending"
                ? "bg-amber-100 text-amber-600"
                : discount.status === "approved"
                ? "bg-emerald-100 text-emerald-600"
                : "bg-rose-100 text-rose-600"
            }`}
          >
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg mb-0.5">
              {student?.name || "طالب غير معروف"}
            </h3>
            <p className="text-xs font-bold text-slate-500 inline-flex items-center gap-1">
              {typeLabel}
              {discount.isPermanent ? (
                <span className="text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded text-[10px]">
                  دائم
                </span>
              ) : (
                <span className="text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                  مؤقت
                </span>
              )}
            </p>
          </div>
        </div>
        <div>
          {discount.status === "pending" && (
            <span className="flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-lg border border-amber-200">
              <Clock className="w-3.5 h-3.5" /> قيد الانتظار
            </span>
          )}
          {discount.status === "approved" && (
            <span className="flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> معتمد
            </span>
          )}
          {discount.status === "rejected" && (
            <span className="flex items-center gap-1 text-xs font-bold bg-rose-100 text-rose-700 px-2 py-1 rounded-lg border border-rose-200">
              <XCircle className="w-3.5 h-3.5" /> مرفوض
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex-1 space-y-4">
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="text-sm font-bold text-slate-600">قيمة الخصم:</div>
          <div className="text-xl font-black text-purple-700">
            {discount.amount} {discount.isPercentage ? "%" : "ج.م"}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-400 mb-1">السبب / المبرر:</h4>
          <p className="text-sm font-medium text-slate-700">{discount.reason || "لا يوجد"}</p>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-400 mb-1">نطاق الخصم:</h4>
          <p className="text-sm font-medium text-slate-700">
            {discount.appliesTo === "all_fees"
              ? "الاشتراك وجميع الرسوم (باص، وجبات..)"
              : "الاشتراك التعليمي فقط"}
          </p>
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500 pt-4 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <UserIcon className="w-3 h-3" /> {discount.addedBy}
          </span>
          <span>{discount.date ? format(new Date(discount.date), "yyyy-MM-dd") : ""}</span>
        </div>
      </div>

      {discount.status === "pending" && (
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex gap-2">
          <button
            onClick={() => updateStatus(discount.id, "approved")}
            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
          >
            <Check className="w-4 h-4" /> اعتماد
          </button>
          <button
            onClick={() => updateStatus(discount.id, "rejected")}
            className="flex-1 flex items-center justify-center gap-1.5 bg-rose-100 text-rose-700 py-2 rounded-xl text-sm font-bold hover:bg-rose-200 transition-colors border border-rose-200"
          >
            <X className="w-4 h-4" /> رفض
          </button>
        </div>
      )}
    </div>
  );
};
export default DiscountCard;
