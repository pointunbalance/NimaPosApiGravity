import React from 'react';
import { Trash2, RefreshCw } from 'lucide-react';

interface DangerZoneCardProps {
  isClearing: boolean;
  disabled: boolean;
  onClear: () => void;
}

export const DangerZoneCard: React.FC<DangerZoneCardProps> = ({
  isClearing,
  disabled,
  onClear,
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-rose-100/40 font-['Tajawal']">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100/50 flex items-center justify-center text-rose-600 shrink-0">
          <Trash2 className="w-6 h-6 stroke-[2]" />
        </div>
        <div>
          <h3 className="font-black text-rose-600 text-lg">منطقة الخطر (إعادة ضبط المصنع)</h3>
          <p className="text-sm text-rose-500/80 font-bold mt-1">
            مسح جميع البيانات من النظام بشكل نهائي.
          </p>
        </div>
      </div>

      <div className="bg-rose-50 border border-rose-100/40 p-4 rounded-2xl mb-6">
        <p className="text-xs text-rose-700 font-bold leading-relaxed">
          استخدم هذا الخيار فقط إذا كنت تريد مسح جميع البيانات والبدء من جديد. يوصى بشدة بأخذ نسخة احتياطية قبل القيام بذلك.
        </p>
      </div>

      <button 
        onClick={onClear}
        disabled={disabled}
        className="w-full py-3 bg-white text-rose-600 border-2 border-rose-200 hover:border-rose-300 rounded-xl font-black hover:bg-rose-50 transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer active:scale-95 text-sm"
      >
        {isClearing ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            جاري مسح البيانات...
          </>
        ) : (
          <>
            <Trash2 className="w-5 h-5 stroke-[2]" />
            مسح جميع البيانات
          </>
        )}
      </button>
    </div>
  );
};
