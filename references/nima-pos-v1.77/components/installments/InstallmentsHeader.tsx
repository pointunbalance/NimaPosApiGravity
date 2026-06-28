import React from 'react';
import { CalendarClock, Plus } from 'lucide-react';

interface InstallmentsHeaderProps {
  onOpenNewModal: () => void;
}

const InstallmentsHeader: React.FC<InstallmentsHeaderProps> = ({ onOpenNewModal }) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarClock className="w-6 h-6 text-brand-500" />
          إدارة الأقساط والتمويل
        </h1>
        <p className="text-slate-500 text-sm mt-1">تتبع وجدولة مديونيات العملاء، الفوائد، وغرامات التأخير</p>
      </div>
      <button
        onClick={onOpenNewModal}
        className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-brand-700 transition-colors font-bold shadow-sm"
      >
        <Plus className="w-5 h-5" />
        خطة أقساط جديدة
      </button>
    </div>
  );
};

export default InstallmentsHeader;
