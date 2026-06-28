import React from "react";
import { Clock, UserCheck } from "lucide-react";

interface TodayPickupLogProps {
  pickupLogs: any[];
  students: any[];
}

export const TodayPickupLog: React.FC<TodayPickupLogProps> = ({
  pickupLogs,
  students,
}) => {
  return (
    <div className="bg-slate-800 rounded-3xl p-6 text-white shadow-lg overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-8 -mt-8"></div>
      <h2 className="text-xl font-black mb-4 flex items-center gap-2 relative z-10">
        <Clock className="w-5 h-5 text-emerald-400" /> سجل استلام اليوم
      </h2>
      <div className="space-y-3 relative z-10 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {pickupLogs.length > 0 ? (
          pickupLogs.map((log) => {
            const logStudent = students.find((s) => s.id === log.studentId);
            return (
              <div
                key={log.id}
                className="bg-white/10 rounded-xl p-3 border border-white/10 flex flex-col gap-2"
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-emerald-300 text-sm">
                    {logStudent?.name}
                  </span>
                  <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded">
                    {log.time}
                  </span>
                </div>
                <div className="text-xs text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  المستلم: {log.pickupPersonName} ({log.relation})
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-slate-400 font-bold bg-white/5 rounded-2xl border border-white/5 border-dashed">
            لم يتم تسليم أي طفل اليوم بعد
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayPickupLog;
