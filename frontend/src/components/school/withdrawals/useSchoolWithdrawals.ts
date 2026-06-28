import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { format } from 'date-fns';

export const useSchoolWithdrawals = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const withdrawals = useLiveQuery(() => db.schoolWithdrawals?.toArray()) || [];
  const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
  const classes = useLiveQuery(() => db.schoolClassesList?.toArray()) || [];

  const activeStudents = students.filter(
    (s) => s.status === 'نشط' || s.status === 'متوقف'
  );

  const [form, setForm] = useState({
    studentId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
    hasDebt: false,
    debtAmount: 0,
    hasRefund: false,
    refundAmount: 0,
    refundMethod: 'cash',
    notes: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.schoolWithdrawals.add({
      ...form,
      debtAmount: form.hasDebt ? Number(form.debtAmount) : 0,
      refundAmount: form.hasRefund ? Number(form.refundAmount) : 0,
      status: 'pending', // Pending management decision
      managementDecision: '',
      createdAt: new Date().toISOString(),
    });
    setIsCreateModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({
      studentId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      reason: '',
      hasDebt: false,
      debtAmount: 0,
      hasRefund: false,
      refundAmount: 0,
      refundMethod: 'cash',
      notes: '',
    });
  };

  const executeStatusUpdate = async (
    id: number,
    studentId: number,
    status: 'approved' | 'rejected',
    hasRefund: boolean,
    refundAmount: number,
    refundMethod: string,
  ) => {
    await db.schoolWithdrawals.update(id, {
      status,
      managementDecision: status === 'approved' ? 'موافق عليه' : 'مرفوض',
      decisionDate: new Date().toISOString(),
    });

    if (status === 'approved') {
      // Update student status
      await db.schoolStudents.update(studentId, { status: 'منسحب' });

      // Process refund if applicable
      if (hasRefund && refundAmount > 0) {
        const student = students.find((s) => s.id === studentId);
        await db.treasuryTransactions.add({
          type: 'outflow',
          amount: Number(refundAmount),
          date: new Date().toISOString(),
          category: 'expenses',
          description: `استرداد رسوم بسبب انسحاب الطالب: ${student?.name || 'بدون اسم'}`,
          paymentMethod: refundMethod as any,
          status: 'completed',
          studentId: studentId,
          receiptNumber: `REF-${Date.now()}`,
        });

        // Auto Accounting Integration (Journal Entry)
        try {
          const { AccountingEngine } = await import('../../../services/AccountingEngine');
          const creditAccountCode = refundMethod === 'cash' ? '1010' : '1020';
          const creditAccount = await db.accounts.where('code').equals(creditAccountCode).first();
          const expenseAccount = await db.accounts.where('code').equals('5020').first();

          if (creditAccount && expenseAccount) {
            await AccountingEngine.postEntry({
              date: new Date(),
              reference: `WD-${id}`,
              description: `استرداد رسوم الطالب المنسحب: ${student?.name || ''}`,
              lines: [
                {
                  accountId: expenseAccount.id!,
                  accountName: expenseAccount.name,
                  debit: Number(refundAmount),
                  credit: 0,
                  description: 'مصروف رد رسوم للانسحاب',
                },
                {
                  accountId: creditAccount.id!,
                  accountName: creditAccount.name,
                  debit: 0,
                  credit: Number(refundAmount),
                  description: `رد المبلغ للانسحاب`,
                },
              ],
              ignoreClosedPeriod: true,
            });
          }
        } catch (err) {
          console.error('Failed to post automatic journal entry for withdrawal refund:', err);
        }
      }
    }
  };

  const updateStatus = (
    id: number,
    studentId: number,
    status: 'approved' | 'rejected',
    hasRefund: boolean,
    refundAmount: number,
    refundMethod: string,
  ) => {
    const title = status === 'approved' ? 'الموافقة على الانسحاب' : 'رفض الطلب';
    const message =
      status === 'approved'
        ? 'هل أنت متأكد من الموافقة على الانسحاب؟ سيتم تغيير حالة الطالب إلى "منسحب" ورد المستحقات المالية إن وجدت.'
        : 'هل أنت متأكد من رفض طلب الانسحاب؟';

    setConfirmConfig({
      title,
      message,
      onConfirm: () => {
        executeStatusUpdate(id, studentId, status, hasRefund, refundAmount, refundMethod);
      },
    });
    setIsConfirmOpen(true);
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (filterStatus !== 'all' && w.status !== filterStatus) return false;

    const student = students.find((s) => s.id === Number(w.studentId));
    if (
      searchQuery &&
      student &&
      !student.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return {
    isCreateModalOpen,
    setIsCreateModalOpen,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    withdrawals,
    students,
    classes,
    activeStudents,
    form,
    setForm,
    handleCreate,
    resetForm,
    updateStatus,
    filteredWithdrawals,
    isConfirmOpen,
    setIsConfirmOpen,
    confirmConfig,
  };
};

export default useSchoolWithdrawals;
