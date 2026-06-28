import React from 'react';
import { Edit, Trash2, Printer, DollarSign } from 'lucide-react';
import { B2BInvoice } from '../../types';

interface B2BInvoicesListProps {
  invoices: B2BInvoice[];
  getCustomerName: (id: number) => string;
  getStatusColor: (status: string) => string;
  translateStatus: (status: string) => string;
  onEdit: (invoice: B2BInvoice) => void;
  onDelete: (id: number) => void;
  onPrint?: (invoice: B2BInvoice) => void;
  onPayment?: (invoice: B2BInvoice) => void;
}

const B2BInvoicesList: React.FC<B2BInvoicesListProps> = ({
  invoices,
  getCustomerName,
  getStatusColor,
  translateStatus,
  onEdit,
  onDelete,
  onPrint,
  onPayment
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">رقم الفاتورة</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">العميل</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">الأصناف</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">تاريخ الإصدار</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">تاريخ الاستحقاق</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">الإجمالي</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">المدفوع</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">المتبقي</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">الحالة</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-indigo-600">{invoice.referenceNumber || `INV-${invoice.id?.toString().padStart(4, '0')}`}</td>
              <td className="px-6 py-4 text-sm text-slate-800 font-medium">{getCustomerName(invoice.customerId)}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{invoice.items?.length || 0} صنف</td>
              <td className="px-6 py-4 text-sm text-slate-500">{new Date(invoice.createdAt).toLocaleDateString('ar-SA')}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</td>
              <td className="px-6 py-4 text-sm text-slate-800 font-medium">{invoice.totalAmount.toLocaleString()}</td>
              <td className="px-6 py-4 text-sm text-emerald-600">{invoice.paidAmount.toLocaleString()}</td>
              <td className="px-6 py-4 text-sm text-rose-600">{(invoice.totalAmount - invoice.paidAmount).toLocaleString()}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                  {translateStatus(invoice.status)}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {onPayment && invoice.status !== 'paid' && (
                    <button onClick={() => onPayment(invoice)} className="p-1 text-slate-400 hover:text-emerald-600 transition-colors" title="تسجيل دفعة">
                      <DollarSign size={18} />
                    </button>
                  )}
                  {onPrint && (
                    <button onClick={() => onPrint(invoice)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="طباعة الفاتورة">
                      <Printer size={18} />
                    </button>
                  )}
                  <button onClick={() => onEdit(invoice)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="تعديل">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => invoice.id && onDelete(invoice.id)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors" title="حذف">
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {invoices.length === 0 && (
            <tr>
              <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
                لا توجد فواتير مسجلة
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default B2BInvoicesList;
