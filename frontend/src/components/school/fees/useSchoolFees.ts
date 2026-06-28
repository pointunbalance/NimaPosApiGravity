import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { useToast } from '../../../context/ToastContext';
import { saveFeeTypeInDb, saveSubscriptionInDb, executeConfirmedFeeActionInDb } from './feeUtils';

export interface FeeType {
  id?: number;
  name: string;
  type: 'tuition' | 'transport' | 'books' | 'activities';
  amount: number;
  isActive: number; // 1 = true, 0 = false
}

export interface StudentSubscription {
  id?: number;
  studentId: number;
  feeTypeId: number;
  totalRequired: number;
  totalPaid: number;
  remainingAmount: number;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid';
  notes?: string;
}

export const useSchoolFees = () => {
  const { success, error } = useToast();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'feetypes'>('subscriptions');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Live Query DB lists
  const feeTypes = useLiveQuery(() => db.schoolFeeTypes.toArray()) || [];
  const subscriptions = useLiveQuery(() => db.studentSubscriptions.toArray()) || [];
  const students = useLiveQuery(() => db.schoolStudents.toArray()) || [];

  // Modals state
  const [feeTypeModalOpen, setFeeTypeModalOpen] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // ConfirmModal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'deleteSub' | 'deleteType', id: number } | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  // Form states
  const [feeTypeForm, setFeeTypeForm] = useState<Partial<FeeType>>({
    name: '',
    type: 'tuition',
    amount: 0,
    isActive: 1
  });

  const [subForm, setSubForm] = useState<Partial<StudentSubscription>>({
    studentId: 0,
    feeTypeId: 0,
    totalRequired: 0,
    dueDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Get helper texts
  const getStudentName = (id: number) => students.find(s => s.id === id)?.name || 'طالب غير معروف';
  const getFeeTypeName = (id: number) => feeTypes.find(f => f.id === id)?.name || 'رسوم غير معروفة';
  const getFeeTypePrice = (id: number) => feeTypes.find(f => f.id === id)?.amount || 0;

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
    const studentName = getStudentName(sub.studentId).toLowerCase();
    const feeName = getFeeTypeName(sub.feeTypeId).toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = studentName.includes(searchLower) || feeName.includes(searchLower);
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter fee types
  const filteredFeeTypes = feeTypes.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Save / Update Fee Type
  const handleSaveFeeType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeTypeForm.name?.trim() || Number(feeTypeForm.amount) <= 0) {
      error('برجاء إدخال بيانات صحيحة ومبلغ أكبر من صفر');
      return;
    }

    try {
      await saveFeeTypeInDb(isEditMode, selectedId, feeTypeForm);
      success(isEditMode ? 'تم تحديث بنية الرسوم بنجاح' : 'تم إضافة نوع الرسوم الجديد بنجاح');
      setFeeTypeModalOpen(false);
      resetFeeTypeForm();
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء حفظ نوع الرسوم');
    }
  };

  // Assign Fee to Student (Subscription)
  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    const studentId = Number(subForm.studentId);
    const feeTypeId = Number(subForm.feeTypeId);
    const amount = Number(subForm.totalRequired);

    if (!studentId || !feeTypeId || amount <= 0) {
      error('برجاء تحديد الطالب ونوع الرسوم والمبلغ المطلوب');
      return;
    }

    try {
      const studentName = getStudentName(studentId);
      const feeName = getFeeTypeName(feeTypeId);

      const res = await saveSubscriptionInDb(subForm, studentName, feeName);
      if (res.accrualPosted) {
        success('تم تسجيل استحقاق الرسوم بنجاح وترحيل القيد الدفتري!');
      } else {
        success('تم تسجيل الرسوم محلياً ومع ذلك تعذر إنشاء الأثر الدفتري التلقائي');
      }

      setSubModalOpen(false);
      resetSubForm();
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء تسجيل استحقاق الرسوم');
    }
  };

  const handleDeleteSub = (id: number) => {
    setConfirmAction({ type: 'deleteSub', id });
    setConfirmTitle('تأكيد إلغاء رسوم الطالب');
    setConfirmMessage('هل أنت متأكد من رغبتك في إلغاء وحذف استحقاق الرسوم هذا للطالب بشكل نهائي؟');
    setIsConfirmOpen(true);
  };

  const handleDeleteFeeType = (id: number) => {
    const isUsed = subscriptions.some(s => s.feeTypeId === id);
    if (isUsed) {
      error('لا يمكن حذف نوع الرسوم لأنه مرتبط باشتراكات طلاب قائمة');
      return;
    }

    setConfirmAction({ type: 'deleteType', id });
    setConfirmTitle('تأكيد حذف نوع الرسوم');
    setConfirmMessage('هل أنت متأكد من رغبتك في حذف هذا النوع من الرسوم المدرسية بشكل نهائي؟');
    setIsConfirmOpen(true);
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    try {
      await executeConfirmedFeeActionInDb(confirmAction);
      success(confirmAction.type === 'deleteSub' ? 'تم حذف استحقاق الرسوم بنجاح' : 'تم حذف نوع الرسوم بنجاح');
    } catch (err) {
      error('حدث خطأ أثناء تنفيذ الإجراء المالي');
    }
    setConfirmAction(null);
    setIsConfirmOpen(false);
  };

  const resetFeeTypeForm = () => {
    setFeeTypeForm({ name: '', type: 'tuition', amount: 0, isActive: 1 });
    setSelectedId(null);
    setIsEditMode(false);
  };

  const resetSubForm = () => {
    setSubForm({
      studentId: 0,
      feeTypeId: 0,
      totalRequired: 0,
      dueDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setSelectedId(null);
    setIsEditMode(false);
  };

  const openEditFeeType = (fee: FeeType) => {
    setFeeTypeForm({ ...fee });
    setSelectedId(fee.id!);
    setIsEditMode(true);
    setFeeTypeModalOpen(true);
  };

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    feeTypes,
    subscriptions,
    students,
    feeTypeModalOpen,
    setFeeTypeModalOpen,
    subModalOpen,
    setSubModalOpen,
    isEditMode,
    selectedId,
    isConfirmOpen,
    setIsConfirmOpen,
    confirmTitle,
    confirmMessage,
    feeTypeForm,
    setFeeTypeForm,
    subForm,
    setSubForm,
    getStudentName,
    getFeeTypeName,
    getFeeTypePrice,
    filteredSubscriptions,
    filteredFeeTypes,
    handleSaveFeeType,
    handleSaveSubscription,
    handleDeleteSub,
    handleDeleteFeeType,
    executeConfirmedAction,
    resetFeeTypeForm,
    resetSubForm,
    openEditFeeType,
  };
};
