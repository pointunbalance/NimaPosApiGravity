import React from 'react';
import { ShoppingBag, Package, Truck, CheckCircle } from 'lucide-react';

interface EcommerceOrdersStatsProps {
  todayOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
}

const EcommerceOrdersStats: React.FC<EcommerceOrdersStatsProps> = ({
  todayOrders,
  pendingOrders,
  shippedOrders,
  deliveredOrders
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">طلبات اليوم</p>
          <p className="text-2xl font-bold text-slate-900">{todayOrders}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
        <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">بانتظار التجهيز</p>
          <p className="text-2xl font-bold text-slate-900">{pendingOrders}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
          <Truck className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">في الطريق</p>
          <p className="text-2xl font-bold text-slate-900">{shippedOrders}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">تم التوصيل</p>
          <p className="text-2xl font-bold text-slate-900">{deliveredOrders}</p>
        </div>
      </div>
    </div>
  );
};

export default EcommerceOrdersStats;
