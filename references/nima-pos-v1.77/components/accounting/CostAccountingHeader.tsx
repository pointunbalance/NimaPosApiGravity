import React from "react";
import { Calculator, ArrowRightLeft, Plus } from "lucide-react";

interface CostAccountingHeaderProps {
  onSwitchTab: (tab: "dashboard" | "elements" | "allocation") => void;
  onOpenNewModal: () => void;
}

const CostAccountingHeader: React.FC<CostAccountingHeaderProps> = ({
  onSwitchTab,
  onOpenNewModal,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-indigo-600" />
          حسابات التكاليف
        </h1>
        <p className="text-slate-500 mt-1">
          إدارة وتحليل تكاليف النشاط التشغيلي وتوزيع المصروفات غير المباشرة
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSwitchTab("allocation")}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors font-bold text-sm shadow-sm"
        >
          <ArrowRightLeft className="w-4 h-4 text-slate-400" />
          توزيع التكاليف
        </button>
        <button
          onClick={onOpenNewModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-bold text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          عنصر تكلفة جديد
        </button>
      </div>
    </div>
  );
};

export default CostAccountingHeader;
