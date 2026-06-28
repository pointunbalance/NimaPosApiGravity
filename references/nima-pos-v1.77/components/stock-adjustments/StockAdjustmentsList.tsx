import React from 'react';
import { Package, Store, ArrowUpCircle, ArrowDownCircle, Calendar, ClipboardX } from 'lucide-react';
import { StockAdjustment } from '../../types';

interface StockAdjustmentsListProps {
  filteredAdjustments: StockAdjustment[];
  productMap: Map<number, { cost: number; name: string }>;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  getReasonConfig: (r: string) => { label: string; color: string };
}

const StockAdjustmentsList: React.FC<StockAdjustmentsListProps> = ({
  filteredAdjustments,
  productMap,
  formatCurrency,
  formatDate,
  getReasonConfig,
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">المنتج</th>
              <th className="px-6 py-4">المخزن</th>
              <th className="px-6 py-4">التغيير</th>
              <th className="px-6 py-4">القيمة المالية</th>
              <th className="px-6 py-4">السبب</th>
              <th className="px-6 py-4">التاريخ</th>
              <th className="px-6 py-4">ملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAdjustments?.map((adj) => {
              const reasonConfig = getReasonConfig(adj.reason);
              const cost = productMap.get(adj.productId)?.cost || 0;
              const totalValue = adj.quantity * cost;

              return (
                <tr key={adj.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg text-gray-400">
                        <Package className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-gray-800">{adj.productName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-gray-400" />
                      {adj.warehouseName || 'المخزن الرئيسي'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {adj.type === 'increase' ? (
                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded-lg text-xs font-bold border border-green-100">
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        +{adj.quantity}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded-lg text-xs font-bold border border-red-100">
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                        -{adj.quantity}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {formatCurrency(totalValue)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${reasonConfig.color}`}
                    >
                      {reasonConfig.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs" dir="ltr">
                    <div className="flex items-center gap-2 font-mono">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {formatDate(adj.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate italic text-xs">
                    {adj.notes || '-'}
                  </td>
                </tr>
              );
            })}
            {filteredAdjustments?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center">
                    <ClipboardX className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-bold">لا توجد حركات مطابقة للبحث</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockAdjustmentsList;
