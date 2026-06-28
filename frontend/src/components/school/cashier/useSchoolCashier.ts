import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { AccountingEngine } from '../../../services/AccountingEngine';
import { useToast } from '../../../context/ToastContext';
import {
  getStudentName as getStudentNameUtil,
  getFeeTypeName as getFeeTypeNameUtil,
  calculateExpectedCash,
  calculateCardPayments,
  calculateCashIn,
  calculateCashOut,
  saveStudentPayment,
  saveGeneralTransaction,
} from './cashierUtils';

export const useSchoolCashier = () => {
  const { success, error } = useToast();
  const [currentShiftId, setCurrentShiftId] = useState<number | null>(null);

  const shifts = useLiveQuery(() => db.shifts?.toArray()) || [];
  const activeShift = shifts.find(s => s.status === 'open');

  const teachers = useLiveQuery(() => db.schoolTeachers?.toArray()) || [];
  const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
  const feeTypes = useLiveQuery(() => db.schoolFeeTypes?.toArray()) || [];
  const subscriptions = useLiveQuery(() => db.studentSubscriptions?.toArray()) || [];
  const allPayments = useLiveQuery(() => db.studentPayments?.toArray()) || [];
  const allTreasury = useLiveQuery(() => db.treasuryTransactions?.toArray()) || [];

  // Start Shift State Modals
  const [startShiftModalOpen, setStartShiftModalOpen] = useState(false);
  const [startCashValue, setStartCashValue] = useState('0');

  // Close Shift State Modals
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false);
  const [actualCashValue, setActualCashValue] = useState('0');

  // Derived shift operations
  const shiftPayments = activeShift
    ? allPayments.filter(p => new Date(p.paymentDate) >= new Date(activeShift.startTime))
    : [];

  const shiftGeneralOps = activeShift
    ? allTreasury.filter(t => new Date(t.date) >= new Date(activeShift.startTime))
    : [];

  const [activeTab, setActiveTab] = useState<'receive' | 'expenses' | 'log' | 'report'>('receive');

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState<any>({
    studentId: 0, subscriptionId: 0, amount: 0, paymentMethod: 'cash', notes: ''
  });

  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionFormData, setTransactionFormData] = useState<any>({
    type: 'outflow', amount: 0, description: '', category: 'other', paymentMethod: 'cash'
  });

  const getStudentName = (id: number) => getStudentNameUtil(students, id);
  const getFeeTypeName = (id: number) => getFeeTypeNameUtil(feeTypes, id);

  // Modal-driven shift control functions
  const handleStartShiftClick = () => {
    if (activeShift) {
      error('توجد وردية كاشير مفتوحة بالفعل');
      return;
    }
    setStartCashValue('0');
    setStartShiftModalOpen(true);
  };

  const handleCloseShiftClick = () => {
    if (!activeShift) return;
    const expected = currentExpectedCash();
    setActualCashValue(expected.toString());
    setCloseShiftModalOpen(true);
  };

  const currentExpectedCash = () => calculateExpectedCash(activeShift, shiftPayments, shiftGeneralOps);

  const executeStartShift = async () => {
    try {
      const startCash = Number(startCashValue) || 0;
      await db.shifts.add({
        startTime: new Date(),
        startCash,
        cashSales: 0,
        cardSales: 0,
        shiftExpenses: [],
        expectedCash: startCash,
        status: 'open'
      });
      setStartShiftModalOpen(false);
      success('تم فتح وردية كاشير جديدة بنجاح');
    } catch (err) {
      console.error(err);
      error('فشل فتح الوردية');
    }
  };

  const executeCloseShift = async () => {
    if (!activeShift) return;
    try {
      const expected = currentExpectedCash();
      const actualCash = Number(actualCashValue) || 0;
      const difference = actualCash - expected;

      await db.shifts.update(activeShift.id!, {
        endTime: new Date(),
        expectedCash: expected,
        actualCash: actualCash,
        difference: difference,
        status: 'closed'
      });

      setCloseShiftModalOpen(false);
      success('تم إغلاق يومية الكاشير بنجاح وتوثيق الفوارق المادية حركياً');
    } catch (err) {
      console.error(err);
      error('فشل إغلاق الوردية');
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) {
      error('برجاء فتح يومية أولاً');
      return;
    }

    try {
      const studentName = getStudentName(Number(paymentFormData.studentId));
      const feeName = paymentFormData.subscriptionId
        ? getFeeTypeName(subscriptions.find(s => s.id === Number(paymentFormData.subscriptionId))?.feeTypeId || 0)
        : 'دفعة رسوم عامة';

      await saveStudentPayment(paymentFormData, subscriptions, studentName, feeName);

      success('تم تسجيل الدفعة بنجاح وإصدار إيصال القبض');
      setPaymentModalOpen(false);
      setPaymentFormData({ studentId: 0, subscriptionId: 0, amount: 0, paymentMethod: 'cash', notes: '' });
    } catch (err) {
      console.error(err);
      error('فشل حفظ الدفعة الدراسية');
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) {
      error('برجاء فتح يومية أولاً');
      return;
    }

    try {
      await saveGeneralTransaction(transactionFormData);

      success('تم تسجيل المعاملة المالية وتحديث الخزينة بنجاح');
      setTransactionModalOpen(false);
      setTransactionFormData({ type: 'outflow', amount: 0, description: '', category: 'other', paymentMethod: 'cash' });
    } catch (err) {
      console.error(err);
      error('فشل حفظ المعاملة');
    }
  };

  const totalCardPayments = calculateCardPayments(shiftPayments, shiftGeneralOps);

  const totalCashIn = calculateCashIn(shiftPayments, shiftGeneralOps);

  const totalCashOut = calculateCashOut(shiftGeneralOps);

  const currentCashInDrawer = (activeShift?.startCash || 0) + totalCashIn - totalCashOut;

  return {
    activeShift,
    shifts,
    teachers,
    students,
    feeTypes,
    subscriptions,
    allPayments,
    allTreasury,
    startShiftModalOpen,
    setStartShiftModalOpen,
    startCashValue,
    setStartCashValue,
    closeShiftModalOpen,
    setCloseShiftModalOpen,
    actualCashValue,
    setActualCashValue,
    shiftPayments,
    shiftGeneralOps,
    activeTab,
    setActiveTab,
    paymentModalOpen,
    setPaymentModalOpen,
    paymentFormData,
    setPaymentFormData,
    transactionModalOpen,
    setTransactionModalOpen,
    transactionFormData,
    setTransactionFormData,
    getStudentName,
    getFeeTypeName,
    handleStartShiftClick,
    handleCloseShiftClick,
    currentExpectedCash,
    executeStartShift,
    executeCloseShift,
    handleSavePayment,
    handleSaveTransaction,
    totalCardPayments,
    totalCashIn,
    totalCashOut,
    currentCashInDrawer,
  };
};
