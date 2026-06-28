import React from "react";
import { useFinancialReportsData } from "../../components/accounting/reports/useFinancialReportsData";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import FinancialReportsHeader from "../../components/accounting/reports/FinancialReportsHeader";
import FinancialReportsKPIs from "../../components/accounting/reports/FinancialReportsKPIs";
import FinancialReportsTabs from "../../components/accounting/reports/FinancialReportsTabs";
import TrialBalanceReport from "../../components/accounting/reports/TrialBalanceReport";
import IncomeStatementReport from "../../components/accounting/reports/IncomeStatementReport";
import BalanceSheetReport from "../../components/accounting/reports/BalanceSheetReport";
import CashFlowStatementReport from "../../components/accounting/reports/CashFlowStatementReport";

const FinancialReports: React.FC = () => {
  const data = useFinancialReportsData();
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("ar-IQ", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50/50 font-['Tajawal'] print:bg-white print:p-0">
      {/* Header Panel */}
      <FinancialReportsHeader
        dateRange={data.dateRange}
        setDateRange={data.setDateRange}
        costCenterId={data.costCenterId}
        setCostCenterId={data.setCostCenterId}
        costCenters={data.costCenters}
        onExportCSV={data.handleExportCSV}
        onPrint={() => window.print()}
        storeName={settings?.storeName}
        activeTab={data.activeTab}
      />

      {/* KPI Cards (Visible based on context) */}
      {data.activeTab === "income" && (
        <FinancialReportsKPIs
          incomeStatementData={data.incomeStatementData}
          balanceSheetData={data.balanceSheetData}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Tab select buttons */}
      <FinancialReportsTabs activeTab={data.activeTab} setActiveTab={data.setActiveTab} />

      {/* ================= TRIAL BALANCE ================= */}
      {data.activeTab === "trial" && data.reportData && (
        <TrialBalanceReport
          reportData={data.reportData}
          formatCurrency={formatCurrency}
          goToLedger={data.goToLedger}
        />
      )}

      {/* ================= INCOME STATEMENT ================= */}
      {data.activeTab === "income" && (
        <IncomeStatementReport
          incomeStatementData={data.incomeStatementData}
          expenseChartData={data.expenseChartData}
          formatCurrency={formatCurrency}
          currencyCode={data.currencyCode}
          goToLedger={data.goToLedger}
        />
      )}

      {/* ================= BALANCE SHEET ================= */}
      {data.activeTab === "balance" && (
        <BalanceSheetReport
          balanceSheetData={data.balanceSheetData}
          incomeStatementData={data.incomeStatementData}
          formatCurrency={formatCurrency}
          goToLedger={data.goToLedger}
        />
      )}

      {/* ================= CASH FLOW STATEMENT ================= */}
      {data.activeTab === "cashflow" && (
        <CashFlowStatementReport
          cashFlowData={data.cashFlowData}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

export default FinancialReports;
