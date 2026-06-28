import React from 'react';
import { Purchase } from '../../types';
import { FileText, Calendar, Package, Eye, Trash2, Image as ImageIcon } from 'lucide-react';
import { TableVirtuoso } from 'react-virtuoso';

interface PurchasesListProps {
  filteredPurchases: Purchase[];
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  setViewPurchase: (purchase: Purchase) => void;
  handleDeletePurchase: (id: number) => void;
  loadMore?: () => void;
  hasMore?: boolean;
}

const PurchasesList: React.FC<PurchasesListProps> = ({
  filteredPurchases,
  formatCurrency,
  formatDate,
  setViewPurchase,
  handleDeletePurchase,
  loadMore,
  hasMore
}) => {
  return (
    <div className="bg-white rounded-b-3xl shadow-sm border border-t-0 border-gray-200 overflow-hidden flex-1 flex flex-col min-h-[500px]">
      <div className="flex-1 relative">
        {filteredPurchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <FileText className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-bold">لا توجد فواتير مطابقة</p>
          </div>
        ) : (
          <TableVirtuoso
            data={filteredPurchases}
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
                <thead {...props} ref={ref as any} className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 sticky top-0 z-10 shadow-sm" />
              )),
              TableRow: ({ item, ...props }) => (
                <tr {...props} className="hover:bg-gray-50/80 transition-colors group border-b border-gray-100" />
              ),
              TableBody: React.forwardRef((props, ref) => (
                <tbody {...props} ref={ref as any} className="divide-y divide-gray-100 bg-white" />
              )),
            }}
            fixedHeaderContent={() => (
              <tr>
                <th className="px-6 py-4 bg-gray-50">رقم الفاتورة</th>
                <th className="px-6 py-4 bg-gray-50">المورد</th>
                <th className="px-6 py-4 bg-gray-50">التاريخ</th>
                <th className="px-6 py-4 bg-gray-50">التفاصيل</th>
                <th className="px-6 py-4 bg-gray-50">الإجمالي</th>
                <th className="px-6 py-4 bg-gray-50">مرفق</th>
                <th className="px-6 py-4 bg-gray-50 text-center">إجراءات</th>
              </tr>
            )}
            itemContent={(index, purchase) => (
              <>
                <td className="px-6 py-4">
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">
                    {purchase.invoiceNumber || '---'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800">{purchase.supplierName}</div>
                </td>
                <td className="px-6 py-4 text-gray-500" dir="ltr">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {formatDate(purchase.date)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-100 flex items-center gap-1 w-fit">
                    <Package className="w-3 h-3" />
                    {purchase.items.length} أصناف
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-black text-gray-900">{formatCurrency(purchase.totalAmount)}</span>
                </td>
                <td className="px-6 py-4">
                  {purchase.attachment ? <ImageIcon className="w-4 h-4 text-indigo-500" /> : <span className="text-gray-300">-</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setViewPurchase(purchase)}
                      className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePurchase(purchase.id!)}
                      className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default PurchasesList;
