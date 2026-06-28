import React from 'react';
import { Truck, Plus, DollarSign } from 'lucide-react';

interface DeliveryHeaderProps {
  onNewDelivery: () => void;
  onSettleAllCouriers?: () => void;
}

const DeliveryHeader: React.FC<DeliveryHeaderProps> = ({ onNewDelivery, onSettleAllCouriers }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3 mb-1">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
            <Truck className="w-6 h-6" />
          </div>
          إدارة التوصيل والمندوبين
        </h1>
        <p className="text-slate-500 font-medium">تتبع الطلبات الخارجية وتصفية حسابات المندوبين</p>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={onSettleAllCouriers}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-slate-50 transition-colors shadow-sm"
        >
          <DollarSign className="w-5 h-5 text-emerald-500" />
          تصفية الحسابات
        </button>
        <button 
          onClick={onNewDelivery}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20"
        >
          <Plus className="w-5 h-5" />
          طلب توصيل جديد
        </button>
      </div>
    </div>
  );
};

export default DeliveryHeader;
