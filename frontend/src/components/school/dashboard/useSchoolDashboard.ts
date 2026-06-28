import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { format } from 'date-fns';

export const useSchoolDashboard = () => {
  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  
  // 1. عدد الأطفال المسجلين
  const enrolledChildren = useLiveQuery(() => db.schoolStudents.where('status').equals('نشط').count()) || 0;
  
  // 2. عدد الحاضرين و 3. الغائبين و 4. المتأخرين
  const todayAttendance = useLiveQuery(async () => {
     return await db.schoolAttendanceList.where('date').equals(todayDateStr).toArray();
  }) || [];
  const presentCount = todayAttendance.filter(a => a.status === 'present').length;
  const absentCount = todayAttendance.filter(a => a.status === 'absent').length;
  const lateCount = todayAttendance.filter(a => a.status === 'late').length;

  // 5. & 6. التنبيهات الصحية
  const healthLogs = useLiveQuery(() => db.healthLogs.where('date').equals(todayDateStr).toArray()) || [];
  
  // اليوم إيرادات ومصروفات (ربط مالي فعلي)
  const todayJournals = useLiveQuery(() => db.journalEntries.where('date').equals(todayDateStr).toArray()) || [];
  let todayRevenue = 0;
  let todayExpenses = 0;
  
  todayJournals.forEach(entry => {
     entry.lines?.forEach(line => {
       if (line.description?.includes('ايراد') || entry.description?.includes('ايراد') || entry.description?.includes('دفع') || entry.description?.includes('سداد')) {
           if (line.credit > 0) todayRevenue += line.credit;
       }
       if (line.description?.includes('مصروف') || entry.description?.includes('مصروف')) {
           if (line.debit > 0) todayExpenses += line.debit;
       }
     });
  });

  // 7. أعياد الميلاد
  const students = useLiveQuery(() => db.schoolStudents.toArray()) || [];
  const todayMonth = todayDateStr.split('-')[1];
  const todayDay = todayDateStr.split('-')[2];
  
  const todayBirthdays = students.filter(s => {
    const dob = (s as any).dateOfBirth || s.birthDate;
    if (!dob) return false;
    const [, month, day] = dob.split('-');
    return month === todayMonth && day === todayDay;
  });

  // 8. اشتراكات أوشكت على الانتهاء
  const subscriptions = useLiveQuery(() => db.studentSubscriptions.toArray()) || [];
  const expiringSubscriptions = subscriptions.filter(sub => {
     if (!sub.endDate || sub.status !== 'active') return false;
     const diffTime = Math.abs(new Date(sub.endDate).getTime() - new Date().getTime());
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
     return diffDays <= 7 && new Date(sub.endDate) > new Date(); // Expiring within 7 days
  });

  // 9. المتأخرين في السداد (أقساط مستحقة)
  const payments = useLiveQuery(() => db.studentPayments.toArray()) || [];
  const latePayments = payments.filter((p: any) => p.status === 'late' || (p.dueDate && new Date(p.dueDate) < new Date() && p.status === 'pending'));

  // 10. موظفون غائبون
  const staffAttendance = useLiveQuery(() => db.attendance.where('date').equals(todayDateStr).toArray()) || [];
  const absentStaff = staffAttendance.filter((a: any) => a.status === 'absent' || a.status === 'leave');

  // 11. آخر عمليات مالية
  const latestFinancials = useLiveQuery(() => db.journalEntries.reverse().limit(5).toArray()) || [];

  // 12. آخر أطفال تم تسجيلهم
  const latestStudents = useLiveQuery(() => db.schoolStudents.reverse().limit(5).toArray()) || [];

  const chartData = [
    { name: 'يناير', value: 400 },
    { name: 'فبراير', value: 300 },
    { name: 'مارس', value: 600 },
    { name: 'أبريل', value: 800 },
    { name: 'مايو', value: 500 },
    { name: 'يونيو', value: Math.max(900, todayRevenue) }, // Dynamic mock tip
  ];

  const netToday = todayRevenue - todayExpenses;

  return {
    enrolledChildren,
    presentCount,
    absentCount,
    lateCount,
    healthLogs,
    todayRevenue,
    todayExpenses,
    todayBirthdays,
    expiringSubscriptions,
    latePayments,
    absentStaff,
    latestFinancials,
    latestStudents,
    chartData,
    netToday,
    students
  };
};
