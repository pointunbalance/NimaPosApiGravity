import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Attendance as AttendanceType, User } from '../../types';

export const useAttendanceData = (department?: string) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceType['status']>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const users = useLiveQuery(() => {
    if (department) {
      return db.users.filter((u) => u.department === department).toArray();
    }
    return db.users.toArray();
  }, [department]) || [];

  const attendances = useLiveQuery(
    () => db.attendance.where('date').equals(selectedDate).toArray(),
    [selectedDate]
  ) || [];

  const workShifts = useLiveQuery(() => db.workShifts.toArray(), []) || [];
  
  const rosterAssignments = useLiveQuery(
    () => db.rosterAssignments.where('date').equals(selectedDate).toArray(),
    [selectedDate]
  ) || [];

  const getUserActiveShift = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return null;
    
    const rosterAssn = rosterAssignments.find((r) => r.userId === userId);
    if (rosterAssn) {
      if (rosterAssn.isDayOff) return 'off';
      if (rosterAssn.workShiftId) {
        return workShifts.find((ws) => ws.id === rosterAssn.workShiftId);
      }
    }
    
    // Default fallback
    if (user.workShiftId) {
      const shift = workShifts.find((ws) => ws.id === user.workShiftId);
      if (shift) {
        const dayIndex = new Date(selectedDate).getDay();
        if (shift.daysOff?.includes(dayIndex)) {
          return 'off';
        }
        return shift;
      }
    }
    return null;
  };

  const userHistory = useLiveQuery(
    () => (selectedUser ? db.attendance.where('userId').equals(selectedUser.id!).reverse().toArray() : []),
    [selectedUser]
  );

  const activeUsers = useMemo(() => users.filter((u) => u.isActive), [users]);

  // Merge users with their attendance record for the selected date
  const attendanceData = useMemo(() => {
    return activeUsers
      .map((user) => {
        const record = attendances.find((a) => a.userId === user.id);
        return {
          user,
          record: record || {
            userId: user.id!,
            date: selectedDate,
            status: 'absent' as const,
          },
        };
      })
      .filter((item) => {
        const matchesSearch =
          item.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.user.jobTitle && item.user.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || item.record.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
  }, [activeUsers, attendances, selectedDate, searchTerm, statusFilter]);

  const getDepartmentLabels = () => {
    switch (department) {
      case 'school':
        return {
          employeeLabel: 'طاقم التدريس/الموظف',
          employeeRoleLabel: 'المسمى الوظيفي',
          employeeLabelPlural: 'الطاقم',
        };
      case 'garage':
        return {
          employeeLabel: 'الفني/العامل',
          employeeRoleLabel: 'التخصص',
          employeeLabelPlural: 'الفنيين',
        };
      case 'gym':
        return {
          employeeLabel: 'المدرب/الموظف',
          employeeRoleLabel: 'التخصص',
          employeeLabelPlural: 'المدربين',
        };
      case 'hotel':
        return {
          employeeLabel: 'الموظف/العامل',
          employeeRoleLabel: 'القسم',
          employeeLabelPlural: 'الموظفين',
        };
      case 'clinics':
        return {
          employeeLabel: 'الطبيب/الممرض',
          employeeRoleLabel: 'التخصص',
          employeeLabelPlural: 'الطاقم الطبي',
        };
      case 'legal':
        return {
          employeeLabel: 'المحامي/المستشار',
          employeeRoleLabel: 'التخصص',
          employeeLabelPlural: 'المحامين',
        };
      case 'manufacturing':
        return {
          employeeLabel: 'العامل/الفني',
          employeeRoleLabel: 'القسم',
          employeeLabelPlural: 'العمال',
        };
      case 'restaurant':
        return {
          employeeLabel: 'الطاهي/الويتر',
          employeeRoleLabel: 'القسم',
          employeeLabelPlural: 'العاملين',
        };
      case 'realestate':
        return {
          employeeLabel: 'الموظف/الوسيط',
          employeeRoleLabel: 'القسم',
          employeeLabelPlural: 'الموظفين/الوسطاء',
        };
      default:
        return {
          employeeLabel: 'الموظف',
          employeeRoleLabel: 'المسمى الوظيفي',
          employeeLabelPlural: 'الموظفين',
        };
    }
  };

  const labels = getDepartmentLabels();

  return {
    selectedDate,
    setSelectedDate,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedUser,
    setSelectedUser,
    users,
    attendances,
    workShifts,
    rosterAssignments,
    getUserActiveShift,
    userHistory,
    attendanceData,
    labels,
  };
};
