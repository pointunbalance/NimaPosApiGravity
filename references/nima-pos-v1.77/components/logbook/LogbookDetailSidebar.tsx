import React from 'react';
import { LogEntry } from '../../types';
import { X, Copy } from 'lucide-react';
import { getLogTypeLabel, formatCurrency } from './logbookUtils';

interface LogbookDetailSidebarProps {
  selectedLog: LogEntry;
  onClose: () => void;
}

const LogbookDetailSidebar: React.FC<LogbookDetailSidebarProps> = ({ selectedLog, onClose }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('تم النسخ');
  };

  return (
    <div className="w-full lg:w-[35%] bg-white border-r border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-300 relative z-20">
      {/* Drawer Header */}
      <div className="bg-slate-900 text-white p-6 relative shrink-0">
        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2 text-indigo-300 font-mono text-xs">
            <span>#{selectedLog.id}</span>
            <span>•</span>
            <span>{new Date(selectedLog.date).toLocaleString()}</span>
          </div>
          <h2 className="text-2xl font-bold leading-tight">{selectedLog.action}</h2>
          
          <div className="flex items-center gap-2 mt-4">
            <span className={`px-2 py-1 rounded text-xs font-bold bg-white/10 text-white border border-white/20`}>
              {getLogTypeLabel(selectedLog.type)}
            </span>
            {selectedLog.status === 'error' && (
              <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">فشل العملية</span>
            )}
          </div>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
        
        {/* Main Details */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">التفاصيل</h4>
          <p className="text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
            {selectedLog.details || 'لا توجد تفاصيل إضافية'}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-400 font-bold mb-1">المستخدم</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                {selectedLog.user.substring(0,1)}
              </div>
              <span className="text-sm font-bold text-slate-800">{selectedLog.user}</span>
            </div>
          </div>
          
          {selectedLog.amount ? (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-400 font-bold mb-1">القيمة المالية</p>
              <span className="text-lg font-black text-emerald-600">{formatCurrency(selectedLog.amount)}</span>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm opacity-50">
              <p className="text-xs text-slate-400 font-bold mb-1">القيمة المالية</p>
              <span className="text-sm text-gray-400">-</span>
            </div>
          )}
        </div>

        {/* Reference ID */}
        {selectedLog.referenceId && (
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-xs text-indigo-400 font-bold mb-1">المعرف المرجعي (Ref ID)</p>
              <p className="font-mono text-indigo-700 font-bold">#{selectedLog.referenceId}</p>
            </div>
            <button 
              onClick={() => copyToClipboard(selectedLog.referenceId!.toString())}
              className="p-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors shadow-sm"
              title="نسخ"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Technical Info (JSON Parse Attempt) */}
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 font-mono">RAW DATA (SYSTEM)</p>
          <div className="text-[10px] font-mono text-slate-600 break-all">
            LOG_ID: {selectedLog.id}<br/>
            TS: {new Date(selectedLog.date).getTime()}<br/>
            TYPE: {selectedLog.type.toUpperCase()}<br/>
            STATUS: {selectedLog.status.toUpperCase()}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LogbookDetailSidebar;
