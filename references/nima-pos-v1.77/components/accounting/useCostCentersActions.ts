import { db } from "../../db";
import { CostCenter } from "../../types";
import { CostCenterAnalytics } from "./useCostCentersData";

export const useCostCentersActions = (
  formData: Partial<CostCenter>,
  editingCenter: CostCenter | null,
  setFormData: (val: Partial<CostCenter>) => void,
  setIsModalOpen: (val: boolean) => void,
  setEditingCenter: (val: CostCenter | null) => void,
  analytics: CostCenterAnalytics,
  dateRange: { start: string; end: string },
  showSuccess: (msg: string) => void,
  showError: (msg: string) => void
) => {
  const handleSave = async () => {
    if (!formData.name || !formData.code) return;
    try {
      if (editingCenter?.id) {
        await db.costCenters.update(editingCenter.id, formData);
        showSuccess("تم تحديث مركز التكلفة بنجاح");
      } else {
        await db.costCenters.add(formData as CostCenter);
        showSuccess("تم إضافة مركز تكلفة جديد بنجاح");
      }
      setIsModalOpen(false);
      setEditingCenter(null);
      setFormData({ name: "", code: "", description: "", budget: 0 });
    } catch (e) {
      console.error(e);
      showError("حدث خطأ أثناء حفظ مركز التكلفة");
    }
  };

  const executeDeleteCenter = async (id: number) => {
    try {
      await db.costCenters.delete(id);
      showSuccess("تم حذف مركز التكلفة بنجاح");
    } catch (err) {
      console.error(err);
      showError("حدث خطأ أثناء حذف مركز التكلفة");
    }
  };

  const handleExport = () => {
    const headers = [
      "الكود",
      "الاسم",
      "الميزانية",
      "المصروف الفعلي",
      "الإيراد الفعلي",
      "صافي التكلفة",
      "الحالة",
      "المتبقي من الميزانية",
    ];
    const rows = analytics.filteredCenters.map((c) => {
      const expense = analytics.stats.get(c.id!)?.expense || 0;
      const income = analytics.stats.get(c.id!)?.income || 0;
      const netCost = expense - income;
      const budget = c.budget || 0;
      const remaining = budget - expense;
      return [
        c.code,
        c.name,
        budget,
        expense,
        income,
        netCost,
        budget > 0 && expense > budget ? "تجاوز الميزانية" : "طبيعي",
        remaining,
      ];
    });
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `cost_centers_${dateRange.start}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return {
    handleSave,
    executeDeleteCenter,
    handleExport,
    handlePrint,
  };
};
