import React from 'react';
import { Layers, Plus } from 'lucide-react';

interface CategoriesHeaderProps {
  onOpenModal: () => void;
}

const CategoriesHeader: React.FC<CategoriesHeaderProps> = ({ onOpenModal }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 font-['Tajawal']">
      <div>
        <h1 className="text-3xl font-black text-slate-800 mb-2 flex items-center gap-3 tracking-tight">
          <Layers className="w-8 h-8 text-indigo-600 stroke-[2]" />
          تصنيفات المنتجات
        </h1>
        <p className="text-slate-500 font-bold text-sm">تنظيم المنتجات وأيقونات العرض في نقطة البيع</p>
      </div>
      <button 
        onClick={onOpenModal}
        className="bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white px-5 py-3 rounded-2xl flex items-center gap-2 shadow-md shadow-indigo-500/20 font-black transition-all active:scale-95 cursor-pointer"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>تصنيف جديد</span>
      </button>
    </div>
  );
};

export default CategoriesHeader;
