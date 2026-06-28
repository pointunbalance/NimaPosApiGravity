import React from 'react';
import { PurchaseOrder } from '../../types';
import { Eye, FileEdit, ShoppingCart } from 'lucide-react';

interface PurchaseOrdersListProps {
  filteredOrders: PurchaseOrder[];
  currency: string;
  getStatusBadge: (status: string) => React.ReactNode;
  onViewOrder: (order: PurchaseOrder) => void;
  onEditOrder: (order: PurchaseOrder) => void;
}

const PurchaseOrdersList: React.FC<PurchaseOrdersListProps> = ({
  filteredOrders,
  currency,
  getStatusBadge,
  onViewOrder,
  onEditOrder
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                          <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-black tracking-wider">
                              PO-{order.id?.toString().padStart(4, '0')}
                          </div>
                          {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="mb-6 flex-1">
                          <p className="text-xs text-slate-400 font-bold mb-1 uppercase">المورد</p>
                          <p className="font-black text-slate-800 text-lg">{order.supplierName}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div>
                              <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">التاريخ</p>
                              <p className="font-bold text-slate-700 text-sm">{new Date(order.date).toLocaleDateString('ar-EG')}</p>
                          </div>
                          <div>
                              <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">الإجمالي</p>
                              <p className="font-black text-indigo-600 text-sm">{order.totalAmount.toLocaleString()} {currency}</p>
                          </div>
                      </div>

                      <div className="flex gap-2">
                          <button 
                              onClick={() => onViewOrder(order)}
                              className="flex-1 py-3 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                          >
                              <Eye className="w-4 h-4" /> عرض
                          </button>
                          {order.status === 'draft' && (
                              <button 
                                  onClick={() => onEditOrder(order)}
                                  className="px-4 py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center"
                              >
                                  <FileEdit className="w-4 h-4" />
                              </button>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                  <ShoppingCart className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-700 mb-2">لا توجد أوامر شراء</h3>
              <p className="text-slate-500 max-w-md text-center">
                  لم يتم العثور على أي أوامر شراء مطابقة للبحث أو الفلتر الحالي.
              </p>
          </div>
      )}
    </div>
  );
};

export default PurchaseOrdersList;
