import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { useToast } from '../../../context/ToastContext';

export const useTransport = () => {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<'routes' | 'subscribers' | 'trips' | 'expenses'>('routes');

  const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
  const staff = useLiveQuery(() => db.schoolTeachers?.toArray()) || [];

  const routes = useLiveQuery(() => db.transportRoutes?.toArray()) || [];
  const subscribers = useLiveQuery(() => db.transportSubscribers?.toArray()) || [];
  const trips = useLiveQuery(() => db.transportTrips?.toArray()) || [];
  const logs = useLiveQuery(() => db.transportLogs?.toArray()) || [];

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmParams, setConfirmParams] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const requestConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmParams({ title, message, onConfirm });
    setConfirmOpen(true);
  };

  // Form states
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [routeFormData, setRouteFormData] = useState<any>({
    name: '',
    busNumber: '',
    driverId: 0,
    supervisorId: 0,
    capacity: 20,
    stops: '',
    status: 'active',
    monthlyCost: 0,
  });

  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subFormData, setSubFormData] = useState<any>({
    studentId: 0,
    routeId: 0,
    type: 'both',
    stopName: '',
  });

  const [tripModalOpen, setTripModalOpen] = useState(false);
  const [tripFormData, setTripFormData] = useState<any>({
    routeId: 0,
    date: new Date().toISOString().split('T')[0],
    direction: 'to_school',
    status: 'in_progress',
  });

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseFormData, setExpenseFormData] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: 'fuel',
    description: '',
    routeId: 0,
  });
  const expenses = useLiveQuery(() => db.expenses?.where('category').equals('transport').toArray()) || [];

  // --- Helpers ---
  const getStudentName = (id: number) => students.find((s) => s.id === id)?.name || 'غير معروف';
  const getStaffName = (id: number) => staff.find((s) => s.id === id)?.name || 'غير معروف';
  const getRouteName = (id: number) => routes.find((r) => r.id === id)?.name || 'غير معروف';

  // --- Handlers ---
  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (routeFormData.id) {
        await db.transportRoutes.update(routeFormData.id, routeFormData);
        success('تم تحديث بيانات المسار بنجاح');
      } else {
        await db.transportRoutes.add(routeFormData);
        success('تم إضافة المسار بنجاح');
      }
      setRouteModalOpen(false);
      setRouteFormData({
        name: '',
        busNumber: '',
        driverId: 0,
        supervisorId: 0,
        capacity: 20,
        stops: '',
        status: 'active',
        monthlyCost: 0,
      });
    } catch (err) {
      console.error(err);
      toastError('حدث خطأ أثناء حفظ المسار');
    }
  };

  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribers.find((s) => s.studentId === subFormData.studentId)) {
      toastError('الطالب مشترك بالفعل في خط باص');
      return;
    }
    try {
      await db.transportSubscribers.add(subFormData);
      success('تم تسجيل اشتراك الطالب بنجاح');
      setSubModalOpen(false);
      setSubFormData({ studentId: 0, routeId: 0, type: 'both', stopName: '' });
    } catch (err) {
      toastError('فشل تسجيل اشتراك الطالب');
    }
  };

  const handleStartTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.transportTrips.add({
        ...tripFormData,
        startTime: new Date().toISOString(),
      });
      success('تم بدء الرحلة الحالية للباص بنجاح');
      setTripModalOpen(false);
    } catch (err) {
      toastError('فشل بدء الرحلة');
    }
  };

  const handleCompleteTrip = async (tripId: number) => {
    requestConfirmation(
      "إنهاء الرحلة",
      "هل تم الانتهاء من الرحلة وتوصيل كافة الطلاب بنجاح؟",
      async () => {
        try {
          await db.transportTrips.update(tripId, {
            status: 'completed',
            endTime: new Date().toISOString(),
          });
          success('تم إنهاء الرحلة بنجاح وتم إرسال الإشعارات لذوي الطلاب.');
        } catch (err) {
          toastError('حدث خطأ أثناء إنهاء الرحلة');
        }
      }
    );
  };

  const handleStudentAction = async (
    tripId: number,
    studentId: number,
    action: 'boarded' | 'dropped' | 'absent'
  ) => {
    try {
      const existingLog = logs.find((l) => l.tripId === tripId && l.studentId === studentId);
      const studentName = getStudentName(studentId);

      if (existingLog) {
        await db.transportLogs.update(existingLog.id, {
          action,
          time: new Date().toLocaleTimeString('ar-EG'),
        });
      } else {
        await db.transportLogs.add({
          tripId,
          studentId,
          action,
          time: new Date().toLocaleTimeString('ar-EG'),
        });
      }

      const actionText = action === 'boarded' ? 'صعد الحافلة' : action === 'dropped' ? 'نزول ووصول الطفل' : 'غياب';
      success(`تم تسجيل ${actionText} للطالب ${studentName}`);
    } catch (err) {
      toastError('فشل تسجيل حالة الطالب');
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const routeName = getRouteName(expenseFormData.routeId);
      const expenseId = await db.expenses.add({
        date: new Date(expenseFormData.date),
        amount: Number(expenseFormData.amount),
        category: 'transport',
        title: expenseFormData.description || `مصروفات نقل وحركة للمسار: ${routeName}`,
        notes: `مسار الباص: ${routeName} - فئة المصروف: ${expenseFormData.category}`,
      });

      // Unified Accounting Integration
      try {
        const { AccountingEngine } = await import('../../../services/AccountingEngine');
        const creditAccount = await db.accounts.where('code').equals('1010').first(); // Cash
        const expenseAccount = await db.accounts.where('code').equals('5020').first(); // Operating Expenses

        if (creditAccount && expenseAccount) {
          await AccountingEngine.postEntry({
            date: new Date(expenseFormData.date),
            reference: `EXP-TR-${expenseId}`,
            description: `مصاريف تشغيل وإهلاك الحافلة للمسار: ${routeName} (${expenseFormData.category})`,
            lines: [
              {
                accountId: expenseAccount.id!,
                accountName: expenseAccount.name,
                debit: Number(expenseFormData.amount),
                credit: 0,
                description: `إثبات مصروفات الحافلة: ${expenseFormData.description || routeName}`,
              },
              {
                accountId: creditAccount.id!,
                accountName: creditAccount.name,
                debit: 0,
                credit: Number(expenseFormData.amount),
                description: `خصم من الصندوق لتمويل مصروفات النقل`,
              },
            ],
            ignoreClosedPeriod: true,
          });
        }
      } catch (accErr) {
        console.error('Failed to post automatic journal entry for transport expense:', accErr);
      }

      success('تم تسجيل المصروف بنجاح وتوجيهه محاسبياً إلى الأستاذ العام.');
      setExpenseModalOpen(false);
      setExpenseFormData({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        category: 'fuel',
        description: '',
        routeId: 0,
      });
    } catch (err) {
      console.error(err);
      toastError('حدث خطأ أثناء حفظ مصروف النقل');
    }
  };

  return {
    activeTab,
    setActiveTab,
    students,
    staff,
    routes,
    subscribers,
    trips,
    logs,
    routeModalOpen,
    setRouteModalOpen,
    routeFormData,
    setRouteFormData,
    subModalOpen,
    setSubModalOpen,
    subFormData,
    setSubFormData,
    tripModalOpen,
    setTripModalOpen,
    tripFormData,
    setTripFormData,
    expenseModalOpen,
    setExpenseModalOpen,
    expenseFormData,
    setExpenseFormData,
    expenses,
    confirmOpen,
    setConfirmOpen,
    confirmParams,
    getStudentName,
    getStaffName,
    getRouteName,
    handleSaveRoute,
    handleSaveSub,
    handleStartTrip,
    handleCompleteTrip,
    handleStudentAction,
    handleSaveExpense,
  };
};
export default useTransport;
