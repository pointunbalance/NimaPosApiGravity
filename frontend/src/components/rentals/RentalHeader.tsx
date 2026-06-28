import React from 'react';
import { Shirt, Plus, Calendar as CalendarIcon } from 'lucide-react';

interface RentalHeaderProps {
    onAddItem: () => void;
    onNewBooking: () => void;
}

export const RentalHeader: React.FC<RentalHeaderProps> = ({ onAddItem, onNewBooking }) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                    <Shirt className="w-8 h-8 text-indigo-600" />
                    إدارة تأجير الملابس
                </h1>
                <p className="text-slate-500 mt-1">البدل الرجالي، فساتين الزفاف، والأزياء التنكرية</p>
            </div>
            <div className="flex gap-2">
                <button onClick={onAddItem} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-transform hover:-translate-y-0.5">
                    <Plus className="w-4 h-4" /> إضافة أصل جديد
                </button>
                <button onClick={onNewBooking} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-200 font-bold transition-transform hover:-translate-y-0.5">
                    <CalendarIcon className="w-4 h-4" /> حجز جديد
                </button>
            </div>
        </div>
    );
};
