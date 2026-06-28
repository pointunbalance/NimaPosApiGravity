import React from 'react';
import { Building2 } from 'lucide-react';
import { Warehouse } from '../../types';

interface WarehouseAssetsListProps {
  warehouses: Warehouse[] | undefined;
  warehouseAssets: Record<number, number>;
  totalInventoryValue: number;
  formatCurrency: (amount: number) => string;
}

const WarehouseAssetsList: React.FC<WarehouseAssetsListProps> = ({
  warehouses,
  warehouseAssets,
  totalInventoryValue,
  formatCurrency
}) => {
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden print:border-none print:shadow-none">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-500" />
          قيمة المخزون (توزيع المخازن)
        </h3>
        <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg">
          {formatCurrency(totalInventoryValue)}
        </span>
      </div>
      <div className="p-6 space-y-4">
        {warehouses?.map(w => {
          const value = warehouseAssets[w.id!] || 0;
          const percent = totalInventoryValue > 0 ? (value / totalInventoryValue) * 100 : 0;
          return (
            <div key={w.id}>
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-bold text-slate-700">{w.name}</span>
                <span className="font-bold text-slate-900">{formatCurrency(value)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WarehouseAssetsList;
