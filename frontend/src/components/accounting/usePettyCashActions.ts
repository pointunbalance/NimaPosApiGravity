import { db } from "../../db";
import { PettyCash, PettyCashExpense, Account, Settings } from "../../types";
import { PettyCashFormData } from "./PettyCashCreateModal";

export const usePettyCashActions = (
  selectedFund: PettyCash | null,
  setSelectedFund: React.Dispatch<React.SetStateAction<PettyCash | null>>,
  expenseAmount: string,
  setExpenseAmount: (val: string) => void,
  expenseDescription: string,
  setExpenseDescription: (val: string) => void,
  expenseAccountId: string,
  setExpenseAccountId: (val: string) => void,
  accounts: Account[],
  settings: Settings | undefined,
  filteredFunds: PettyCash[],
  setIsModalOpen: (open: boolean) => void,
  showSuccess: (msg: string) => void,
  showError: (msg: string) => void
) => {
  const calculateRemaining = (fund: PettyCash) => {
    const totalExpenses = fund.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return fund.amount - totalExpenses;
  };

  const handleCreateFund = async (data: PettyCashFormData) => {
    try {
      await db.transaction("rw", db.pettyCash, db.journalEntries, async () => {
        const fundId = await db.pettyCash.add({
          employeeName: data.employeeName,
          amount: data.amount,
          date: new Date(),
          description: data.description,
          status: "active",
          expenses: [],
          sourceAccountId: data.sourceAccountId,
          pettyCashAccountId: data.pettyCashAccountId,
        });

        // Create Journal Entry for funding
        const AccountingEngine = (await import("../../services/AccountingEngine")).AccountingEngine;
        await AccountingEngine.postEntry({
          date: new Date(),
          reference: `PC-${fundId}`,
          description: `صرف عهدة نقدية للموظف: ${data.employeeName} - ${data.description}`,
          lines: [
            {
              accountId: data.pettyCashAccountId,
              debit: data.amount,
              credit: 0,
              description: `صرف عهدة - ${data.employeeName}`,
            },
            {
              accountId: data.sourceAccountId,
              debit: 0,
              credit: data.amount,
              description: `صرف عهدة - ${data.employeeName}`,
            },
          ],
        });
      });

      setIsModalOpen(false);
      showSuccess("تم إنشاء العهدة بنجاح وصرف المبلغ");
    } catch (err) {
      console.error("Error creating petty cash fund:", err);
      showError("حدث خطأ أثناء إنشاء العهدة");
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFund || !expenseAmount || !expenseDescription || !expenseAccountId) return;

    const amount = parseFloat(expenseAmount);
    const currentTotal = selectedFund.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    if (currentTotal + amount > selectedFund.amount) {
      showError("لا يمكن إضافة مصروف يتجاوز المبلغ المتبقي في العهدة.");
      return;
    }

    const newExpense: PettyCashExpense = {
      id: crypto.randomUUID(),
      date: new Date(),
      amount: amount,
      description: expenseDescription,
      accountId: Number(expenseAccountId),
    };

    const updatedExpenses = [...selectedFund.expenses, newExpense];

    await db.pettyCash.update(selectedFund.id!, {
      expenses: updatedExpenses,
    });

    setSelectedFund({ ...selectedFund, expenses: updatedExpenses });
    setExpenseAmount("");
    setExpenseDescription("");
    setExpenseAccountId("");
    showSuccess("تم إضافة المصروف للعهدة بنجاح");
  };

  const handleRemoveExpense = async (expenseId: string) => {
    if (!selectedFund) return;

    const updatedExpenses = selectedFund.expenses.filter((e) => e.id !== expenseId);

    await db.pettyCash.update(selectedFund.id!, {
      expenses: updatedExpenses,
    });

    setSelectedFund({ ...selectedFund, expenses: updatedExpenses });
    showSuccess("تم حذف المصروف بنجاح");
  };

  const executeCloseFund = async () => {
    if (!selectedFund) return;
    try {
      await db.transaction("rw", db.pettyCash, db.journalEntries, async () => {
        // 1. Update Petty Cash status
        await db.pettyCash.update(selectedFund.id!, {
          status: "closed",
          closedAt: new Date(),
        });

        // 2. Create Journal Entry for expenses and returning remaining amount
        if (selectedFund.expenses.length > 0 && selectedFund.pettyCashAccountId && selectedFund.sourceAccountId) {
          const totalExpenses = selectedFund.expenses.reduce((sum, exp) => sum + exp.amount, 0);
          const remainingAmount = selectedFund.amount - totalExpenses;

          const lines = [];

          // Debit expenses
          selectedFund.expenses.forEach((exp) => {
            if (exp.accountId) {
              lines.push({
                accountId: exp.accountId,
                debit: exp.amount,
                credit: 0,
                description: `تسوية عهدة ${selectedFund.employeeName} - ${exp.description}`,
              });
            }
          });

          // Debit source account (return remaining)
          if (remainingAmount > 0) {
            lines.push({
              accountId: selectedFund.sourceAccountId,
              debit: remainingAmount,
              credit: 0,
              description: `إرجاع متبقي عهدة ${selectedFund.employeeName}`,
            });
          }

          // Credit Petty Cash account
          lines.push({
            accountId: selectedFund.pettyCashAccountId,
            debit: 0,
            credit: selectedFund.amount,
            description: `إغلاق عهدة ${selectedFund.employeeName}`,
          });

          const AccountingEngine = (await import("../../services/AccountingEngine")).AccountingEngine;
          await AccountingEngine.postEntry({
            date: new Date(),
            reference: `PC-CLOSE-${selectedFund.id}`,
            description: `تسوية وإغلاق عهدة الموظف: ${selectedFund.employeeName}`,
            lines: lines,
          });
        }
      });

      setSelectedFund(null);
      showSuccess("تمت تسوية وإغلاق العهدة بنجاح.");
    } catch (err) {
      console.error("Error closing petty cash fund:", err);
      showError("حدث خطأ أثناء إغلاق العهدة");
    }
  };

  const handlePrintDetails = () => {
    if (!selectedFund) return;
    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) return;

    const remaining = calculateRemaining(selectedFund);
    const totalExpenses = selectedFund.expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const html = `
      <html dir="rtl"><head><title>تفاصيل العهدة - ${selectedFund.employeeName}</title>
      <style>body { font-family: Tahoma, sans-serif; padding: 20px; } .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; } .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; } .box { background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #ddd; text-align: center; } h1 { margin: 0; font-size: 24px; color: #333; } h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; } p { margin: 0; font-weight: bold; font-size: 18px; } table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 10px; text-align: right; } th { background-color: #f5f5f5; } .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }</style>
      </head><body><div class="header"><h1>${settings?.storeName || "Nima POS"}</h1><h2>تقرير تفاصيل عهدة نقدية</h2>
      <p style="font-size:14px;font-weight:normal;margin-top:10px;">الموظف: ${selectedFund.employeeName}</p>
      <p style="font-size:14px;font-weight:normal;">التاريخ: ${new Date(selectedFund.date).toLocaleDateString("ar-EG")}</p></div>
      <div class="info-grid"><div class="box"><h3>المبلغ الأساسي</h3><p>${selectedFund.amount.toLocaleString()} ج.م</p></div>
      <div class="box"><h3>إجمالي المصروفات</h3><p style="color:#e11d48;">${totalExpenses.toLocaleString()} ج.م</p></div>
      <div class="box"><h3>المتبقي</h3><p style="color:${remaining < 0 ? "#e11d48" : "#4f46e5"};">${remaining.toLocaleString()} ج.م</p></div></div>
      <h3>سجل المصروفات</h3><table><thead><tr><th>التاريخ</th><th>البيان</th><th>الحساب</th><th>المبلغ</th></tr></thead><tbody>
      ${selectedFund.expenses.length > 0 ? selectedFund.expenses.map(exp => `
        <tr><td>${new Date(exp.date).toLocaleDateString("ar-EG")}</td><td>${exp.description}</td>
        <td>${accounts.find(a => a.id === exp.accountId)?.name || "-"}</td><td>${exp.amount.toLocaleString()} ج.م</td></tr>
      `).join("") : '<tr><td colspan="4" style="text-align:center;">لا توجد مصروفات مسجلة</td></tr>'}
      </tbody></table><div class="footer">تم استخراج التقرير في ${new Date().toLocaleString("ar-EG")}</div><script>window.print();</script></body></html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintList = () => {
    window.print();
  };

  const handleExportList = () => {
    if (filteredFunds.length === 0) {
      showError("لا توجد بيانات للتصدير");
      return;
    }

    const headers = [
      "الموظف",
      "التاريخ",
      "البيان",
      "المبلغ الأساسي",
      "إجمالي المصروفات",
      "المتبقي",
      "الحالة",
    ];
    const csvData = filteredFunds.map((fund) => {
      const totalExpenses = fund.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const remaining = fund.amount - totalExpenses;
      return [
        fund.employeeName,
        new Date(fund.date).toLocaleDateString("ar-EG"),
        fund.description,
        fund.amount,
        totalExpenses,
        remaining,
        fund.status === "active" ? "نشطة" : "مغلقة",
      ];
    });

    const csvContent = [headers, ...csvData].map((e) => e.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `petty_cash_list_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("تم تصدير القائمة بنجاح");
  };

  return {
    handleCreateFund,
    handleAddExpense,
    handleRemoveExpense,
    executeCloseFund,
    handlePrintDetails,
    handlePrintList,
    handleExportList,
  };
};
