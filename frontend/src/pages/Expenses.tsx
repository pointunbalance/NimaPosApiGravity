import React from 'react';
import { X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ExpenseModal from '../components/expenses/ExpenseModal';
import ExpensesStats from '../components/expenses/ExpensesStats';
import ExpensesTrendChart from '../components/expenses/ExpensesTrendChart';
import ExpensesList from '../components/expenses/ExpensesList';
import ExpensesHeader from '../components/expenses/ExpensesHeader';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useExpensesData, getCategoryLabel } from '../components/expenses/useExpensesData';
import { useExpensesActions } from '../components/expenses/useExpensesActions';

const Expenses: React.FC = () => {
  const { success, error } = useToast();
  const expData = useExpensesData();
  const expActions = useExpensesActions(
    expData.filteredExpenses,
    expData.dateRange,
    success,
    error
  );

  return (
    <div className="p-8 h-full overflow-y-auto bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
      
      <ExpensesHeader 
        handleExportCSV={expActions.handleExportCSV} 
        openModal={() => expActions.openModal()} 
        handleQuickAdd={expActions.handleQuickAdd} 
      />

      <ExpensesStats 
        stats={expData.stats} 
        chartData={expData.chartData} 
        formatCurrency={expData.formatCurrency} 
      />

      {/* Main Content: Chart & List */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          <ExpensesTrendChart 
            trendData={expData.trendData} 
            dateRange={expData.dateRange} 
            setDateRange={expData.setDateRange} 
            formatCurrency={expData.formatCurrency} 
          />

          <ExpensesList 
            filteredExpenses={expData.filteredExpenses}
            searchTerm={expData.searchTerm}
            setSearchTerm={expData.setSearchTerm}
            filterCategory={expData.filterCategory}
            setFilterCategory={expData.setFilterCategory}
            getCategoryLabel={getCategoryLabel}
            getCategoryPercentage={expData.getCategoryPercentage}
            formatCurrency={expData.formatCurrency}
            formatDate={expData.formatDate}
            handleDuplicate={expActions.handleDuplicate}
            openModal={expActions.openModal}
            deleteExpense={expActions.deleteExpense}
            setViewImage={expActions.setViewImage}
            handleApprove={expActions.handleApprove}
            handleReject={expActions.handleReject}
          />
      </div>

      <ExpenseModal 
        isOpen={expActions.isModalOpen} 
        onClose={expActions.closeModal} 
        expenseToEdit={expActions.expenseToEdit} 
        duplicateExpense={expActions.duplicateExpense} 
      />

      {/* Image Preview Modal */}
      {expActions.viewImage && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => expActions.setViewImage(null)}>
              <div className="relative max-w-3xl max-h-[90vh]">
                  <img src={expActions.viewImage} alt="Receipt Full" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
                  <button className="absolute -top-4 -right-4 bg-white text-black p-2 rounded-full shadow-lg" onClick={() => expActions.setViewImage(null)}>
                      <X className="w-6 h-6" />
                  </button>
              </div>
          </div>
      )}

      <ConfirmModal
        isOpen={expActions.isDeleteConfirmOpen}
        title="حذف المصروف"
        message="هل أنت متأكد من حذف هذا البند الخدمي/المصروف؟ سيتم إزالة السجل نهائياً وتحديث النقدية المتوقعة في الوردية النشطة إذا تطلب ذلك."
        onConfirm={expActions.executeDeleteExpense}
        onCancel={() => {
          expActions.setIsDeleteConfirmOpen(false);
          expActions.setExpenseToDeleteId(null);
        }}
        confirmText="نعم، احذف"
        cancelText="تراجع"
      />
    </div>
  );
};

export default Expenses;
