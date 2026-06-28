import React from 'react';
import { Edit2, Trash2, Package, DollarSign, Layers, LayoutGrid } from 'lucide-react';
import { Category } from '../../types';
import { iconMap } from '../../utils/categoryIcons';

interface CategoriesGridProps {
  processedCategories: Category[];
  categoryStats: Record<string, { count: number, value: number }>;
  searchTerm: string;
  formatCurrency: (amount: number) => string;
  onOpenModal: (category?: Category) => void;
  onDeleteCategory: (id: number, name: string) => void;
}

const CategoriesGrid: React.FC<CategoriesGridProps> = ({
  processedCategories,
  categoryStats,
  searchTerm,
  formatCurrency,
  onOpenModal,
  onDeleteCategory,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {processedCategories?.map(category => {
        const stats = categoryStats[category.name.trim()] || { count: 0, value: 0 };
        const Icon = iconMap[category.icon || 'grid'] || LayoutGrid;
        
        return (
          <div 
            key={category.id} 
            className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col h-56 hover:-translate-y-1"
          >
            {/* Color Banner */}
            <div className="absolute top-0 left-0 w-full h-2 transition-all duration-300 group-hover:h-3" style={{ backgroundColor: category.color || '#6366f1' }}></div>
            
            <div className="p-6 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{ backgroundColor: category.color || '#6366f1' }}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                  <button onClick={() => onOpenModal(category)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => onDeleteCategory(category.id!, category.name)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              
              <h3 className="font-black text-xl text-slate-800 mb-1 truncate" title={category.name}>{category.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-auto leading-relaxed">
                {category.description || 'لا يوجد وصف متاح لهذا التصنيف'}
              </p>

              <div className="mt-4 flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <Package className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{stats.count}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200" title="إجمالي قيمة المنتجات">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span dir="ltr">{formatCurrency(stats.value)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Empty State */}
      {processedCategories?.length === 0 && (
        <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md rounded-3xl border border-indigo-100 shadow-md shadow-indigo-100/10 font-['Tajawal'] gap-4">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-full flex items-center justify-center shadow-md shadow-indigo-150/20 border border-indigo-200">
            <Layers className="w-9 h-9 text-indigo-600 stroke-[1.8] animate-pulse" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-black text-slate-800 mb-1">لا توجد تصنيفات</h3>
            <p className="font-bold text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {searchTerm ? 'لم يتم العثور على نتائج مطابقة لبحثك. جرب كلمات مفتاحية أخرى.' : 'ابدأ بإضافة تصنيفات لتنظيم منتجاتك وتسهيل الوصول إليها.'}
            </p>
          </div>
          {!searchTerm && (
            <button 
              onClick={() => onOpenModal()}
              className="mt-2 bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white px-6 py-3 rounded-2xl font-black shadow-md shadow-indigo-500/15 transition-all active:scale-95 cursor-pointer"
            >
              إضافة أول تصنيف
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoriesGrid;
