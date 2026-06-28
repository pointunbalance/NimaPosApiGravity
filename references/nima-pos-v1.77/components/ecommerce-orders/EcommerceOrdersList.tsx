import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { EcommerceOrder } from '../../types';

interface EcommerceOrdersListProps {
  orders: EcommerceOrder[];
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  onEdit: (order: EcommerceOrder) => void;
  onDelete: (id: number) => void;
}

const EcommerceOrdersList: React.FC<EcommerceOrdersListProps> = ({
  orders,
  getStatusColor,
  getStatusText,
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-sm font-semibold text-slate-600">رقم الطلب</th>
              <th className="p-4 text-sm font-semibold text-slate-600">المنصة</th>
              <th className="p-4 text-sm font-semibold text-slate-600">العميل</th>
              <th className="p-4 text-sm font-semibold text-slate-600">التاريخ</th>
              <th className="p-4 text-sm font-semibold text-slate-600">المنتجات</th>
              <th className="p-4 text-sm font-semibold text-slate-600">المبلغ</th>
              <th className="p-4 text-sm font-semibold text-slate-600">الحالة</th>
              <th className="p-4 text-sm font-semibold text-slate-600 text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-sm font-medium text-indigo-600">{order.orderNumber}</td>
                <td className="p-4 text-sm text-slate-500 capitalize">{order.platform}</td>
                <td className="p-4 text-sm text-slate-900 font-medium">{order.customerName}</td>
                <td className="p-4 text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</td>
                <td className="p-4 text-sm text-slate-500">{order.items ? order.items.length : 0} منتجات</td>
                <td className="p-4 text-sm text-slate-900 font-medium">{order.total.toFixed(2)} ر.س</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td className="p-4 text-sm text-left">
                   <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onEdit(order)} className="text-indigo-600 hover:text-indigo-900">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => order.id && onDelete(order.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  لا توجد طلبات مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EcommerceOrdersList;
