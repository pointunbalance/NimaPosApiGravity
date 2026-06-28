import React from 'react';
import { Gift, Plus } from 'lucide-react';

interface GiftCardsHeaderProps {
  onOpenModal: () => void;
}

const GiftCardsHeader: React.FC<GiftCardsHeaderProps> = ({ onOpenModal }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 font-['Tajawal']">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm">
          <Gift className="w-8 h-8 stroke-[2]" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">بطاقات الهدايا</h1>
          <p className="text-slate-500 font-bold text-sm mt-1">إصدار وتتبع وإدارة بطاقات الهدايا الرقمية والمادية لتعزيز المبيعات</p>
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <button
          onClick={onOpenModal}
          className="w-full sm:w-auto bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 font-black transition-all cursor-pointer active:scale-95 text-sm"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          إصدار بطاقة جديدة
        </button>
      </div>
    </div>
  );
};

export default GiftCardsHeader;
