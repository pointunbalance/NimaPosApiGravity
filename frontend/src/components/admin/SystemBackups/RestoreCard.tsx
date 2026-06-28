import React from 'react';
import { Upload, AlertCircle, RefreshCw } from 'lucide-react';

interface RestoreCardProps {
  isRestoring: boolean;
  disabled: boolean;
  onRestore: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const RestoreCard: React.FC<RestoreCardProps> = ({
  isRestoring,
  disabled,
  onRestore,
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-indigo-100/40 flex flex-col font-['Tajawal']">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600 shrink-0">
          <Upload className="w-6 h-6 stroke-[2]" />
        </div>
        <div>
          <h3 className="font-black text-slate-800 text-lg">استعادة البيانات</h3>
          <p className="text-sm text-slate-500 font-bold mt-1">
            استعادة بيانات النظام من ملف نسخة احتياطية سابق (بصيغة JSON).
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-2xl mb-6 flex gap-3 flex-1">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 stroke-[2]" />
        <div className="text-xs text-amber-800">
          <p className="font-black mb-1">تحذير هام!</p>
          <p className="font-bold leading-relaxed">عملية الاستعادة ستقوم بمسح جميع البيانات الحالية واستبدالها ببيانات النسخة الاحتياطية. لا يمكن التراجع عن هذه العملية.</p>
        </div>
      </div>

      <div className="relative">
        <input 
          type="file" 
          accept=".json"
          onChange={onRestore}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className={`w-full py-3 bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-200/80 rounded-xl font-black transition-all flex items-center justify-center gap-2 ${isRestoring ? 'opacity-70' : ''}`}>
          {isRestoring ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              جاري استعادة البيانات...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 stroke-[2]" />
              اختيار ملف النسخة الاحتياطية
            </>
          )}
        </div>
      </div>
    </div>
  );
};
