import React from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Send,
  RefreshCw,
  QrCode,
  FileCode2,
} from "lucide-react";
import { EInvoice } from "../../types";

interface EInvoicesTableProps {
  invoices: EInvoice[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSubmitToZatca: (invoice: EInvoice) => void;
  onViewQR: (invoice: EInvoice) => void;
  onViewXML: (invoice: EInvoice) => void;
}

const EInvoicesTable: React.FC<EInvoicesTableProps> = ({
  invoices,
  searchTerm,
  setSearchTerm,
  onSubmitToZatca,
  onViewQR,
  onViewXML,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm flex items-center gap-1 w-fit">
            <CheckCircle className="w-4 h-4" /> مقبولة
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-1 w-fit">
            <XCircle className="w-4 h-4" /> مرفوضة
          </span>
        );
      case "submitted":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1 w-fit animate-pulse">
            <Clock className="w-4 h-4 animate-spin" /> قيد المراجعة
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm flex items-center gap-1 w-fit">
            <FileText className="w-4 h-4" /> مسودة
          </span>
        );
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.orderId.toString().includes(searchTerm)
  );

  return (
    <div className="bg-white">
      <div className="p-4 border-b border-slate-100 font-bold">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث برقم الطلب أو العميل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 font-bold">
            <tr>
              <th className="p-4 text-slate-600 font-bold">رقم الطلب</th>
              <th className="p-4 text-slate-600 font-bold">التاريخ</th>
              <th className="p-4 text-slate-600 font-bold">العميل</th>
              <th className="p-4 text-slate-600 font-bold">المبلغ</th>
              <th className="p-4 text-slate-600 font-bold">الحالة</th>
              <th className="p-4 text-slate-600 font-bold">ZATCA Hash</th>
              <th className="p-4 text-slate-600 font-bold text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-800">#{invoice.orderId}</td>
                <td className="p-4 text-slate-600">
                  {new Date(invoice.date).toLocaleDateString("ar-EG")}{" "}
                  {new Date(invoice.date).toLocaleTimeString("ar-EG")}
                </td>
                <td className="p-4 text-slate-600">{invoice.customerName}</td>
                <td className="p-4 font-black text-slate-800">
                  {invoice.amount.toFixed(2)}
                </td>
                <td className="p-4">{getStatusBadge(invoice.status)}</td>
                <td className="p-4 text-slate-500 font-mono text-xs">
                  {invoice.zatcaHash || "---"}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    {invoice.status === "pending" || invoice.status === "rejected" ? (
                      <button
                        onClick={() => onSubmitToZatca(invoice)}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm font-bold bg-indigo-50 px-2 py-1 rounded"
                      >
                        <Send className="w-4 h-4" /> إرسال
                      </button>
                    ) : invoice.status === "submitted" ? (
                      <span className="text-blue-500 flex items-center gap-1 text-sm font-bold">
                        <RefreshCw className="w-4 h-4 animate-spin" /> جاري...
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => onViewQR(invoice)}
                          className="text-slate-600 hover:text-indigo-600 p-1.5 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="عرض QR Code"
                        >
                          <QrCode className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onViewXML(invoice)}
                          className="text-slate-600 hover:text-indigo-600 p-1.5 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="عرض XML"
                        >
                          <FileCode2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">
                  لا توجد فواتير إلكترونية تطابق البحث أو مسجلة حالياً.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EInvoicesTable;
