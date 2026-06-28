import React from 'react';
import { LockKeyhole, Download, Printer } from 'lucide-react';

interface ShiftHeaderProps {
  onExportCSV?: () => void;
  onPrintList?: () => void;
}

const ShiftHeader: React.FC<ShiftHeaderProps> = ({ onExportCSV, onPrintList }) => {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
      <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <LockKeyhole className="w-8 h-8 text-brand-600" />
              إدارة الصندوق (الورديات)
          </h1>
          <p className="text-gray-500">متابعة حركة النقد، المصروفات اليومية، وتقارير الإغلاق</p>
      </div>
      <div className="flex gap-2">
        {onPrintList && (
          <button 
            onClick={onPrintList}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" /> طباعة الأرشيف
          </button>
        )}
        {onExportCSV && (
          <button 
            onClick={onExportCSV}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> تصدير CSV
          </button>
        )}
      </div>
    </div>
  );
};

export default ShiftHeader;
