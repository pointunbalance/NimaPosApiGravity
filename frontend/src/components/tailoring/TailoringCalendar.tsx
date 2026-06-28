import React, { useMemo, useState } from 'react';
import { TailoringOrder } from '../../types';
import { CalendarIcon, User, Clock, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

interface TailoringCalendarProps {
    orders: TailoringOrder[];
}

const TailoringCalendar: React.FC<TailoringCalendarProps> = ({ orders }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const days = useMemo(() => {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const daysArray = [];
        while (d.getMonth() === currentDate.getMonth()) {
            daysArray.push(new Date(d));
            d.setDate(d.getDate() + 1);
        }
        return daysArray;
    }, [currentDate]);

    const getFittingsForDay = (date: Date) => {
        const targetStr = date.toISOString().split('T')[0];
        
        const fittings: { order: TailoringOrder, fitting: any }[] = [];
        orders.forEach(o => {
            if (o.status !== 'cancelled' && o.status !== 'delivered' && o.fittings) {
                o.fittings.forEach(f => {
                    const fStr = new Date(f.date).toISOString().split('T')[0];
                    if (fStr === targetStr) {
                        fittings.push({ order: o, fitting: f });
                    }
                });
            }
        });
        return fittings.sort((a, b) => new Date(a.fitting.date).getTime() - new Date(b.fitting.date).getTime());
    };

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"><ChevronRight className="w-5 h-5"/></button>
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-indigo-500" />
                        {currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold hover:bg-indigo-100 text-sm transition-colors">اليوم</button>
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5"/></button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
                {days.map(date => {
                    const fittings = getFittingsForDay(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                        <div key={date.toISOString()} className={`relative min-h-[140px] rounded-2xl border p-3 flex flex-col gap-1 transition-all hover:shadow-md cursor-pointer ${isToday ? 'bg-indigo-50/30 border-indigo-400 ring-2 ring-indigo-50' : 'bg-white border-slate-100 hover:border-indigo-200'}`}>
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-50/80">
                                <span className={`font-bold text-sm ${isToday ? 'text-indigo-600' : 'text-slate-600'}`}>
                                    {date.toLocaleDateString('ar-EG', { weekday: 'short' })}
                                </span>
                                <span className={`font-black text-xl leading-none ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>
                                    {date.getDate()}
                                </span>
                            </div>
                            
                            <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-none">
                                {fittings.map((item, idx) => (
                                    <div key={idx} className={`text-[10px] p-2 rounded-xl border mb-1 transition-all hover:-translate-y-0.5 hover:shadow-sm flex flex-col gap-1 ${item.fitting.status === 'completed' ? 'bg-slate-50 border-slate-200 opacity-60 text-slate-600' : 'bg-blue-50/50 border-blue-100 text-slate-700'}`}>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold truncate max-w-[80px]" title={item.order.customerName}>{item.order.customerName}</span>
                                            {item.fitting.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                            {item.fitting.status === 'scheduled' && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>}
                                        </div>
                                        <div className="flex flex-col gap-0.5 opacity-80">
                                            <span className="flex items-center gap-1 font-medium"><Clock className="w-3 h-3 text-indigo-400"/> {new Date(item.fitting.date).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TailoringCalendar;
