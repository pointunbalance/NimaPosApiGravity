import React from 'react';
import { CalendarDays } from 'lucide-react';
import { User, WorkShift, RosterAssignment } from '../../types';

interface RosterTableProps {
  users: User[];
  workShifts: WorkShift[];
  rosterAssignments: RosterAssignment[];
  weekDays: string[];
  daysOfWeek: string[];
  rosterWeekStart: string;
  setRosterWeekStart: (date: string) => void;
  onUpdateRoster: (userId: number, dateStr: string, shiftId: number | 'off' | 'default') => Promise<void>;
}

export const RosterTable: React.FC<RosterTableProps> = ({
  users,
  workShifts,
  rosterAssignments,
  weekDays,
  daysOfWeek,
  rosterWeekStart,
  setRosterWeekStart,
  onUpdateRoster,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 border-b border-slate-200 gap-2">
        <h2 className="font-bold flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-indigo-600" />
          أسبوع العمل
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="date"
            className="bg-white border text-sm border-slate-300 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none w-full sm:w-auto"
            value={rosterWeekStart}
            onChange={(e) => {
              const d = new Date(e.target.value);
              d.setDate(d.getDate() - d.getDay()); // Always start at Sunday
              setRosterWeekStart(d.toISOString().split('T')[0]);
            }}
          />
          <button
            onClick={() => {
              const d = new Date(rosterWeekStart);
              d.setDate(d.getDate() + 7);
              setRosterWeekStart(d.toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap"
          >
            الأسبوع التالي
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right align-middle">
          <thead>
            <tr className="bg-slate-100/50 border-b border-slate-200">
              <th className="p-4 font-semibold text-slate-600 w-48">الموظف</th>
              {weekDays.map((date) => {
                const d = new Date(date);
                return (
                  <th key={date} className="p-4 font-semibold text-slate-600 min-w-[140px]">
                    <div className="text-xs text-slate-400 mb-1">{daysOfWeek[d.getDay()]}</div>
                    <div>{d.toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' })}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                <td className="p-4">
                  <div className="font-bold text-slate-800">{user.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{user.jobTitle || 'موظف'}</div>
                </td>
                {weekDays.map((date) => {
                  const assignment = rosterAssignments.find(
                    (r) => r.userId === user.id && r.date === date
                  );

                  let activeValue: number | 'off' | 'default' = 'default';
                  if (assignment) {
                    if (assignment.isDayOff) activeValue = 'off';
                    else if (assignment.workShiftId) activeValue = assignment.workShiftId;
                  }

                  // Check if default is a day off for this user's base shift
                  let defaultIsOff = false;
                  let baseShiftName = 'بدون وردية';
                  if (user.workShiftId) {
                    const shift = workShifts.find((s) => s.id === user.workShiftId);
                    if (shift) {
                      baseShiftName = shift.name;
                      const dayIndex = new Date(date).getDay();
                      if (shift.daysOff?.includes(dayIndex)) {
                        defaultIsOff = true;
                      }
                    }
                  }

                  return (
                    <td key={date} className="p-2 border-r border-slate-100">
                      <select
                        value={activeValue}
                        onChange={(e) =>
                          onUpdateRoster(
                            user.id!,
                            date,
                            e.target.value === 'default'
                              ? 'default'
                              : e.target.value === 'off'
                              ? 'off'
                              : Number(e.target.value)
                          )
                        }
                        className={`w-full text-xs p-2 rounded border focus:ring-1 focus:ring-indigo-500 outline-none transition-colors ${
                          activeValue === 'off'
                            ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                            : activeValue !== 'default'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                            : defaultIsOff
                            ? 'bg-slate-100 border-slate-200 text-slate-400'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <option value="default">
                          {defaultIsOff ? 'عطلة (أصلي)' : `أساسي (${baseShiftName})`}
                        </option>
                        <option value="off">يوم راحة (Off)</option>
                        {workShifts.map((ws) => (
                          <option key={ws.id} value={ws.id}>
                            {ws.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default RosterTable;
