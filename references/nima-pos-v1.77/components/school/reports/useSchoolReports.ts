import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { logActivity } from '../../../utils/logger';
import { 
  Users, GraduationCap, Briefcase, Calendar, Clock, AlertTriangle, 
  CheckCircle, Wallet, TrendingUp, TrendingDown, HeartPulse 
} from 'lucide-react';

export const reportsList = [
  { id: 'students', name: 'تقرير الأطفال', category: 'الطلاب', icon: Users },
  { id: 'students_level', name: 'تقرير الأطفال حسب المستوى', category: 'الطلاب', icon: GraduationCap },
  { id: 'students_class', name: 'تقرير الأطفال حسب الفصل', category: 'الطلاب', icon: Briefcase },
  { id: 'withdrawn', name: 'تقرير الأطفال المنسحبين', category: 'الطلاب', icon: Users },
  { id: 'birthdays', name: 'تقرير أعياد الميلاد', category: 'الطلاب', icon: Calendar },
  { id: 'attendance_daily', name: 'تقرير الحضور اليومي', category: 'الحضور والمتابعة', icon: Clock },
  { id: 'absence_monthly', name: 'تقرير الغياب الشهري', category: 'الحضور والمتابعة', icon: AlertTriangle },
  { id: 'behavior', name: 'تقرير المتابعة السلوكية', category: 'الحضور والمتابعة', icon: CheckCircle },
  { id: 'subscriptions_due', name: 'تقرير الاشتراكات المستحقة', category: 'الحسابات', icon: Wallet },
  { id: 'late_payments', name: 'تقرير المتأخرين في السداد', category: 'الحسابات', icon: AlertTriangle },
  { id: 'revenues', name: 'تقرير الإيرادات', category: 'الحسابات', icon: TrendingUp },
  { id: 'expenses', name: 'تقرير المصروفات المنصرفة', category: 'الحسابات', icon: TrendingDown },
  { id: 'daily_cash', name: 'تقرير الخزنة اليومية', category: 'الحسابات', icon: Wallet },
  { id: 'employees', name: 'تقرير الموظفين', category: 'الموارد البشرية', icon: Briefcase },
  { id: 'evaluations', name: 'تقرير تقييمات الأطفال', category: 'النشاط الأكاديمي', icon: CheckCircle },
  { id: 'events_trips', name: 'تقرير الأنشطة والرحلات', category: 'النشاط الأكاديمي', icon: Calendar },
  { id: 'transport', name: 'تقرير الباص', category: 'الخدمات', icon: Briefcase },
  { id: 'inventory', name: 'تقرير المخزون والعهد', category: 'الخدمات', icon: Briefcase },
  { id: 'health_cases', name: 'تقرير الحالات الصحية والعيادة', category: 'الخدمات', icon: HeartPulse },
  { id: 'complaints', name: 'تقرير الشكاوى والملاحظات', category: 'الخدمات', icon: AlertTriangle },
];

export const useSchoolReports = () => {
  const [selectedReport, setSelectedReport] = useState<string>('students');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [classFilter, setClassFilter] = useState<number>(0);
  const [levelFilter, setLevelFilter] = useState<number>(0);

  const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
  const classes = useLiveQuery(() => db.schoolClassesList?.toArray()) || [];
  const levels = useLiveQuery(() => db.educationalLevels?.toArray()) || [];
  const attendances = useLiveQuery(() => db.studentAttendances?.toArray()) || [];
  const subscriptions = useLiveQuery(() => db.studentSubscriptions?.toArray()) || [];
  const feeTypes = useLiveQuery(() => db.schoolFeeTypes?.toArray()) || [];
  const payments = useLiveQuery(() => db.studentPayments?.toArray()) || [];
  const staff = useLiveQuery(() => db.users?.toArray()) || [];
  const healthLogs = useLiveQuery(() => db.healthLogs?.toArray()) || [];
  const evaluations = useLiveQuery(() => db.studentEvaluations?.toArray()) || [];
  const behaviorLogs = useLiveQuery(() => db.schoolBehavior?.toArray()) || [];
  const events = useLiveQuery(() => db.schoolEvents?.toArray()) || [];
  const trips = useLiveQuery(() => db.schoolTrips?.toArray()) || [];
  const complaints = useLiveQuery(() => db.schoolComplaints?.toArray()) || [];
  const expenses = useLiveQuery(() => db.schoolExpenses?.toArray()) || [];
  const inventory = useLiveQuery(() => db.schoolInventory?.toArray()) || [];

  const reportData = useMemo(() => {
    let result: any[] = [];
    
    const filteredStudents = students.filter(s => {
      const mClass = classFilter === 0 || s.classroomId === classFilter;
      const mLevel = levelFilter === 0 || s.levelId === levelFilter;
      return mClass && mLevel;
    });

    if (selectedReport === 'students' || selectedReport === 'students_class' || selectedReport === 'students_level') {
      result = filteredStudents.map(s => ({
        code: s.code || '-',
        name: s.name,
        level: levels.find(l=>l.id === s.levelId)?.name || '-',
        classroom: classes.find(c=>c.id === s.classroomId)?.name || '-',
        parentPhone: s.parentPhone || '-'
      }));
    } 
    else if (selectedReport === 'attendance_daily') {
      result = filteredStudents.map(s => {
        const att = attendances.find(a => a.studentId === s.id && a.date >= startDate && a.date <= endDate);
        return {
          name: s.name,
          classroom: classes.find(c=>c.id === s.classroomId)?.name || '-',
          status: att ? (att.status === 'present' ? 'حاضر' : att.status === 'absent' ? 'غائب' : att.status === 'late' ? 'متأخر' : 'عذر') : 'لم يسجل'
        };
      }).filter(item => item.status !== 'لم يسجل');
    }
    else if (selectedReport === 'health_cases') {
      result = healthLogs.filter(h => h.date >= startDate && h.date <= endDate).map(h => ({
        date: h.date,
        childName: students.find(s=>s.id === h.studentId)?.name || 'غير معروف',
        type: h.type === 'accident' ? 'حادث' : h.type === 'injury' ? 'إصابة' : h.type === 'medication' ? 'إعطاء دواء' : 'أخرى',
        details: h.description
      }));
    }
    else if (selectedReport === 'subscriptions_due' || selectedReport === 'late_payments') {
      result = subscriptions.map(sub => {
        const student = students.find(s=>s.id === sub.studentId);
        const feeType = feeTypes.find(f=>f.id === sub.feeTypeId);
        return {
          childName: student?.name || '-',
          classroom: classes.find(c=>c.id === student?.classroomId)?.name || '-',
          feeName: feeType?.name || '-',
          amountDue: sub.amountDue || feeType?.amount || 'غير محدد',
          status: sub.status === 'paid' ? 'مدفوع' : 'غير مدفوع'
        };
      }).filter(item => item.status !== 'مدفوع' && (!classFilter || item.classroom === classes.find(c=>c.id===classFilter)?.name));
    }
    else if (selectedReport === 'reactions' || selectedReport === 'behavior') {
      result = behaviorLogs.filter(b => (!startDate || !b.date || (b.date >= startDate && b.date <= endDate))).map(b => ({
        date: b.date || '-',
        childName: students.find(s=>s.id === Number(b.studentId))?.name || b.studentName || '-',
        type: b.type === 'hitting' ? 'ضرب' : b.type === 'biting' ? 'عض' : b.type === 'crying' ? 'بكاء مستمر' : b.type === 'isolation' ? 'عزلة وانطواء' : b.type === 'refusing_food' ? 'رفض الطعام' : b.type === 'hyperactive' ? 'فرط حركة' : b.type,
        priority: b.priority === 'high' ? 'عالي' : b.priority === 'medium' ? 'متوسط' : 'عادي',
        notes: b.dailyNotes || b.notes || '-'
      }));
    }
    else if (selectedReport === 'events_trips') {
      const ev = events.map(e => ({
        date: e.date,
        type: 'نشاط/حدث',
        name: e.name || '-',
        status: e.status || '-'
      }));
      const tr = trips.map(t => ({
        date: t.date,
        type: 'رحلة',
        name: t.name || '-',
        status: t.status || '-'
      }));
      result = [...ev, ...tr].filter(x => (!startDate || (x.date >= startDate && x.date <= endDate)));
    }
    else if (selectedReport === 'complaints') {
      result = complaints.filter(c => (!startDate || (c.date >= startDate && c.date <= endDate))).map(c => ({
        date: c.date,
        type: c.type === 'academic' ? 'أكاديمي' : c.type === 'behavioral' ? 'سلوكي' : c.type === 'administrative' ? 'إداري' : 'أخرى',
        status: c.status === 'resolved' ? 'محلولة' : c.status === 'in_progress' ? 'قيد المعالجة' : 'جديدة',
        priority: c.priority === 'high' ? 'عالي' : c.priority === 'medium' ? 'متوسط' : 'عادي',
        childName: students.find(s=>s.id === c.studentId)?.name || 'عام'
      }));
    }
    else if (selectedReport === 'inventory') {
      result = inventory.map(i => ({
        category: i.category || '-',
        name: i.name,
        quantity: i.quantity || 0,
        minimum: i.reorderPoint || i.minQuantity || 0,
        status: (i.quantity || 0) <= (i.reorderPoint || i.minQuantity || 0) ? 'يحتاج توريد' : 'متوفر'
      }));
    }
    else if (selectedReport === 'expenses') {
      result = expenses.filter(e => (!startDate || (e.date >= startDate && e.date <= endDate))).map(e => ({
        date: e.date,
        title: e.title || e.description || '-',
        category: e.category === 'maintenance' ? 'صيانة' : e.category === 'utilities' ? 'مرافق' : e.category === 'supplies' ? 'مستلزمات' : e.category === 'salaries' ? 'رواتب' : e.category || '-',
        amount: e.amount || 0,
        status: e.status === 'paid' ? 'مدفوع' : 'غير مدفوع',
        paymentMethod: e.paymentMethod === 'cash' ? 'كاش' : 'بنكي'
      }));
    }
    else if (selectedReport === 'revenues' || selectedReport === 'daily_cash') {
      result = payments.filter(p => p.paymentDate && p.paymentDate.split('T')[0] >= startDate && p.paymentDate.split('T')[0] <= endDate).map(p => ({
        date: p.paymentDate.split('T')[0],
        receipt: p.receiptNumber || '-',
        childName: students.find(s=>s.id === p.studentId)?.name || 'غير محدد',
        amount: p.amount || 0,
        method: p.method === 'cash' ? 'كاش' : 'بنكي'
      }));
    }
    else if (selectedReport === 'employees') {
      result = staff.filter(u => u.role !== 'admin' && u.role !== 'owner').map(u => ({
        name: u.name,
        jobTitle: u.jobTitle || 'موظف',
        phone: u.phone || '-',
        salary: (u as any).baseSalary || (u as any).salary || 0
      }));
    }
    else if (selectedReport === 'withdrawn') {
      result = students.filter(s => s.status === 'منسحب' || s.status === 'متوقف').map(s => ({
        name: s.name,
        level: levels.find(l=>l.id === s.levelId)?.name || '-',
        classroom: classes.find(c=>c.id === s.classroomId)?.name || '-',
        parentPhone: s.parentPhone || '-'
      }));
    }
    else if (selectedReport === 'birthdays') {
      result = students.map(s => ({
        name: s.name,
        dob: (s as any).dob || s.birthDate || (s as any).dateOfBirth || 'غير مسجل',
        age: ((s as any).dob || s.birthDate || (s as any).dateOfBirth) ? Math.floor((new Date().getTime() - new Date(((s as any).dob || s.birthDate || (s as any).dateOfBirth)).getTime()) / 31557600000) + ' سنوات' : '-',
      }));
    }
    else if (selectedReport === 'absence_monthly') {
      result = attendances.filter(a => a.status === 'absent' && a.date >= startDate && a.date <= endDate).map(a => ({
        name: students.find(s=>s.id === a.studentId)?.name || '-',
        date: a.date,
        reason: a.notes || 'بدون عذر'
      }));
    }
    else if (selectedReport === 'transport') {
      result = students.filter(s => !!s.busSubscription && s.busSubscription !== 'no' && s.busSubscription !== 'بدون إشتراك').map(s => ({
        name: s.name,
        classroom: classes.find(c=>c.id === s.classroomId)?.name || '-',
        address: s.address || '-',
        parentPhone: s.parentPhone || '-'
      }));
    }
    else if (selectedReport === 'evaluations') {
      result = evaluations.map(e => ({
        name: students.find(s=>s.id === e.studentId)?.name || '-',
        classroom: classes.find(c=>c.id === e.classroomId)?.name || '-',
        monthOrWeek: e.monthOrWeek || '-',
        score: e.totalScore || 0,
        rating: e.rating || '-'
      }));
    }
    return result;
  }, [selectedReport, students, classes, levels, attendances, healthLogs, classFilter, levelFilter, startDate, endDate, subscriptions, feeTypes, payments, behaviorLogs, events, trips, complaints, expenses, inventory]);

  const printReport = async () => {
    const userJson = localStorage.getItem('nima_user');
    const currentUser = userJson ? JSON.parse(userJson) : null;
    if (currentUser?.role !== 'admin' && !currentUser?.permissions?.includes('school_export_print')) {
      alert('ليس لديك صلاحية لطباعة التقارير.');
      return;
    }
    const reportName = reportsList.find(r=>r.id===selectedReport)?.name || 'تقرير';
    await logActivity('other', `طباعة: ${reportName}`, `تم طباعة تقرير مدرسة: ${reportName}`);
    window.print();
  };

  const exportCSV = async () => {
    if(reportData.length === 0) { alert('لا توجد بيانات للتصدير'); return; }
    const userJson = localStorage.getItem('nima_user');
    const currentUser = userJson ? JSON.parse(userJson) : null;
    if (currentUser?.role !== 'admin' && !currentUser?.permissions?.includes('school_export_print')) {
      alert('ليس لديك صلاحية لتصدير التقارير.');
      return;
    }
    const reportName = reportsList.find(r=>r.id===selectedReport)?.name || 'تقرير';
    await logActivity('other', `تصدير بيانات: ${reportName}`, `تم تصدير تقرير مدرسة: ${reportName}`);
    const headers = Object.keys(reportData[0]).join(',');
    const rows = reportData.map(obj => Object.values(obj).map(v => `"${v}"`).join(',')).join('\n');
    const csv = "\uFEFF" + headers + '\n' + rows; // Add BOM for excel Arabic support
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return {
    selectedReport,
    setSelectedReport,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    classFilter,
    setClassFilter,
    levelFilter,
    setLevelFilter,
    reportData,
    printReport,
    exportCSV,
    classes,
    levels
  };
};
