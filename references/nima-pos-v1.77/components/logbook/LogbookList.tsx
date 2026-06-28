import React from 'react';
import { LogEntry } from '../../types';
import { XCircle, AlertTriangle, ArrowUpRight, ArrowDownRight, Calendar, ChevronRight } from 'lucide-react';
import { getLogColorStyle, getLogIcon, getLogTypeLabel, formatCurrency } from './logbookUtils';

interface LogbookListProps {
  logs: LogEntry[];
  selectedLog: LogEntry | null;
  onSelectLog: (log: LogEntry) => void;
}

const LogbookList: React.FC<LogbookListProps> = ({ logs, selectedLog, onSelectLog }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full text-sm text-right">
        <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 w-[250px]">العملية</th>
            <th className="px-6 py-4">التفاصيل</th>
            <th className="px-6 py-4 w-[150px]">القيمة</th>
            <th className="px-6 py-4 w-[200px]">المستخدم / الوقت</th>
            <th className="px-6 py-4 w-[50px]"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map(log => {
            const isError = log.status === 'error';
            const isSelected = selectedLog?.id === log.id;
            return (
              <tr 
                key={log.id} 
                onClick={() => onSelectLog(log)}
                className={`group transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50 hover:bg-indigo-100' : isError ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-gray-50'}`}
              >
                <td className="px-6 py-4 align-top">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border shrink-0 mt-1 ${getLogColorStyle(log.type, log.status)}`}>
                      {isError ? <XCircle className="w-4 h-4" /> : getLogIcon(log.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-base ${isError ? 'text-red-700' : 'text-gray-800'}`}>{log.action}</p>
                        {log.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {getLogTypeLabel(log.type)}
                        </span>
                        {log.referenceId && (
                          <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            REF: {log.referenceId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <p className={`text-sm leading-relaxed line-clamp-2 ${isError ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                    {log.details || '-'}
                  </p>
                </td>
                <td className="px-6 py-4 align-top">
                  {log.amount ? (
                    <div className={`font-bold text-base flex items-center gap-1 ${
                      ['sale', 'payment', 'adjustment'].includes(log.type) ? 'text-emerald-600' :
                      ['expense', 'purchase', 'refund'].includes(log.type) ? 'text-red-600' : 'text-gray-700'
                    }`}>
                      {formatCurrency(log.amount)}
                      {['sale', 'payment'].includes(log.type) ? <ArrowUpRight className="w-3 h-3" /> : ['expense', 'purchase'].includes(log.type) ? <ArrowDownRight className="w-3 h-3" /> : null}
                    </div>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-200">
                        {log.user.substring(0, 1).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{log.user}</span>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 font-mono mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(log.date).toLocaleDateString()} 
                      <span className="mx-1">•</span>
                      {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 align-middle">
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LogbookList;
