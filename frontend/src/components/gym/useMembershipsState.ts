import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { AccountingEngine } from "../../services/AccountingEngine";
import { MembershipType, GymPlanType, DEFAULT_PLANS } from './membershipsTypes';

export const useMembershipsState = () => {
  // Navigation tab state: 'records' (subscriptions list) OR 'plans' (manage package sizes)
  const [activeTab, setActiveTab] = useState<'records' | 'plans'>('records');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Subscription form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Package Form modal state (for custom plans sizing)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isPlanEdit, setIsPlanEdit] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  
  // Custom Confirmation Modals State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const [showPlanDeleteConfirm, setShowPlanDeleteConfirm] = useState(false);
  const [deletePlanTargetId, setDeletePlanTargetId] = useState<string | null>(null);

  // Dynamic Gym Plans Persistence (localStorage / state)
  const [plansList, setPlansList] = useState<GymPlanType[]>(() => {
    const saved = localStorage.getItem('gym_membership_plans_custom');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse customizable gym plans:", e);
      }
    }
    return DEFAULT_PLANS;
  });

  const savePlans = (updatedPlans: GymPlanType[]) => {
    setPlansList(updatedPlans);
    localStorage.setItem('gym_membership_plans_custom', JSON.stringify(updatedPlans));
  };

  // Customizable gym plan model state
  const [planFormData, setPlanFormData] = useState<Partial<GymPlanType>>({
    name: '',
    durationDays: 30,
    price: 300,
    category: 'عام'
  });

  // Default Form values setup for members subscriptions
  const [formData, setFormData] = useState<Partial<MembershipType>>({
    memberId: '',
    phone: '',
    plan: plansList[0]?.name || 'باقة مخصصة',
    price: plansList[0]?.price || 300,
    startDate: new Date().toISOString().split('T')[0],
    endDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + (plansList[0]?.durationDays || 30));
      return d.toISOString().split('T')[0];
    })(),
    status: 'فعال',
    paymentMethod: 'نقدي',
    notes: ''
  });

  // Load configuration for currency (Default to Egyptian Pounds "ج.م")
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currency = settings?.currency || 'ج.م';

  // Live query of actual member subscriptions from DB
  const records = useLiveQuery(() => db.gymMembershipsList.toArray()) || [];

  // Helper: check if a date is expiring soon (within 7 days and is active)
  const isExpiringSoon = (endDateStr: string, status: string) => {
    if (status !== 'فعال') return false;
    const end = new Date(endDateStr);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  // Calculations for live metrics
  const metrics = useMemo(() => {
    const total = records.length;
    const active = records.filter(item => item.status === 'فعال').length;
    const expired = records.filter(item => item.status === 'منتهي').length;
    
    // Revenue calculations (using custom price inputted by the user)
    const revenue = records.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    
    // Expiring soon count
    const expiringCount = records.filter(item => isExpiringSoon(item.endDate, item.status)).length;

    return { total, active, expired, revenue, expiringCount };
  }, [records]);

  // Handle preset plan selection change inside the form
  const handlePresetChange = (presetName: string) => {
    const preset = plansList.find(p => p.name === presetName);
    if (preset) {
      const newStart = formData.startDate || new Date().toISOString().split('T')[0];
      const sDate = new Date(newStart);
      sDate.setDate(sDate.getDate() + preset.durationDays);
      
      setFormData(prev => ({
        ...prev,
        plan: preset.name,
        price: preset.price,
        endDate: sDate.toISOString().split('T')[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        plan: presetName
      }));
    }
  };

  // Calculate customized expiry date when start date or preset adjusts
  const handleStartDateChange = (newStart: string) => {
    const matchedPreset = plansList.find(p => p.name === formData.plan);
    const duration = matchedPreset ? matchedPreset.durationDays : 30;
    const sDate = new Date(newStart);
    sDate.setDate(sDate.getDate() + duration);
    
    setFormData(prev => ({
      ...prev,
      startDate: newStart,
      endDate: sDate.toISOString().split('T')[0]
    }));
  };

  // Perform dynamic search and status filtering
  const filteredRecords = useMemo(() => {
    return records.filter((item: any) => {
      // Search matches Name, phone, or plan name
      const matchesSearch = 
        String(item.memberId || '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.phone || '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.plan || '').toLowerCase().includes(search.toLowerCase());

      if (statusFilter === 'all') return matchesSearch;
      if (statusFilter === 'expiring') {
        return matchesSearch && isExpiringSoon(item.endDate, item.status);
      }
      return matchesSearch && item.status === statusFilter;
    });
  }, [records, search, statusFilter]);

  // Membership modal controls
  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setFormData({
        memberId: item.memberId || '',
        phone: item.phone || '',
        plan: item.plan || (plansList[0]?.name || ''),
        price: Number(item.price) || (plansList[0]?.price || 300),
        startDate: item.startDate || new Date().toISOString().split('T')[0],
        endDate: item.endDate || '',
        status: item.status || 'فعال',
        paymentMethod: item.paymentMethod || 'نقدي',
        notes: item.notes || ''
      });
    } else {
      setCurrentId(null);
      setFormData({
        memberId: '',
        phone: '',
        plan: plansList[0]?.name || 'باقة مخصصة',
        price: plansList[0]?.price || 300,
        startDate: new Date().toISOString().split('T')[0],
        endDate: (() => {
          const d = new Date();
          d.setDate(d.getDate() + (plansList[0]?.durationDays || 30));
          return d.toISOString().split('T')[0];
        })(),
        status: 'فعال',
        paymentMethod: 'نقدي',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId?.trim()) return;

    try {
      if (isEdit && currentId) {
        await db.gymMembershipsList.update(currentId, formData);
      } else {
        const addedId = await db.gymMembershipsList.add(formData);
        // Post automatic Balanced Journal Entry for Gymnastics Membership
        try {
          const amt = Number(formData.price) || 0;
          if (amt > 0) {
            let debitAccountCode = '1010'; // Default Cash
            if (formData.paymentMethod === 'شبكة') debitAccountCode = '1020'; // Bank
            else if (formData.paymentMethod === 'آجل') debitAccountCode = '1030'; // Accounts Receivable

            const debitAccount = await db.accounts.where('code').equals(debitAccountCode).first();
            const revenueAccount = await db.accounts.where('code').equals('4010').first(); // Sales Revenue

            if (debitAccount && revenueAccount) {
              await AccountingEngine.postEntry({
                date: new Date(formData.startDate || new Date()),
                reference: `GYM-MEM-${addedId}`,
                description: `قيد تلقائي مالي لاشتراك نادي رياضي رقم #${addedId} - الباقة: ${formData.plan}`,
                lines: [
                  {
                    accountId: debitAccount.id!,
                    accountName: debitAccount.name,
                    debit: amt,
                    credit: 0,
                    description: `سداد اشتراك عضو رقم #${formData.memberId}`
                  },
                  {
                    accountId: revenueAccount.id!,
                    accountName: revenueAccount.name,
                    debit: 0,
                    credit: amt,
                    description: `إيرادات اشتراكات نادي رياضي رقم #${addedId}`
                  }
                ],
                ignoreClosedPeriod: true
              });
            }
          }
        } catch (acctErr) {
          console.error("Accounting Integration Error (Gym membership):", acctErr);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Membership delete triggers
  const askDelete = (id: number) => {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (deleteTargetId !== null) {
      await db.gymMembershipsList.delete(deleteTargetId);
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    }
  };

  // Customizable Plan Presets / Package configuration controls
  const handleOpenPlanModal = (editPresetMode = false, item: GymPlanType | null = null) => {
    setIsPlanEdit(editPresetMode);
    if (editPresetMode && item) {
      setCurrentPlanId(item.id);
      setPlanFormData({
        name: item.name,
        durationDays: item.durationDays,
        price: item.price,
        category: item.category || 'عام'
      });
    } else {
      setCurrentPlanId(null);
      setPlanFormData({
        name: '',
        durationDays: 30,
        price: 300,
        category: 'عام'
      });
    }
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planFormData.name?.trim()) return;

    if (isPlanEdit && currentPlanId) {
      // Modify existing
      const updated = plansList.map(p => {
        if (p.id === currentPlanId) {
          return {
            ...p,
            name: planFormData.name!,
            durationDays: Number(planFormData.durationDays) || 30,
            price: Number(planFormData.price) || 0,
            category: planFormData.category || 'عام'
          };
        }
        return p;
      });
      savePlans(updated);
    } else {
      // Create new
      const newPlan: GymPlanType = {
        id: 'pla_' + Date.now(),
        name: planFormData.name,
        durationDays: Number(planFormData.durationDays) || 30,
        price: Number(planFormData.price) || 0,
        category: planFormData.category || 'عام'
      };
      savePlans([...plansList, newPlan]);
    }
    setIsPlanModalOpen(false);
  };

  // Package deletion
  const askDeletePlan = (id: string) => {
    setDeletePlanTargetId(id);
    setShowPlanDeleteConfirm(true);
  };

  const confirmDeletePlan = () => {
    if (deletePlanTargetId) {
      const updated = plansList.filter(p => p.id !== deletePlanTargetId);
      savePlans(updated);
      setShowPlanDeleteConfirm(false);
      setDeletePlanTargetId(null);
    }
  };

  return {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    isModalOpen,
    setIsModalOpen,
    isEdit,
    currentId,
    isPlanModalOpen,
    setIsPlanModalOpen,
    isPlanEdit,
    currentPlanId,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showPlanDeleteConfirm,
    setShowPlanDeleteConfirm,
    plansList,
    savePlans,
    planFormData,
    setPlanFormData,
    formData,
    setFormData,
    currency,
    records,
    isExpiringSoon,
    metrics,
    handlePresetChange,
    handleStartDateChange,
    filteredRecords,
    handleOpenModal,
    handleSave,
    askDelete,
    confirmDelete,
    handleOpenPlanModal,
    handleSavePlan,
    askDeletePlan,
    confirmDeletePlan
  };
};
