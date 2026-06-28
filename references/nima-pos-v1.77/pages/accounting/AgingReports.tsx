import React from "react";
import { Toaster, toast } from "react-hot-toast";
import { useAgingReportsData, AgingRecord } from "../../components/accounting/useAgingReportsData";
import AgingReportsHeader from "../../components/accounting/AgingReportsHeader";
import AgingReportsSummary from "../../components/accounting/AgingReportsSummary";
import AgingReportsTable from "../../components/accounting/AgingReportsTable";
import AgingRecordModal from "../../components/accounting/AgingRecordModal";

const AgingReports: React.FC = () => {
  const data = useAgingReportsData();

  const sendReminder = (record: AgingRecord) => {
    if (!record.phone) {
      toast.error("لا يوجد رقم هاتف مسجل لهذا الحساب");
      return;
    }
    const text = `عزيزي ${record.name}،\nنود تذكيركم بأن إجمالي الرصيد المستحق هو ${data.formatCurrency(record.totalBalance)} ${data.currencyCode}.\nيرجى التكرم بالسداد في أقرب وقت.\nشكراً.`;
    const phone = record.phone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div
      className="p-8 h-full overflow-y-auto bg-slate-50/50 font-['Tajawal'] print:p-0 print:bg-white"
      dir="rtl"
    >
      {/* Header for Screen */}
      <AgingReportsHeader
        asOfDate={data.asOfDate}
        setAsOfDate={data.setAsOfDate}
        onExport={data.handleExportCSV}
        onPrint={() => window.print()}
      />

      {/* Print Header layout */}
      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-6 font-bold">
        <h2 className="text-3xl font-bold mb-2">{data.settings?.storeName}</h2>
        <h3 className="text-xl font-bold uppercase tracking-widest border-2 border-black inline-block px-4 py-1 mb-2">
          تقرير أعمار الديون - {data.activeTab === "receivable" ? "العملاء" : "الموردين"}
        </h3>
        <div className="flex justify-between items-end mt-4 text-sm font-bold">
          <div>
            <p>العملة: {data.currencyCode}</p>
          </div>
          <div>
            <p>حتى تاريخ: {data.asOfDate}</p>
          </div>
        </div>
      </div>

      {/* Analytics: Chart and widgets */}
      <AgingReportsSummary
        chartData={data.chartData}
        totals={data.totals}
        formatCurrency={data.formatCurrency}
      />

      {/* Tabular Lists */}
      <AgingReportsTable
        activeTab={data.activeTab}
        setActiveTab={data.setActiveTab}
        searchTerm={data.searchTerm}
        setSearchTerm={data.setSearchTerm}
        asOfDate={data.asOfDate}
        setAsOfDate={data.setAsOfDate}
        agingData={data.agingData}
        formatCurrency={data.formatCurrency}
        onView={data.setSelectedEntity}
        onSendReminder={sendReminder}
      />

      {/* Drill down modal */}
      {data.selectedEntity && (
        <AgingRecordModal
          selectedEntity={data.selectedEntity}
          onClose={() => data.setSelectedEntity(null)}
          activeTab={data.activeTab}
          formatCurrency={data.formatCurrency}
        />
      )}

      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};

export default AgingReports;
