import React from 'react';
import { Edit, Trash2, FileText } from 'lucide-react';
import { Customer } from '../../types';

interface B2BCustomersListProps {
  customers: Customer[];
  getStatusColor: (status: string) => string;
  onEdit: (customer: Customer) => void;
  onDelete: (id: number) => void;
  onViewStatement?: (customer: Customer) => void;
}

const B2BCustomersList: React.FC<B2BCustomersListProps> = ({
  customers,
  getStatusColor,
  onEdit,
  onDelete,
  onViewStatement
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">رقم العميل</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">الشركة</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">رقم الهاتف</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">الحد الائتماني</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">الرصيد المستحق</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">الحالة</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-indigo-600">C-{customer.id?.toString().padStart(4, '0')}</td>
              <td className="px-6 py-4 text-sm text-slate-800 font-medium">{customer.name}</td>
              <td className="px-6 py-4 text-sm text-slate-500" dir="ltr">{customer.phone}</td>
              <td className="px-6 py-4 text-sm text-slate-800">{customer.creditLimit?.toLocaleString() || '0'}</td>
              <td className="px-6 py-4 text-sm font-medium text-rose-600">{customer.balance?.toLocaleString() || '0'}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor('نشط')}`}>
                  نشط
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {onViewStatement && (
                    <button onClick={() => onViewStatement(customer)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="كشف حساب">
                      <FileText size={18} />
                    </button>
                  )}
                  <button onClick={() => onEdit(customer)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="تعديل">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => customer.id && onDelete(customer.id)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors" title="حذف">
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {customers.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                لا يوجد عملاء
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default B2BCustomersList;
