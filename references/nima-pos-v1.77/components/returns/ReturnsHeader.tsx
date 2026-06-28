import React from 'react';
import { RotateCcw, Plus } from 'lucide-react';

interface ReturnsHeaderProps {
  onNewReturnClick: () => void;
}

const ReturnsHeader: React.FC<ReturnsHeaderProps> = ({ onNewReturnClick }) => {
  return (
    <div className="flex justify-between items-center mb-6 font-['Tajawal']">
      <div>
        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
          <RotateCcw className="w-8 h-8 text-rose-500 stroke-[2]" />
          إدارة المرتجعات
        </h1>
        <p className="text-slate-500 text-xs font-bold mt-1">معالجة وتتبع البضائع المرتجعة والفواتير الدائنة</p>
      </div>
      <button 
        onClick={onNewReturnClick}
        className="bg-gradient-to-br from-rose-500 to-red-650 hover:from-rose-600 hover:to-red-750 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-rose-500/20 font-black text-sm cursor-pointer active:scale-95"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        تسجيل مرتجع جديد
      </button>
    </div>
  );
};

export default ReturnsHeader;
