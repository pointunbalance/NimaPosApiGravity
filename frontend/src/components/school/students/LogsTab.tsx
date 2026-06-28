import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { Clock } from 'lucide-react';

interface LogsTabProps {
  selectedChildId: number;
}

export const LogsTab: React.FC<LogsTabProps> = ({ selectedChildId }) => {
  const logsData = useLiveQuery(() => db.auditLogs.toArray())?.filter(l => l.recordId === selectedChildId && l.module === 'students') || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
         <Clock className="w-6 h-6 text-slate-600" />
         <h3 className="text-xl font-black text-slate-800">سجل عمليات الطفل</h3>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
         <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                 <th className="p-4 font-bold text-slate-600">التاريخ والوقت</th>
                 <th className="p-4 font-bold text-slate-600">المستخدم</th>
                 <th className="p-4 font-bold text-slate-600">نوع العملية</th>
                 <th className="p-4 font-bold text-slate-600">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logsData.length === 0 ? (
                 <tr><td colSpan={4} className="p-8 text-center text-slate-500">لا يوجد سجل عمليات لهذا الطفل</td></tr>
              ) : (
                 logsData.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono font-bold text-slate-600" dir="ltr">{new Date(log.timestamp).toLocaleString('en-GB')}</td>
                      <td className="p-4 font-bold text-slate-800">{log.userName || '-'}</td>
                      <td className="p-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-bold">{log.action || '-'}</span>
                      </td>
                      <td className="p-4 text-slate-600">{log.details || '-'}</td>
                    </tr>
                 ))
              )}
            </tbody>
         </table>
      </div>
    </div>
  );
};
