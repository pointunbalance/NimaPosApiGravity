import { useState } from 'react';
import { db } from '../../db';
import { JournalEntry, Account, CostCenter } from '../../types';
import { AccountingEngine } from '../../services/AccountingEngine';
import { JournalEntryFormData } from './journalEntrySchema';

export const useJournalEntriesActions = (
  accounts: Account[] | undefined,
  journals: JournalEntry[] | undefined,
  filteredJournals: JournalEntry[],
  isDateClosed: (date: string | Date) => boolean,
  settings: any,
  success: (msg: string) => void,
  error: (msg: string) => void
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null);

  // Form / Editing State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Deletion Confirm State
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [entryToDeleteId, setEntryToDeleteId] = useState<number | null>(null);

  // Reverse Entry Confirm State
  const [isConfirmReverseOpen, setIsConfirmReverseOpen] = useState(false);
  const [entryToReverse, setEntryToReverse] = useState<JournalEntry | null>(null);

  const handleSave = async (data: JournalEntryFormData, attachment?: string) => {
    try {
      if (isDateClosed(data.date)) {
        error('لا يمكن إضافة أو تعديل قيود في سنة مالية مغلقة.');
        return;
      }
      
      if (editingId) {
        const existingEntry = journals?.find(j => j.id === editingId);
        if (existingEntry && isDateClosed(existingEntry.date)) {
          error('القيد الأصلي يقع في سنة مالية مغلقة، لا يمكن تعديله.');
          return;
        }
      }

      const linesWithNames = data.lines.map((l) => ({
        ...l,
        accountName: accounts?.find((a) => a.id === l.accountId)?.name,
      }));

      let totalDebit = 0;
      let totalCredit = 0;
      linesWithNames.forEach((l) => {
        totalDebit += Number(l.debit) || 0;
        totalCredit += Number(l.credit) || 0;
      });

      if (Math.abs(totalDebit - totalCredit) > 0.001) {
        error('القيد غير متوازن، يرجى التحقق من تساوي إجمالي المدين والدائن.');
        return;
      }

      if (editingId) {
        await db.journalEntries.put({
          date: new Date(data.date),
          description: data.description,
          reference: data.reference,
          lines: linesWithNames,
          totalAmount: totalDebit,
          status: data.status,
          id: editingId,
        });

        await db.auditLogs.add({
          userId: '1',
          userName: 'مدير النظام',
          action: 'update',
          module: 'journal',
          details: `تعديل القيد المحاسبي رقم #${editingId}`,
          timestamp: new Date().toISOString(),
        });
        success('تم تعديل القيد بنجاح');
      } else {
        await AccountingEngine.postEntry({
          date: new Date(data.date),
          description: data.description,
          reference: data.reference,
          lines: linesWithNames,
        });
        success('تم تسجيل القيد بنجاح');
      }

      closeModal();
    } catch (e: any) {
      console.error(e);
      error(e.message || 'خطأ في الحفظ');
    }
  };

  const handleReverseEntry = (entry: JournalEntry) => {
    if (isDateClosed(entry.date)) {
      error('لا يمكن عكس قيد يقع في سنة مالية مغلقة.');
      return;
    }
    setEntryToReverse(entry);
    setIsConfirmReverseOpen(true);
  };

  const executeReverseEntry = async () => {
    if (!entryToReverse) return;
    try {
      const reversedLines = entryToReverse.lines.map((l) => ({
        accountId: l.accountId,
        accountName: l.accountName,
        debit: l.credit,
        credit: l.debit,
        description: l.description,
        costCenterId: l.costCenterId,
      }));

      await AccountingEngine.postEntry({
        date: new Date(),
        description: `عكس قيد رقم #${entryToReverse.id} - ${entryToReverse.description}`,
        reference: `REV-${entryToReverse.id}`,
        lines: reversedLines,
      });
      success('تم إنشاء القيد العكسي بنجاح');
    } catch (e: any) {
      console.error(e);
      error(e.message || 'حدث خطأ أثناء إنشاء القيد العكسي');
    } finally {
      setIsConfirmReverseOpen(false);
      setEntryToReverse(null);
    }
  };

  const handleDuplicateEntry = (entry: JournalEntry) => {
    setEditingId(null);
    setEditingEntry({
      ...entry,
      id: undefined,
      description: `نسخة من: ${entry.description}`,
      reference: '',
      status: 'draft',
      date: new Date(),
    });
    setIsModalOpen(true);
  };

  const deleteEntry = (id: number) => {
    const entry = journals?.find((j) => j.id === id);
    if (entry && isDateClosed(entry.date)) {
      error('لا يمكن حذف قيد يقع في سنة مالية مغلقة.');
      return;
    }
    if (entry && entry.status === 'posted') {
      error('لا يمكن حذف قيد مالي مرحل. قم بعكس القيد بدلاً من الحذف للحفاظ على السجل المالي.');
      return;
    }
    setEntryToDeleteId(id);
    setIsConfirmDeleteOpen(true);
  };

  const executeDeleteEntry = async () => {
    if (!entryToDeleteId) return;
    try {
      await db.journalEntries.delete(entryToDeleteId);
      await db.auditLogs.add({
        userId: '1',
        userName: 'مدير النظام',
        action: 'delete',
        module: 'journal',
        details: `حذف القيد المحاسبي رقم #${entryToDeleteId}`,
        timestamp: new Date().toISOString(),
      });
      success('تم حذف القيد المحاسبي بنجاح.');
    } catch (e: any) {
      console.error(e);
      error('حدث خطأ أثناء الحذف.');
    } finally {
      setIsConfirmDeleteOpen(false);
      setEntryToDeleteId(null);
    }
  };

  const openModal = (entry?: JournalEntry) => {
    if (entry) {
      if (entry.status === 'posted') {
        error('لا يمكن تعديل قيد مالي مرحل. يتم التعديل فقط للقيود بالمسودة.');
        return;
      }
      setEditingId(entry.id!);
      setEditingEntry(entry);
    } else {
      setEditingId(null);
      setEditingEntry(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setEditingEntry(null);
  };

  const handleExportCSV = () => {
    if (!filteredJournals || filteredJournals.length === 0) return;

    const headers = [
      'رقم القيد',
      'التاريخ',
      'البيان',
      'المرجع',
      'الإجمالي',
      'الحالة',
    ];
    const rows = filteredJournals.map((j) => [
      j.id,
      new Date(j.date).toLocaleDateString(),
      `"${j.description.replace(/"/g, '""')}"`,
      `"${j.reference || ''}"`,
      j.totalAmount,
      j.status === 'posted' ? 'مرحل' : 'مسودة',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Journal_Entries_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const printVoucher = (entry: JournalEntry) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const html = `
      <html dir="rtl"><head><title>سند قيد #${entry.id}</title>
      <style>body { font-family: Tahoma, sans-serif; padding: 20px; } .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; } .info { display: flex; justify-content: space-between; margin-bottom: 20px; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: center; } th { background-color: #f5f5f5; } .footer { margin-top: 40px; display: flex; justify-content: space-around; }</style>
      </head><body><div class="header"><h2>${settings?.storeName || 'Nima POS'}</h2><h3>سند قيد يومية (Journal Voucher)</h3></div>
      <div class="info"><div><strong>رقم القيد:</strong> #${entry.id}</div><div><strong>التاريخ:</strong> ${new Date(entry.date).toLocaleDateString()}</div><div><strong>المرجع:</strong> ${entry.reference || '-'}</div></div>
      <p><strong>البيان:</strong> ${entry.description}</p>
      <table><thead><tr><th>الحساب</th><th>البيان الفرعي</th><th>مدين</th><th>دائن</th></tr></thead><tbody>
      ${entry.lines.map(l => `
        <tr><td style="text-align: right;">${l.accountName}</td><td style="text-align: right;">${l.description || '-'}</td>
        <td>${l.debit > 0 ? l.debit.toLocaleString() : '-'}</td><td>${l.credit > 0 ? l.credit.toLocaleString() : '-'}</td></tr>
      `).join('')}
      <tr style="font-weight: bold; background-color: #eee;"><td colspan="2">الإجمالي</td><td>${entry.totalAmount.toLocaleString()}</td><td>${entry.totalAmount.toLocaleString()}</td></tr>
      </tbody></table><div class="footer"><div>المحاسب</div><div>المدير المالي</div><div>المدير العام</div></div><script>window.print();</script></body></html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return {
    isModalOpen,
    setIsModalOpen,
    viewEntry,
    setViewEntry,
    editingId,
    setEditingId,
    editingEntry,
    setEditingEntry,
    isConfirmDeleteOpen,
    setIsConfirmDeleteOpen,
    isConfirmReverseOpen,
    setIsConfirmReverseOpen,
    entryToReverse,
    setEntryToReverse,
    setEntryToDeleteId,
    handleSave,
    handleReverseEntry,
    executeReverseEntry,
    handleDuplicateEntry,
    deleteEntry,
    executeDeleteEntry,
    openModal,
    closeModal,
    handleExportCSV,
    printVoucher,
  };
};
