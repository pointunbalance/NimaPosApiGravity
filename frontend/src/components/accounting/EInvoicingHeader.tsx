import React from "react";
import { Receipt, CheckCircle, AlertCircle } from "lucide-react";

interface EInvoicingHeaderProps {
  zatcaEnabled?: boolean;
  zatcaEnvironment?: "sandbox" | "simulation" | "production";
}

const EInvoicingHeader: React.FC<EInvoicingHeaderProps> = ({
  zatcaEnabled,
  zatcaEnvironment,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Receipt className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">الفاتورة الإلكترونية</h1>
          <p className="text-slate-500">
            إدارة التكامل مع هيئات الزكاة والضريبة (ZATCA)
          </p>
        </div>
      </div>

      {zatcaEnabled ? (
        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold flex items-center gap-1">
          <CheckCircle className="w-4 h-4" /> الربط مفعل (
          {zatcaEnvironment === "production" ? "الإنتاج" : "التجريبي"})
        </span>
      ) : (
        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-bold flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> الربط غير مفعل
        </span>
      )}
    </div>
  );
};

export default EInvoicingHeader;
