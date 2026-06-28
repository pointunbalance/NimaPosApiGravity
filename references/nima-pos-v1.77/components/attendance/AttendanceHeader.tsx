import React from 'react';
import { Clock, Calendar, MonitorPlay } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AttendanceHeaderProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  title?: string;
  subtitle?: string;
}

const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({ selectedDate, setSelectedDate, title = 'الحضور والانصراف', subtitle = 'تتبع ساعات عمل الموظفين وتسجيل الحضور اليومي' }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-6 h-6 text-brand-500" />
          {title}
        </h1>
        <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
      </div>
      
      <div className="flex items-center gap-3 w-full md:w-auto">
        <Link 
          to="/attendance-terminal" 
          target="_blank"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <MonitorPlay className="w-4 h-4" />
          <span>شاشة البصمة (Kiosk)</span>
        </Link>
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
          <Calendar className="w-5 h-5 text-slate-400 ml-2" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none outline-none text-slate-700 font-medium cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeader;
