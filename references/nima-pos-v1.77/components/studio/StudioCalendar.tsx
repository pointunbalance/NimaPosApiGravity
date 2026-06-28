import React from 'react';
import { StudioBooking, ShiftType, BookingStatus } from '../../types';
import { MessageCircle, Edit3, Trash2 } from 'lucide-react';

interface StudioCalendarProps {
  daysInMonth: Date[];
  getBookingsForDay: (date: Date) => StudioBooking[];
  handleDayClick: (day: number) => void;
  handleEditBooking: (booking: StudioBooking) => void;
  sendWhatsApp: (booking: StudioBooking) => void;
  getStatusColor: (status: BookingStatus) => string;
  getStatusLabel: (status: BookingStatus) => string;
  getShiftBadge: (shift: ShiftType) => { label: string; color: string; icon: React.ElementType };
  formatCurrency: (amount: number) => string;
  handleDeleteBooking?: (id: number) => void;
}

const StudioCalendar: React.FC<StudioCalendarProps> = ({
  daysInMonth,
  getBookingsForDay,
  handleDayClick,
  handleEditBooking,
  sendWhatsApp,
  getStatusColor,
  getStatusLabel,
  getShiftBadge,
  formatCurrency,
  handleDeleteBooking,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {daysInMonth.map((date) => {
        const dayBookings = getBookingsForDay(date);
        const isToday = new Date().toDateString() === date.toDateString();

        return (
          <div
            key={date.toISOString()}
            className={`bg-white rounded-2xl border p-3 min-h-[180px] flex flex-col transition-all hover:shadow-md cursor-pointer ${isToday ? 'border-indigo-400 ring-4 ring-indigo-50 shadow-sm' : 'border-slate-100 hover:border-indigo-200'}`}
            onClick={() => handleDayClick(date.getDate())}
          >
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-50">
              <span className={`text-lg font-black ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>
                {date.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' })}
              </span>
              {dayBookings.length > 0 && (
                <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full ring-1 ring-indigo-100">
                  {dayBookings.length}
                </span>
              )}
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-100">
              {dayBookings.map(b => {
                const statusClass = getStatusColor(b.status);
                const Icon = getShiftBadge(b.shift).icon;

                return (
                  <div key={b.id} className="group relative">
                    <div
                      onClick={(e) => { e.stopPropagation(); handleEditBooking(b); }}
                      className={`text-[10px] p-2 rounded-xl flex flex-col gap-1 mb-1 border transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md ${statusClass}`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <Icon className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          <span className="truncate font-bold text-xs max-w-[80px]" title={b.customerName}>{b.customerName}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-end opacity-80">
                         <span className="font-bold">{b.cameraName}</span>
                         <span className="font-medium">{getShiftBadge(b.shift).label}</span>
                      </div>
                    </div>

                    {/* HOVER POPUP CARD */}
                    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto scale-95 group-hover:scale-100 origin-bottom duration-200">
                      <h4 className="font-bold text-slate-800 text-sm mb-2 pb-2 border-b border-slate-100">{b.customerName}</h4>
                      <div className="space-y-2 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>الكاميرا:</span>
                          <span className="font-bold">{b.cameraName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>التوقيت:</span>
                          <span className="font-bold">{getShiftBadge(b.shift).label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>الحالة:</span>
                          <span className="font-bold">{getStatusLabel(b.status)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-100 mt-1">
                          <span>المتبقي:</span>
                          <span className={`font-black ${b.remaining > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {b.remaining > 0 ? formatCurrency(b.remaining) : 'خالص'}
                          </span>
                        </div>

                        {/* Quick Actions in Hover Card */}
                        <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-100">
                          <button
                            className="flex-1 bg-green-50 text-green-600 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-green-100 transition-colors"
                            onClick={(e) => { e.stopPropagation(); sendWhatsApp(b); }}
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> واتساب
                          </button>
                          <button
                            className="flex-1 bg-blue-50 text-blue-600 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-blue-100 transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleEditBooking(b); }}
                          >
                            <Edit3 className="w-3.5 h-3.5" /> تعديل
                          </button>
                          {handleDeleteBooking && (
                             <button
                              className="px-2 bg-red-50 text-red-600 py-1.5 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
                              onClick={(e) => { e.stopPropagation(); handleDeleteBooking(b.id!); }}
                             >
                              <Trash2 className="w-3.5 h-3.5" />
                             </button>
                          )}
                        </div>
                      </div>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-slate-200">
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-white/95" style={{ marginBottom: '-6px' }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {dayBookings.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-400 text-[11px] font-medium opacity-50">
                  لا توجد حجوزات
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StudioCalendar;
