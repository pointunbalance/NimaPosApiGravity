import React from 'react';
import { History, CheckCircle, MessageCircle, Smartphone, Bell } from 'lucide-react';

interface CommunicationLogsTabProps {
  logs: any[];
  students: any[];
  templates: any[];
}

export const CommunicationLogsTab: React.FC<CommunicationLogsTabProps> = ({
  logs,
  students,
  templates,
}) => {
  return (
    <div className="p-6 animate-in fade-in duration-300">
      <div className="mb-6 flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" /> التقرير الشامل للمراسلات
        </h3>
        <span className="text-sm font-bold text-slate-500">إجمالي الرسائل: {logs.length}</span>
      </div>
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-right">
            <tr>
              <th className="px-4 py-3 font-bold text-slate-600">التاريخ والوقت</th>
              <th className="px-4 py-3 font-bold text-slate-600">الطالب</th>
              <th className="px-4 py-3 font-bold text-slate-600">القناة</th>
              <th className="px-4 py-3 font-bold text-slate-600">النوعية</th>
              <th className="px-4 py-3 font-bold text-slate-600">محتوى الرسالة</th>
              <th className="px-4 py-3 font-bold text-slate-600">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-medium">
            {logs
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                    {new Date(log.date).toLocaleString('ar-EG')}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {students.find((s) => s.id === log.studentId)?.name || 'طالب محذوف'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {log.channel === 'whatsapp' && <MessageCircle className="w-4 h-4 text-[#25D366]" />}
                      {log.channel === 'sms' && <Smartphone className="w-4 h-4 text-sky-500" />}
                      {log.channel === 'app' && <Bell className="w-4 h-4 text-indigo-500" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {templates.find((t) => t.id === log.type)?.name || 'رسالة مخصصة'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={log.messageContent}>
                    {log.messageContent}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold w-fit">
                      <CheckCircle className="w-3 h-3" /> تم الإرسال
                    </span>
                  </td>
                </tr>
              ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">
                  لا توجد سجلات مراسلات مسجلة.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommunicationLogsTab;
