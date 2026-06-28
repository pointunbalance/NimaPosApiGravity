import React from 'react';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { JournalEntriesHeader } from '../../components/accounting/JournalEntriesHeader';
import { JournalEntriesSummary } from '../../components/accounting/JournalEntriesSummary';
import { JournalEntriesFilters } from '../../components/accounting/JournalEntriesFilters';
import { JournalEntriesTable } from '../../components/accounting/JournalEntriesTable';
import { JournalEntryViewModal } from '../../components/accounting/JournalEntryViewModal';
import { JournalEntryEditModal } from '../../components/accounting/JournalEntryEditModal';
import { useJournalEntriesData } from '../../components/accounting/useJournalEntriesData';
import { useJournalEntriesActions } from '../../components/accounting/useJournalEntriesActions';

const JournalEntries: React.FC = () => {
  const { success, error } = useToast();
  const data = useJournalEntriesData();
  const actions = useJournalEntriesActions(
    data.accounts,
    data.journals,
    data.filteredJournals,
    data.isDateClosed,
    data.settings,
    success,
    error
  );

  return (
    <div
      className="p-8 h-full overflow-y-auto bg-slate-50/50 font-['Tajawal'] print:p-0 print:bg-white"
      dir="rtl"
    >
      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
        <h2 className="text-2xl font-bold print:text-black">
          {data.settings?.storeName || 'Nima POS'}
        </h2>
        <h3 className="text-xl font-bold mt-2 print:text-black">
          قائمة قيود اليومية
        </h3>
        <p className="text-sm mt-2 print:text-black">
          الفترة من: {new Date(data.dateRange.start).toLocaleDateString('ar-EG')} إلى{' '}
          {new Date(data.dateRange.end).toLocaleDateString('ar-EG')}
        </p>
        <p className="text-sm mt-1 print:text-black">
          تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}
        </p>
      </div>

      <JournalEntriesHeader
        onNewEntry={() => actions.openModal()}
        onExportCSV={actions.handleExportCSV}
        onPrintList={() => window.print()}
        isExportDisabled={data.filteredJournals.length === 0}
      />

      <div className="print:hidden">
        <JournalEntriesSummary
          filteredJournals={data.filteredJournals}
          formatCurrency={data.formatCurrency}
        />
      </div>

      <JournalEntriesFilters
        searchTerm={data.searchTerm}
        setSearchTerm={data.setSearchTerm}
        statusFilter={data.statusFilter}
        setStatusFilter={data.setStatusFilter}
        dateRange={data.dateRange}
        setDateRange={data.setDateRange}
        setQuickDate={data.setQuickDate}
      />

      <JournalEntriesTable
        filteredJournals={data.filteredJournals}
        formatCurrency={data.formatCurrency}
        onView={(entry) => actions.setViewEntry(entry)}
        onPrint={actions.printVoucher}
        onDuplicate={actions.handleDuplicateEntry}
        onEdit={actions.openModal}
        onReverse={actions.handleReverseEntry}
        onDelete={actions.deleteEntry}
      />

      <JournalEntryViewModal
        viewEntry={actions.viewEntry}
        onClose={() => actions.setViewEntry(null)}
        onPrint={actions.printVoucher}
        formatCurrency={data.formatCurrency}
        costCenters={data.costCenters}
      />

      <JournalEntryEditModal
        isOpen={actions.isModalOpen}
        onClose={actions.closeModal}
        editingEntry={actions.editingEntry}
        accounts={data.accounts}
        costCenters={data.costCenters}
        onSubmit={actions.handleSave}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={actions.isConfirmDeleteOpen}
        title="تأكيد حذف القيد"
        message="هل أنت متأكد من حذف هذا القيد؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={actions.executeDeleteEntry}
        onCancel={() => {
          actions.setIsConfirmDeleteOpen(false);
          actions.setEntryToDeleteId(null);
        }}
        confirmText="نعم، احذف"
        cancelText="تراجع"
      />

      {/* Reverse Entry Confirmation Modal */}
      <ConfirmModal
        isOpen={actions.isConfirmReverseOpen}
        title="تأكيد القيد العكسي"
        message="هل أنت متأكد من إنشاء قيد عكسي لهذا القيد المالي؟ سيتم إلغاء تأثير المعاملة الأصلية محاسبياً بقيد معادل."
        onConfirm={actions.executeReverseEntry}
        onCancel={() => {
          actions.setIsConfirmReverseOpen(false);
          actions.setEntryToReverse(null);
        }}
        confirmText="إنشاء قيد عكسي"
        cancelText="تراجع"
      />
    </div>
  );
};

export default JournalEntries;
