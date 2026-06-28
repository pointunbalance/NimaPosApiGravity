import React from 'react';
import { ChevronRight, ChevronLeft, Bell, BellOff, Edit2, Trash2, Clock, DollarSign, Users, Info } from 'lucide-react';
import { format, isSameMonth, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { EVENT_TYPES } from './eventConstants';

interface ListViewProps {
  currentDate: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  combinedEvents: any[];
  handleToggleNotification: (id: number, currentStatus: boolean) => void;
  handleOpenModal: (editMode: boolean, item?: any) => void;
  handleDeleteClick: (id: number) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  currentDate,
  prevMonth,
  nextMonth,
  combinedEvents,
  handleToggleNotification,
  handleOpenModal,
  handleDeleteClick,
}) => {
  const filteredEvents = combinedEvents.filter((e) => isSameMonth(parseISO(e.date), currentDate));

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm" dir="rtl">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <button
          onClick={prevMonth}
          type="button"
          className="p-2 hover:bg-white rounded-xl text-slate-600 transition-colors shadow-sm border border-slate-200"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-black text-slate-800" dir="ltr">
          {format(currentDate, 'MMMM yyyy', { locale: ar })}
        </h2>
        <button
          onClick={nextMonth}
          type="button"
          className="p-2 hover:bg-white rounded-xl text-slate-600 transition-colors shadow-sm border border-slate-200"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
      <div className="divide-y divide-slate-100 bg-white">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-bold">لا توجد أحداث في هذا الشهر.</div>
        ) : (
          filteredEvents.map((e) => {
            const typeInfo =
              EVENT_TYPES[e.type as keyof typeof EVENT_TYPES] ||
              EVENT_TYPES['special_activity'];
            return (
              <div
                key={e.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-slate-100 rounded-xl p-3 text-center min-w-[70px]">
                    <span className="block text-xl font-black text-slate-800">
                      {format(parseISO(e.date), 'dd')}
                    </span>
                    <span className="block text-xs font-bold text-slate-500">
                      {format(parseISO(e.date), 'MMM', { locale: ar })}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-black text-slate-800">{e.name}</h3>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${typeInfo.color}`}
                      >
                        {typeInfo.label}
                      </span>
                      {!e.isVirtual && e.isNotificationSent && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                          <Bell className="w-3 h-3" /> تم الإشعار
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-500 mt-2">
                      {!e.isVirtual && (
                        <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <Clock className="w-4 h-4 text-slate-400" /> {e.time}
                        </span>
                      )}
                      {e.cost > 0 && (
                        <span className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg">
                          <DollarSign className="w-4 h-4" /> {e.cost} ج.م
                        </span>
                      )}
                      {e.classes?.length > 0 && (
                        <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">
                          <Users className="w-4 h-4" /> {e.classes.length} فصول مشاركة
                        </span>
                      )}
                    </div>
                    {e.notes && (
                      <p className="text-sm text-slate-600 mt-2 flex items-start gap-1">
                        <Info className="w-4 h-4 text-slate-400 mt-0.5" /> {e.notes}
                      </p>
                    )}
                  </div>
                </div>

                {!e.isVirtual && (
                  <div className="flex items-center gap-2 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      onClick={() => handleToggleNotification(e.id, e.isNotificationSent)}
                      type="button"
                      className={`p-2.5 rounded-xl font-bold transition-colors shadow-sm border ${
                        e.isNotificationSent
                          ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      }`}
                      title={
                        e.isNotificationSent
                          ? 'إلغاء الإشعار'
                          : 'تحديد كـ "تم إشعار الأهل"'
                      }
                    >
                      {e.isNotificationSent ? (
                        <BellOff className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenModal(true, e)}
                      type="button"
                      className="p-2.5 bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors shadow-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(e.id)}
                      type="button"
                      className="p-2.5 bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default ListView;
