import React from "react";
import { CheckSquare } from "lucide-react";

interface FiscalYearClosingHeaderProps {
  activeTab: "closing" | "history";
  setActiveTab: (val: "closing" | "history") => void;
}

const FiscalYearClosingHeader: React.FC<FiscalYearClosingHeaderProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="flex justify-between items-center mb-8 print:hidden">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <CheckSquare className="w-8 h-8 text-indigo-600" />
          إقفال السنة المالية
        </h1>
        <p className="text-slate-500 mt-1">
          إجراءات نهاية الفترة المحاسبية وترحيل الأرباح
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-xl border border-slate-200">
        <button
          onClick={() => setActiveTab("closing")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "closing"
              ? "bg-slate-800 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          إقفال جديد
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "history"
              ? "bg-slate-800 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          سجل الإغلاقات
        </button>
      </div>
    </div>
  );
};

export default FiscalYearClosingHeader;
