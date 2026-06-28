import React from 'react';
import { Activity, Cake, CreditCard } from 'lucide-react';

interface AlertsPanelProps {
  healthLogs: any[];
  todayBirthdays: any[];
  expiringSubscriptions: any[];
  students: any[];
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  healthLogs,
  todayBirthdays,
  expiringSubscriptions,
  students,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Clinic Alerts */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-rose-500" />
          تنبيهات العيادة اليوم
        </h3>
        {healthLogs.length === 0 ? (
          <div className="text-center py-2 text-slate-400 font-medium">
            لا توجد حالات مسجلة اليوم
          </div>
        ) : (
          <ul className="space-y-3">
            {healthLogs.slice(0, 3).map((log: any, idx) => (
              <li
                key={idx}
                className="flex justify-between items-center text-sm border-b border-slate-50 last:border-0 pb-2"
              >
                <span className="font-bold text-slate-700">{log.reason}</span>
                <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-xs">
                  {students.find((s) => s.id === log.studentId)?.name || 'طالب'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Birthdays */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
          <Cake className="w-5 h-5 text-fuchsia-500" />
          أعياد ميلاد اليوم
        </h3>
        {todayBirthdays.length === 0 ? (
          <div className="text-center py-2 text-slate-400 font-medium">
            لا توجد أعياد ميلاد اليوم
          </div>
        ) : (
          <ul className="space-y-2">
            {todayBirthdays.map((student, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <div className="w-6 h-6 rounded-full bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center">
                  🎈
                </div>
                {student.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Expiring Subscriptions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-500" />
          اشتراكات أوشكت على الانتهاء
        </h3>
        {expiringSubscriptions.length === 0 ? (
          <div className="text-center py-2 text-slate-400 font-medium">
            لا توجد اشتراكات قاربت الانتهاء
          </div>
        ) : (
          <ul className="space-y-2">
            {expiringSubscriptions.slice(0, 3).map((sub: any, idx) => (
              <li
                key={idx}
                className="flex justify-between text-sm items-center border-b border-slate-50 pb-2 last:border-0"
              >
                <span className="font-bold text-slate-700">
                  {students.find((s) => s.id === sub.studentId)?.name || 'طالب'}
                </span>
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                  {sub.endDate}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
