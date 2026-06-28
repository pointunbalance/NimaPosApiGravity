import React from 'react';
import { MapPin } from 'lucide-react';

const VanSalesMap: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-0 overflow-hidden h-64 relative bg-slate-100 flex items-center justify-center">
      {/* Placeholder for actual map integration */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      <div className="text-center relative z-10">
        <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-500 font-medium">عرض الخريطة المباشر</p>
        <p className="text-xs text-slate-400">يتطلب دمج الخرائط</p>
      </div>
    </div>
  );
};

export default VanSalesMap;
