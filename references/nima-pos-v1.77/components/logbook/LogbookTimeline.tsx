import React from 'react';
import { LogEntry } from '../../types';
import { User } from 'lucide-react';
import { getLogColorStyle, getLogTypeLabel, formatCurrency } from './logbookUtils';

interface LogbookTimelineProps {
  logs: LogEntry[];
  selectedLog: LogEntry | null;
  onSelectLog: (log: LogEntry) => void;
}

const LogbookTimeline: React.FC<LogbookTimelineProps> = ({ logs, selectedLog, onSelectLog }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pl-4 border-r-2 border-indigo-100 mr-8 relative">
      {logs.map((log, idx) => {
        const isError = log.status === 'error';
        const logDate = new Date(log.date);
        const prevLog = logs[idx - 1];
        const showDateHeader = !prevLog || new Date(prevLog.date).toDateString() !== logDate.toDateString();

        return (
          <div key={log.id} className="relative">
            {showDateHeader && (
              <div className="absolute -right-[4.5rem] top-[-2rem] bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200 shadow-sm z-10">
                {logDate.toLocaleDateString()}
              </div>
            )}
            
            {/* Timeline Dot */}
            <div className={`absolute -right-[11px] top-4 w-5 h-5 rounded-full border-4 border-[#f3f4f6] ${isError ? 'bg-red-500' : 'bg-indigo-500'} z-10`}></div>

            <div 
              onClick={() => onSelectLog(log)}
              className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${selectedLog?.id === log.id ? 'border-indigo-500 shadow-md' : 'border-gray-200 hover:border-indigo-300'} ${isError ? 'border-l-4 border-l-red-500' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                    {logDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </span>
                  <h3 className={`font-bold text-lg ${isError ? 'text-red-700' : 'text-gray-800'}`}>{log.action}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-lg font-bold border ${getLogColorStyle(log.type)}`}>
                    {getLogTypeLabel(log.type)}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 leading-relaxed">{log.details}</p>
              
              <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <User className="w-3.5 h-3.5" />
                  <span className="font-bold">{log.user}</span>
                </div>
                {log.amount ? (
                  <span className="font-bold text-sm text-gray-800">{formatCurrency(log.amount)}</span>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LogbookTimeline;
