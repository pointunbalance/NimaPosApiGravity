import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { format, isSameMonth, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { EVENT_TYPES } from './eventConstants';

interface CalendarViewProps {
  currentDate: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  calendarDays: Date[];
  getEventsForDay: (date: Date) => any[];
  handleOpenModal: (editMode: boolean, item?: any) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  prevMonth,
  nextMonth,
  calendarDays,
  getEventsForDay,
  handleOpenModal,
}) => {
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

      <div className="grid grid-cols-7 text-center border-b border-slate-200 bg-white">
        {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((day) => (
          <div
            key={day}
            className="py-3 text-sm font-bold text-slate-500 border-l last:border-l-0 border-slate-100"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 bg-slate-50">
        {calendarDays.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          const dayEvents = getEventsForDay(day);

          return (
            <div
              key={idx}
              className={`min-h-[120px] p-2 border-b border-l last:border-l-0 border-slate-200 transition-all ${
                isCurrentMonth ? 'bg-white' : 'bg-slate-50 opacity-50'
              } ${isTodayDate ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50/10' : ''}`}
            >
              <div className="flex justify-between items-center mb-2">
                <span
                  className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                    isTodayDate ? 'bg-indigo-600 text-white' : 'text-slate-700'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-1.5 max-h-[80px] overflow-y-auto no-scrollbar">
                {dayEvents.map((e) => {
                  const typeInfo =
                    EVENT_TYPES[e.type as keyof typeof EVENT_TYPES] ||
                    EVENT_TYPES['special_activity'];
                  return (
                    <div
                      key={e.id}
                      onClick={() => !e.isVirtual && handleOpenModal(true, e)}
                      className={`text-xs p-1.5 rounded-md border truncate cursor-pointer transition-transform hover:scale-105 ${typeInfo.color}`}
                      title={e.name}
                    >
                      <span className="font-bold">{e.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default CalendarView;
