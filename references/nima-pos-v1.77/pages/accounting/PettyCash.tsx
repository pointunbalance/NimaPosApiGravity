import React, { useState } from "react";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { usePettyCashData } from "../../components/accounting/usePettyCashData";
import { usePettyCashActions } from "../../components/accounting/usePettyCashActions";

import PettyCashHeader from "../../components/accounting/PettyCashHeader";
import PettyCashFilters from "../../components/accounting/PettyCashFilters";
import PettyCashGrid from "../../components/accounting/PettyCashGrid";
import PettyCashCreateModal from "../../components/accounting/PettyCashCreateModal";
import PettyCashDetailsModal from "../../components/accounting/PettyCashDetailsModal";

const PettyCashPage: React.FC = () => {
  const { success, error: showError } = useToast();
  const data = usePettyCashData();
  const actions = usePettyCashActions(
    data.selectedFund,
    data.setSelectedFund,
    data.expenseAmount,
    data.setExpenseAmount,
    data.expenseDescription,
    data.setExpenseDescription,
    data.expenseAccountId,
    data.setExpenseAccountId,
    data.accounts,
    data.settings,
    data.filteredFunds,
    data.setIsModalOpen,
    success,
    showError
  );

  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

  const handleCloseFundClick = () => {
    setIsConfirmCloseOpen(true);
  };

  const handleConfirmCloseFund = async () => {
    setIsConfirmCloseOpen(false);
    await actions.executeCloseFund();
  };

  return (
    <div
      className="p-8 h-full overflow-y-auto bg-slate-50/50 font-['Tajawal'] print:p-0 print:bg-white"
      dir="rtl"
    >
      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
        <h2 className="text-2xl font-bold">تقرير العهد النقدية</h2>
        <p className="text-sm mt-2">
          تاريخ التقرير: {new Date().toLocaleDateString("ar-EG")}
        </p>
      </div>

      <PettyCashHeader
        onOpenCreateModal={() => data.setIsModalOpen(true)}
        onPrint={actions.handlePrintList}
        onExport={actions.handleExportList}
      />

      <div className="print:hidden">
        <PettyCashFilters
          searchTerm={data.searchTerm}
          setSearchTerm={data.setSearchTerm}
        />

        <PettyCashGrid
          filteredFunds={data.filteredFunds}
          calculateRemaining={data.calculateRemaining}
          onSelectFund={data.setSelectedFund}
        />
      </div>

      {/* Print representation */}
      <div className="hidden print:block">
        <table className="w-full border-collapse border border-slate-300 text-sm">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-2 text-right">الموظف</th>
              <th className="border border-slate-300 p-2 text-right">التاريخ</th>
              <th className="border border-slate-300 p-2 text-right">البيان</th>
              <th className="border border-slate-300 p-2 text-right">المبلغ الأساسي</th>
              <th className="border border-slate-300 p-2 text-right">إجمالي المصروفات</th>
              <th className="border border-slate-300 p-2 text-right">المتبقي</th>
              <th className="border border-slate-300 p-2 text-center">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {data.filteredFunds.map((fund) => {
              const totalExpenses = fund.expenses.reduce(
                (sum, exp) => sum + exp.amount,
                0
              );
              const remaining = fund.amount - totalExpenses;
              return (
                <tr key={fund.id}>
                  <td className="border border-slate-300 p-2">{fund.employeeName}</td>
                  <td className="border border-slate-300 p-2">
                    {new Date(fund.date).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="border border-slate-300 p-2">{fund.description}</td>
                  <td className="border border-slate-300 p-2">
                    {fund.amount.toLocaleString()} ج.م
                  </td>
                  <td className="border border-slate-300 p-2 text-rose-600">
                    {totalExpenses.toLocaleString()} ج.م
                  </td>
                  <td className="border border-slate-300 p-2" dir="ltr">
                    {remaining.toLocaleString()} ج.م
                  </td>
                  <td className="border border-slate-300 p-2 text-center">
                    {fund.status === "active" ? "نشطة" : "مغلقة"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PettyCashCreateModal
        isOpen={data.isModalOpen}
        onClose={() => data.setIsModalOpen(false)}
        onSubmit={actions.handleCreateFund}
        accounts={data.accounts}
      />

      <PettyCashDetailsModal
        selectedFund={data.selectedFund}
        onClose={() => data.setSelectedFund(null)}
        calculateRemaining={data.calculateRemaining}
        onAddExpense={actions.handleAddExpense}
        expenseDescription={data.expenseDescription}
        setExpenseDescription={data.setExpenseDescription}
        expenseAmount={data.expenseAmount}
        setExpenseAmount={data.setExpenseAmount}
        expenseAccountId={data.expenseAccountId}
        setExpenseAccountId={data.setExpenseAccountId}
        onRemoveExpense={actions.handleRemoveExpense}
        onCloseFund={handleCloseFundClick}
        accounts={data.accounts}
        onPrint={actions.handlePrintDetails}
      />

      <ConfirmModal
        isOpen={isConfirmCloseOpen}
        title="إغلاق وتسوية العهدة"
        message="هل أنت متأكد من إغلاق وتسوية هذه العهدة؟ سيتم إنشاء قيد يومية بالمصروفات وإرجاع المبلغ المتبقي إلى الحساب المصدر."
        onConfirm={handleConfirmCloseFund}
        onCancel={() => setIsConfirmCloseOpen(false)}
        confirmText="نعم، أغلق العهدة"
        cancelText="تراجع"
      />
    </div>
  );
};

export default PettyCashPage;
