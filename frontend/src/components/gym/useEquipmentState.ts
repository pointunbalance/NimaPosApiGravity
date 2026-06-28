import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { EquipmentType, MaintenanceLogType } from './equipmentTypes';

export const useEquipmentState = () => {
  // Navigation / Tabs State
  const [activeTab, setActiveTab] = useState<'directory' | 'scheduler' | 'finance'>('directory');
  
  // Search and Filtering State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals & Panel States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
  
  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Maintenance Details Panel for Selected Equipment
  const [selectedEquipId, setSelectedEquipId] = useState<number | null>(null);
  const [isMaintenancePanelOpen, setIsMaintenancePanelOpen] = useState(false);
  
  // Adding individual Maintenance Log form inside the panel
  const [showAddLogForm, setShowAddLogForm] = useState(false);
  const [logFormData, setLogFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: '',
    paymentMethod: 'cash' as 'cash' | 'bank' | 'on_credit',
    technician: ''
  });

  // Main Equipment Form Data
  const [formData, setFormData] = useState<Partial<EquipmentType>>({
    name: '',
    type: '',
    status: 'يعمل',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: '',
    nextMaintenance: '',
    supervisorId: '',
    supplierName: '',
    supplierPhone: '',
    notes: '',
    maintenanceLogs: []
  });

  const currency = 'EGP';

  // Live Query from Dexie DB
  const records: EquipmentType[] = useLiveQuery(() => db.gymEquipment.toArray()) || [];
  const trainers = useLiveQuery(() => db.gymTrainersList.toArray()) || [];

  // Helper for Toast trigger
  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Safe Double-Entry Ledger Posting Function
  const postMaintenanceJournalEntry = async (
    equipmentName: string, 
    equipId: number, 
    amount: number, 
    description: string, 
    paymentMethod: 'cash' | 'bank' | 'on_credit',
    refCode: string
  ) => {
    try {
      const cashAcc = await db.accounts.where('code').equals('1010').first();
      const bankAcc = await db.accounts.where('code').equals('1020').first();
      const payablesAcc = await db.accounts.where('code').equals('2010').first() || await db.accounts.where('type').equals('liability').first();
      const expenseAcc = await db.accounts.where('code').equals('5060').first() || await db.accounts.where('type').equals('expense').first();

      const debitAccount = expenseAcc;
      let creditAccount = cashAcc;

      if (paymentMethod === 'bank') {
        creditAccount = bankAcc;
      } else if (paymentMethod === 'on_credit') {
        creditAccount = payablesAcc;
      }

      if (debitAccount && creditAccount) {
        await db.journalEntries.add({
          date: new Date(),
          reference: refCode,
          description: `مصاريف صيانة للأصل: ${equipmentName} - ${description}`,
          lines: [
            { 
              accountId: debitAccount.id!, 
              accountName: debitAccount.name, 
              debit: amount, 
              credit: 0, 
              description: `صيانة جهاز رياضي #${equipId}` 
            },
            { 
              accountId: creditAccount.id!, 
              accountName: creditAccount.name, 
              debit: 0, 
              credit: amount, 
              description: `سداد تكلفة صيانة الجهاز - طريقة: ${paymentMethod === 'cash' ? 'نقدية' : paymentMethod === 'bank' ? 'بنكي' : 'آجل على الحساب'}` 
            }
          ],
          totalAmount: amount,
          status: 'posted'
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error("Journal entry post failure:", err);
      return false;
    }
  };

  // Filters & Dynamic properties calculations
  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.type).filter(Boolean)));
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) || 
                            item.type?.toLowerCase().includes(search.toLowerCase()) ||
                            item.serialNumber?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [records, search, statusFilter, typeFilter]);

  // Financial Stats & Chart Data Processing
  const totalExpenditure = useMemo(() => {
    return records.reduce((sum: number, equip) => {
      const logsSum = (equip.maintenanceLogs || []).reduce((s: number, l) => s + (Number(l.cost) || 0), 0);
      return sum + logsSum;
    }, 0);
  }, [records]);

  const statsCore = useMemo(() => {
    return {
      total: records.length,
      active: records.filter((r) => r.status === 'يعمل').length,
      warning: records.filter((r) => r.status === 'تحتاج فحص' || r.status === 'بحاجة لصيانة').length,
      maintenance: records.filter((r) => r.status === 'تحت الصيانة').length,
      broken: records.filter((r) => r.status === 'معطل' || r.status === 'خارج الخدمة').length,
      totalExpenses: totalExpenditure
    };
  }, [records, totalExpenditure]);

  // Recharts Data prep: Costs aggregated by Equipment Type
  const chartDataByClass = useMemo(() => {
    return uniqueTypes.map((t) => {
      const costSum = records
        .filter((r) => r.type === t)
        .reduce((sum: number, equip) => {
          const logsSum = (equip.maintenanceLogs || []).reduce((s: number, l) => s + (Number(l.cost) || 0), 0);
          return sum + logsSum;
        }, 0);
      return { name: t, cost: costSum };
    }).filter((d) => d.cost > 0);
  }, [uniqueTypes, records]);

  // Extract all historical logs recursively with equipment context
  const allLedgerLogs = useMemo(() => {
    return records.flatMap((r) => {
      return (r.maintenanceLogs || []).map((l) => ({
        ...l,
        equipmentName: r.name,
        equipmentId: r.id
      }));
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);

  // Modal Handlers
  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setFormData({
        name: item.name || '',
        type: item.type || '',
        status: item.status || 'يعمل',
        serialNumber: item.serialNumber || '',
        purchaseDate: item.purchaseDate || '',
        purchasePrice: item.purchasePrice || '',
        nextMaintenance: item.nextMaintenance || '',
        supervisorId: item.supervisorId || '',
        supplierName: item.supplierName || '',
        supplierPhone: item.supplierPhone || '',
        notes: item.notes || '',
        maintenanceLogs: item.maintenanceLogs || []
      });
    } else {
      setCurrentId(null);
      setFormData({
        name: '',
        type: '',
        status: 'يعمل',
        serialNumber: '',
        purchaseDate: '',
        purchasePrice: '',
        nextMaintenance: '',
        supervisorId: '',
        supplierName: '',
        supplierPhone: '',
        notes: '',
        maintenanceLogs: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : '',
        supervisorId: formData.supervisorId ? Number(formData.supervisorId) : ''
      } as any;

      if (isEdit && currentId) {
        await db.gymEquipment.update(currentId, dataToSave);
        showToast('تم تحديث بيانات الجهاز بصفة تامة بنجاح', 'success');
      } else {
        await db.gymEquipment.add(dataToSave);
        showToast('تم تسجيل وإضافة الجهاز الرياضي بنجاح بدفتر الأصول', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('خطأ فني أثناء حفظ بيانات السجل المالي للأصل', 'error');
    }
  };

  const askDelete = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'تأكيد شطب واستبعاد الأصل الرياضي',
      message: `هل أنت متأكد من رغبتك في حذف وإيقاف قيد الجهاز: "${name}" بشكل نهائي من الصالة؟ لا يمكن التراجع عن هذا الإجراء لسلامة البيانات.`,
      onConfirm: async () => {
        await db.gymEquipment.delete(id);
        if (selectedEquipId === id) {
          setIsMaintenancePanelOpen(false);
        }
        showToast(`تم حذف وإيقاف الجهاز "${name}" بكفاءة`, 'success');
        setConfirmDialog(null);
      }
    });
  };

  // Open Detailed Maintenance History Panel
  const handleOpenMaintenancePanel = (equipId: number) => {
    setSelectedEquipId(equipId);
    const equip = records.find((r) => r.id === equipId);
    if (equip) {
      setIsMaintenancePanelOpen(true);
      setShowAddLogForm(false);
      setLogFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        cost: '',
        paymentMethod: 'cash',
        technician: ''
      });
    }
  };

  // Add individual maintenance log & execute automatic double-entry accounting hook!
  const handleAddMaintenanceLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipId) return;

    const equip = records.find((r) => r.id === selectedEquipId);
    if (!equip) return;

    try {
      const logCost = Number(logFormData.cost) || 0;
      const refCode = `EQ-MAINT-${equip.id}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Post in general ledger if there is cost
      let ledgerRefString = '';
      if (logCost > 0) {
        const posted = await postMaintenanceJournalEntry(
          equip.name, 
          equip.id!, 
          logCost, 
          logFormData.description, 
          logFormData.paymentMethod,
          refCode
        );
        if (posted) {
          ledgerRefString = refCode;
        }
      }

      // Prepare list of logs
      const currentLogs = equip.maintenanceLogs || [];
      const newLog: MaintenanceLogType = {
        id: `m-log-${Date.now()}`,
        date: logFormData.date,
        description: logFormData.description,
        cost: logCost,
        paymentMethod: logFormData.paymentMethod,
        journalRef: ledgerRefString || undefined,
        technician: logFormData.technician || 'مهندس الصيانة المعتمد'
      };

      const updatedLogs = [...currentLogs, newLog];
      
      // Update status of equipment contextually if they say it works now
      let statusUpdate = equip.status;
      if (logFormData.description.includes('إصلاح') || logFormData.description.includes('جاهز') || logFormData.description.includes('يعمل')) {
        statusUpdate = 'يعمل';
      }

      await db.gymEquipment.update(equip.id!, {
        maintenanceLogs: updatedLogs,
        lastMaintenance: logFormData.date,
        status: statusUpdate
      });

      showToast(
        logCost > 0 
          ? `تم قيد عملية الصيانة بقيمة ${logCost} ${currency}، وتوليد القيد المحاسبي التلقائي ${refCode} باليومية العامة.`
          : 'تم تدوين تقرير الفحص الفني الدوري والوقائي بنجاح.',
        'success'
      );

      // Reset Form State
      setShowAddLogForm(false);
      setLogFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        cost: '',
        paymentMethod: 'cash',
        technician: ''
      });
    } catch (err) {
      console.error(err);
      showToast('فشل أثناء قيد الدفتر التابع لعمليات الصيانة الفنية', 'error');
    }
  };

  const selectedEquipForHistory = useMemo(() => {
    return selectedEquipId ? records.find((r) => r.id === selectedEquipId) : null;
  }, [selectedEquipId, records]);

  return {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    isModalOpen,
    setIsModalOpen,
    isEdit,
    currentId,
    toast,
    setToast,
    confirmDialog,
    setConfirmDialog,
    selectedEquipId,
    setSelectedEquipId,
    isMaintenancePanelOpen,
    setIsMaintenancePanelOpen,
    showAddLogForm,
    setShowAddLogForm,
    logFormData,
    setLogFormData,
    formData,
    setFormData,
    currency,
    records,
    trainers,
    showToast,
    uniqueTypes,
    filteredRecords,
    statsCore,
    chartDataByClass,
    allLedgerLogs,
    handleOpenModal,
    handleSave,
    askDelete,
    handleOpenMaintenancePanel,
    handleAddMaintenanceLogSubmit,
    selectedEquipForHistory
  };
};
