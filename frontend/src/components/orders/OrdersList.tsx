import React from 'react';
import { User, Printer, ChevronLeft, RotateCcw, CheckCircle2, Loader2, ChevronRight } from 'lucide-react';
import { Order } from '../../types';
import { TableVirtuoso } from 'react-virtuoso';

interface OrdersListProps {
  orders: Order[];
  isLoading: boolean;
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;
  setInvoicePreviewOrder: (order: Order | null) => void;
  customerMap: Map<number, string>;
  formatDate: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
  formatCurrency: (amount: number) => string;
  loadMore?: () => void;
  hasMore?: boolean;
}

const OrdersList: React.FC<OrdersListProps> = ({
  orders,
  isLoading,
  selectedOrder,
  setSelectedOrder,
  setInvoicePreviewOrder,
  customerMap,
  formatDate,
  formatTime,
  formatCurrency,
  loadMore,
  hasMore
}) => {
  return (
    <div className="flex-1 overflow-hidden p-6 flex flex-col">
      {isLoading ? (
        <div className="flex items-center justify-center h-full text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>جاري تحميل البيانات...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 relative">
          {orders.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">لا توجد نتائج</div>
          ) : (
            <TableVirtuoso
              data={orders}
              endReached={() => {
                if (hasMore && loadMore) loadMore();
              }}
              overscan={200}
              className="w-full h-full"
              components={{
                Table: ({ style, ...props }) => (
                  <table {...props} style={{ ...style, width: '100%', textAlign: 'right', borderCollapse: 'collapse' }} className="text-sm" />
                ),
                TableHead: React.forwardRef((props, ref) => (
                  <thead {...props} ref={ref as any} className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0 z-10 shadow-sm" />
                )),
                TableRow: ({ item, ...props }) => {
                  const isSelected = selectedOrder?.id === item.id;
                  return (
                    <tr 
                      {...props} 
                      onClick={() => setSelectedOrder(item)}
                      className={`cursor-pointer transition-colors border-b border-slate-100 ${isSelected ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-slate-50'}`}
                    />
                  );
                },
                TableBody: React.forwardRef((props, ref) => (
                  <tbody {...props} ref={ref as any} className="divide-y divide-slate-100 bg-white" />
                )),
              }}
              fixedHeaderContent={() => (
                <tr>
                  <th className="px-6 py-4 bg-slate-50">رقم الطلب</th>
                  <th className="px-6 py-4 bg-slate-50">التاريخ</th>
                  <th className="px-6 py-4 bg-slate-50">العميل</th>
                  <th className="px-6 py-4 bg-slate-50">النوع</th>
                  <th className="px-6 py-4 bg-slate-50">الكاشير</th>
                  <th className="px-6 py-4 bg-slate-50">المبلغ</th>
                  <th className="px-6 py-4 bg-slate-50">الدفع</th>
                  <th className="px-6 py-4 bg-slate-50">الحالة</th>
                  <th className="px-6 py-4 bg-slate-50 w-10"></th>
                </tr>
              )}
              itemContent={(index, order) => {
                const customerName = order.customerId ? customerMap.get(order.customerId) : 'عميل عام';
                return (
                  <>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-700">#{order.referenceNumber || order.id}</span>
                      {order.isReturn && <span className="mr-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">مرتجع</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 text-xs">{formatDate(order.date)}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{formatTime(order.date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-bold text-slate-800">{customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {order.orderType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {order.cashierName || '-'}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      {order.paymentMethod}
                    </td>
                    <td className="px-6 py-4">
                      {order.status === 'refunded' ? (
                        <span className="text-red-600 font-bold text-xs flex items-center gap-1"><RotateCcw className="w-3 h-3" /> مسترجع</span>
                      ) : (
                        <span className="text-emerald-600 font-bold text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> مكتمل</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setInvoicePreviewOrder(order); }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="طباعة الفاتورة"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <ChevronLeft className="w-4 h-4 text-slate-300" />
                      </div>
                    </td>
                  </>
                );
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersList;
