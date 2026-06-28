import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { TrainerType, PayoutRecord } from './trainersTypes';

export const useTrainersState = () => {
  // Navigation tabs:
  // 'directory' (Cards list), 'payroll' (Commission settlement), 'performance' (Charts & analytics), 'master' (raw table)
  const [activeTab, setActiveTab] = useState<'directory' | 'payroll' | 'performance' | 'master'>('directory');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Notifications/Toasts State
  const [toastNotification, setToastNotification] = useState<{ type: 'success' | 'warning' | 'error', text: string } | null>(null);

  // Custom ConfirmModal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Payroll Calculation and disbursement State
  const [selectedTrainerId, setSelectedTrainerId] = useState<number | null>(null);
  const [extraBonus, setExtraBonus] = useState<number>(0);
  const [extraDeduction, setExtraDeduction] = useState<number>(0);
  const [payrollMethod, setPayrollMethod] = useState<'cash' | 'bank'>('cash');
  const [payrollNotes, setPayrollNotes] = useState<string>('');
  const [isPayoutConfirmOpen, setIsPayoutConfirmOpen] = useState(false);

  // Retrieve setting currency symbol (e.g., ج.م)
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currency = settings?.currency || 'ج.م';

  // Live query of databases
  const trainers: TrainerType[] = useLiveQuery(() => db.gymTrainersList.toArray()) || [];
  const classes = useLiveQuery(() => db.gymClassesList.toArray()) || [];

  const triggerToast = (type: 'success' | 'warning' | 'error', text: string) => {
    setToastNotification({ type, text });
    setTimeout(() => setToastNotification(null), 4000);
  };

  // Prepopulate standard trainers on first load if the DB is empty
  const handleSeedMockData = async () => {
    try {
      const demoTrainers: TrainerType[] = [
        {
          name: 'كابتن أندري لسينكو',
          specialization: '🏋️‍♂️ كمال أجسام وحديد',
          phone: '01066554433',
          status: 'متاح',
          bio: 'مدرب محترف حاصل على شهادات دولية ISSA مع خبرة 8 سنوات في إعداد الأبطال الرياضيين وتصميم برامج الضخامة والتنشيف.',
          shift: 'مسائي (02:00 م - 10:00 م)',
          baseSalary: 6000,
          commissionType: 'fixed_per_student',
          commissionValue: 50,
          rating: 4.9,
          hireDate: '2024-01-10',
          payoutHistory: []
        },
        {
          name: 'كابتن أولغا سيريبرينكو',
          specialization: '🧘‍♀️ يوغا وبيلاتس',
          phone: '01122334455',
          status: 'متاح',
          bio: 'أخصائية تدريب مرونة وتوازن، بطلة يوغا، تساعد المتدربين على الوصول إلى الانسجام العضلي التام وتأهيل الإصابات الرياضية.',
          shift: 'صباحي (06:00 ص - 02:00 م)',
          baseSalary: 5500,
          commissionType: 'percentage_of_session',
          commissionValue: 15, // 15% commission per premium attendee
          rating: 4.8,
          hireDate: '2024-03-15',
          payoutHistory: []
        },
        {
          name: 'كابتن روستيسلاف ميلنيك',
          specialization: '🏃‍♂️ لياقة بدنية وكارديو',
          phone: '01233445566',
          status: 'متاح',
          bio: 'متخصص تدريب اللياقة البدنية عالي الكثافة (HIIT) وحرق الدهون الزائدة مع تصميم برامج تغذية قاسية تناسب الرياضيين.',
          shift: 'دوام كامل (09:00 ص - 06:00 م)',
          baseSalary: 6500,
          commissionType: 'fixed_per_student',
          commissionValue: 40,
          rating: 4.7,
          hireDate: '2024-05-01',
          payoutHistory: []
        },
        {
          name: 'كابتن كاترينا شفتشينكو',
          specialization: '🔥 كروس فت وتدريب وظيفي',
          phone: '01555667788',
          status: 'في إجازة',
          bio: 'مدربة كروس فت شغوفة وطموحة. حاصلة على جوائز اللياقة الوظيفية، متخصصة في التدريب الدائري وحث عضلة القلب.',
          shift: 'مرن / حسب الطلب',
          baseSalary: 4500,
          commissionType: 'percentage_of_session',
          commissionValue: 10,
          rating: 4.6,
          hireDate: '2025-02-20',
          payoutHistory: []
        }
      ];

      for (const t of demoTrainers) {
        await db.gymTrainersList.add(t);
      }
      triggerToast('success', 'تم تدوين وتأسيس باقة المدربين المقترحة بقاعدة البيانات بنجاح!');
    } catch (err) {
      console.error(err);
      triggerToast('error', 'فشل تدوين البيانات الافتراضية.');
    }
  };

  // Filter records dynamically
  const filteredTrainers = useMemo(() => {
    return trainers.filter((item: TrainerType) => {
      const matchesSearch = 
        String(item.name || '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.phone || '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.specialization || '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.bio || '').toLowerCase().includes(search.toLowerCase());

      const matchesSpec = specFilter === 'all' || item.specialization === specFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesSpec && matchesStatus;
    });
  }, [trainers, search, specFilter, statusFilter]);

  // Overall statistics for dashboard metrics
  const statsMetrics = useMemo(() => {
    const totalTrainers = trainers.length;
    const availableCount = trainers.filter(t => t.status === 'متاح').length;
    const onLeaveCount = trainers.filter(t => t.status === 'في إجازة').length;
    
    // Total payroll exposure (sum of base salaries)
    const baseSalariesSum = trainers.reduce((sum, t) => sum + (Number(t.baseSalary) || 0), 0);
    
    // Average rating
    const validRatings = trainers.map(t => t.rating || 4.8);
    const avgRating = validRatings.length > 0 
      ? Number((validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length).toFixed(1))
      : 4.8;

    return {
      totalTrainers,
      availableCount,
      onLeaveCount,
      baseSalariesSum,
      avgRating
    };
  }, [trainers]);

  // Calculations for specific selected trainer in Payroll Ledger
  const trainerPayrollData = useMemo(() => {
    if (selectedTrainerId === null) return null;
    const tr = trainers.find(t => t.id === selectedTrainerId);
    if (!tr) return null;

    // Class metrics for this trainer (matching by Trainer's Name)
    const trainerClasses = classes.filter(c => c.trainerId === tr.name);
    
    let totalClassesCount = trainerClasses.length;
    let totalEnrolledAttendees = 0;
    let computedCommission = 0;

    trainerClasses.forEach(cls => {
      const attendees = Array.isArray(cls.enrolledMembers) ? cls.enrolledMembers : [];
      totalEnrolledAttendees += attendees.length;

      if (tr.commissionType === 'fixed_per_student') {
        const rate = Number(tr.commissionValue) || 0;
        computedCommission += attendees.length * rate;
      } else {
        // percentage_of_session
        const pct = Number(tr.commissionValue) || 0;
        attendees.forEach((student: any) => {
          const paidFee = Number(student.paidAmount) || Number(cls.price) || 0;
          computedCommission += (paidFee * pct) / 100;
        });
      }
    });

    const baseSal = Number(tr.baseSalary) || 0;
    const grossTotal = baseSal + computedCommission;

    return {
      trainer: tr,
      classes: trainerClasses,
      totalClassesCount,
      totalEnrolledAttendees,
      baseSalary: baseSal,
      computedCommission,
      grossTotal
    };
  }, [selectedTrainerId, trainers, classes]);

  // Setup Form inputs state (for adding/updating)
  const [formData, setFormData] = useState<Partial<TrainerType>>({
    name: '',
    specialization: '🏋️‍♂️ كمال أجسام وحديد',
    phone: '',
    status: 'متاح',
    bio: '',
    shift: 'مسائي (02:00 م - 10:00 م)',
    baseSalary: 5000,
    commissionType: 'fixed_per_student',
    commissionValue: 30,
    rating: 4.8,
    hireDate: new Date().toISOString().split('T')[0],
    payoutHistory: []
  });

  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setFormData({
        name: item.name || '',
        specialization: item.specialization || '🏋️‍♂️ كمال أجسام وحديد',
        phone: item.phone || '',
        status: item.status || 'متاح',
        bio: item.bio || '',
        shift: item.shift || 'مسائي (02:00 م - 10:00 م)',
        baseSalary: Number(item.baseSalary) || 5000,
        commissionType: item.commissionType || 'fixed_per_student',
        commissionValue: Number(item.commissionValue) || 30,
        rating: Number(item.rating) || 4.8,
        hireDate: item.hireDate || new Date().toISOString().split('T')[0],
        payoutHistory: item.payoutHistory || []
      });
    } else {
      setCurrentId(null);
      setFormData({
        name: '',
        specialization: '🏋️‍♂️ كمال أجسام وحديد',
        phone: '',
        status: 'متاح',
        bio: '',
        shift: 'مسائي (02:00 م - 10:00 م)',
        baseSalary: 5000,
        commissionType: 'fixed_per_student',
        commissionValue: 30,
        rating: 4.8,
        hireDate: new Date().toISOString().split('T')[0],
        payoutHistory: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      triggerToast('error', 'يجب إدخال اسم المدرب بالكامل.');
      return;
    }

    try {
      const dataToSave = {
        name: formData.name.trim(),
        specialization: formData.specialization || '🏋️‍♂️ كمال أجسام وحديد',
        phone: formData.phone?.trim() || '',
        status: formData.status || 'متاح',
        bio: formData.bio?.trim() || '',
        shift: formData.shift || 'مسائي (02:00 م - 10:00 م)',
        baseSalary: Number(formData.baseSalary) || 5000,
        commissionType: formData.commissionType || 'fixed_per_student',
        commissionValue: Number(formData.commissionValue) || 30,
        rating: Number(formData.rating) || 4.8,
        hireDate: formData.hireDate || new Date().toISOString().split('T')[0],
        payoutHistory: formData.payoutHistory || []
      };

      if (isEdit && currentId) {
        await db.gymTrainersList.update(currentId, dataToSave);
        triggerToast('success', `تم تعديل بيانات كابتن ${dataToSave.name} بنجاح.`);
      } else {
        await db.gymTrainersList.add(dataToSave);
        triggerToast('success', `تم تسجيل وإدراج كابتن ${dataToSave.name} في كادر العمل.`);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      triggerToast('error', 'حدث خطأ أثناء حفظ التعديلات.');
    }
  };

  // Trigger Custom Confirm Delete
  const askDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      const tr = trainers.find(t => t.id === deleteId);
      await db.gymTrainersList.delete(deleteId);
      triggerToast('success', `تم شطب سجل المدرب ${tr?.name || ''} نهائياً.`);
      setIsDeleteOpen(false);
      setDeleteId(null);
      if (selectedTrainerId === deleteId) {
        setSelectedTrainerId(null);
      }
    }
  };

  // Double-Entry Accounting journal payment post integration
  const postTrainerSalaryJournal = async (
    trainerName: string, 
    totalPayout: number, 
    baseAmount: number, 
    commAmount: number, 
    paySrc: string
  ) => {
    try {
      const creditAccountCode = paySrc === 'bank' ? '1020' : '1010'; // 1010: Cash, 1020: Bank
      const creditAccount = await db.accounts.where('code').equals(creditAccountCode).first();
      const debitAccount = await db.accounts.where('code').equals('5010').first(); // Salaries Expense

      if (creditAccount && debitAccount) {
        const addedEntryId = await db.journalEntries.add({
          date: new Date(),
          reference: `TRAINER-PAY-GYM-${Date.now()}`,
          description: `قيود إثبات صرف رواتب وعمولات التشغيل - كابتن: ${trainerName}`,
          lines: [
            {
              accountId: debitAccount.id!,
              accountName: debitAccount.name,
              debit: totalPayout,
              credit: 0,
              description: `صرف مستحقات المدرب كابتن: ${trainerName} (أساسي: ${baseAmount} + عمولة: ${commAmount})`
            },
            {
              accountId: creditAccount.id!,
              accountName: creditAccount.name,
              debit: 0,
              credit: totalPayout,
              description: `صرف رواتب مدربين من دفتريات ${creditAccount.name} للمدرب: ${trainerName}`
            }
          ],
          totalAmount: totalPayout,
          status: "posted",
          createdBy: "النظام المالي الرياضي التلقائي"
        });
        return `REF-GYM-TRPAY-${addedEntryId}`;
      }
      return `REF-TRPAY-${Date.now()}`;
    } catch (error) {
      console.error("Failed to post trainer salary journal entry automatically:", error);
      return `ERR-${Date.now()}`;
    }
  };

  // Process and save salary disbursement
  const handleDisbursePayroll = async () => {
    if (!trainerPayrollData) return;
    const { trainer, baseSalary, computedCommission } = trainerPayrollData;

    const netPayout = baseSalary + computedCommission + Number(extraBonus) - Number(extraDeduction);
    if (netPayout <= 0) {
      triggerToast('error', 'عذراً، يجب أن تكون القيمة الصافية للراتب المحول أكبر من صفر.');
      return;
    }

    try {
      // 1. Post to Accounting Journal
      const journalRefNo = await postTrainerSalaryJournal(
        trainer.name,
        netPayout,
        baseSalary,
        computedCommission,
        payrollMethod
      );

      // 2. Add record to Trainer's layout history
      const newPayout: PayoutRecord = {
        id: `PAY-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        baseSalary: baseSalary,
        commissionAmount: computedCommission,
        extraBonus: Number(extraBonus),
        extraDeduction: Number(extraDeduction),
        totalAmount: netPayout,
        paymentMethod: payrollMethod === 'bank' ? '💳 شبكة / تحويل بنكي' : '💵 كاش من الصندوق',
        notes: payrollNotes.trim() || undefined,
        journalRef: journalRefNo
      };

      const updatedHistory = [...(trainer.payoutHistory || []), newPayout];

      await db.gymTrainersList.update(trainer.id!, {
        payoutHistory: updatedHistory
      });

      triggerToast('success', `تم صرف وتسجيل المرتب الشهري كابتن ${trainer.name} بقيمة ${netPayout.toLocaleString()} ${currency} تزامناً مع الحسابات.`);
      
      // Reset variables
      setIsPayoutConfirmOpen(false);
      setExtraBonus(0);
      setExtraDeduction(0);
      setPayrollNotes('');
    } catch (err) {
      console.error(err);
      triggerToast('error', 'حدث خطأ أثناء صرف وتسجيل الرواتب.');
    }
  };

  // Prepare chart data comparing Trainer Performance
  const chartPerformanceData = useMemo(() => {
    return trainers.map(tr => {
      const trainerClasses = classes.filter(c => c.trainerId === tr.name);
      
      let enrolledCount = 0;
      let capacitySum = 0;

      trainerClasses.forEach(c => {
        const attendees = Array.isArray(c.enrolledMembers) ? c.enrolledMembers : [];
        enrolledCount += attendees.length;
        capacitySum += Number(c.capacity) || 20;
      });

      return {
        name: tr.name.replace('كابتن ', ''),
        classesCount: trainerClasses.length,
        studentsCount: enrolledCount,
        maxCapacity: capacitySum
      };
    });
  }, [trainers, classes]);

  return {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    specFilter,
    setSpecFilter,
    statusFilter,
    setStatusFilter,
    isModalOpen,
    setIsModalOpen,
    isEdit,
    currentId,
    toastNotification,
    setToastNotification,
    triggerToast,
    isDeleteOpen,
    setIsDeleteOpen,
    selectedTrainerId,
    setSelectedTrainerId,
    extraBonus,
    setExtraBonus,
    extraDeduction,
    setExtraDeduction,
    payrollMethod,
    setPayrollMethod,
    payrollNotes,
    setPayrollNotes,
    isPayoutConfirmOpen,
    setIsPayoutConfirmOpen,
    currency,
    trainers,
    classes,
    handleSeedMockData,
    filteredTrainers,
    statsMetrics,
    trainerPayrollData,
    formData,
    setFormData,
    handleOpenModal,
    handleSave,
    askDelete,
    confirmDelete,
    handleDisbursePayroll,
    chartPerformanceData
  };
};
