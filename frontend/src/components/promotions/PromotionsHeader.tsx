import React from 'react';
import { Percent, Plus } from 'lucide-react';

interface PromotionsHeaderProps {
  onOpenModal: () => void;
}

const PromotionsHeader: React.FC<PromotionsHeaderProps> = ({ onOpenModal }) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Percent className="w-6 h-6 text-brand-500" />
          العروض الترويجية والخصومات
        </h1>
        <p className="text-slate-500 text-sm mt-1">إدارة الكوبونات، الخصومات المباشرة، وعروض اشترِ X واحصل على Y</p>
      </div>
      <button
        onClick={onOpenModal}
        className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-brand-700 transition-colors shadow-sm font-bold"
      >
        <Plus className="w-5 h-5" />
        إنشاء عرض جديد
      </button>
    </div>
  );
};

export default PromotionsHeader;
