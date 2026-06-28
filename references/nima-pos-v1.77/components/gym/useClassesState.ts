import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { ClassType } from './types';

export const useClassesState = () => {
  // Navigation tabs: 'grid' (Classes board), 'enroll' (Attendance/Bookings desk), 'list' (Master database entries)
  const [activeTab, setActiveTab] = useState<'grid' | 'enroll' | 'list'>('grid');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Quick Trainer Creation modal state
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  const [trainerNameInput, setTrainerNameInput] = useState('');
  const [trainerPhoneInput, setTrainerPhoneInput] = useState('');
  const [trainerSpecInput, setTrainerSpecInput] = useState('لياقة بدنية وكارديو');

  // Notifications
  const [showNotification, setShowNotification] = useState<{ type: 'success' | 'warning' | 'error', text: string } | null>(null);

  // Custom ConfirmModal configurations
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Enrollment configuration
  const [selectedClassForEnroll, setSelectedClassForEnroll] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [isPaidEnroll, setIsPaidEnroll] = useState(true);
  const [enrollPaymentMethod, setEnrollPaymentMethod] = useState('نقدي');

  // Query settings for currency
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currency = settings?.currency || 'ج.م';

  // Live query of databases
  const originalClasses = useLiveQuery(() => db.gymClassesList.toArray()) || [];
  const trainers = useLiveQuery(() => db.gymTrainersList.toArray()) || [];
  const members = useLiveQuery(() => db.gymMembershipsList.toArray()) || [];

  // Filter records dynamically
  const filteredRecords = useMemo(() => {
    return originalClasses.filter((item: any) => {
      const matchesSearch = 
        String(item.name || '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.trainerId || '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.room || '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.schedule || '').toLowerCase().includes(search.toLowerCase());

      const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || (item.status || 'نشطة') === statusFilter;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [originalClasses, search, categoryFilter, statusFilter]);

  // Dashboard calculations
  const metrics = useMemo(() => {
    const totalClasses = originalClasses.length;
    const activeClasses = originalClasses.filter(c => (c.status || 'نشطة') !== 'معلقة').length;
    
    let totalCap = 0;
    let totalEnrolled = 0;
    let totalPaidRevenues = 0;

    originalClasses.forEach(c => {
      totalCap += Number(c.capacity) || 20;
      const attendees = Array.isArray(c.enrolledMembers) ? c.enrolledMembers : [];
      totalEnrolled += attendees.length;

      attendees.forEach(m => {
        totalPaidRevenues += Number(m.paidAmount) || 0;
      });
    });

    const occupancyRate = totalCap > 0 ? Math.round((totalEnrolled / totalCap) * 100) : 0;

    return {
      totalClasses,
      activeClasses,
      totalEnrolled,
      occupancyRate,
      totalCap,
      totalPaidRevenues
    };
  }, [originalClasses]);

  // Helper to format 24h time to Arabic reading time
  const formatToArabicTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hourStr, minStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const suffix = hour >= 12 ? 'مساءً' : 'صباحاً';
    let adjustedHour = hour % 12;
    if (adjustedHour === 0) adjustedHour = 12;
    return `${adjustedHour}:${minStr} ${suffix}`;
  };

  // Setup Form inputs state
  const [classForm, setClassForm] = useState<Partial<ClassType>>({
    name: '',
    trainerId: '',
    days: [],
    time: '17:00',
    capacity: 20,
    room: 'الصالة الرئيسية',
    category: 'كارديو ولياقة بدنية',
    price: 0,
    status: 'نشطة'
  });

  const triggerToast = (type: 'success' | 'warning' | 'error', text: string) => {
    setShowNotification({ type, text });
    setTimeout(() => setShowNotification(null), 4000);
  };

  // Modal open controllers
  const handleOpenClassModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setClassForm({
        name: item.name || '',
        trainerId: item.trainerId || '',
        days: Array.isArray(item.days) ? item.days : [],
        time: item.time || '17:00',
        capacity: Number(item.capacity) || 20,
        room: item.room || 'الصالة الرئيسية',
        category: item.category || 'كارديو ولياقة بدنية',
        price: Number(item.price) || 0,
        status: item.status || 'نشطة'
      });
    } else {
      setCurrentId(null);
      const defaultTrainer = trainers[0]?.name || '';
      setClassForm({
        name: '',
        trainerId: defaultTrainer,
        days: ['السبت', 'الإثنين'],
        time: '18:00',
        capacity: 20,
        room: 'الصالة مخصصة (A)',
        category: 'كارديو ولياقة بدنية',
        price: 0,
        status: 'نشطة'
      });
    }
    setIsModalOpen(true);
  };

  // Add trainer on the fly
  const handleQuickAddTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainerNameInput.trim()) return;

    try {
      const newTrainer = {
        name: trainerNameInput.trim(),
        specialization: trainerSpecInput,
        phone: trainerPhoneInput.trim(),
        status: 'متاح'
      };

      await db.gymTrainersList.add(newTrainer);
      setClassForm(prev => ({ ...prev, trainerId: newTrainer.name }));
      
      triggerToast('success', `تم تسجيل المدرب ${newTrainer.name} بنجاح وإدراجه بالخيارات.`);
      setIsTrainerModalOpen(false);
      setTrainerNameInput('');
      setTrainerPhoneInput('');
    } catch (err) {
      console.error(err);
      triggerToast('error', 'فشل إضافة المدرب الجديد.');
    }
  };

  // Convert days and time array to formatted schedule text
  const computeAndSaveSchedule = (days: string[], time: string) => {
    if (!days || days.length === 0) return 'موعد غير حدد';
    const ArabicTime = formatToArabicTime(time);
    return `${days.join('، ')} [⏱️ ${ArabicTime}]`;
  };

  // Double entry system update: journal accounting integration
  const postPaidSessionJournal = async (memberName: string, className: string, amount: number, paymentMethod: string) => {
    try {
      const debitAccountName = paymentMethod === 'شبكة' ? 'البنك والشبكة الإلكترونية' : 'الصندوق النقدي الرياضي';
      const debitAccountId = paymentMethod === 'شبكة' ? 1002 : 1001;
      const creditAccountName = 'مبيعات وإيرادات الحصص المتخصصة';
      const creditAccountId = 4005;

      const lines = [
        {
          accountId: debitAccountId,
          accountName: debitAccountName,
          debit: amount,
          credit: 0,
          description: `سداد قيمة حجز حصة (${className}) للمشترك: ${memberName}`
        },
        {
          accountId: creditAccountId,
          accountName: creditAccountName,
          debit: 0,
          credit: amount,
          description: `إيرادات الحصص المدفوعة - الحصة (${className}) لـ: ${memberName}`
        }
      ];

      const entry = {
        date: new Date(),
        reference: `GYM-BOOKING-${Date.now()}`,
        description: `قيود إيرادات حجز حصة جماعية (${className}) للعضو: ${memberName}`,
        lines: lines,
        totalAmount: amount,
        status: "posted" as "posted",
        createdBy: "المساعد الرياضي التلقائي"
      };

      await db.journalEntries.add(entry);
    } catch (error) {
      console.error("Failed to automatically post journal entry on class booking:", error);
    }
  };

  // Click handler to save class
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name?.trim()) return;

    const finalSchedule = computeAndSaveSchedule(classForm.days || [], classForm.time || '17:00');

    const itemToSave: any = {
      name: classForm.name,
      trainerId: classForm.trainerId || 'غير محدد',
      schedule: finalSchedule,
      days: classForm.days || [],
      time: classForm.time || '17:00',
      capacity: Number(classForm.capacity) || 20,
      room: classForm.room || 'الصالة الرئيسية',
      category: classForm.category || 'كارديو ولياقة بدنية',
      price: Number(classForm.price) || 0,
      status: classForm.status || 'نشطة',
      enrolledMembers: isEdit ? classForm.enrolledMembers || [] : []
    };

    try {
      if (isEdit && currentId) {
        const originalItem = originalClasses.find(c => c.id === currentId);
        itemToSave.enrolledMembers = originalItem?.enrolledMembers || [];
        
        await db.gymClassesList.update(currentId, itemToSave);
        triggerToast('success', 'تم تعديل مصفوفة الحصة بنجاح!');
      } else {
        await db.gymClassesList.add(itemToSave);
        triggerToast('success', 'تم إدراج وجدولة الحصة الرياضية بنجاح!');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      triggerToast('error', 'حدث خطأ أثناء حفظ التعديلات.');
    }
  };

  const askDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await db.gymClassesList.delete(deleteId);
      triggerToast('success', 'تم حذف الحصة نهائياً من قاعدة البيانات.');
      setIsDeleteOpen(false);
      setDeleteId(null);
      if (selectedClassForEnroll === deleteId) {
        setSelectedClassForEnroll(null);
      }
    }
  };

  // Members enrollment behavior
  const activeClassData = useMemo(() => {
    if (selectedClassForEnroll === null) return null;
    return originalClasses.find(c => c.id === selectedClassForEnroll) || null;
  }, [selectedClassForEnroll, originalClasses]);

  const handleEnrollMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForEnroll || !selectedMemberId) return;

    const classRecord = originalClasses.find(c => c.id === selectedClassForEnroll);
    if (!classRecord) return;

    const attendees = Array.isArray(classRecord.enrolledMembers) ? classRecord.enrolledMembers : [];
    if (attendees.length >= (classRecord.capacity || 20)) {
      triggerToast('warning', 'عذراً، هذه الحصة مكتملة العدد بالكامل!');
      return;
    }

    const selectedMemberObj = members.find(m => m.memberId === selectedMemberId || String(m.id) === selectedMemberId);
    if (!selectedMemberObj) {
      triggerToast('error', 'العضو المحدد غير متواجد بسجلات المشتركين.');
      return;
    }

    if (selectedMemberObj.status === 'منتهي') {
      triggerToast('warning', 'انتباه: اشتراك هذا العضو منتهي! يرجى تجديد الاشتراك أولاً لضمان الفوترة الحركية.');
    }

    const isAlreadyJoined = attendees.some((a: any) => a.memberId === selectedMemberObj.memberId);
    if (isAlreadyJoined) {
      triggerToast('warning', 'هذا العضو مسجل بالفعل في هذه الحصة التدريبية!');
      return;
    }

    const sessionFee = isPaidEnroll ? Number(classRecord.price) || 0 : 0;

    const enrollmentInfo = {
      memberId: selectedMemberObj.memberId,
      memberName: selectedMemberObj.memberId,
      phone: selectedMemberObj.phone || '',
      enrolledAt: new Date().toISOString().split('T')[0],
      paidAmount: sessionFee,
      paymentMethod: enrollPaymentMethod
    };

    const updatedAttendees = [...attendees, enrollmentInfo];

    try {
      await db.gymClassesList.update(selectedClassForEnroll, {
        enrolledMembers: updatedAttendees
      });

      if (sessionFee > 0) {
        await postPaidSessionJournal(selectedMemberObj.memberId, classRecord.name, sessionFee, enrollPaymentMethod);
      }

      triggerToast('success', `تم تسجيل ${selectedMemberObj.memberId} في حصة ${classRecord.name} بنجاح.`);
      setSelectedMemberId('');
    } catch (error) {
      console.error("Failed to enroll member in gym class:", error);
      triggerToast('error', 'فشل تسجيل انضمام العضو.');
    }
  };

  const handleCancelEnrollment = async (memberToCheckId: string) => {
    if (!selectedClassForEnroll) return;
    const classRecord = originalClasses.find(c => c.id === selectedClassForEnroll);
    if (!classRecord) return;

    const attendees = Array.isArray(classRecord.enrolledMembers) ? classRecord.enrolledMembers : [];
    const updated = attendees.filter((a: any) => a.memberId !== memberToCheckId);

    try {
      await db.gymClassesList.update(selectedClassForEnroll, {
        enrolledMembers: updated
      });
      triggerToast('success', 'تم شطب وإلغاء تسجيل العضو من هذه الحصة بنجاح.');
    } catch (err) {
      console.error(err);
      triggerToast('error', 'فشل إلغاء الحجز.');
    }
  };

  return {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    isModalOpen,
    setIsModalOpen,
    isEdit,
    currentId,
    isTrainerModalOpen,
    setIsTrainerModalOpen,
    trainerNameInput,
    setTrainerNameInput,
    trainerPhoneInput,
    setTrainerPhoneInput,
    trainerSpecInput,
    setTrainerSpecInput,
    showNotification,
    isDeleteOpen,
    setIsDeleteOpen,
    setDeleteId,
    setSelectedClassForEnroll,
    selectedClassForEnroll,
    selectedMemberId,
    setSelectedMemberId,
    isPaidEnroll,
    setIsPaidEnroll,
    enrollPaymentMethod,
    setEnrollPaymentMethod,
    currency,
    originalClasses,
    trainers,
    members,
    filteredRecords,
    metrics,
    classForm,
    setClassForm,
    handleOpenClassModal,
    handleQuickAddTrainer,
    handleSaveClass,
    askDelete,
    confirmDelete,
    activeClassData,
    handleEnrollMember,
    handleCancelEnrollment
  };
};
