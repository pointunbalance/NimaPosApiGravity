import React from 'react';
import { Truck, MapPin } from 'lucide-react';

interface VanSalesHeaderProps {
  onNewRouteClick: () => void;
}

const VanSalesHeader: React.FC<VanSalesHeaderProps> = ({ onNewRouteClick }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
          <Truck size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">مبيعات السيارات (Van Sales)</h1>
          <p className="text-slate-500 text-sm mt-1">إدارة فرق المبيعات المتنقلة ومسارات التوصيل</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={onNewRouteClick}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
        >
          <MapPin className="w-4 h-4" />
          تخطيط مسار جديد
        </button>
      </div>
    </div>
  );
};

export default VanSalesHeader;
