import React, { useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Settings } from "lucide-react";
import { useEInvoicingData } from "../../components/accounting/useEInvoicingData";
import EInvoicingHeader from "../../components/accounting/EInvoicingHeader";
import EInvoicingStats from "../../components/accounting/EInvoicingStats";
import EInvoicesTable from "../../components/accounting/EInvoicesTable";
import UninvoicedOrdersTable from "../../components/accounting/UninvoicedOrdersTable";
import EInvoicingSettingsForm from "../../components/accounting/EInvoicingSettingsForm";
import EInvoicingModals from "../../components/accounting/EInvoicingModals";

export const EInvoicing: React.FC = () => {
  const data = useEInvoicingData();

  // Listen for feedback messages from our custom hook
  useEffect(() => {
    if (data.statusMessage) {
      const { type, text } = data.statusMessage;
      if (type === "success") {
        toast.success(text);
      } else if (type === "error") {
        toast.error(text);
      } else if (type === "warning") {
        toast.error(text, { icon: "⚠️" });
      }
      data.setStatusMessage(null);
    }
  }, [data.statusMessage, data]);

  return (
    <div className="p-6 font-['Tajawal'] bg-slate-50/30 h-full overflow-y-auto" dir="rtl">
      {/* Header Panel */}
      <EInvoicingHeader
        zatcaEnabled={data.settings?.zatca?.enabled}
        zatcaEnvironment={data.settings?.zatca?.environment}
      />

      {/* Numerical Metrics */}
      <EInvoicingStats invoices={data.invoices} />

      {/* Tabs and Content Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="flex border-b border-slate-100 font-bold">
          <button
            onClick={() => data.setActiveTab("invoices")}
            className={`flex-1 py-4 text-center font-bold transition-colors ${
              data.activeTab === "invoices"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            سجل الفواتير الإلكترونية
          </button>
          <button
            onClick={() => data.setActiveTab("uninvoiced")}
            className={`flex-1 py-4 text-center font-bold transition-colors ${
              data.activeTab === "uninvoiced"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            الطلبات غير المفوترة ({data.uninvoicedOrders.length})
          </button>
          <button
            onClick={() => data.setActiveTab("settings")}
            className={`flex-1 py-4 text-center font-bold transition-colors flex items-center justify-center gap-2 ${
              data.activeTab === "settings"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Settings className="w-4 h-4" /> إعدادات الربط
          </button>
        </div>

        {data.activeTab === "invoices" && (
          <EInvoicesTable
            invoices={data.invoices}
            searchTerm={data.searchTerm}
            setSearchTerm={data.setSearchTerm}
            onSubmitToZatca={data.handleSubmitToZatca}
            onViewQR={(inv) => {
              data.setSelectedInvoice(inv);
              data.setShowQRModal(true);
            }}
            onViewXML={(inv) => {
              data.setSelectedInvoice(inv);
              data.setShowXMLModal(true);
            }}
          />
        )}

        {data.activeTab === "uninvoiced" && (
          <UninvoicedOrdersTable
            orders={data.uninvoicedOrders}
            onGenerateInvoice={data.handleGenerateInvoice}
          />
        )}

        {data.activeTab === "settings" && data.settings && (
          <EInvoicingSettingsForm
            settings={data.settings}
            setSettings={data.setSettings}
            isSaving={data.isSavingSettings}
            onSubmit={data.handleSaveSettings}
          />
        )}
      </div>

      {/* Previews Modal Windows */}
      {data.selectedInvoice && (
        <EInvoicingModals
          selectedInvoice={data.selectedInvoice}
          showQRModal={data.showQRModal}
          setShowQRModal={data.setShowQRModal}
          showXMLModal={data.showXMLModal}
          setShowXMLModal={data.setShowXMLModal}
          settings={data.settings}
        />
      )}

      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};
