import React from 'react';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import { Rental } from '../../types';

interface RentalCalendarProps {
    monthName: string;
    changeMonth: (delta: number) => void;
    daysInMonth: Date[];
    getRentalsForDay: (date: Date) => Rental[];
    handleDayClick: (day: number) => void;
    handleEditRental: (rental: Rental) => void;
}

export const RentalCalendar: React.FC<RentalCalendarProps> = ({
    monthName, changeMonth, daysInMonth, getRentalsForDay, handleDayClick, handleEditRental
}) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-6 bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"><ChevronRight className="w-5 h-5"/></button>
                <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-indigo-500"/> {monthName}</h2>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5"/></button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
                {daysInMonth.map((date) => {
                    const dayRentals = getRentalsForDay(date);
                    const isToday = new Date().toDateString() === date.toDateString();
                    return (
                        <div 
                            key={date.toISOString()} 
                            className={`bg-white rounded-2xl border p-3 min-h-[140px] flex flex-col transition-all hover:shadow-md cursor-pointer ${isToday ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}
                            onClick={() => handleDayClick(date.getDate())}
                        >
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-50">
                                <span className={`font-bold text-sm ${isToday ? 'text-indigo-600' : 'text-slate-600'}`}>
                                    {date.toLocaleDateString('ar-EG', { weekday: 'short' })}
                                </span>
                                <span className={`font-black text-xl leading-none ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>
                                    {date.getDate()}
                                </span>
                            </div>
                            <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-none">
                                {dayRentals.map(r => {
                                    const isPickup = new Date(r.pickupDate).toDateString() === date.toDateString();
                                    const isReturn = new Date(r.returnDate).toDateString() === date.toDateString();
                                    return (
                                        <div 
                                            key={r.id} 
                                            onClick={(e) => { e.stopPropagation(); handleEditRental(r); }}
                                            className={`text-[10px] p-2 rounded-xl border mb-1 transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-pointer flex items-center justify-between ${
                                                isPickup ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 
                                                isReturn ? 'bg-red-50 border-red-100 text-red-800' : 
                                                'bg-blue-50 border-blue-100 text-blue-800'
                                            }`}
                                        >
                                            <span className="font-bold truncate max-w-[80px]" title={r.customerName}>{r.customerName}</span>
                                            {isPickup && <span className="bg-emerald-200/50 text-emerald-700 px-1.5 py-0.5 rounded-md text-[9px] font-bold">تسليم</span>}
                                            {isReturn && <span className="bg-red-200/50 text-red-700 px-1.5 py-0.5 rounded-md text-[9px] font-bold">إرجاع</span>}
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
