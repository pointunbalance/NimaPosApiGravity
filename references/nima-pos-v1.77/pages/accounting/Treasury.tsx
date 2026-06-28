import React from "react";
import { Toaster, toast } from "react-hot-toast";
import { db } from "../../db";
import { TreasuryTransaction, TreasuryAccount } from "../../types";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useTreasuryData } from "../../components/accounting/useTreasuryData";
import TreasuryHeader from "../../components/accounting/TreasuryHeader";
import TreasuryBalances from "../../components/accounting/TreasuryBalances";
import TreasuryFilters from "../../components/accounting/TreasuryFilters";
import TreasuryTable from "../../components/accounting/TreasuryTable";
import TreasuryTransactionModal from "../../components/accounting/TreasuryTransactionModal";
import TreasuryAccountModal from "../../components/accounting/TreasuryAccountModal";

export const Treasury: React.FC = () => {
  const data = useTreasuryData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (data.editingTransaction?.id) {
        await db.treasuryTransactions.update(
          data.editingTransaction.id,
          data.formData as TreasuryTransaction
        );
        toast.success("تم تحديث الحركة بنجاح.");
      } else {
        await db.treasuryTransactions.add(data.formData as TreasuryTransaction);
        toast.success("تم تسجيل الحركة الجديدة بنجاح.");
      }
      data.handleCloseModal();
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error("فشل في حفظ الحركة.");
    }
  };

  const executeDelete = async () => {
    if (!data.transactionToDeleteId) return;
    try {
      await db.treasuryTransactions.delete(data.transactionToDeleteId);
      toast.success("تم حذف حركة الخزينة بنجاح.");
    } catch (e: any) {
      console.error(e);
      toast.error("فشل في حذف الحركة.");
    } finally {
      data.setIsDeleteConfirmOpen(false);
      data.setTransactionToDeleteId(null);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.treasuryAccounts.add({
        ...data.accountFormData,
        createdAt: new Date().toISOString(),
      } as TreasuryAccount);
      toast.success("تم إضافة الحساب بنجاح.");
      data.setIsAccountModalOpen(false);
      data.setAccountFormData({ name: "", type: "safe" });
    } catch (error) {
      console.error("Error saving account:", error);
      toast.error("فشل في إضافة الحساب.");
    }
  };

  const getAccountName = (accountIdStr?: string, accountIdNum?: number) => {
    if (accountIdNum) {
      const acc = data.treasuryAccounts.find((a) => a.id === accountIdNum);
      if (acc) return acc.name;
    }
    const acc = data.treasuryAccounts.find(
      (a) => a.type === accountIdStr || String(a.id) === String(accountIdStr)
    );
    if (acc) return acc.name;

    switch (accountIdStr) {
      case "safe":
        return "الخزينة الرئيسية";
      case "bank":
        return "الحساب البنكي";
      case "petty_cash":
        return "العهدة النقدية";
      default:
        return "-";
    }
  };

  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      sales: "مبيعات",
      expenses: "مصروفات",
      loan: "قروض",
      investment: "استثمارات",
      operational: "تشغيلي",
      transfer: "تحويل داخلي",
      other: "أخرى",
    };
    return categories[category] || category;
  };

  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      cash: "نقدي",
      bank_transfer: "تحويل بنكي",
      check: "شيك",
      card: "بطاقة ائتمان",
    };
    return methods[method] || method;
  };

  return (
    <div className="p-6 bg-slate-50/50 h-full overflow-y-auto" dir="rtl">
      {/* Header */}
      <TreasuryHeader
        onAddAccount={() => data.setIsAccountModalOpen(true)}
        onNewTransaction={() => data.handleOpenModal()}
      />

      {/* Balances Dashboard */}
      <TreasuryBalances
        treasuryAccounts={data.treasuryAccounts}
        calculateBalance={data.calculateBalance}
        totalBalance={data.totalBalance}
      />

      {/* Filters and Search */}
      <TreasuryFilters
        searchTerm={data.searchTerm}
        setSearchTerm={data.setSearchTerm}
        filterType={data.filterType}
        setFilterType={data.setFilterType}
        filterAccount={data.filterAccount}
        setFilterAccount={data.setFilterAccount}
        treasuryAccounts={data.treasuryAccounts}
        totalInflow={data.totalInflow}
        totalOutflow={data.totalOutflow}
      />

      {/* Transactions Table */}
      <TreasuryTable
        filteredTransactions={data.filteredTransactions}
        treasuryAccounts={data.treasuryAccounts}
        getAccountName={getAccountName}
        getCategoryName={getCategoryName}
        getPaymentMethodName={getPaymentMethodName}
        onEdit={data.handleOpenModal}
        onDelete={(id) => {
          data.setTransactionToDeleteId(id);
          data.setIsDeleteConfirmOpen(true);
        }}
      />

      {/* Add/Edit Transaction Modal */}
      <TreasuryTransactionModal
        isOpen={data.isModalOpen}
        onClose={data.handleCloseModal}
        editingTransaction={data.editingTransaction}
        formData={data.formData}
        setFormData={data.setFormData}
        treasuryAccounts={data.treasuryAccounts}
        onSubmit={handleSubmit}
      />

      {/* Add Account Modal */}
      <TreasuryAccountModal
        isOpen={data.isAccountModalOpen}
        onClose={() => data.setIsAccountModalOpen(false)}
        accountFormData={data.accountFormData}
        setAccountFormData={data.setAccountFormData}
        onSubmit={handleAccountSubmit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={data.isDeleteConfirmOpen}
        title="حذف حركة السيولة"
        message="هل أنت متأكد من حذف هذه الحركة المالية المحددة؟ سيتم تعديل رصيد الخزينة/الحساب تلقائياً فور الحذف."
        onConfirm={executeDelete}
        onCancel={() => {
          data.setIsDeleteConfirmOpen(false);
          data.setTransactionToDeleteId(null);
        }}
        confirmText="نعم، احذف"
        cancelText="تراجع"
      />

      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};
