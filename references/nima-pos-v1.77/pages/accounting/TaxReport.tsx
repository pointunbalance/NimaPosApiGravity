import React from "react";
import { Toaster, toast } from "react-hot-toast";
import { useTaxReportData } from "../../components/accounting/useTaxReportData";
import TaxReportHeader from "../../components/accounting/TaxReportHeader";
import TaxReportQuickFilters from "../../components/accounting/TaxReportQuickFilters";
import TaxReportSummary from "../../components/accounting/TaxReportSummary";
import TaxReportDetails from "../../components/accounting/TaxReportDetails";
import ConfirmModal from "../../components/ui/ConfirmModal";

const TaxReport: React.FC = () => {
  const data = useTaxReportData();

  const handleSaveClick = () => {
    data.handleSaveTaxReturn(false);
  };

  const handleConfirmSave = () => {
    data.setIsSaveConfirmOpen(false);
    data.handleSaveTaxReturn(true); // force save
  };

  const handleConfirmNoAccounts = () => {
    data.setIsNoAccountsConfirmOpen(false);
    data.handleSaveTaxReturn(true); // force save with ignore accounts
  };

  React.useEffect(() => {
    if (data.saveStatus) {
      if (data.saveStatus.success) {
        toast.success(data.saveStatus.message);
      } else {
        toast.error(data.saveStatus.message);
      }
      data.setSaveStatus(null);
    }
  }, [data.saveStatus, data]);

  return (
    <div
      className="p-8 h-full overflow-y-auto bg-slate-50/50 font-['Tajawal'] print:p-0 print:bg-white"
      dir="rtl"
    >
      <TaxReportHeader
        dateRange={data.dateRange}
        setDateRange={data.setDateRange}
        onExport={data.handleExport}
        onPrint={() => window.print()}
      />

      <TaxReportQuickFilters onSelectFilter={data.setQuickFilter} />

      {data.taxData && (
        <div className="space-y-6">
          <TaxReportSummary
            taxData={data.taxData}
            formatCurrency={data.formatCurrency}
            currencyCode={data.currencyCode}
            settings={data.settings}
            dateRange={data.dateRange}
          />

          <TaxReportDetails
            activeTab={data.activeTab}
            setActiveTab={data.setActiveTab}
            taxData={data.taxData}
            taxReturns={data.taxReturns || []}
            formatCurrency={data.formatCurrency}
            onSaveTaxReturn={handleSaveClick}
          />
        </div>
      )}

      {/* Confirmation Modals instead of native window.confirm */}
      <ConfirmModal
        isOpen={data.isSaveConfirmOpen}
        title="تأكيد حفظ الإقرار"
        message="يوجد إقرار ضريبي محفوظ مسبقاً لنفس الفترة. هل تريد حفظ إقرار جديد؟"
        onConfirm={handleConfirmSave}
        onCancel={() => data.setIsSaveConfirmOpen(false)}
        confirmText="حفظ إقرار جديد"
        cancelText="إلغاء"
      />

      <ConfirmModal
        isOpen={data.isNoAccountsConfirmOpen}
        title="حسابات الضريبة غير موجودة"
        message="تحذير: لم يتم العثور على حسابات الضريبة (ضريبة المخرجات، ضريبة المدخلات، الضريبة المستحقة) في دليل الحسابات لتوليد القيد التلقائي. هل تريد حفظ الإقرار بدون قيد محاسبي؟"
        onConfirm={handleConfirmNoAccounts}
        onCancel={() => data.setIsNoAccountsConfirmOpen(false)}
        confirmText="حفظ بدون قيد"
        cancelText="إلغاء"
      />

      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};

export default TaxReport;
