import React from 'react';
import { UserCircle, CheckCircle2, XCircle, Clock3, AlertCircle, Eye } from 'lucide-react';
import { Attendance as AttendanceType, User } from '../../types';

interface AttendanceData {
  user: User;
  record: {
    userId: number;
    date: string;
    status: AttendanceType['status'];
    checkInTime?: string;
    checkOutTime?: string;
    notes?: string;
    photoIn?: string;
    photoOut?: string;
    lateMinutes?: number;
    earlyLeaveMinutes?: number;
  };
}

interface AttendanceTableProps {
  attendanceData: AttendanceData[];
  handleStatusChange: (userId: number, status: AttendanceType['status']) => void;
  handleTimeChange: (userId: number, field: 'checkInTime' | 'checkOutTime', value: string) => void;
  handleNotesChange: (userId: number, notes: string) => void;
  onViewHistory: (user: User) => void;
  employeeLabel?: string;
  employeeRoleLabel?: string;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  attendanceData,
  handleStatusChange,
  handleTimeChange,
  handleNotesChange,
  onViewHistory,
  employeeLabel = 'الموظف',
  employeeRoleLabel = 'المسمى الوظيفي'
}) => {
  const getStatusBadge = (status: AttendanceType['status']) => {
    switch (status) {
      case 'present': return { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'حاضر' };
      case 'absent': return { icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200', label: 'غائب' };
      case 'late': return { icon: Clock3, color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'متأخر' };
      case 'excused': return { icon: AlertCircle, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'مجاز' };
      default: return { icon: XCircle, color: 'text-slate-600 bg-slate-50 border-slate-200', label: 'غير محدد' };
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-slate-600 font-bold text-sm">{employeeLabel}</th>
              <th className="px-6 py-4 text-slate-600 font-bold text-sm">الحالة</th>
              <th className="px-6 py-4 text-slate-600 font-bold text-sm">وقت الحضور</th>
              <th className="px-6 py-4 text-slate-600 font-bold text-sm">وقت الانصراف</th>
              <th className="px-6 py-4 text-slate-600 font-bold text-sm">ملاحظات</th>
              <th className="px-6 py-4 text-slate-600 font-bold text-sm print:hidden">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {attendanceData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  <UserCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  لا يوجد {employeeLabel} لعرضه.
                </td>
              </tr>
            ) : (
              attendanceData.map(({ user, record }) => {
                const badge = getStatusBadge(record.status);
                
                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.jobTitle || employeeLabel}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={record.status}
                        onChange={(e) => handleStatusChange(user.id!, e.target.value as any)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium outline-none cursor-pointer appearance-none ${badge.color} `}
                        style={{ backgroundImage: 'none' }}
                      >
                        <option value="present">حاضر</option>
                        <option value="absent">غائب</option>
                        <option value="late">متأخر</option>
                        <option value="excused">مجاز</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <input 
                            type="time" 
                            value={record.checkInTime || ''}
                            onChange={(e) => handleTimeChange(user.id!, 'checkInTime', e.target.value)}
                            disabled={record.status === 'absent' || record.status === 'excused'}
                            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          {record.photoIn && (
                            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 overflow-hidden shadow-sm flex-shrink-0 cursor-pointer" title="تم توثيق الدخول بالأنظمة البيومترية" onClick={() => {
                                const win = window.open();
                                if(win) win.document.write(`<img src="${record.photoIn}" style="max-width:100%;height:auto;"/>`);
                            }}>
                              <img src={record.photoIn} alt="بصمة دخول" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                        {record.lateMinutes ? (
                           <span className="text-xs text-rose-500 font-medium">تأخير {record.lateMinutes} دقيقة</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <input 
                            type="time" 
                            value={record.checkOutTime || ''}
                            onChange={(e) => handleTimeChange(user.id!, 'checkOutTime', e.target.value)}
                            disabled={record.status === 'absent' || record.status === 'excused'}
                            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          {record.photoOut && (
                            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 overflow-hidden shadow-sm flex-shrink-0 cursor-pointer" title="تم توثيق الخروج بالأنظمة البيومترية" onClick={() => {
                                const win = window.open();
                                if(win) win.document.write(`<img src="${record.photoOut}" style="max-width:100%;height:auto;"/>`);
                            }}>
                              <img src={record.photoOut} alt="بصمة خروج" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                        {record.earlyLeaveMinutes ? (
                           <span className="text-xs text-rose-500 font-medium">مغادرة مبكرة {record.earlyLeaveMinutes} دقيقة</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="إضافة ملاحظة..."
                          defaultValue={record.notes || ''}
                          onBlur={(e) => handleNotesChange(user.id!, e.target.value)}
                          className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-brand-500 px-2 py-1 text-sm outline-none transition-colors text-slate-800"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 print:hidden">
                      <button 
                        onClick={() => onViewHistory(user)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="عرض السجل"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;
