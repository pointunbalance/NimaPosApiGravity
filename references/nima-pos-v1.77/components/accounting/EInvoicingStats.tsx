import React from "react";
import { Receipt, CheckCircle, XCircle, Clock } from "lucide-react";
import { EInvoice } from "../../types";

interface EInvoicingStatsProps {
  invoices: EInvoice[];
}

const EInvoicingStats: React.FC<EInvoicingStatsProps> = ({ invoices }) => {
  const total = invoices.length;
  const accepted = invoices.filter((i) => i.status === "accepted").length;
  const rejected = invoices.filter((i) => i.status === "rejected").length;
  const pending = invoices.filter(
    (i) => i.status === "pending" || i.status === "submitted"
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 font-bold">
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm">إجمالي الفواتير</p>
          <p className="text-2xl font-bold text-slate-800">{total}</p>
        </div>
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
          <Receipt className="w-6 h-6" />
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm">مقبولة (ZATCA)</p>
          <p className="text-2xl font-bold text-emerald-600">{accepted}</p>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
          <CheckCircle className="w-6 h-6" />
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm">مرفوضة</p>
          <p className="text-2xl font-bold text-red-600">{rejected}</p>
        </div>
        <div className="p-3 bg-red-50 text-red-600 rounded-lg">
          <XCircle className="w-6 h-6" />
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm">قيد الانتظار</p>
          <p className="text-2xl font-bold text-amber-600">{pending}</p>
        </div>
        <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
          <Clock className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default EInvoicingStats;
