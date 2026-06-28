import React from "react";

interface TaxReportQuickFiltersProps {
  onSelectFilter: (filter: string) => void;
}

const TaxReportQuickFilters: React.FC<TaxReportQuickFiltersProps> = ({
  onSelectFilter,
}) => {
  const filters = [
    { key: "thisMonth", label: "هذا الشهر" },
    { key: "lastMonth", label: "الشهر السابق" },
    { key: "q1", label: "الربع الأول" },
    { key: "q2", label: "الربع الثاني" },
    { key: "q3", label: "الربع الثالث" },
    { key: "q4", label: "الربع الرابع" },
    { key: "thisYear", label: "هذا العام" },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6 print:hidden">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => onSelectFilter(f.key)}
          className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors font-bold"
        >
          {f.label}
        </button>
      ))}
    </div>
  );
};

export default TaxReportQuickFilters;
