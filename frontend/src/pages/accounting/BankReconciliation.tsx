import React, { useState } from "react";
import { Scale, History, PlusCircle } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useBankReconciliationData } from "../../components/accounting/useBankReconciliationData";
import { useBankReconciliationActions } from "../../components/accounting/useBankReconciliationActions";

import { BankReconciliationHistory } from "../../components/accounting/BankReconciliationHistory";
import { BankReconciliationForm } from "../../components/accounting/BankReconciliationForm";
import { BankReconciliationList } from "../../components/accounting/BankReconciliationList";
import { BankReconciliationAdjustmentModal } from "../../components/accounting/BankReconciliationAdjustmentModal";
import { BankReconciliationDetailsModal } from "../../components/accounting/BankReconciliationDetailsModal";

const BankReconciliationPage: React.FC = () => {
  const { success, error } = useToast();
  const data = useBankReconciliationData();
  const actions = useBankReconciliationActions(
    data.selectedAccountId,
    data.statementDate,
    data.statementBalance,
    data.selectedEntryIds,
    data.setSelectedEntryIds,
    data.setStatementBalance,
    data.setShowHistory,
    data.unreconciledTransactions,
    data.displayedTransactions,
    data.calculation,
    data.fiscalYears,
    data.adjAmount,
    data.adjType,
    data.adjDate,
    data.adjExpenseAccId,
    data.setIsAdjModalOpen,
    data.setAdjAmount,
    data.accounts,
    data.settings,
    data.formatCurrency,
    data.setViewingRecId,
    success,
    error
  );

  const [undoRecId, setUndoRecId] = useState<number | null>(null);

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50/50 font-['Tajawal']" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <Scale className="w-8 h-8 text-indigo-600" />
            تسوية البنك (Bank Reconciliation)
          </h1>
          <p className="text-slate-500 mt-1">مطابقة كشف الحساب البنكي مع دفاتر النظام</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => data.setShowHistory(!data.showHistory)}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm border transition-all ${
              data.showHistory
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {data.showHistory ? <PlusCircle className="w-4 h-4" /> : <History className="w-4 h-4" />}
            {data.showHistory ? "تسوية جديدة" : "الأرشيف والسجلات"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      {data.showHistory ? (
        <BankReconciliationHistory
          previousReconciliations={data.previousReconciliations}
          accounts={data.accounts}
          formatCurrency={data.formatCurrency}
          setViewingRecId={data.setViewingRecId}
          printReport={actions.printReport}
          setUndoRecId={setUndoRecId}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          <BankReconciliationForm
            selectedAccountId={data.selectedAccountId}
            setSelectedAccountId={data.setSelectedAccountId}
            bankAccounts={data.bankAccounts}
            statementDate={data.statementDate}
            setStatementDate={data.setStatementDate}
            statementBalance={data.statementBalance}
            setStatementBalance={data.setStatementBalance}
            openingBalance={data.openingBalance}
            calculation={data.calculation}
            formatCurrency={data.formatCurrency}
            setIsAdjModalOpen={data.setIsAdjModalOpen}
            handleSaveReconciliation={actions.handleSaveReconciliation}
            fiscalYears={data.fiscalYears}
          />

          <BankReconciliationList
            selectedAccountId={data.selectedAccountId}
            txSearchTerm={data.txSearchTerm}
            setTxSearchTerm={data.setTxSearchTerm}
            handleExportUnreconciled={actions.handleExportUnreconciled}
            autoMatch={actions.autoMatch}
            toggleSelectAll={actions.toggleSelectAll}
            isAllSelected={actions.isAllSelected}
            displayedTransactions={data.displayedTransactions}
            selectedEntryIds={data.selectedEntryIds}
            toggleTransaction={actions.toggleTransaction}
            unreconciledTransactions={data.unreconciledTransactions}
            formatCurrency={data.formatCurrency}
          />
        </div>
      )}

      {/* Adjustment Modal */}
      <BankReconciliationAdjustmentModal
        isAdjModalOpen={data.isAdjModalOpen}
        setIsAdjModalOpen={data.setIsAdjModalOpen}
        adjType={data.adjType}
        setAdjType={data.setAdjType}
        adjAmount={data.adjAmount}
        setAdjAmount={data.setAdjAmount}
        adjDate={data.adjDate}
        setAdjDate={data.setAdjDate}
        adjExpenseAccId={data.adjExpenseAccId}
        setAdjExpenseAccId={data.setAdjExpenseAccId}
        expenseAccounts={data.expenseAccounts}
        revenueAccounts={data.revenueAccounts}
        handleAddAdjustment={actions.handleAddAdjustment}
      />

      {/* Details Modal */}
      <BankReconciliationDetailsModal
        viewingRecId={data.viewingRecId}
        viewingRec={data.viewingRec}
        setViewingRecId={data.setViewingRecId}
        accounts={data.accounts}
        formatCurrency={data.formatCurrency}
        viewingRecTransactions={data.viewingRecTransactions}
      />

      {/* Undo Confirmation Modal */}
      <ConfirmModal
        isOpen={undoRecId !== null}
        title="إلغاء التسوية"
        message="هل أنت متأكد من إلغاء هذه التسوية؟ سيتم إعادة جميع الحركات المرتبطة بها إلى حالة 'غير مطابقة'."
        onConfirm={async () => {
          if (undoRecId !== null) {
            await actions.executeUndoReconciliation(undoRecId);
            setUndoRecId(null);
          }
        }}
        onCancel={() => setUndoRecId(null)}
        confirmText="تأكيد الإلغاء"
        cancelText="تراجع"
      />
    </div>
  );
};

export default BankReconciliationPage;
