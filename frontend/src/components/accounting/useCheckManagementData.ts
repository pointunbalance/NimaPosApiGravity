import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { BankCheck } from "../../types";

export const useCheckManagementData = () => {
  const [activeTab, setActiveTab] = useState<"receivable" | "payable">("receivable");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "cleared" | "bounced" | "overdue">("pending");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0],
    end: new Date(new Date().setMonth(new Date().getMonth() + 3))
      .toISOString()
      .split("T")[0],
  });

  const [editingCheck, setEditingCheck] = useState<BankCheck | null>(null);

  // Form State
  const [formNumber, setFormNumber] = useState("");
  const [formAmount, setFormAmount] = useState<number | "">("");
  const [formBank, setFormBank] = useState("");
  const [formIssueDate, setFormIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formDueDate, setFormDueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formPayeeId, setFormPayeeId] = useState<number | "">("");
  const [formStatus, setFormStatus] = useState<BankCheck["status"]>("pending");
  const [formImage, setFormImage] = useState("");

  const checks = useLiveQuery(() => db.bankChecks.toArray(), []);
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []);
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const fiscalYears = useLiveQuery(() => db.fiscalYears.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  // --- Logic & Calculations ---

  const getDaysRemaining = (dueDate: Date) => {
    const diff =
      new Date(dueDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filteredChecks = useMemo(() => {
    if (!checks) return [];
    return checks
      .filter((c) => {
        const matchesType = c.type === activeTab;
        const matchesSearch =
          c.number.includes(searchTerm) ||
          c.payeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.bankName.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesStatus = true;
        const daysRem = getDaysRemaining(c.dueDate);

        if (statusFilter === "overdue") {
          matchesStatus = c.status === "pending" && daysRem < 0;
        } else if (statusFilter !== "all") {
          matchesStatus = c.status === statusFilter;
        }

        const dDate = new Date(c.dueDate).setHours(0, 0, 0, 0);
        const start = new Date(dateRange.start).setHours(0, 0, 0, 0);
        const end = new Date(dateRange.end).setHours(23, 59, 59, 999);
        const matchesDate = dDate >= start && dDate <= end;

        return matchesType && matchesSearch && matchesStatus && matchesDate;
      })
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
  }, [checks, activeTab, searchTerm, statusFilter, dateRange]);

  const stats = useMemo(() => {
    if (!checks)
      return { incoming: 0, outgoing: 0, overdueCount: 0, overdueAmount: 0 };

    const pendingChecks = checks.filter((c) => c.status === "pending");

    const incoming = pendingChecks
      .filter((c) => c.type === "receivable")
      .reduce((s, c) => s + c.amount, 0);
    const outgoing = pendingChecks
      .filter((c) => c.type === "payable")
      .reduce((s, c) => s + c.amount, 0);

    const overdue = pendingChecks.filter(
      (c) => getDaysRemaining(c.dueDate) < 0
    );

    return {
      incoming,
      outgoing,
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, c) => s + c.amount, 0),
    };
  }, [checks]);

  return {
    activeTab,
    setActiveTab,
    isModalOpen,
    setIsModalOpen,
    viewImage,
    setViewImage,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
    editingCheck,
    setEditingCheck,
    formNumber,
    setFormNumber,
    formAmount,
    setFormAmount,
    formBank,
    setFormBank,
    formIssueDate,
    setFormIssueDate,
    formDueDate,
    setFormDueDate,
    formPayeeId,
    setFormPayeeId,
    formStatus,
    setFormStatus,
    formImage,
    setFormImage,
    checks,
    customers,
    suppliers,
    accounts,
    fiscalYears,
    settings,
    getDaysRemaining,
    filteredChecks,
    stats,
  };
};
