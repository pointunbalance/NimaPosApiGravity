import React from "react";
import { AlertCircle, FileText } from "lucide-react";
import { Order } from "../../types";

interface UninvoicedOrdersTableProps {
  orders: Order[];
  onGenerateInvoice: (order: Order) => void;
}

const UninvoicedOrdersTable: React.FC<UninvoicedOrdersTableProps> = ({
  orders,
  onGenerateInvoice,
}) => {
  return (
    <div className="p-4">
      <div className="mb-4 bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3 border border-blue-100 font-bold">
        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <p className="text-sm font-bold">
          هذه القائمة تعرض الطلبات المكتملة التي لم يتم إصدار فاتورة إلكترونية لها بعد. يجب إصدار
          الفواتير وإرسالها لهيئة الزكاة والضريبة لتجنب الغرامات.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 font-bold">
            <tr>
              <th className="p-4 text-slate-600 font-bold">رقم الطلب</th>
              <th className="p-4 text-slate-600 font-bold">التاريخ</th>
              <th className="p-4 text-slate-600 font-bold">المبلغ الإجمالي</th>
              <th className="p-4 text-slate-600 font-bold">طريقة الدفع</th>
              <th className="p-4 text-slate-600 font-bold">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-800">#{order.id}</td>
                <td className="p-4 text-slate-600">
                  {new Date(order.date).toLocaleString("ar-EG")}
                </td>
                <td className="p-4 font-black text-slate-800">
                  {order.totalAmount.toFixed(2)}
                </td>
                <td className="p-4 text-slate-600">
                  {order.paymentMethod === "cash"
                    ? "نقدي"
                    : order.paymentMethod === "card"
                    ? "بطاقة"
                    : "آجل"}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => onGenerateInvoice(order)}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm font-bold bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" /> إنشاء فاتورة
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                  جميع الطلبات المكتملة مفوترة ومسجلة في نظام الفوترة الإلكترونية.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UninvoicedOrdersTable;
