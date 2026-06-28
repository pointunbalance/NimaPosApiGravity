import React from 'react';
import { Package, ClipboardCheck, ArrowRightLeft, History } from 'lucide-react';
import { TableVirtuoso } from 'react-virtuoso';

interface WarehouseInventoryTableProps {
  warehouseInventory: any[] | undefined;
  formatCurrency: (amount: number) => string;
  openStockModal: (item: any) => void;
  openTransferModal: (item: any) => void;
  openHistoryModal: (item: any) => void;
}

const WarehouseInventoryTable: React.FC<WarehouseInventoryTableProps> = ({
  warehouseInventory,
  formatCurrency,
  openStockModal,
  openTransferModal,
  openHistoryModal,
}) => {
  if (!warehouseInventory || warehouseInventory.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-16 text-center text-slate-500 font-medium">
        لا توجد منتجات مطابقة للبحث
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-250px)]">
      <TableVirtuoso
        data={warehouseInventory}
        className="w-full h-full"
        components={{
          Table: ({ style, ...props }) => (
            <table {...props} style={{ ...style, width: '100%', textAlign: 'right', borderCollapse: 'collapse' }} className="text-sm" />
          ),
          TableHead: React.forwardRef((props, ref) => (
            <thead {...props} ref={ref} className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 sticky top-0 z-10" />
          )),
          TableRow: ({ item, ...props }) => (
            <tr {...props} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100" />
          ),
          TableBody: React.forwardRef((props, ref) => (
            <tbody {...props} ref={ref} className="divide-y divide-slate-100" />
          )),
        }}
        fixedHeaderContent={() => (
          <tr>
            <th className="px-6 py-5 bg-slate-50">المنتج</th>
            <th className="px-6 py-5 bg-slate-50">التصنيف</th>
            <th className="px-6 py-5 bg-slate-50">الكمية المتوفرة</th>
            <th className="px-6 py-5 bg-slate-50">تكلفة المخزون</th>
            <th className="px-6 py-5 bg-slate-50 text-center">إجراءات</th>
          </tr>
        )}
        itemContent={(index, item) => {
          const isLow = item.quantity > 0 && item.quantity <= item.alertThreshold;
          const isOut = item.quantity <= 0;
          return (
            <>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <span className="font-bold text-slate-800">{item.productName}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-slate-500 font-medium">
                {item.productCategory || '---'}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-black text-lg ${
                      isOut ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-slate-800'
                    }`}
                  >
                    {item.quantity}
                  </span>
                  {isOut && (
                    <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-lg font-bold">
                      نفذت
                    </span>
                  )}
                  {isLow && (
                    <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-lg font-bold">
                      منخفض
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 font-bold text-slate-700" dir="ltr">
                {formatCurrency(item.quantity * item.costPrice)}
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => openStockModal(item)}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors text-slate-500"
                    title="تعديل الجرد"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openTransferModal(item)}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors text-slate-500"
                    title="نقل لمخزن آخر"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openHistoryModal(item)}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-slate-500"
                    title="سجل الحركات"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </>
          );
        }}
      />
    </div>
  );
};

export default WarehouseInventoryTable;
