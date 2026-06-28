import React from 'react';
import { Settings } from 'lucide-react';

interface AutoBackupCardProps {
  autoBackupEnabled: boolean;
  autoBackupFrequency: string;
  onSettingsChange: (enabled: boolean, frequency: string) => void;
}

export const AutoBackupCard: React.FC<AutoBackupCardProps> = ({
  autoBackupEnabled,
  autoBackupFrequency,
  onSettingsChange,
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-indigo-100/40 font-['Tajawal']">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100/50 flex items-center justify-center text-blue-600 shrink-0">
          <Settings className="w-6 h-6 stroke-[2]" />
        </div>
        <div>
          <h3 className="font-black text-slate-800 text-lg">إعدادات النسخ التلقائي</h3>
          <p className="text-sm text-slate-500 font-bold mt-1">
            تكوين النسخ الاحتياطي التلقائي لضمان عدم فقدان البيانات.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-center justify-between p-4 border border-indigo-50/60 bg-white/40 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all">
          <div>
            <p className="font-black text-slate-800 text-sm">تفعيل النسخ التلقائي</p>
            <p className="text-xs text-slate-500 font-bold mt-0.5">سيتم حفظ نسخة احتياطية محلياً بشكل دوري</p>
          </div>
          <div className="relative inline-block w-12 h-6 rounded-full transition-colors duration-200 ease-in-out">
            <input 
              type="checkbox" 
              className="peer sr-only"
              checked={autoBackupEnabled}
              onChange={(e) => onSettingsChange(e.target.checked, autoBackupFrequency)}
            />
            <div className="absolute inset-0 bg-slate-200 rounded-full peer-checked:bg-indigo-600 transition-colors"></div>
            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></div>
          </div>
        </label>

        <div className={`p-4 border border-indigo-50/60 bg-white/40 rounded-2xl transition-opacity ${!autoBackupEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="block text-xs font-black text-slate-700 mb-2">تكرار النسخ الاحتياطي</label>
          <select 
            value={autoBackupFrequency}
            onChange={(e) => onSettingsChange(autoBackupEnabled, e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-indigo-100/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white/85 text-sm font-bold text-slate-700 appearance-none cursor-pointer"
          >
            <option value="daily">يومياً</option>
            <option value="weekly">أسبوعياً</option>
            <option value="monthly">شهرياً</option>
          </select>
        </div>
      </div>
    </div>
  );
};
