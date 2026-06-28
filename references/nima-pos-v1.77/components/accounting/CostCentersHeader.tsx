import React from "react";
import { Building, Plus, Download, Printer } from "lucide-react";

interface CostCentersHeaderProps {
  onExport: () => void;
  onPrint: () => void;
  onOpenModal: () => void;
}

const CostCentersHeader: React.FC<CostCentersHeaderProps> = ({
  onExport,
  onPrint,
  onOpenModal,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <Building className="w-8 h-8 text-indigo-600" />
          مراكز التكلفة
        </h1>
        <p className="text-slate-500 mt-1">
          توزيع وتحليل المصروفات والإيرادات على الفروع والأقسام
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onExport}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" /> تصدير
        </button>
        <button
          onClick={onPrint}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" /> طباعة
        </button>
        <button
          onClick={onOpenModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> إضافة مركز
        </button>
      </div>
    </div>
  );
};

export default CostCentersHeader;
