import React from 'react';
import { Code, Settings, Database, Play, Trash2 } from 'lucide-react';

interface DeveloperToolsCardProps {
  items: any[];
  navigate: (path: string) => void;
  setIsSchemaModalOpen: (open: boolean) => void;
  setIsSeedModalOpen: (open: boolean) => void;
  setIsClearModalOpen: (open: boolean) => void;
  isSeeding: boolean;
  isClearing: boolean;
}

export const DeveloperToolsCard: React.FC<DeveloperToolsCardProps> = ({
  items,
  navigate,
  setIsSchemaModalOpen,
  setIsSeedModalOpen,
  setIsClearModalOpen,
  isSeeding,
  isClearing
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
      <div className="px-3.5 py-3 border-b border-slate-100 bg-slate-50/40 flex justify-between items-center group-hover:bg-indigo-50/40 transition-colors">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <Code className="w-4 h-4 text-indigo-600" />
          <span>أدوات المطور المتكاملة</span>
        </h3>
        <span className="bg-indigo-700 border border-indigo-800 text-white font-black text-xs px-2.5 py-0.5 rounded-lg shadow-sm transition-all duration-200 group-hover:scale-105">
          ٦
        </span>
      </div>
      <div className="p-3.5 flex-1 bg-white flex flex-col justify-between space-y-3.5">
        <div>
          <div className="text-[10px] font-bold text-slate-400 mb-2 mr-1">الروابط التطويرية والمستندات</div>
          <div className="space-y-1">
            {items.map((item, i) => {
              const Icon = item.icon as any;
              return (
                <button
                  key={i}
                  onClick={() => navigate(item.path)}
                  className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-slate-100 border border-transparent transition-all group/item cursor-pointer text-right"
                  dir="rtl"
                >
                  <div className="flex items-center gap-2 pointer-events-none">
                    <Icon className="w-3.5 h-3.5 text-indigo-500 group-hover/item:text-indigo-600 transition-colors" />
                    <span className="font-bold text-slate-700 text-xs group-hover/item:text-indigo-650 transition-all">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-100"></div>

        <div>
          <div className="text-[10px] font-bold text-slate-400 mb-2 mr-1">العمليات التشغيلية للنظام</div>
          <div className="space-y-1.5">
            <button 
              onClick={() => navigate('/setup')} 
              className="w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-slate-700 shadow-sm text-right cursor-pointer"
              dir="rtl"
            >
              <Settings className="w-4 h-4 text-slate-400 shrink-0" />
              <span>مدير إعدادات المنظومة (Setup)</span>
            </button>
            <button 
              onClick={() => setIsSchemaModalOpen(true)}
              className="w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-xl text-xs font-bold border border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50/45 transition-all text-indigo-800 shadow-sm text-right cursor-pointer"
              dir="rtl"
            >
              <Database className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>عرض هيكل الجداول (Schema)</span>
            </button>
            <button 
              onClick={() => setIsSeedModalOpen(true)}
              disabled={isSeeding}
              className="w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold border border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50/45 transition-all text-emerald-800 disabled:opacity-55 shadow-sm text-right cursor-pointer"
              dir="rtl"
            >
              <Play className="w-4 h-4 text-emerald-500 shrink-0 animate-pulse" />
              <span>{isSeeding ? 'جاري التوليد...' : 'توليد بيانات تجريبية ضخمة'}</span>
            </button>
            <button 
              onClick={() => setIsClearModalOpen(true)}
              disabled={isClearing}
              className="w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold border border-red-200 hover:border-red-300 hover:bg-red-50/70 transition-all text-[#DC2626] disabled:opacity-55 shadow-sm text-right cursor-pointer"
              dir="rtl"
            >
              <Trash2 className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{isClearing ? 'جاري التفريغ...' : 'حذف كل البيانات (إعادة تعيين)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
