import React, { useState } from "react";
import { db, exportFullDatabase, downloadBackup } from "../../db";
import { FiscalYear, JournalEntryLine } from "../../types";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useFiscalYearClosingData } from "../../components/accounting/useFiscalYearClosingData";
import FiscalYearClosingHeader from "../../components/accounting/FiscalYearClosingHeader";
import FiscalYearClosingStepper from "../../components/accounting/FiscalYearClosingStepper";
import FiscalYearSetupStep from "../../components/accounting/FiscalYearSetupStep";
import FiscalYearValidationStep from "../../components/accounting/FiscalYearValidationStep";
import FiscalYearPreviewStep from "../../components/accounting/FiscalYearPreviewStep";
import FiscalYearConfirmationStep from "../../components/accounting/FiscalYearConfirmationStep";
import FiscalYearHistoryTab from "../../components/accounting/FiscalYearHistoryTab";
import FiscalYearEntryModal from "../../components/accounting/FiscalYearEntryModal";

const FiscalYearClosing: React.FC = () => {
  const data = useFiscalYearClosingData();
  const [reopenYear, setReopenYear] = useState<FiscalYear | null>(null);

  const viewClosingEntry = async (year: FiscalYear) => {
    try {
      const closingEntries = await db.journalEntries
        .where("date")
        .equals(year.endDate)
        .toArray();

      const entry = closingEntries.find(
        (j) => j.reference.startsWith("CLOSE-") || j.description.includes("إقفال")
      );

      if (entry) {
        const populatedLines = entry.lines.map((line) => {
          const acc = data.accounts?.find((a) => a.id === line.accountId);
          return {
            ...line,
            accountName: acc ? acc.name : "حساب محذوف",
          };
        });

        data.setClosingEntryDetails({ ...entry, lines: populatedLines });
        data.setSelectedYear(year);
        data.setShowEntryModal(true);
      } else {
        alert("لم يتم العثور على قيد الإقفال لهذه السنة.");
      }
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء جلب تفاصيل القيد.");
    }
  };

  const handleBackup = async () => {
    try {
      const blob = await exportFullDatabase();
      downloadBackup(blob, `PreClosing_Backup_${data.closingDate}.json`);
      data.setHasBackedUp(true);
    } catch (e) {
      alert("فشل النسخ الاحتياطي");
    }
  };

  const executeClosing = async () => {
    if (!data.retainedEarningsId) return;
    data.setIsProcessing(true);

    try {
      const lines: JournalEntryLine[] = [];

      // 1. Build Journal Lines (Zero out temp accounts)
      data.financialSummary.revenueAccounts.forEach((acc) => {
        lines.push({
          accountId: acc.id,
          debit: acc.balance,
          credit: 0,
          description: "إقفال إيرادات",
        });
      });
      data.financialSummary.expenseAccounts.forEach((acc) => {
        lines.push({
          accountId: acc.id,
          debit: 0,
          credit: acc.balance,
          description: "إقفال مصروفات",
        });
      });

      // 2. Transfer to Retained Earnings
      if (data.financialSummary.netIncome > 0) {
        lines.push({
          accountId: Number(data.retainedEarningsId),
          debit: 0,
          credit: data.financialSummary.netIncome,
          description: "ترحيل صافي الربح",
        });
      } else if (data.financialSummary.netIncome < 0) {
        lines.push({
          accountId: Number(data.retainedEarningsId),
          debit: Math.abs(data.financialSummary.netIncome),
          credit: 0,
          description: "ترحيل صافي الخسارة",
        });
      }

      const reference = `CLOSE-${new Date(data.closingDate).getTime()}`;

      const AccountingEngine = (await import("../../services/AccountingEngine")).AccountingEngine;
      await (db as any).transaction(
        "rw",
        db.journalEntries,
        db.fiscalYears,
        db.auditLogs,
        async () => {
          await AccountingEngine.postEntry({
            date: new Date(data.closingDate),
            description: data.description,
            reference: reference,
            lines: lines,
            ignoreClosedPeriod: true,
          });

          await db.fiscalYears.add({
            name: `إقفال ${data.startDate} إلى ${data.closingDate}`,
            startDate: new Date(data.startDate),
            endDate: new Date(data.closingDate),
            status: "closed",
            closedAt: new Date(),
          });

          await db.auditLogs.add({
            userId: "1",
            userName: "مدير النظام",
            action: "closing",
            module: "fiscal_year",
            details: `إقفال السنة المالي من ${data.startDate} إلى ${data.closingDate}`,
            timestamp: new Date().toISOString(),
          });
        }
      );

      alert("تم إقفال الفترة بنجاح!");
      data.setActiveTab("history");
      data.setCurrentStep(1);
      data.setHasBackedUp(false);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء الإقفال");
    } finally {
      data.setIsProcessing(false);
    }
  };

  const executeReopen = async () => {
    if (!reopenYear) return;
    data.setIsProcessing(true);
    try {
      await (db as any).transaction(
        "rw",
        db.journalEntries,
        db.fiscalYears,
        async () => {
          const closingEntries = await db.journalEntries
            .where("date")
            .equals(reopenYear.endDate)
            .toArray();

          const entryToDelete = closingEntries.find(
            (j) => j.reference.startsWith("CLOSE-") || j.description.includes("إقفال")
          );

          if (entryToDelete && entryToDelete.id) {
            await db.journalEntries.delete(entryToDelete.id);
          }

          if (reopenYear.id) {
            await db.fiscalYears.delete(reopenYear.id);
          }
        }
      );
      alert("تم إلغاء الإقفال بنجاح.");
      setReopenYear(null);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء إلغاء الإقفال.");
    } finally {
      data.setIsProcessing(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("ar-IQ", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(val);

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50/50 font-['Tajawal'] print:bg-white print:p-0">
      {/* Header */}
      <FiscalYearClosingHeader activeTab={data.activeTab} setActiveTab={data.setActiveTab} />

      {data.activeTab === "closing" && (
        <div className="max-w-4xl mx-auto print:max-w-none">
          {/* Stepper */}
          <FiscalYearClosingStepper currentStep={data.currentStep} />

          {/* Step 1: Setup */}
          {data.currentStep === 1 && (
            <FiscalYearSetupStep
              startDate={data.startDate}
              setStartDate={data.setStartDate}
              closingDate={data.closingDate}
              setClosingDate={data.setClosingDate}
              retainedEarningsId={data.retainedEarningsId}
              setRetainedEarningsId={data.setRetainedEarningsId}
              accounts={data.accounts}
              financialSummary={data.financialSummary}
              formatCurrency={formatCurrency}
              onNext={() => data.setCurrentStep(2)}
            />
          )}

          {/* Step 2: Validation */}
          {data.currentStep === 2 && (
            <FiscalYearValidationStep
              validationIssues={data.validationIssues}
              hasBackedUp={data.hasBackedUp}
              onBackup={handleBackup}
              onPrev={() => data.setCurrentStep(1)}
              onNext={() => data.setCurrentStep(3)}
            />
          )}

          {/* Step 3: Preview */}
          {data.currentStep === 3 && (
            <FiscalYearPreviewStep
              closingEntryPreview={data.closingEntryPreview}
              startDate={data.startDate}
              closingDate={data.closingDate}
              storeName={data.settings?.storeName}
              formatCurrency={formatCurrency}
              onPrev={() => data.setCurrentStep(2)}
              onNext={() => data.setCurrentStep(4)}
            />
          )}

          {/* Step 4: Confirmation */}
          {data.currentStep === 4 && (
            <FiscalYearConfirmationStep
              isProcessing={data.isProcessing}
              onPrev={() => data.setCurrentStep(3)}
              onExecute={executeClosing}
            />
          )}
        </div>
      )}

      {data.activeTab === "history" && (
        <FiscalYearHistoryTab
          fiscalYears={data.fiscalYears}
          isProcessing={data.isProcessing}
          onViewEntry={viewClosingEntry}
          onReopen={setReopenYear}
        />
      )}

      {/* Entry Details Modal */}
      <FiscalYearEntryModal
        isOpen={data.showEntryModal}
        onClose={() => data.setShowEntryModal(false)}
        closingEntryDetails={data.closingEntryDetails}
        selectedYear={data.selectedYear}
        storeName={data.settings?.storeName}
        formatCurrency={formatCurrency}
      />

      {/* Reopen Confirmation Modal */}
      <ConfirmModal
        isOpen={reopenYear !== null}
        title="إلغاء إقفال السنة المالية"
        message={`هل أنت متأكد من إلغاء إقفال الفترة "${reopenYear?.name}"؟ سيتم حذف قيد الإقفال المرتبط بها.`}
        onConfirm={executeReopen}
        onCancel={() => setReopenYear(null)}
        confirmText="إلغاء الإقفال"
        cancelText="تراجع"
      />
    </div>
  );
};

export default FiscalYearClosing;
