import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { CostCenter } from "../../types";

export interface CostCenterAnalytics {
  stats: Map<number, { expense: number; income: number; count: number }>;
  totalExpenses: number;
  totalIncome: number;
  chartData: Array<{ name: string; value: number; income: number; budget: number }>;
  transactions: any[];
  filteredCenters: CostCenter[];
}

export const useCostCentersData = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Date Filter
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const [formData, setFormData] = useState<Partial<CostCenter>>({
    name: "",
    code: "",
    description: "",
    budget: 0,
  });

  const costCenters = useLiveQuery(() => db.costCenters.toArray(), []) || [];
  const journals = useLiveQuery(() => db.journalEntries.toArray(), []) || [];

  const setQuickFilter = (filter: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (filter) {
      case "thisMonth":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "lastMonth":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "thisYear":
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      case "allTime":
        start = new Date(2000, 0, 1);
        end = new Date(2100, 11, 31);
        break;
    }

    setDateRange({
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    });
  };

  const analytics: CostCenterAnalytics = useMemo(() => {
    if (!costCenters || !journals) {
      return {
        stats: new Map(),
        totalExpenses: 0,
        totalIncome: 0,
        chartData: [],
        transactions: [],
        filteredCenters: [],
      };
    }

    const startDate = new Date(dateRange.start).setHours(0, 0, 0, 0);
    const endDate = new Date(dateRange.end).setHours(23, 59, 59, 999);

    const stats = new Map<number, { expense: number; income: number; count: number }>();
    let totalExpenses = 0;
    let totalIncome = 0;
    const transactions: any[] = [];

    const filteredCenters = costCenters.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    journals.forEach((entry) => {
      const entryDate = new Date(entry.date).getTime();
      if (entryDate >= startDate && entryDate <= endDate) {
        entry.lines.forEach((line) => {
          if (line.costCenterId) {
            const current = stats.get(line.costCenterId) || {
              expense: 0,
              income: 0,
              count: 0,
            };

            current.expense += line.debit;
            current.income += line.credit;
            current.count += 1;

            stats.set(line.costCenterId, current);

            if (filteredCenters.some((c) => c.id === line.costCenterId)) {
              totalExpenses += line.debit;
              totalIncome += line.credit;
            }

            if (selectedCenterId === line.costCenterId) {
              transactions.push({
                ...line,
                date: entry.date,
                ref: entry.reference,
                desc: entry.description,
                entryId: entry.id,
              });
            }
          }
        });
      }
    });

    const chartData = filteredCenters
      .map((c) => ({
        name: c.name,
        value: stats.get(c.id!)?.expense || 0,
        income: stats.get(c.id!)?.income || 0,
        budget: c.budget || 0,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      stats,
      totalExpenses,
      totalIncome,
      chartData,
      transactions,
      filteredCenters,
    };
  }, [costCenters, journals, dateRange, selectedCenterId, searchTerm]);

  return {
    isModalOpen,
    setIsModalOpen,
    editingCenter,
    setEditingCenter,
    selectedCenterId,
    setSelectedCenterId,
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    formData,
    setFormData,
    costCenters,
    journals,
    setQuickFilter,
    analytics,
  };
};
