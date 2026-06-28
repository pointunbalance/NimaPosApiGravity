import { db } from '../../db';
import { Attendance as AttendanceType } from '../../types';

export const useAttendanceActions = (
  selectedDate: string,
  attendanceData: any[],
  getUserActiveShift: (userId: number) => any,
  labels: { employeeLabel: string; employeeRoleLabel: string; employeeLabelPlural: string },
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void
) => {
  const handleStatusChange = async (userId: number, status: AttendanceType['status']) => {
    try {
      const selectedDateObj = new Date(selectedDate);
      const userLeaves = await db.leaveRequests
        .where('userId')
        .equals(userId)
        .filter((l) => l.status === 'approved')
        .toArray();

      const hasApprovedLeave = userLeaves.some((l) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        selectedDateObj.setHours(12, 0, 0, 0);
        return selectedDateObj >= start && selectedDateObj <= end;
      });

      if (hasApprovedLeave && status !== 'excused' && status !== 'absent') {
        showToast('لا يمكن تسجيل حضور للموظف حيث أنه في إجازة معتمدة', 'warning');
        return;
      }

      const existingRecord = await db.attendance.where({ userId, date: selectedDate }).first();
      
      if (existingRecord) {
        await db.attendance.update(existingRecord.id!, { status });
      } else {
        await db.attendance.add({
          userId,
          date: selectedDate,
          status,
        });
      }
      showToast('تم تحديث حالة الحضور بنجاح', 'success');
    } catch (error) {
      console.error('Error updating attendance:', error);
      showToast('حدث خطأ أثناء التحديث', 'error');
    }
  };

  const handleTimeChange = async (userId: number, field: 'checkInTime' | 'checkOutTime', value: string) => {
    try {
      const selectedDateObj = new Date(selectedDate);
      const userLeaves = await db.leaveRequests
        .where('userId')
        .equals(userId)
        .filter((l) => l.status === 'approved')
        .toArray();
      
      const hasApprovedLeave = userLeaves.some((l) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        selectedDateObj.setHours(12, 0, 0, 0);
        return selectedDateObj >= start && selectedDateObj <= end;
      });

      if (hasApprovedLeave) {
        showToast('لا يمكن تسجيل وقت للموظف حيث أنه في إجازة معتمدة', 'warning');
        return;
      }

      const existingRecord = await db.attendance.where({ userId, date: selectedDate }).first();
      
      if (existingRecord) {
        let newStatus = existingRecord.status;
        if (field === 'checkInTime' && value) {
          const shift = getUserActiveShift(userId);
          
          if (shift && shift !== 'off') {
            const [shiftHours, shiftMinutes] = shift.startTime.split(':').map(Number);
            const [inHours, inMinutes] = value.split(':').map(Number);
            
            const shiftTimeValue = shiftHours * 60 + shiftMinutes;
            const inTimeValue = inHours * 60 + inMinutes;
            
            if (inTimeValue > shiftTimeValue + (shift.gracePeriodMinutes || 0)) {
              newStatus = 'late';
            } else if (newStatus === 'absent' || newStatus === 'late') {
              newStatus = 'present';
            }
          } else {
            newStatus = 'present';
          }
        }
        await db.attendance.update(existingRecord.id!, { 
          [field]: value || undefined,
          ...(field === 'checkInTime' && value ? { status: newStatus } : {}),
        });
      } else {
        let initialStatus = 'present' as AttendanceType['status'];
        if (field === 'checkInTime' && value) {
          const shift = getUserActiveShift(userId);
          
          if (shift && shift !== 'off') {
            const [shiftHours, shiftMinutes] = shift.startTime.split(':').map(Number);
            const [inHours, inMinutes] = value.split(':').map(Number);
            
            const shiftTimeValue = shiftHours * 60 + shiftMinutes;
            const inTimeValue = inHours * 60 + inMinutes;
            
            if (inTimeValue > shiftTimeValue + (shift.gracePeriodMinutes || 0)) {
              initialStatus = 'late';
            }
          }
        }
        await db.attendance.add({
          userId,
          date: selectedDate,
          status: initialStatus,
          [field]: value || undefined,
        });
      }
    } catch (error) {
      console.error('Error updating time:', error);
      showToast('حدث خطأ أثناء التحديث', 'error');
    }
  };

  const handleNotesChange = async (userId: number, notes: string) => {
    try {
      const existingRecord = await db.attendance.where({ userId, date: selectedDate }).first();
      
      if (existingRecord) {
        await db.attendance.update(existingRecord.id!, { notes });
      } else {
        await db.attendance.add({
          userId,
          date: selectedDate,
          status: 'absent',
          notes,
        });
      }
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const handleExport = () => {
    if (!attendanceData || attendanceData.length === 0) return;
    
    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'present': return 'حاضر';
        case 'absent': return 'غائب';
        case 'late': return 'متأخر';
        case 'excused': return 'مجاز';
        default: return 'غير محدد';
      }
    };

    const headers = [labels.employeeLabel, labels.employeeRoleLabel, 'الحالة', 'وقت الحضور', 'وقت الانصراف', 'ملاحظات'];
    const csvContent = [
      headers.join(','),
      ...attendanceData.map(({ user, record }) => {
        return [
          `"${user.name}"`,
          `"${user.jobTitle || ''}"`,
          `"${getStatusLabel(record.status)}"`,
          `"${record.checkInTime || ''}"`,
          `"${record.checkOutTime || ''}"`,
          `"${(record.notes || '').replace(/"/g, '""')}"`,
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    handleStatusChange,
    handleTimeChange,
    handleNotesChange,
    handleExport,
  };
};
