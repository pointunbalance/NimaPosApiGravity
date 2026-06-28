import React from 'react';
import { 
  Wrench, 
  User, 
  Calendar, 
  Clock, 
  ClipboardList, 
  Edit2, 
  Trash2, 
  Info 
} from 'lucide-react';
import { EquipmentType } from './equipmentTypes';

interface EquipmentTabDirectoryProps {
  filteredRecords: EquipmentType[];
  trainers: any[];
  selectedEquipId: number | null;
  onOpenMaintenancePanel: (id: number) => void;
  onEdit: (item: EquipmentType) => void;
  onDelete: (id: number, name: string) => void;
  currency: string;
}

export const EquipmentTabDirectory: React.FC<EquipmentTabDirectoryProps> = ({
  filteredRecords,
  trainers,
  selectedEquipId,
  onOpenMaintenancePanel,
  onEdit,
  onDelete,
  currency
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right" dir="rtl">
      {filteredRecords.length === 0 ? (
        <div className="md:col-span-2 bg-white border border-slate-200 p-12 text-center rounded-3xl flex flex-col items-center justify-center gap-3">
          <Info className="w-12 h-12 text-slate-300" />
          <div>
            <h3 className="text-base font-extrabold text-slate-700">لا توجد أجهزة متطابقة</h3>
            <p className="text-xs text-slate-400 leading-relaxed mt-1">
              برجاء تغيير فلاتر التصفية للبحث أو إضافة جهاز رياضي جديد لتتبع حركته الفنية والمالية.
            </p>
          </div>
        </div>
      ) : (
        filteredRecords.map((item) => {
          const supervisor = trainers.find((t: any) => t.id === Number(item.supervisorId));
          const logsCount = (item.maintenanceLogs || []).length;
          const logsAccumulatedCost = (item.maintenanceLogs || []).reduce((s, l) => s + (Number(l.cost) || 0), 0);

          return (
            <div 
              key={item.id} 
              className={`bg-white rounded-2xl border p-5 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative ${
                selectedEquipId === item.id 
                  ? 'border-indigo-500 ring-2 ring-indigo-500/10' 
                  : 'border-slate-200'
              }`}
            >
              {/* Top Status and Specs */}
              <div>
                <div className="flex justify-between items-start flex-row-reverse">
                  <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg ${
                    item.status === 'يعمل' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                      : item.status === 'تحت الصيانة' 
                      ? 'bg-amber-50 text-amber-800 border border-amber-100 animate-pulse'
                      : item.status === 'بحاجة لصيانة' || item.status === 'تحتاج فحص'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-100'
                  }`}>
                    {item.status === 'يعمل' && '🟢 يعمل بكفاءة ممتاز'}
                    {item.status === 'تحت الصيانة' && '⚙️ قيد الصيانة فنية'}
                    {(item.status === 'بحاجة لصيانة' || item.status === 'تحتاج فحص') && '⚠️ بحاجة لفحص'}
                    {(item.status === 'معطل' || item.status === 'خارج الخدمة') && '🔴 معطل/تالف للتبديل'}
                  </span>

                  <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md font-mono font-bold">
                    #{item.id}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5 leading-tight flex-row-reverse">
                    <Wrench className="w-4 h-4 text-slate-400" />
                    <span>{item.name}</span>
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-row-reverse">
                    <span className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-100 font-bold">
                      {item.type || 'غير مصنف'}
                    </span>
                    {item.serialNumber && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        S/N: {item.serialNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Extra stats specs list */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2 text-xs text-slate-500 font-bold">
                  {supervisor && (
                    <div className="flex items-center gap-1.5 text-slate-600 flex-row-reverse">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>الكابتن المشرف: <strong className="text-indigo-600 font-black">{supervisor.name}</strong></span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 flex-row-reverse">
                    <span className="flex items-center gap-1 flex-row-reverse">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>آخر فحص: {item.lastMaintenance || 'لا يوجد تسجيل فحص مسبق'}</span>
                    </span>
                    {item.nextMaintenance && (
                      <span className="text-slate-500 flex items-center gap-0.5 flex-row-reverse">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        <span>القادم: {item.nextMaintenance}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cumulative Maintenance Details Bottom Strip */}
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-[11px] flex-row-reverse">
                <span className="font-bold text-slate-400">تاريخ العمليات: <strong className="text-slate-700 font-mono">{logsCount} مرة</strong></span>
                <span className="font-bold text-rose-600">استنزف مالي: <strong className="font-mono">{logsAccumulatedCost.toLocaleString()} {currency}</strong></span>
              </div>

              {/* Card Buttons actions */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 flex-row-reverse">
                <button
                  onClick={() => onOpenMaintenancePanel(item.id!)}
                  className="col-span-2 px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl hover:bg-indigo-100 font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>سجل الصيانة والمالية</span>
                </button>
                
                <div className="flex gap-1 justify-end flex-row-reverse">
                  <button 
                    onClick={() => onEdit(item)} 
                    className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-100 transition-all cursor-pointer"
                    title="تعديل التفاصيل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  
                  <button 
                    onClick={() => onDelete(item.id!, item.name)} 
                    className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50/55 hover:bg-rose-50 rounded-lg border border-rose-100 transition-all cursor-pointer"
                    title="حذف واستبعاد كلي"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })
      )}
    </div>
  );
};
