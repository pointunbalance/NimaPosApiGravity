import React from "react";
import { Users, Truck, Search, Calendar, AlertTriangle, Eye, Send, CheckCircle2 } from "lucide-react";
import { AgingRecord } from "./useAgingReportsData";

interface AgingReportsTableProps {
  activeTab: "receivable" | "payable";
  setActiveTab: (tab: "receivable" | "payable") => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  asOfDate: string;
  setAsOfDate: (date: string) => void;
  agingData: AgingRecord[];
  formatCurrency: (amount: number) => string;
  onView: (record: AgingRecord) => void;
  onSendReminder: (record: AgingRecord) => void;
}

const AgingReportsTable: React.FC<AgingReportsTableProps> = ({
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  asOfDate,
  setAsOfDate,
  agingData,
  formatCurrency,
  onView,
  onSendReminder,
}) => {
  const getRiskBadge = (level: string) => {
    switch (level) {
      case "critical":
        return (
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> حرج جداً
          </span>
        );
      case "high":
        return (
          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">
            عالي
          </span>
        );
      case "medium":
        return (
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">
            متوسط
          </span>
        );
      default:
        return (
          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
            طبيعي
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 print:hidden">
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 w-full md:w-fit font-bold">
          <button
            onClick={() => setActiveTab("receivable")}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === "receivable"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Users className="w-4 h-4" /> ذمم العملاء (مطلوبات)
          </button>
          <button
            onClick={() => setActiveTab("payable")}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === "payable"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Truck className="w-4 h-4" /> ذمم الموردين (مستحقات)
          </button>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto font-bold">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث بالاسم أو الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
            <Calendar className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-bold text-slate-600">حتى تاريخ:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="bg-transparent text-sm font-bold outline-none text-indigo-600 [color-scheme:light]"
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border print:rounded-none print:bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 print:bg-white print:text-black">
            <tr>
              <th className="p-4">{activeTab === "receivable" ? "العميل" : "المورد"}</th>
              <th className="p-4 text-center print:hidden">المخاطرة</th>
              <th className="p-4">إجمالي الرصيد</th>
              <th className="p-4 text-emerald-600 print:text-black">0-30 يوم</th>
              <th className="p-4 text-blue-600 print:text-black">31-60 يوم</th>
              <th className="p-4 text-orange-600 print:text-black">61-90 يوم</th>
              <th className="p-4 text-red-600 print:text-black">+90 يوم</th>
              <th className="p-4 text-center print:hidden">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 print:divide-black font-bold">
            {agingData.map((record) => (
              <tr
                key={record.id}
                className="hover:bg-slate-50 transition-colors group print:bg-white"
              >
                <td className="p-4 font-bold text-slate-700 print:text-black">
                  {record.name}
                  <div className="text-xs text-slate-400 font-normal mt-0.5 print:text-black" dir="ltr">
                    {record.phone || "-"}
                  </div>
                </td>
                <td className="p-4 text-center print:hidden">
                  <div className="flex justify-center">{getRiskBadge(record.riskLevel)}</div>
                </td>
                <td className="p-4 font-black text-slate-800 bg-slate-50/50 print:bg-white print:text-black">
                  {formatCurrency(record.totalBalance)}
                </td>
                <td className="p-4 text-slate-600 font-medium print:text-black">
                  {record.buckets["0-30"] > 0 ? formatCurrency(record.buckets["0-30"]) : "-"}
                </td>
                <td className="p-4 text-slate-600 font-medium print:text-black">
                  {record.buckets["31-60"] > 0 ? formatCurrency(record.buckets["31-60"]) : "-"}
                </td>
                <td className="p-4 font-bold text-orange-600 print:text-black">
                  {record.buckets["61-90"] > 0 ? formatCurrency(record.buckets["61-90"]) : "-"}
                </td>
                <td className="p-4 font-bold text-red-600 bg-red-50/10 print:bg-white print:text-black">
                  {record.buckets["90+"] > 0 ? formatCurrency(record.buckets["90+"]) : "-"}
                </td>
                <td className="p-4 text-center print:hidden">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onView(record)}
                      className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                      title="التفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSendReminder(record)}
                      className="p-1.5 text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                      title="تذكير واتساب"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {agingData.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400 print:text-black">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-20 print:hidden" />
                  <p>لا توجد ديون مسجلة في هذا التصنيف</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AgingReportsTable;
