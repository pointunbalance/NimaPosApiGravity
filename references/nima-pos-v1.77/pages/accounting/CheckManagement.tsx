import React, { useState } from "react";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { BankCheck } from "../../types";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../../components/ui/ConfirmModal";

import CheckManagementHeader from "../../components/accounting/CheckManagementHeader";
import CheckManagementStats from "../../components/accounting/CheckManagementStats";
import CheckManagementFilters from "../../components/accounting/CheckManagementFilters";
import CheckManagementGrid from "../../components/accounting/CheckManagementGrid";
import CheckManagementModal from "../../components/accounting/CheckManagementModal";
import CheckManagementImageViewer from "../../components/accounting/CheckManagementImageViewer";

import { useCheckManagementData } from "../../components/accounting/useCheckManagementData";
import { useCheckManagementActions } from "../../components/accounting/useCheckManagementActions";

const CheckManagement: React.FC = () => {
  const { success, error } = useToast();
  const data = useCheckManagementData();
  const actions = useCheckManagementActions(
    data.activeTab,
    data.formNumber,
    data.formAmount,
    data.formBank,
    data.formIssueDate,
    data.formDueDate,
    data.formPayeeId,
    data.formStatus,
    data.formImage,
    data.editingCheck,
    data.setEditingCheck,
    data.setIsModalOpen,
    data.setFormNumber,
    data.setFormAmount,
    data.setFormBank,
    data.setFormIssueDate,
    data.setFormDueDate,
    data.setFormPayeeId,
    data.setFormStatus,
    data.setFormImage,
    data.customers,
    data.suppliers,
    data.accounts,
    data.fiscalYears,
    data.checks,
    data.filteredChecks,
    success,
    error
  );

  const [deleteCheckId, setDeleteCheckId] = useState<number | null>(null);

  // UI Helpers
  const getStatusBadge = (status: BankCheck["status"], dueDate: Date) => {
    const daysRem = data.getDaysRemaining(dueDate);

    if (status === "cleared")
      return (
        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> تم التحصيل
        </span>
      );
    if (status === "bounced")
      return (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
          <XCircle className="w-3 h-3" /> مرتجع
        </span>
      );
    if (status === "returned")
      return (
        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
          مسترد
        </span>
      );
    if (status === "deposited")
      return (
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
          مودع
        </span>
      );

    if (daysRem < 0)
      return (
        <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 animate-pulse">
          <AlertTriangle className="w-3 h-3" /> متأخر {Math.abs(daysRem)} يوم
        </span>
      );
    if (daysRem <= 3)
      return (
        <span className="bg-orange-50 text-orange-600 border border-orange-200 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
          <Clock className="w-3 h-3" /> استحقاق قريب
        </span>
      );

    return (
      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">
        تحت التحصيل
      </span>
    );
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("ar-IQ", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(amount);

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
          تقرير الشيكات ({data.activeTab === "receivable" ? "أوراق القبض" : "أوراق الدفع"})
        </h3>
        <p className="text-sm mt-2 print:text-black">
          تاريخ التقرير: {new Date().toLocaleDateString("ar-EG")}
        </p>
      </div>

      <CheckManagementHeader
        onExport={actions.handleExport}
        onOpenModal={() => actions.openModal()}
        onPrint={actions.handlePrint}
      />
      <CheckManagementStats stats={data.stats} formatCurrency={formatCurrency} />
      <CheckManagementFilters
        activeTab={data.activeTab}
        setActiveTab={data.setActiveTab}
        searchTerm={data.searchTerm}
        setSearchTerm={data.setSearchTerm}
        dateRange={data.dateRange}
        setDateRange={data.setDateRange}
        statusFilter={data.statusFilter}
        setStatusFilter={data.setStatusFilter}
      />

      <div className="print:hidden">
        <CheckManagementGrid
          filteredChecks={data.filteredChecks}
          activeTab={data.activeTab}
          getDaysRemaining={data.getDaysRemaining}
          getStatusBadge={getStatusBadge}
          onViewImage={data.setViewImage}
          onDeleteCheck={(id) => {
            if (actions.checkDeleteEligibility(id)) {
              setDeleteCheckId(id);
            }
          }}
          onOpenModal={actions.openModal}
        />
      </div>

      <div className="hidden print:block">
        <table className="w-full border-collapse border border-slate-300 print:border-black text-sm">
          <thead>
            <tr className="bg-slate-100 print:bg-white">
              <th className="border border-slate-300 print:border-black p-2 text-right print:text-black">رقم الشيك</th>
              <th className="border border-slate-300 print:border-black p-2 text-right print:text-black">البنك</th>
              <th className="border border-slate-300 print:border-black p-2 text-right print:text-black">
                {data.activeTab === "receivable" ? "العميل" : "المورد"}
              </th>
              <th className="border border-slate-300 print:border-black p-2 text-right print:text-black">المبلغ</th>
              <th className="border border-slate-300 print:border-black p-2 text-right print:text-black">تاريخ التحرير</th>
              <th className="border border-slate-300 print:border-black p-2 text-right print:text-black">تاريخ الاستحقاق</th>
              <th className="border border-slate-300 print:border-black p-2 text-center print:text-black">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {data.filteredChecks.map((check) => (
              <tr key={check.id}>
                <td className="border border-slate-300 print:border-black p-2 font-mono print:text-black">{check.number}</td>
                <td className="border border-slate-300 print:border-black p-2 print:text-black">{check.bankName}</td>
                <td className="border border-slate-300 print:border-black p-2 print:text-black">{check.payeeName}</td>
                <td className="border border-slate-300 print:border-black p-2 font-bold print:text-black">
                  {formatCurrency(check.amount)}
                </td>
                <td className="border border-slate-300 print:border-black p-2 print:text-black font-mono">
                  {new Date(check.issueDate).toLocaleDateString("ar-EG")}
                </td>
                <td className="border border-slate-300 print:border-black p-2 print:text-black font-mono">
                  {new Date(check.dueDate).toLocaleDateString("ar-EG")}
                </td>
                <td className="border border-slate-300 print:border-black p-2 text-center print:text-black">
                  {check.status === "cleared"
                    ? "محصل"
                    : check.status === "bounced"
                      ? "مرتجع"
                      : check.status === "deposited"
                        ? "مودع"
                        : check.status === "returned"
                          ? "مسترد"
                          : "تحت التحصيل"}
                </td>
              </tr>
            ))}
            {data.filteredChecks.length === 0 && (
              <tr>
                <td colSpan={7} className="border border-slate-300 print:border-black p-4 text-center text-slate-500 print:text-black">
                  لا توجد بيانات مطابقة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CheckManagementModal
        isOpen={data.isModalOpen}
        onClose={actions.closeModal}
        onSave={actions.handleSave}
        editingCheck={data.editingCheck}
        activeTab={data.activeTab}
        formNumber={data.formNumber}
        setFormNumber={data.setFormNumber}
        formAmount={data.formAmount}
        setFormAmount={data.setFormAmount}
        formBank={data.formBank}
        setFormBank={data.setFormBank}
        formIssueDate={data.formIssueDate}
        setFormIssueDate={data.setFormIssueDate}
        formDueDate={data.formDueDate}
        setFormDueDate={data.setFormDueDate}
        formPayeeId={data.formPayeeId}
        setFormPayeeId={data.setFormPayeeId}
        formStatus={data.formStatus}
        setFormStatus={data.setFormStatus}
        formImage={data.formImage}
        setFormImage={data.setFormImage}
        customers={data.customers}
        suppliers={data.suppliers}
      />
      <CheckManagementImageViewer image={data.viewImage} onClose={() => data.setViewImage(null)} />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteCheckId !== null}
        title="حذف الشيك"
        message="هل أنت متأكد من حذف هذا الشيك نهائياً؟"
        onConfirm={async () => {
          if (deleteCheckId !== null) {
            await actions.executeDeleteCheck(deleteCheckId);
            setDeleteCheckId(null);
          }
        }}
        onCancel={() => setDeleteCheckId(null)}
        confirmText="تأكيد الحذف"
        cancelText="إلغاء"
      />
    </div>
  );
};

export default CheckManagement;
