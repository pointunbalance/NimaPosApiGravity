import React from 'react';
import { Wrench, Plus } from 'lucide-react';

interface MaintenanceHeaderProps {
  onNewOrder: () => void;
}

const MaintenanceHeader: React.FC<MaintenanceHeaderProps> = ({ onNewOrder }) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Wrench className="w-6 h-6 text-brand-500" />
          أوامر الصيانة
        </h1>
        <p className="text-slate-500 text-sm mt-1">إدارة طلبات صيانة الأجهزة والخدمات</p>
      </div>
      <button 
        onClick={onNewOrder}
        className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-brand-700 transition-colors"
      >
        <Plus className="w-5 h-5" />
        استلام جهاز جديد
      </button>
    </div>
  );
};

export default MaintenanceHeader;
