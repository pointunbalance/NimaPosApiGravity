import React from "react";
import { BookOpen } from "lucide-react";

import { GeneralLedgerHeader } from "../../components/accounting/GeneralLedgerHeader";
import { GeneralLedgerFilters } from "../../components/accounting/GeneralLedgerFilters";
import { GeneralLedgerSummary } from "../../components/accounting/GeneralLedgerSummary";
import { GeneralLedgerChart } from "../../components/accounting/GeneralLedgerChart";
import { GeneralLedgerTable } from "../../components/accounting/GeneralLedgerTable";
import { GeneralLedgerEntryModal } from "../../components/accounting/GeneralLedgerEntryModal";
import { useGeneralLedgerData } from "../../components/accounting/useGeneralLedgerData";

const GeneralLedger: React.FC = () => {
  const data = useGeneralLedgerData();

  return (
    <div
      className="p-8 h-full overflow-y-auto bg-slate-50/50 font-['Tajawal'] print:p-0 print:bg-white"
      dir="rtl"
    >
      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
        <h2 className="text-2xl font-bold print:text-black">
          {data.settings?.storeName || "Nima POS"}
        </h2>
        <h3 className="text-xl font-bold mt-2 print:text-black">
          دفتر الأستاذ العام - {data.selectedAccount?.name}
        </h3>
        {data.selectedCostCenterId && (
          <h4 className="text-lg font-bold mt-1 text-slate-600 print:text-black">
            مركز التكلفة:{" "}
            {
              data.costCenters?.find((c) => c.id === Number(data.selectedCostCenterId))
                ?.name
            }
          </h4>
        )}
        <p className="text-sm mt-2 print:text-black">
          تاريخ التقرير: {new Date().toLocaleDateString("ar-EG")}
        </p>
      </div>

      <GeneralLedgerHeader
        onExportCSV={data.handleExportCSV}
        onPrint={() => window.print()}
        isExportDisabled={!data.ledgerData}
      />

      <GeneralLedgerFilters
        accounts={data.accounts}
        costCenters={data.costCenters}
        selectedAccountId={data.selectedAccountId}
        setSelectedAccountId={data.setSelectedAccountId}
        selectedCostCenterId={data.selectedCostCenterId}
        setSelectedCostCenterId={data.setSelectedCostCenterId}
        dateRange={data.dateRange}
        setDateRange={data.setDateRange}
        setQuickDate={data.setQuickDate}
        searchTerm={data.searchTerm}
        setSearchTerm={data.setSearchTerm}
        showChart={data.showChart}
        setShowChart={data.setShowChart}
      />

      {/* Ledger Content */}
      {data.selectedAccount && data.ledgerData ? (
        <div className="space-y-6">
          <GeneralLedgerSummary
            selectedAccount={data.selectedAccount}
            ledgerData={data.ledgerData}
            dateRange={data.dateRange}
            formatCurrency={data.formatCurrency}
          />

          {data.showChart && (
            <GeneralLedgerChart
              chartData={data.chartData}
              formatCurrency={data.formatCurrency}
            />
          )}

          <GeneralLedgerTable
            ledgerData={data.ledgerData}
            dateRange={data.dateRange}
            formatCurrency={data.formatCurrency}
            setViewEntry={data.setViewEntry}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-96 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white print:hidden">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-10 h-10 text-slate-300" />
          </div>
          <p className="text-xl font-bold text-slate-600">
            يرجى اختيار حساب لعرض دفتر الأستاذ
          </p>
          <p className="text-sm mt-2 text-slate-400">
            يمكنك البحث عن أي حساب في الدليل وعرض حركته التفصيلية
          </p>
        </div>
      )}

      <GeneralLedgerEntryModal
        viewEntry={data.viewEntry}
        setViewEntry={data.setViewEntry}
        selectedAccount={data.selectedAccount}
        formatCurrency={data.formatCurrency}
      />
    </div>
  );
};

export default GeneralLedger;
