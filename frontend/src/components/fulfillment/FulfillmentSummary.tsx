import React from 'react';
import { ListChecks } from 'lucide-react';

interface FulfillmentSummaryProps {
  itemSummary: [string, number][];
}

const FulfillmentSummary: React.FC<FulfillmentSummaryProps> = ({ itemSummary }) => {
  return (
    <div className="w-80 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col shrink-0 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-black text-xl text-slate-800 flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
            <ListChecks className="w-5 h-5" />
          </div>
          المطلوب الآن
        </h3>
        <p className="text-sm font-medium text-slate-500 mt-2">مجموع الأصناف قيد الانتظار</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
        {itemSummary.map(([name, qty]) => (
          <div key={name} className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-100 hover:shadow-md transition-all">
            <span className="text-sm font-bold text-slate-700 line-clamp-2 leading-relaxed ml-2">{name}</span>
            <span className="text-lg font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{qty}</span>
          </div>
        ))}
        {itemSummary.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
             <ListChecks className="w-12 h-12 mb-4 opacity-20" />
             <p className="font-medium">لا توجد أصناف مطلوبة</p>
          </div>
        )}
      </div>
      <div className="p-5 bg-slate-50/80 border-t border-slate-200 text-center">
        <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">إجمالي الأصناف</p>
        <p className="text-3xl font-black text-slate-800">
          {itemSummary.reduce((acc, curr) => acc + curr[1], 0)}
        </p>
      </div>
    </div>
  );
};

export default FulfillmentSummary;
