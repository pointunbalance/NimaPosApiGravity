import React from "react";
import { History, CheckCircle, Save } from "lucide-react";
import { TaxData } from "./useTaxReportData";

interface TaxReportDetailsProps {
  activeTab: "summary" | "sales" | "purchases" | "history";
  setActiveTab: (tab: "summary" | "sales" | "purchases" | "history") => void;
  taxData: TaxData;
  taxReturns: any[];
  formatCurrency: (amount: number) => string;
  onSaveTaxReturn: () => void;
}

const TaxReportDetails: React.FC<TaxReportDetailsProps> = ({
  activeTab,
  setActiveTab,
  taxData,
  taxReturns,
  formatCurrency,
  onSaveTaxReturn,
}) => {
  return (
    <div className="space-y-6">
      {/* Tabs Header - Hidden on Print */}
      <div className="flex border-b border-slate-200 print:hidden overflow-x-auto">
        <button
          onClick={() => setActiveTab("summary")}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "summary"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          ملخص الإقرار
        </button>
        <button
          onClick={() => setActiveTab("sales")}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "sales"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          فواتير المبيعات ({taxData.taxableOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("purchases")}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "purchases"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          فواتير المشتريات ({taxData.taxablePurchases.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === "history"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <History className="w-4 h-4" /> سجل الإقرارات
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border print:rounded-none">
        {/* Summary Tab */}
        {activeTab === "summary" && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6 border-b pb-4 print:hidden">
              <h3 className="font-bold text-lg text-slate-800">تفاصيل الملخص</h3>
              <button
                onClick={onSaveTaxReturn}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" /> حفظ الإقرار الضريبي
              </button>
            </div>
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 font-bold border-b text-gray-600">
                <tr>
                  <th className="p-4">البند</th>
                  <th className="p-4">المبلغ الخاضع للضريبة (Net)</th>
                  <th className="p-4">مبلغ الضريبة (VAT)</th>
                  <th className="p-4">الإجمالي (Gross)</th>
                </tr>
              </thead>
              <tbody className="divide-y font-bold">
                <tr>
                  <td className="p-4 text-slate-800">المبيعات (المخرجات)</td>
                  <td className="p-4 font-mono">{formatCurrency(taxData.totalSalesNet)}</td>
                  <td className="p-4 font-mono font-bold text-red-600">
                    {formatCurrency(taxData.totalOutputTax)}
                  </td>
                  <td className="p-4 font-mono text-gray-500">
                    {formatCurrency(taxData.totalSalesGross)}
                  </td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-800">المشتريات (المدخلات)</td>
                  <td className="p-4 font-mono">{formatCurrency(taxData.totalPurchasesNet)}</td>
                  <td className="p-4 font-mono font-bold text-green-600">
                    {formatCurrency(taxData.totalInputTax)}
                  </td>
                  <td className="p-4 font-mono text-gray-500">
                    {formatCurrency(taxData.totalPurchasesGross)}
                  </td>
                </tr>
                <tr className="bg-slate-50 font-black text-base border-t-2 border-slate-800">
                  <td className="p-4">صافي الضريبة المستحقة</td>
                  <td className="p-4">-</td>
                  <td className="p-4 font-mono text-indigo-700">
                    {formatCurrency(taxData.netTaxPayable)}
                  </td>
                  <td className="p-4">-</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-8 pt-8 border-t border-slate-200 text-center print:block hidden font-bold">
              <p className="text-sm">تصديق المحاسب / المدير المالي (تاراس)</p>
              <div className="h-16 mt-4 border-b border-black w-64 mx-auto"></div>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === "sales" && (
          <div className="print:hidden">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                <tr>
                  <th className="p-4">رقم الفاتورة</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">الصافي (قبل الضريبة)</th>
                  <th className="p-4">الضريبة</th>
                  <th className="p-4">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y font-bold">
                {taxData.taxableOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-600">#{o.id}</td>
                    <td className="p-4 text-gray-500">
                      {new Date(o.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-mono">{formatCurrency(o.subtotalAmount)}</td>
                    <td className="p-4 text-red-600 font-mono font-bold">
                      {formatCurrency(o.taxAmount || 0)}
                    </td>
                    <td className="p-4 font-mono font-bold">{formatCurrency(o.totalAmount)}</td>
                  </tr>
                ))}
                {taxData.taxableOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                      لا توجد مبيعات خاضعة للضريبة في هذه الفترة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Purchases Tab */}
        {activeTab === "purchases" && (
          <div className="print:hidden">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                <tr>
                  <th className="p-4">رقم الفاتورة</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">المورد</th>
                  <th className="p-4">الصافي (قبل الضريبة)</th>
                  <th className="p-4">الضريبة</th>
                  <th className="p-4">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y font-bold">
                {taxData.taxablePurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-600">
                      {p.invoiceNumber || `#${p.id}`}
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(p.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-700 font-bold">{p.supplierName}</td>
                    <td className="p-4 font-mono">{formatCurrency(p.subtotal || 0)}</td>
                    <td className="p-4 text-green-600 font-mono font-bold">
                      {formatCurrency(p.taxAmount || 0)}
                    </td>
                    <td className="p-4 font-mono font-bold">{formatCurrency(p.totalAmount)}</td>
                  </tr>
                ))}
                {taxData.taxablePurchases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">
                      لا توجد مشتريات خاضعة للضريبة في هذه الفترة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="print:hidden">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                <tr>
                  <th className="p-4">الرقم المرجعي</th>
                  <th className="p-4">الفترة</th>
                  <th className="p-4">تاريخ الحفظ</th>
                  <th className="p-4">المبيعات (الصافي)</th>
                  <th className="p-4">المشتريات (الصافي)</th>
                  <th className="p-4">الضريبة المستحقة</th>
                  <th className="p-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y font-bold">
                {taxReturns?.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-700">{r.referenceNumber}</td>
                    <td className="p-4 text-slate-600">
                      {r.periodStart} إلى {r.periodEnd}
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(r.filingDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-mono">{formatCurrency(r.totalSalesNet)}</td>
                    <td className="p-4 font-mono">{formatCurrency(r.totalPurchasesNet)}</td>
                    <td className="p-4 font-mono font-bold text-indigo-600">
                      {formatCurrency(r.netTaxPayable)}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" /> محفوظ
                      </span>
                    </td>
                  </tr>
                ))}
                {(!taxReturns || taxReturns.length === 0) && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">
                      لا توجد إقرارات ضريبية محفوظة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxReportDetails;
