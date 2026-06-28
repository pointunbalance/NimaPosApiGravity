import { db } from '../../../db';
import { FeeType, StudentSubscription } from './useSchoolFees';
import { AccountingEngine } from '../../../services/AccountingEngine';

export async function saveFeeTypeInDb(isEditMode: boolean, selectedId: number | null, feeTypeForm: Partial<FeeType>) {
  const dataToSave = {
    name: feeTypeForm.name!,
    type: feeTypeForm.type || 'tuition',
    amount: Number(feeTypeForm.amount),
    isActive: Number(feeTypeForm.isActive)
  };

  if (isEditMode && selectedId) {
    await db.schoolFeeTypes.update(selectedId, dataToSave);
  } else {
    await db.schoolFeeTypes.add(dataToSave);
  }
}

export async function saveSubscriptionInDb(subForm: Partial<StudentSubscription>, studentName: string, feeTypeName: string) {
  const amount = Number(subForm.totalRequired);
  const studentId = Number(subForm.studentId);
  const feeTypeId = Number(subForm.feeTypeId);

  const subId = await db.studentSubscriptions.add({
    studentId,
    feeTypeId,
    totalRequired: amount,
    totalPaid: 0,
    remainingAmount: amount,
    dueDate: subForm.dueDate || new Date().toISOString().split('T')[0],
    status: 'unpaid',
    notes: subForm.notes
  });

  // Unified Accrual Accounting integration
  try {
    const arAccount = await db.accounts.where('code').equals('1030').first();
    const revenueAccount = await db.accounts.where('code').equals('4010').first();

    if (arAccount && revenueAccount) {
      await AccountingEngine.postEntry({
        date: new Date(),
        reference: `SCH-ACCR-${subId}`,
        description: `قيد استحقاق تلقائي للرسوم الدراسية - الطالب: ${studentName} - باقة: ${feeTypeName}`,
        lines: [
          {
            accountId: arAccount.id!,
            accountName: arAccount.name,
            debit: amount,
            credit: 0,
            description: `ذمة مستحقة على الطالب ${studentName}`
          },
          {
            accountId: revenueAccount.id!,
            accountName: revenueAccount.name,
            debit: 0,
            credit: amount,
            description: `إيراد رسوم دراسية مستحق - ${feeTypeName}`
          }
        ],
        ignoreClosedPeriod: true
      });
      return { success: true, accrualPosted: true };
    }
  } catch (acctErr) {
    console.error("Accrual Journal Entry creation failed:", acctErr);
    return { success: true, accrualPosted: false };
  }
  return { success: true, accrualPosted: false };
}

export async function executeConfirmedFeeActionInDb(confirmAction: { type: 'deleteSub' | 'deleteType', id: number }) {
  if (confirmAction.type === 'deleteSub') {
    await db.studentSubscriptions.delete(confirmAction.id);
  } else if (confirmAction.type === 'deleteType') {
    await db.schoolFeeTypes.delete(confirmAction.id);
  }
}
