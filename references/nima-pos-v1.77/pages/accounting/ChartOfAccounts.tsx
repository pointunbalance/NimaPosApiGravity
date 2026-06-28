import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { Account, AccountType } from "../../types";
import { ChartOfAccountsHeader } from "../../components/accounting/ChartOfAccountsHeader";
import { ChartOfAccountsSummary } from "../../components/accounting/ChartOfAccountsSummary";
import { ChartOfAccountsFilters } from "../../components/accounting/ChartOfAccountsFilters";
import { ChartOfAccountsTable } from "../../components/accounting/ChartOfAccountsTable";
import {
  AccountModal,
  AccountFormValues,
} from "../../components/accounting/AccountModal";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useToast } from "../../context/ToastContext";

const ChartOfAccounts: React.FC = () => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [accountToDeleteId, setAccountToDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTypeFilter, setActiveTypeFilter] = useState<AccountType | "all">(
    "all",
  );
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const accounts = useLiveQuery(async () => {
    const all = await db.accounts.toArray();
    return all.sort((a, b) => a.code.localeCompare(b.code)); // Sort by code naturally creates hierarchy order
  }, []);

  const settings = useLiveQuery(() => db.settings.toCollection().first());

  // Calculate Balances
  const accountBalances = useLiveQuery(async () => {
    const journals = await db.journalEntries.toArray();
    const bal = new Map<number, number>();
    journals.forEach((j) => {
      j.lines.forEach((l) => {
        const current = bal.get(l.accountId) || 0;
        // Asset/Expense: Debit +, Credit -
        // Liability/Equity/Revenue: Credit +, Debit -
        // Here we store raw (Debit - Credit)
        bal.set(l.accountId, current + (l.debit - l.credit));
      });
    });
    return bal;
  }, []);

  const summary = useMemo(() => {
    const totals = {
      asset: 0,
      liability: 0,
      equity: 0,
      revenue: 0,
      expense: 0,
    };
    if (accounts && accountBalances) {
      accounts.forEach((acc) => {
        const bal = accountBalances.get(acc.id!) || 0;
        if (acc.type === "asset" || acc.type === "expense") {
          totals[acc.type] += bal;
        } else {
          totals[acc.type] += -bal;
        }
      });
    }
    return totals;
  }, [accounts, accountBalances]);

  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];
    return accounts.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.code.includes(searchTerm);
      const matchesType =
        activeTypeFilter === "all" || a.type === activeTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [accounts, searchTerm, activeTypeFilter]);

  // --- Handlers ---

  const handleSubmit = async (data: AccountFormValues) => {
    setErrorMsg(null);

    try {
      // Validation: Check duplicate code
      const existing = await db.accounts
        .where("code")
        .equals(data.code)
        .first();
      if (existing && existing.id !== editingAccount?.id) {
        setErrorMsg(
          `الكود ${data.code} مستخدم بالفعل لحساب "${existing.name}"`,
        );
        return;
      }

      if (editingAccount?.id) {
        await db.accounts.update(editingAccount.id, data);
      } else {
        await db.accounts.add(data as Account);
      }
      closeModal();
    } catch (e) {
      console.error(e);
      setErrorMsg("حدث خطأ أثناء الحفظ");
    }
  };

  const deleteAccount = async (id: number) => {
    const accToDel = accounts?.find(a => a.id === id);
    if (!accToDel) return;

    // Check if it has sub-accounts
    const hasChildren = accounts?.some(a => a.code.startsWith(accToDel.code) && a.code !== accToDel.code);
    if (hasChildren) {
      showToast("لا يمكن حذف هذا الحساب لأنه يحتوي على حسابات فرعية. الرجاء حذف الحسابات الفرعية أولاً.", "error");
      return;
    }

    // Check if used in journal entries
    const used = await db.journalEntries
      .filter((j) => j.lines.some((l) => l.accountId === id))
      .count();
    if (used > 0) {
      showToast(`لا يمكن حذف هذا الحساب لأنه مستخدم في ${used} قيود محاسبية.`, "error");
      return;
    }

    setAccountToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (accountToDeleteId) {
      await db.accounts.delete(accountToDeleteId);
      showToast("تم حذف الحساب بنجاح", "success");
      setAccountToDeleteId(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  // --- Import / Export ---

  const handleExport = () => {
    if (!accounts) return;
    const headers = ["Code", "Name", "Type", "Balance", "Description"];
    const rows = accounts.map((a) => {
      const rawBalance = accountBalances?.get(a.id!) || 0;
      const displayBal = Math.abs(rawBalance);
      const isDr = rawBalance >= 0;
      const balanceStr =
        rawBalance !== 0 ? `${displayBal} ${isDr ? "Dr" : "Cr"}` : "0";
      return [a.code, a.name, a.type, balanceStr, a.description || ""];
    });
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "chart_of_accounts.csv";
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").slice(1); // Skip header
      let count = 0;

      await (db as any).transaction("rw", db.accounts, async () => {
        for (const line of lines) {
          if (!line.trim()) continue;
          // Handle potential commas inside quotes if needed, but for simple split:
          const parts = line.split(",");
          if (parts.length >= 3) {
            const code = parts[0];
            const name = parts[1];
            const type = parts[2];
            // If exported with balance, desc is at index 4, else at index 3
            const desc =
              parts.length >= 5
                ? parts.slice(4).join(",")
                : parts.slice(3).join(",");

            // Check exist
            const exist = await db.accounts
              .where("code")
              .equals(code.trim())
              .count();
            if (exist === 0) {
              await db.accounts.add({
                code: code.trim(),
                name: name.trim(),
                type: type.trim().toLowerCase() as AccountType,
                description: desc ? desc.trim() : "",
              });
              count++;
            }
          }
        }
      });
      showToast(`تم استيراد ${count} حساب بنجاح`, "success");
      e.target.value = ""; // Reset
    };
    reader.readAsText(file);
  };

  // --- UI Helpers ---

  const openModal = (account?: Account) => {
    setErrorMsg(null);
    if (account) {
      setEditingAccount(account);
    } else {
      setEditingAccount(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
    setErrorMsg(null);
  };

  return (
    <div
      className="p-8 h-full overflow-y-auto bg-slate-50/50 font-['Tajawal'] print:p-0 print:bg-white"
      dir="rtl"
    >
      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
        <h2 className="text-2xl font-bold print:text-black">
          {settings?.storeName || "Nima POS"}
        </h2>
        <h3 className="text-xl font-bold mt-2 print:text-black">
          دليل الحسابات
        </h3>
        <p className="text-sm mt-2 print:text-black">
          تاريخ التقرير: {new Date().toLocaleDateString("ar-EG")}
        </p>
      </div>

      <div className="print:hidden">
        <ChartOfAccountsHeader
          onImport={handleImport}
          onExport={handleExport}
          onNewAccount={() => openModal()}
        />
      </div>

      <div className="print:block">
        <ChartOfAccountsSummary summary={summary} />
      </div>

      <div className="print:hidden">
        <ChartOfAccountsFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeTypeFilter={activeTypeFilter}
          setActiveTypeFilter={setActiveTypeFilter}
        />
      </div>

      <ChartOfAccountsTable
        accounts={filteredAccounts}
        accountBalances={accountBalances}
        onEdit={openModal}
        onDelete={deleteAccount}
      />

      <AccountModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        editingAccount={editingAccount}
        errorMsg={errorMsg}
        defaultType={activeTypeFilter === "all" ? "asset" : activeTypeFilter}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="حذف الحساب المالي"
        message="هل أنت متأكد من رغبتك في حذف هذا الحساب المالي؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
};

export default ChartOfAccounts;
