import React from 'react';
import { Quotation } from '../../types';
import { FileText, Edit2, Trash2, Printer, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface B2BQuotationsListProps {
  quotations: Quotation[];
  getCustomerName: (id?: number) => string;
  getStatusColor: (status: string) => string;
  translateStatus: (status: string) => string;
  onEdit: (quotation: Quotation) => void;
  onDelete: (id: number) => void;
  onPrint: (quotation: Quotation) => void;
  onConvert: (quotation: Quotation) => void;
}

const B2BQuotationsList: React.FC<B2BQuotationsListProps> = ({
  quotations,
  getCustomerName,
  getStatusColor,
  translateStatus,
  onEdit,
  onDelete,
  onPrint,
  onConvert
}) => {
  if (quotations.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">لا توجد عروض أسعار</h3>
        <p className="text-slate-500">لم يتم العثور على أي عروض أسعار تطابق معايير البحث.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 font-medium text-sm">
            <tr>
              <th className="p-4">رقم العرض</th>
              <th className="p-4">التاريخ</th>
              <th className="p-4">العميل</th>
              <th className="p-4">تاريخ الانتهاء</th>
              <th className="p-4">الإجمالي</th>
              <th className="p-4">الحالة</th>
              <th className="p-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotations.map((quotation) => (
              <tr key={quotation.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-mono text-sm text-slate-600">
                  {quotation.referenceNumber || `#QT-${quotation.id?.toString().padStart(4, '0')}`}
                </td>
                <td className="p-4 text-slate-800 font-medium">
                  {format(new Date(quotation.date), 'yyyy-MM-dd')}
                </td>
                <td className="p-4">
                  <span className="font-bold text-slate-800">
                    {quotation.customerId ? getCustomerName(quotation.customerId) : quotation.customerName}
                  </span>
                </td>
                <td className="p-4 text-slate-600">
                  {quotation.expiryDate ? format(new Date(quotation.expiryDate), 'yyyy-MM-dd') : '-'}
                </td>
                <td className="p-4 font-bold text-slate-800">
                  {quotation.totalAmount.toLocaleString()}
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(quotation.status)}`}>
                    {translateStatus(quotation.status)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    {quotation.status === 'pending' && (
                      <button
                        onClick={() => onConvert(quotation)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="تحويل إلى فاتورة"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onPrint(quotation)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="طباعة"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(quotation)}
                      className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(quotation.id!)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default B2BQuotationsList;
