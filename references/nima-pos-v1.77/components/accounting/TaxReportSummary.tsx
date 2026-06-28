import React from "react";
import { ArrowUpCircle, ArrowDownCircle, Scale } from "lucide-react";
import { TaxData } from "./useTaxReportData";

interface TaxReportSummaryProps {
  taxData: TaxData;
  formatCurrency: (amount: number) => string;
  currencyCode: string;
  settings: any;
  dateRange: { start: string; end: string };
}

const TaxReportSummary: React.FC<TaxReportSummaryProps> = ({
  taxData,
  formatCurrency,
  currencyCode,
  settings,
  dateRange,
}) => {
  const totalTax = taxData.totalInputTax + taxData.totalOutputTax || 1;
  const inputPercentage = (taxData.totalInputTax / totalTax) * 100;
  const outputPercentage = (taxData.totalOutputTax / totalTax) * 100;

  return (
    <div className="space-y-6">
      {/* Print Header (Visible Only on Print) */}
      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-6 font-bold">
        <h2 className="text-3xl font-bold mb-2">{settings?.storeName}</h2>
        <h3 className="text-xl font-bold uppercase tracking-widest border-2 border-black inline-block px-4 py-1 mb-2">
          VAT RETURN FORM
        </h3>
        <div className="flex justify-between items-end mt-4 text-sm font-bold">
          <div className="text-left">
            <p>Tax Number: {settings?.taxNumber || "N/A"}</p>
            <p>Currency: {currencyCode}</p>
          </div>
          <div className="text-right">
            <p>From: {dateRange.start}</p>
            <p>To: {dateRange.end}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
        {/* Output Tax */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 print:border-black print:shadow-none font-bold">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl print:hidden">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">ضريبة المخرجات</h3>
              <p className="text-xs text-gray-500">مستحقة من المبيعات</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">صافي المبيعات</span>
              <span className="font-bold font-mono">
                {formatCurrency(taxData.totalSalesNet)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-black text-red-600 border-t border-dashed pt-2">
              <span>الضريبة المستحقة</span>
              <span className="font-mono">
                {formatCurrency(taxData.totalOutputTax)}
              </span>
            </div>
          </div>
        </div>

        {/* Input Tax */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 print:border-black print:shadow-none font-bold">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl print:hidden">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">ضريبة المدخلات</h3>
              <p className="text-xs text-gray-500">قابلة للخصم من المشتريات</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">صافي المشتريات</span>
              <span className="font-bold font-mono">
                {formatCurrency(taxData.totalPurchasesNet)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-black text-green-600 border-t border-dashed pt-2">
              <span>الضريبة القابلة للخصم</span>
              <span className="font-mono">
                {formatCurrency(taxData.totalInputTax)}
              </span>
            </div>
          </div>
        </div>

        {/* Net Payable */}
        <div
          className={`p-6 rounded-3xl shadow-sm border flex flex-col justify-center text-center print:border-black print:shadow-none font-bold ${
            taxData.netTaxPayable >= 0
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-emerald-600 text-white border-emerald-600"
          }`}
        >
          <div className="mb-2 opacity-50 flex justify-center print:hidden">
            <Scale className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold opacity-90 mb-1 print:text-black">
            {taxData.netTaxPayable >= 0 ? "صافي الضريبة المستحقة" : "رصيد دائن (استرداد)"}
          </h3>
          <p className="text-4xl font-black tracking-tight font-mono print:text-black" dir="ltr">
            {formatCurrency(Math.abs(taxData.netTaxPayable))}
          </p>
        </div>
      </div>

      {/* Visual Bar (Hidden on Print) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 print:hidden font-bold">
        <div className="flex justify-between text-xs font-bold mb-2">
          <span className="text-green-600">المدخلات (مشتريات)</span>
          <span className="text-red-600">المخرجات (مبيعات)</span>
        </div>
        <div className="flex h-4 rounded-full overflow-hidden bg-slate-100">
          <div
            className="bg-green-500 h-full transition-all duration-1000"
            style={{ width: `${inputPercentage}%` }}
          ></div>
          <div
            className="bg-red-500 h-full transition-all duration-1000"
            style={{ width: `${outputPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TaxReportSummary;
