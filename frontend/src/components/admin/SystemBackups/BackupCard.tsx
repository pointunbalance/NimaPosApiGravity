import React from 'react';
import { Download, Clock, HardDrive, RefreshCw } from 'lucide-react';

interface BackupCardProps {
  lastBackup: string;
  dbSize: string;
  isExporting: boolean;
  disabled: boolean;
  onBackup: () => void;
}

export const BackupCard: React.FC<BackupCardProps> = ({
  lastBackup,
  dbSize,
  isExporting,
  disabled,
  onBackup,
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-indigo-100/40 flex flex-col font-['Tajawal']">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shrink-0">
          <Download className="w-6 h-6 stroke-[2]" />
        </div>
        <div>
          <h3 className="font-black text-slate-800 text-lg">إنشاء نسخة احتياطية</h3>
          <p className="text-sm text-slate-500 font-bold mt-1">
            قم بإنشاء نسخة احتياطية كاملة لجميع بيانات النظام وحفظها على جهازك.
          </p>
        </div>
      </div>
      
      <div className="bg-slate-50/70 p-4 rounded-2xl mb-6 flex-1 border border-slate-100">
        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
          <Clock className="w-4 h-4 text-indigo-500 stroke-[2]" />
          <span className="font-black">آخر نسخة احتياطية:</span>
          <span className="mr-auto font-bold" dir="ltr">{lastBackup}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <HardDrive className="w-4 h-4 text-indigo-500 stroke-[2]" />
          <span className="font-black">حجم قاعدة البيانات التقديري:</span>
          <span className="mr-auto font-bold" dir="ltr">{dbSize}</span>
        </div>
      </div>

      <button 
        onClick={onBackup}
        disabled={disabled}
        className="w-full py-3 bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white rounded-xl font-black shadow-md shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer active:scale-95 text-sm"
      >
        {isExporting ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            جاري إنشاء النسخة...
          </>
        ) : (
          <>
            <Download className="w-5 h-5 stroke-[2]" />
            تحميل نسخة احتياطية الآن
          </>
        )}
      </button>
    </div>
  );
};
