import React from 'react';
import { LayoutGrid } from 'lucide-react';

interface ModuleCardProps {
  label: string;
  items: any[];
  navigate: (path: string) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ label, items, navigate }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
      <div className="px-3.5 py-3 border-b border-slate-100 bg-slate-50/40 flex justify-between items-center group-hover:bg-indigo-50/40 transition-colors">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 font-['Tajawal']">
          <LayoutGrid className="w-4 h-4 text-indigo-600 opacity-80 group-hover:opacity-100" />
          {label}
        </h3>
        <span className="bg-indigo-700 border border-indigo-800 text-white font-black text-xs px-2.5 py-0.5 rounded-lg shadow-sm transition-all duration-200 group-hover:scale-105 font-mono">
          {items.length}
        </span>
      </div>
      <div className="p-3 pb-5 flex-1 bg-white flex flex-col justify-between">
        <div className="max-h-[220px] overflow-y-auto pl-3.5 pr-1 pb-1.5 custom-scrollbar">
          <div className="grid grid-cols-1 gap-0.5">
            {items.map((item, i) => {
              const Icon = item.icon as any;
              return (
                <button
                  key={i}
                  onClick={() => navigate(item.path)}
                  className="flex items-center justify-between w-full p-2.5 rounded-lg hover:bg-slate-100/60 transition-colors group/item cursor-pointer text-right"
                  dir="rtl"
                >
                  <div className="flex items-center gap-2.5 pointer-events-none">
                    <Icon className="w-3.5 h-3.5 text-slate-500 group-hover/item:text-indigo-600 transition-colors" />
                    <span className="font-bold text-[#374151] text-xs group-hover/item:text-indigo-650 group-hover/item:underline decoration-[1px] decoration-indigo-600/35 underline-offset-3 transition-all">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
