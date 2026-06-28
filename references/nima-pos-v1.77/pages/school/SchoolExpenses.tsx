import React from 'react';
import { X } from 'lucide-react';
import { useSchoolExpenses } from '../../components/school/expenses/useSchoolExpenses';
import SchoolExpenseModal from '../../components/school/expenses/SchoolExpenseModal';
import SchoolExpensesStats from '../../components/school/expenses/SchoolExpensesStats';
import SchoolExpensesTrendChart from '../../components/school/expenses/SchoolExpensesTrendChart';
import SchoolExpensesList from '../../components/school/expenses/SchoolExpensesList';
import SchoolExpensesHeader from '../../components/school/expenses/SchoolExpensesHeader';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const SchoolExpenses: React.FC = () => {
  const {
    isModalOpen,
    viewImage,
    setViewImage,
    expenseToEdit,
    duplicateExpense,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    dateRange,
    setDateRange,
    filteredExpenses,
    stats,
    chartData,
    trendData,
    deleteExpense,
    confirmDeleteExpense,
    handleApprove,
    handleReject,
    handleDuplicate,
    handleQuickAdd,
    openModal,
    closeModal,
    handleExportCSV,
    formatCurrency,
    formatDate,
    getCategoryLabel,
    getCategoryPercentage,
  } = useSchoolExpenses();

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50/50 font-['Tajawal']" dir="rtl">
      <SchoolExpensesHeader
        handleExportCSV={handleExportCSV}
        openModal={() => openModal()}
        handleQuickAdd={handleQuickAdd}
      />

      <SchoolExpensesStats stats={stats} chartData={chartData} formatCurrency={formatCurrency} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <SchoolExpensesTrendChart
          trendData={trendData}
          dateRange={dateRange}
          setDateRange={setDateRange}
          formatCurrency={formatCurrency}
        />

        <SchoolExpensesList
          filteredExpenses={filteredExpenses}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          getCategoryLabel={getCategoryLabel}
          getCategoryPercentage={getCategoryPercentage}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          handleDuplicate={handleDuplicate}
          openModal={openModal}
          deleteExpense={deleteExpense}
          setViewImage={setViewImage}
          handleApprove={handleApprove}
          handleReject={handleReject}
        />
      </div>

      <SchoolExpenseModal
        isOpen={isModalOpen}
        onClose={closeModal}
        expenseToEdit={expenseToEdit}
        duplicateExpense={duplicateExpense}
      />

      {viewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setViewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={viewImage}
              alt="Receipt Full"
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
            />
            <button
              className="absolute -top-4 -right-4 bg-white text-black p-2 rounded-full shadow-lg"
              type="button"
              onClick={() => setViewImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="تأكيد حذف المصروف المدرسي"
        message="هل أنت متأكد من رغبتك في حذف هذا المصروف بشكل نهائي؟"
        onConfirm={confirmDeleteExpense}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        confirmText="نعم، حذف السجل"
        cancelText="إلغاء وتراجع"
      />
    </div>
  );
};

export default SchoolExpenses;
