import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { User } from '../../types';
import { CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface AttendanceTabProps {
  user: User;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({ user }) => {
  const { showToast } = useToast();

  const myAttendance = useLiveQuery(() => {
    if (!user?.id) return [];
    return db.attendance.where('userId').equals(user.id).toArray();
  }, [user?.id]);

  const handleCheckIn = async () => {
    if (!user?.id) return;
    const today = new Date().toISOString().split('T')[0];
    const existing = await db.attendance.where({ userId: user.id, date: today }).first();
    
    // Check if user has an approved leave for current date
    const selectedDateObj = new Date(today);
    const userLeaves = await db.leaveRequests
      .where('userId').equals(user.id)
      .filter(l => l.status === 'approved')
      .toArray();

    const hasApprovedLeave = userLeaves.some(l => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      selectedDateObj.setHours(12,0,0,0);
      return selectedDateObj >= start && selectedDateObj <= end;
    });

    if (hasApprovedLeave) {
      showToast('لا يمكنك تسجيل الحضور نظراً لوجود إجازة معتمدة لهذا اليوم', 'warning');
      return;
    }

    if (existing) {
      showToast('لقد قمت بتسجيل الحضور اليوم بالفعل', 'error');
      return;
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    await db.attendance.add({
      userId: user.id,
      date: today,
      checkInTime: timeString,
      status: 'present'
    });
    showToast('تم تسجيل الحضور بنجاح', 'success');
  };

  const handleCheckOut = async () => {
    if (!user?.id) return;
    const today = new Date().toISOString().split('T')[0];
    const existing = await db.attendance.where({ userId: user.id, date: today }).first();
    
    if (!existing) {
      showToast('يجب تسجيل الحضور أولاً', 'error');
      return;
    }

    if (existing.checkOutTime) {
      showToast('لقد قمت بتسجيل الانصراف اليوم بالفعل', 'error');
      return;
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    await db.attendance.update(existing.id!, {
      checkOutTime: timeString
    });
    showToast('تم تسجيل الانصراف بنجاح', 'success');
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800">سجل الحضور والانصراف</h2>
          <p className="text-sm text-gray-500">متابعة أوقات العمل الخاصة بك</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCheckIn}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            تسجيل حضور
          </button>
          <button
            onClick={handleCheckOut}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            تسجيل انصراف
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">التاريخ</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">وقت الحضور</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">وقت الانصراف</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">الحالة</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">ملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {myAttendance?.map(record => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{new Date(record.date).toLocaleDateString('ar-EG')}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{record.checkInTime || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{record.checkOutTime || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-col gap-1 items-start">
                    {record.status === 'present' && <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs">حاضر</span>}
                    {record.status === 'absent' && <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">غائب</span>}
                    {record.status === 'late' && <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">متأخر</span>}
                    {record.status === 'excused' && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">مستأذن</span>}
                    {record.lateMinutes ? <span className="text-xs text-rose-500 font-medium">تأخير: {record.lateMinutes} دقيقة</span> : null}
                    {record.earlyLeaveMinutes ? <span className="text-xs text-rose-500 font-medium">خروج مبكر: {record.earlyLeaveMinutes} دقيقة</span> : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{record.notes || '-'}</td>
              </tr>
            ))}
            {myAttendance?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">لا توجد سجلات حضور وانصراف</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
