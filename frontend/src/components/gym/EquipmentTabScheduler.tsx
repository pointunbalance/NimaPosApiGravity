import React from 'react';
import { Clock, Wrench } from 'lucide-react';
import { EquipmentType } from './equipmentTypes';

interface EquipmentTabSchedulerProps {
  records: EquipmentType[];
  onOpenMaintenancePanel: (id: number) => void;
}

export const EquipmentTabScheduler: React.FC<EquipmentTabSchedulerProps> = ({
  records,
  onOpenMaintenancePanel
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-right font-sans" dir="rtl">
      <div>
        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 border-b pb-3.5 flex-row-reverse">
          <Clock className="w-5 h-5 text-indigo-500" />
          <span>جدول عمليات الصيانة الوقائية والإنذار المبكر للأجهزة</span>
        </h3>
        <p className="text-xs text-slate-400 mt-2 font-bold leading-normal">
          تساعدك جدولة عمليات الصيانة على تفادي توقف الأجهزة فجأة أثناء التشغيل الحاد. يسرد الجدول الأجهزة التي اقتربت تواريخ دورتهم السنوية للفحص الفني الشامل.
        </p>
      </div>

      <div className="overflow-x-auto text-xs text-right">
        <table className="w-full text-right border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 flex-row-reverse">
              <th className="px-5 py-3.5 font-bold text-slate-700 text-right">كود الأصل</th>
              <th className="px-5 py-3.5 font-bold text-slate-700 text-right">اسم الجهاز والنوع</th>
              <th className="px-5 py-3.5 font-bold text-slate-700 text-right">آخر فحص فني</th>
              <th className="px-5 py-3.5 font-extrabold text-amber-700 text-right">موعد الصيانة القادمة</th>
              <th className="px-5 py-3.5 font-bold text-slate-700 text-right">الحالة بالصالة</th>
              <th className="px-5 py-3.5 font-extrabold text-slate-700 text-center">خدمة فحص سريعة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  لا توجد سجلات أجهزة وقائية مسجلة. أضف جهازاً جديداً لبقاء صالتك آمنة ومدرجة.
                </td>
              </tr>
            ) : (
              records.map((item) => {
                const isOverdue = item.nextMaintenance && new Date(item.nextMaintenance).getTime() < new Date().getTime();

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors font-bold text-slate-700">
                    <td className="px-5 py-4 font-mono text-slate-400 text-[11px] text-right">#{item.id}</td>
                    <td className="px-5 py-4 text-right">
                      <span className="block font-extrabold text-slate-800 text-xs">{item.name}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{item.type}</span>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-500 text-right">{item.lastMaintenance || 'غير مدون'}</td>
                    <td className="px-5 py-4 text-right">
                      {item.nextMaintenance ? (
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-mono ${
                          isOverdue 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200 font-extrabold animate-pulse' 
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}>
                          {item.nextMaintenance} {isOverdue && '(متأخر)'}
                        </span>
                      ) : (
                        <span className="text-slate-400">غير محدد</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] ${
                        item.status === 'يعمل' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => onOpenMaintenancePanel(item.id!)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black shadow-sm transition-all flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>قيد فحص / صيانة</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
