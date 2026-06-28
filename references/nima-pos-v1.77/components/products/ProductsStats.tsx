import React from 'react';
import { Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { Product } from '../../types';

export interface ProductsStatsData {
  totalItems: number;
  totalCostValue: number;
  totalRetailValue: number;
  lowStock: number;
}

interface ProductsStatsProps {
  stats: ProductsStatsData;
  formatCurrency: (amount: number) => string;
}

const ProductsStats: React.FC<ProductsStatsProps> = ({ stats, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">إجمالي المنتجات</p>
          <h3 className="text-2xl font-black text-slate-800">{stats.totalItems}</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">إجمالي قيمة المبيعات المتوقعة</p>
          <h3 className="text-2xl font-black text-slate-800">{formatCurrency(stats.totalRetailValue)}</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">إجمالي قيمة التكلفة</p>
          <h3 className="text-2xl font-black text-slate-800">{formatCurrency(stats.totalCostValue)}</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">نواقص المخزون</p>
          <h3 className="text-2xl font-black text-slate-800">{stats.lowStock}</h3>
        </div>
      </div>
    </div>
  );
};

export default ProductsStats;
