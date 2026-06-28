import React from "react";
import { db } from "../../db";
import { BankCheck } from "../../types";

export const useCheckManagementActions = (
  activeTab: "receivable" | "payable",
  formNumber: string,
  formAmount: number | "",
  formBank: string,
  formIssueDate: string,
  formDueDate: string,
  formPayeeId: number | "",
  formStatus: BankCheck["status"],
  formImage: string,
  editingCheck: BankCheck | null,
  setEditingCheck: React.Dispatch<React.SetStateAction<BankCheck | null>>,
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setFormNumber: React.Dispatch<React.SetStateAction<string>>,
  setFormAmount: React.Dispatch<React.SetStateAction<number | "">>,
  setFormBank: React.Dispatch<React.SetStateAction<string>>,
  setFormIssueDate: React.Dispatch<React.SetStateAction<string>>,
  setFormDueDate: React.Dispatch<React.SetStateAction<string>>,
  setFormPayeeId: React.Dispatch<React.SetStateAction<number | "">>,
  setFormStatus: React.Dispatch<React.SetStateAction<BankCheck["status"]>>,
  setFormImage: React.Dispatch<React.SetStateAction<string>>,
  customers: any[] | undefined,
  suppliers: any[] | undefined,
  accounts: any[] | undefined,
  fiscalYears: any[] | undefined,
  checks: BankCheck[] | undefined,
  filteredChecks: BankCheck[],
  successToast: (msg: string) => void,
  errorToast: (msg: string) => void
) => {
  const openModal = (check?: BankCheck) => {
    if (check) {
      setEditingCheck(check);
      setFormNumber(check.number);
      setFormAmount(check.amount);
      setFormBank(check.bankName);
      setFormIssueDate(new Date(check.issueDate).toISOString().split("T")[0]);
      setFormDueDate(new Date(check.dueDate).toISOString().split("T")[0]);
      setFormPayeeId(check.payeeId || "");
      setFormStatus(check.status);
      setFormImage(check.image || "");
    } else {
      setEditingCheck(null);
      setFormNumber("");
      setFormAmount("");
      setFormBank("");
      setFormIssueDate(new Date().toISOString().split("T")[0]);
      setFormDueDate(new Date().toISOString().split("T")[0]);
      setFormPayeeId("");
      setFormStatus("pending");
      setFormImage("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCheck(null);
  };

  const handleSave = async () => {
    if (!formNumber || !formAmount || !formPayeeId) return;

    const d = new Date().getTime();
    const isClosed = fiscalYears?.some((fy) => {
      const start = new Date(fy.startDate).setHours(0, 0, 0, 0);
      const end = new Date(fy.endDate).setHours(23, 59, 59, 999);
      return d >= start && d <= end && fy.status === "closed";
    });

    if (
      formStatus === "cleared" &&
      (!editingCheck || editingCheck.status !== "cleared") &&
      isClosed
    ) {
      errorToast("لا يمكن تحصيل/صرف شيك في سنة مالية مغلقة.");
      return;
    }

    if (editingCheck?.status === "cleared") {
      if (
        formStatus !== "cleared" ||
        Number(formAmount) !== editingCheck.amount ||
        activeTab !== editingCheck.type
      ) {
        errorToast(
          "لا يمكن تعديل المبلغ أو النوع أو إلغاء حالة التحصيل لشيك محصل لارتباطه بقيود مالية. يرجى إنشاء قيد عكسي يدوياً إذا دعت الحاجة."
        );
        return;
      }
    }

    let payeeName = "";
    if (activeTab === "receivable") {
      payeeName =
        customers?.find((c) => c.id === Number(formPayeeId))?.name || "Unknown";
    } else {
      payeeName =
        suppliers?.find((s) => s.id === Number(formPayeeId))?.name || "Unknown";
    }

    const checkData: BankCheck = {
      number: formNumber,
      amount: Number(formAmount),
      bankName: formBank,
      issueDate: new Date(formIssueDate),
      dueDate: new Date(formDueDate),
      type: activeTab,
      status: formStatus,
      payeeId: Number(formPayeeId),
      payeeName: payeeName,
      image: formImage,
    };

    try {
      await (db as any).transaction(
        "rw",
        db.bankChecks,
        db.journalEntries,
        db.accounts,
        async () => {
          if (editingCheck?.id) {
            await db.bankChecks.update(editingCheck.id, checkData);
          } else {
            await db.bankChecks.add(checkData);
          }

          // Journal Entry Creation Logic
          if (
            formStatus === "cleared" &&
            (!editingCheck || editingCheck.status !== "cleared")
          ) {
            const desc = `${
              activeTab === "receivable" ? "تحصيل" : "صرف"
            } شيك رقم ${formNumber} - ${payeeName}`;

            const bankAcc = accounts?.find((a) => a.code.startsWith("102")); // Asset: Bank
            const notesRec = accounts?.find((a) => a.code.startsWith("105")); // Asset: Notes Receivable
            const notesPay = accounts?.find((a) => a.code.startsWith("203")); // Liability: Notes Payable

            if (bankAcc) {
              const lines = [];
              if (activeTab === "receivable" && notesRec) {
                lines.push({
                  accountId: bankAcc.id!,
                  debit: Number(formAmount),
                  credit: 0,
                  accountName: bankAcc.name,
                });
                lines.push({
                  accountId: notesRec.id!,
                  debit: 0,
                  credit: Number(formAmount),
                  accountName: notesRec.name,
                });
              } else if (activeTab === "payable" && notesPay) {
                lines.push({
                  accountId: notesPay.id!,
                  debit: Number(formAmount),
                  credit: 0,
                  accountName: notesPay.name,
                });
                lines.push({
                  accountId: bankAcc.id!,
                  debit: 0,
                  credit: Number(formAmount),
                  accountName: bankAcc.name,
                });
              }

              if (lines.length > 0) {
                const { AccountingEngine } = await import(
                  "../../services/AccountingEngine"
                );
                await AccountingEngine.postEntry({
                  date: new Date(),
                  description: desc,
                  reference: `CHK-${formNumber}`,
                  lines: lines,
                });
              }
            }
          }
        }
      );
      closeModal();
      successToast("تم حفظ الشيك بنجاح!");
    } catch (e) {
      console.error(e);
      errorToast("خطأ في الحفظ");
    }
  };

  const checkDeleteEligibility = (id: number): boolean => {
    const check = checks?.find((c) => c.id === id);
    if (check && check.status === "cleared") {
      const isClosed = fiscalYears?.some((fy) => {
        const start = new Date(fy.startDate).setHours(0, 0, 0, 0);
        const end = new Date(fy.endDate).setHours(23, 59, 59, 999);
        const issueTime = new Date(check.issueDate).getTime();
        const dueTime = new Date(check.dueDate).getTime();
        return (
          (issueTime >= start && issueTime <= end && fy.status === "closed") ||
          (dueTime >= start && dueTime <= end && fy.status === "closed")
        );
      });

      if (isClosed) {
        errorToast("لا يمكن حذف شيك محصل مرتبط بسنة مالية مغلقة.");
        return false;
      }
    }
    return true;
  };

  const executeDeleteCheck = async (id: number) => {
    try {
      await db.bankChecks.delete(id);
      successToast("تم حذف الشيك بنجاح.");
    } catch (e) {
      console.error(e);
      errorToast("فشل حذف الشيك.");
    }
  };

  const handleExport = () => {
    const data = filteredChecks.map((c) => [
      c.number,
      c.bankName,
      c.payeeName,
      c.amount,
      new Date(c.dueDate).toLocaleDateString(),
      c.status === "cleared" ? "محصل" : "معلق",
    ]);
    const headers = [
      "Check No",
      "Bank",
      "Payee",
      "Amount",
      "Due Date",
      "Status",
    ];
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...data.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `checks_report.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return {
    openModal,
    closeModal,
    handleSave,
    checkDeleteEligibility,
    executeDeleteCheck,
    handleExport,
    handlePrint,
  };
};
