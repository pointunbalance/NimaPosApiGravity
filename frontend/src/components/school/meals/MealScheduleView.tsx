import React from 'react';
import { Coffee, Apple, Salad, Edit2, Info } from 'lucide-react';

interface MealScheduleViewProps {
  WEEK_DAYS: { id: string; label: string }[];
  getDailyMenu: (day: string) => { breakfast: string; snack: string; lunch: string };
  openScheduleModal: (day: string) => void;
}

export const MealScheduleView: React.FC<MealScheduleViewProps> = ({
  WEEK_DAYS,
  getDailyMenu,
  openScheduleModal,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 flex items-start gap-4">
        <Info className="w-6 h-6 text-orange-600 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-lg font-black text-orange-900 mb-1">الجدول الأسبوعي للوجبات</h3>
          <p className="text-sm font-medium text-orange-800">
            يمكنك هنا تحديد الوجبات الثابتة لكل يوم للإفطار والغداء والسناك. سيظهر هذا الجدول في تطبيق أولياء الأمور ليعرفوا الوجبات المقدمة.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {WEEK_DAYS.map((day) => {
          const menu = getDailyMenu(day.id);
          return (
            <div
              key={day.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col"
            >
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                <h4 className="font-black text-slate-800 text-lg">{day.label}</h4>
                <button
                  onClick={() => openScheduleModal(day.id)}
                  className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-4 flex-1">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Coffee className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-1">الإفطار</p>
                    <p className="text-sm font-bold text-slate-800">{menu.breakfast}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Apple className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-1">السناك</p>
                    <p className="text-sm font-bold text-slate-800">{menu.snack}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Salad className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-1">الغداء</p>
                    <p className="text-sm font-bold text-slate-800">{menu.lunch}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
