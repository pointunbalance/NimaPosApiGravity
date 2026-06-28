import React from 'react';
import { Plus, AlertCircle, Sparkles } from 'lucide-react';

interface PricingRulesHeaderProps {
  enableSmartPricing: boolean;
  toggleSmartPricing: () => void;
  onOpenModal: () => void;
}

const PricingRulesHeader: React.FC<PricingRulesHeaderProps> = ({
  enableSmartPricing,
  toggleSmartPricing,
  onOpenModal,
}) => {
  return (
    <div className="font-['Tajawal'] space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm">
              <Sparkles className="w-8 h-8 stroke-[2]" />
            </div>
            قواعد التسعير الذكي
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1">تحديد هوامش الأرباح والأسعار المقترحة تلقائياً عند تغيير تكلفة التوريد</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <label className="relative inline-flex items-center cursor-pointer bg-white/55 backdrop-blur border border-indigo-100/50 px-4 py-2.5 rounded-xl shadow-sm self-start sm:self-auto">
            <span className="ml-3 text-xs font-black text-slate-600">تفعيل التسعير الذكي</span>
            <input
              type="checkbox"
              className="sr-only peer"
              checked={enableSmartPricing}
              onChange={toggleSmartPricing}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
          <button
            onClick={onOpenModal}
            className="bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 font-black transition-all cursor-pointer active:scale-95 text-sm"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>إضافة قاعدة جديدة</span>
          </button>
        </div>
      </div>

      {!enableSmartPricing && (
        <div className="bg-amber-50 border-r-4 border-amber-400 p-4 rounded-2xl flex items-start gap-3 animate-pulse">
          <AlertCircle className="text-amber-500 mt-0.5 w-5 h-5 flex-shrink-0" />
          <div>
            <h3 className="text-amber-800 font-black text-sm">التسعير الذكي معطل حالياً</h3>
            <p className="text-amber-700 text-xs mt-1 font-bold leading-relaxed">
              قم بتفعيل التسعير الذكي باستخدام الزر أعلاه لتمكين النظام من اقتراح أسعار البيع المثالية تلقائياً بناءً على فئات التكلفة عند إدخال بضائع جديدة أو تعديل فواتير الشراء.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingRulesHeader;
