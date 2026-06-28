import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { Budget } from "../../types";
import BudgetingHeader from "../../components/accounting/BudgetingHeader";
import BudgetingFilters from "../../components/accounting/BudgetingFilters";
import BudgetingTable from "../../components/accounting/BudgetingTable";
import BudgetModal, {
  BudgetFormData,
} from "../../components/accounting/BudgetModal";
import BudgetDetailsModal from "../../components/accounting/BudgetDetailsModal";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useToast } from "../../context/ToastContext";

const Budgeting: React.FC = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [budgetToDeleteId, setBudgetToDeleteId] = useState<number | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [viewingBudget, setViewingBudget] = useState<Budget | null>(null);

  // Data
  const budgets = useLiveQuery(() => db.budgets.toArray(), []) || [];
  const fiscalYears = useLiveQuery(() => db.fiscalYears.toArray(), []) || [];
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];
  const costCenters = useLiveQuery(() => db.costCenters.toArray(), []) || [];
  const journals = useLiveQuery(() => db.journalEntries.toArray(), []) || [];

  // Filter accounts to only Expense and Revenue
  const budgetableAccounts = useMemo(() => {
    return accounts.filter((a) => a.type === "expense" || a.type === "revenue");
  }, [accounts]);

  const filteredBudgets = useMemo(() => {
    return budgets.filter((b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [budgets, searchTerm]);

  // Calculate actuals for the currently viewed budget
  const actuals = useMemo(() => {
    if (!viewingBudget) return {};
    const fy = fiscalYears.find((f) => f.id === viewingBudget.fiscalYearId);
    if (!fy) return {};

    const start = new Date(fy.startDate).getTime();
    const end = new Date(fy.endDate).getTime();

    const results: Record<string, number> = {};

    journals.forEach((entry) => {
      const entryDate = new Date(entry.date).getTime();
      if (entryDate >= start && entryDate <= end) {
        entry.lines.forEach((line) => {
          const account = accounts.find((a) => a.id === line.accountId);
          if (!account) return;

          // For expenses, actual = debit - credit. For revenue, actual = credit - debit.
          // Usually budgets are for expenses, but let's handle both.
          let amount = 0;
          if (account.type === "expense") {
            amount = line.debit - line.credit;
          } else if (account.type === "revenue") {
            amount = line.credit - line.debit;
          } else {
            amount = line.debit - line.credit; // Default
          }

          if (amount !== 0) {
            // Key with cost center
            if (line.costCenterId) {
              const key = `${line.accountId}-${line.costCenterId}`;
              results[key] = (results[key] || 0) + amount;
            }
            // Key without cost center (for budget lines that don't specify cost center)
            const keyNoCc = `${line.accountId}-`;
            results[keyNoCc] = (results[keyNoCc] || 0) + amount;
          }
        });
      }
    });

    return results;
  }, [viewingBudget, journals, fiscalYears, accounts]);

  const handleOpenModal = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget);
    } else {
      setEditingBudget(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  const handleViewDetails = (budget: Budget) => {
    setViewingBudget(budget);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setViewingBudget(null);
  };

  const handleSaveBudget = async (data: BudgetFormData) => {
    try {
      const budgetData: Budget = {
        ...data,
        createdAt: editingBudget ? editingBudget.createdAt : new Date(),
        updatedAt: new Date(),
      };

      if (editingBudget && editingBudget.id) {
        await db.budgets.put({ ...budgetData, id: editingBudget.id });
      } else {
        await db.budgets.add(budgetData);
      }
      showToast("تم حفظ الموازنة بنجاح", "success");
      handleCloseModal();
    } catch (error) {
      console.error("Error saving budget:", error);
      showToast("حدث خطأ أثناء حفظ الموازنة.", "error");
    }
  };

  const handleDelete = (id: number) => {
    setBudgetToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (budgetToDeleteId) {
      await db.budgets.delete(budgetToDeleteId);
      showToast("تم حذف الموازنة بنجاح", "success");
      setBudgetToDeleteId(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const headers = [
      "الموازنة",
      "السنة المالية",
      "إجمالي الموازنة",
      "تاريخ الإنشاء",
    ];
    const rows = filteredBudgets.map((b) => {
      const fy = fiscalYears.find((f) => f.id === b.fiscalYearId);
      const total = b.lines.reduce((sum, line) => sum + line.amount, 0);
      return [
        b.name,
        fy ? fy.name : "غير محدد",
        total,
        new Date(b.createdAt).toLocaleDateString(),
      ];
    });
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `budgets.csv`;
    link.click();
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50/50 font-['Tajawal'] print:p-0 print:bg-white">
      <BudgetingHeader
        onOpenModal={() => handleOpenModal()}
        onPrint={handlePrint}
        onExport={handleExport}
      />

      <div className="print:hidden">
        <BudgetingFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>

      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-6">
        <h2 className="text-3xl font-bold mb-2 print:text-black">
          الموازنات التقديرية
        </h2>
      </div>

      <BudgetingTable
        budgets={filteredBudgets}
        fiscalYears={fiscalYears}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
      />

      <BudgetModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSaveBudget}
        editingBudget={editingBudget}
        fiscalYears={fiscalYears}
        budgetableAccounts={budgetableAccounts}
        costCenters={costCenters}
      />

      <BudgetDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        budget={viewingBudget}
        fiscalYears={fiscalYears}
        accounts={accounts}
        costCenters={costCenters}
        actuals={actuals}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="حذف الموازنة التقديرية"
        message="هل أنت متأكد من رغبتك في حذف هذه الموازنة التقديرية؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
};

export default Budgeting;
