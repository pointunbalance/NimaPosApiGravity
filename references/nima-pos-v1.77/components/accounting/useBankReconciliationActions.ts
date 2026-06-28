import { db } from "../../db";
import { BankReconciliation } from "../../types";

export const useBankReconciliationActions = (
  selectedAccountId: number | "",
  statementDate: string,
  statementBalance: number | "",
  selectedEntryIds: Set<number>,
  setSelectedEntryIds: React.Dispatch<React.SetStateAction<Set<number>>>,
  setStatementBalance: React.Dispatch<React.SetStateAction<number | "">>,
  setShowHistory: React.Dispatch<React.SetStateAction<boolean>>,
  unreconciledTransactions: any[],
  displayedTransactions: any[],
  calculation: any,
  fiscalYears: any[] | undefined,
  adjAmount: number | "",
  adjType: "fee" | "interest",
  adjDate: string,
  adjExpenseAccId: number | "",
  setIsAdjModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setAdjAmount: React.Dispatch<React.SetStateAction<number | "">>,
  accounts: any[] | undefined,
  settings: any,
  formatCurrency: (val: number) => string,
  setViewingRecId: React.Dispatch<React.SetStateAction<number | null>>,
  successToast: (msg: string) => void,
  errorToast: (msg: string) => void
) => {
  const isAllSelected =
    displayedTransactions.length > 0 &&
    displayedTransactions.every((tx) => selectedEntryIds.has(tx.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const newSet = new Set(selectedEntryIds);
      displayedTransactions.forEach((tx) => newSet.delete(tx.id));
      setSelectedEntryIds(newSet);
    } else {
      const newSet = new Set(selectedEntryIds);
      displayedTransactions.forEach((tx) => newSet.add(tx.id));
      setSelectedEntryIds(newSet);
    }
  };

  const toggleTransaction = (id: number) => {
    const newSet = new Set(selectedEntryIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedEntryIds(newSet);
  };

  const autoMatch = () => {
    const newSet = new Set(selectedEntryIds);
    const targetDate = new Date(statementDate).getTime();

    unreconciledTransactions.forEach((tx) => {
      if (new Date(tx.date).getTime() <= targetDate) {
        newSet.add(tx.id);
      }
    });
    setSelectedEntryIds(newSet);
  };

  const handleSaveReconciliation = async () => {
    if (!selectedAccountId || !statementBalance) return;
    if (!calculation.isBalanced) {
      errorToast("لا يمكن الحفظ. الفارق يجب أن يكون صفر.");
      return;
    }

    const d = new Date(statementDate).getTime();
    const isClosed = fiscalYears?.some((fy) => {
      const start = new Date(fy.startDate).setHours(0, 0, 0, 0);
      const end = new Date(fy.endDate).setHours(23, 59, 59, 999);
      return d >= start && d <= end && fy.status === "closed";
    });

    if (isClosed) {
      errorToast("لا يمكن حفظ تسوية بنكية في سنة مالية مغلقة.");
      return;
    }

    try {
      await db.bankReconciliations.add({
        accountId: Number(selectedAccountId),
        statementDate: new Date(statementDate),
        statementBalance: Number(statementBalance),
        reconciledEntryIds: Array.from(selectedEntryIds),
        status: "finalized",
        createdAt: new Date(),
      });

      successToast("تم حفظ التسوية واعتمادها بنجاح!");
      setSelectedEntryIds(new Set());
      setStatementBalance("");
      setShowHistory(true);
    } catch (e) {
      console.error(e);
      errorToast("حدث خطأ أثناء الحفظ");
    }
  };

  const handleAddAdjustment = async () => {
    if (!adjAmount || !adjExpenseAccId || !selectedAccountId) return;

    const d = new Date(adjDate).getTime();
    const isClosed = fiscalYears?.some((fy) => {
      const start = new Date(fy.startDate).setHours(0, 0, 0, 0);
      const end = new Date(fy.endDate).setHours(23, 59, 59, 999);
      return d >= start && d <= end && fy.status === "closed";
    });

    if (isClosed) {
      errorToast("لا يمكن إضافة تسوية في سنة مالية مغلقة.");
      return;
    }

    try {
      const isFee = adjType === "fee";

      const bankLine = {
        accountId: Number(selectedAccountId),
        debit: isFee ? 0 : Number(adjAmount),
        credit: isFee ? Number(adjAmount) : 0,
        description: isFee ? "مصروفات بنكية - تسوية" : "فوائد دائنة - تسوية",
      };

      const contraLine = {
        accountId: Number(adjExpenseAccId),
        debit: isFee ? Number(adjAmount) : 0,
        credit: isFee ? 0 : Number(adjAmount),
        description: isFee ? "مصروفات بنكية" : "ايراد فوائد",
      };

      const { AccountingEngine } = await import("../../services/AccountingEngine");
      const id = await AccountingEngine.postEntry({
        date: new Date(adjDate),
        description: isFee
          ? `مصروفات بنكية (تسوية ${statementDate})`
          : `فوائد بنكية (تسوية ${statementDate})`,
        reference: "ADJ-BNK",
        lines: [bankLine, contraLine],
      });

      setSelectedEntryIds((prev) => new Set(prev).add(id as number));
      setIsAdjModalOpen(false);
      setAdjAmount("");
      successToast("تمت إضافة قيد التسوية بنجاح!");
    } catch (e) {
      console.error(e);
      errorToast("فشل إضافة التسوية");
    }
  };

  const executeUndoReconciliation = async (recId: number) => {
    try {
      await db.bankReconciliations.delete(recId);
      successToast("تم إلغاء التسوية بنجاح.");
    } catch (e) {
      console.error(e);
      errorToast("حدث خطأ أثناء إلغاء التسوية.");
    }
  };

  const handleExportUnreconciled = () => {
    if (displayedTransactions.length === 0) {
      errorToast("لا توجد بيانات للتصدير");
      return;
    }

    const headers = [
      "التاريخ",
      "البيان",
      "المرجع",
      "مدين (إيداع)",
      "دائن (سحب)",
    ];
    const csvData = displayedTransactions.map((tx) => [
      new Date(tx.date).toLocaleDateString("ar-EG"),
      tx.desc,
      tx.ref || "",
      tx.debit > 0 ? tx.debit : "",
      tx.credit > 0 ? tx.credit : "",
    ]);

    const csvContent = [headers, ...csvData].map((e) => e.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `unreconciled_transactions_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = (rec: BankReconciliation) => {
    const accountName = accounts?.find((a) => a.id === rec.accountId)?.name;
    const recDate = new Date(rec.statementDate).toLocaleDateString();

    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) return;

    const html = `
        <html dir="rtl">
          <head>
            <title>تقرير تسوية بنكية - ${recDate}</title>
            <style>
              body { font-family: Tahoma, sans-serif; padding: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
              .box { background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #ddd; }
              h1 { margin: 0; font-size: 24px; color: #333; }
              h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; }
              p { margin: 0; font-weight: bold; font-size: 16px; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${settings?.storeName || "Nima POS"}</h1>
              <p>تقرير تسوية البنك</p>
            </div>
            
            <div class="info-grid">
                <div class="box">
                    <h3>الحساب البنكي</h3>
                    <p>${accountName}</p>
                </div>
                <div class="box">
                    <h3>تاريخ الكشف</h3>
                    <p>${recDate}</p>
                </div>
            </div>

            <div class="info-grid">
                <div class="box">
                    <h3>رصيد الكشف (Statement Balance)</h3>
                    <p>${formatCurrency(rec.statementBalance)}</p>
                </div>
                <div class="box">
                    <h3>عدد العمليات المطابقة</h3>
                    <p>${rec.reconciledEntryIds.length}</p>
                </div>
            </div>

            <div style="text-align:center; padding: 20px; background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; color: #047857; font-weight: bold;">
                تمت المطابقة بنجاح (الفارق: 0.00)
            </div>

            <div class="footer">
                تم استخراج التقرير في ${new Date().toLocaleString()}
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return {
    isAllSelected,
    toggleSelectAll,
    toggleTransaction,
    autoMatch,
    handleSaveReconciliation,
    handleAddAdjustment,
    executeUndoReconciliation,
    handleExportUnreconciled,
    printReport,
  };
};
