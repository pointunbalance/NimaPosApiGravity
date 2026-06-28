import React from 'react';
import { Video, Camera as CameraIcon } from 'lucide-react';

interface StudioHeaderProps {
  onShowCameras: () => void;
  onAddBooking: () => void;
}

const StudioHeader: React.FC<StudioHeaderProps> = ({ onShowCameras, onAddBooking }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <Video className="w-8 h-8 text-indigo-600" />
          جدول حجوزات الاستوديو
        </h1>
        <p className="text-slate-500 mt-1">إدارة الكاميرات، مواعيد التصوير، والتفاصيل المالية</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onShowCameras}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <CameraIcon className="w-4 h-4" /> الكاميرات
        </button>
        <button
          onClick={onAddBooking}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
        >
          <Video className="w-4 h-4" /> حجز جديد
        </button>
      </div>
    </div>
  );
};

export default StudioHeader;
