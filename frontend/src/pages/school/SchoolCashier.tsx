import React from 'react';
import { SchoolPaymentModal } from '../../components/school/cashier/SchoolPaymentModal';
import { SchoolTransactionModal } from '../../components/school/cashier/SchoolTransactionModal';
import { StartShiftModal, CloseShiftModal } from '../../components/school/cashier/SchoolShiftModals';
import { useSchoolCashier } from '../../components/school/cashier/useSchoolCashier';
import { ReceiveTab } from '../../components/school/cashier/ReceiveTab';
import { ExpensesTab } from '../../components/school/cashier/ExpensesTab';
import { ShiftLogTab } from '../../components/school/cashier/ShiftLogTab';
import { Wallet, Play, Square, Clock, Receipt, Banknote, FileText } from 'lucide-react';

export const SchoolCashier = () => {
  const {
    activeShift,
    students,
    subscriptions,
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
  } = useSchoolCashier();

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">الخزنة والمدفوعات</h1>
          <p className="text-slate-500 mt-1">إدارة يومية الكاشير، قبض الاشتراكات، وتسجيل المصروفات والإيرادات</p>
        </div>

        {activeShift ? (
          <button
            onClick={handleCloseShiftClick}
            type="button"
            className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-900 shadow-md transition-all"
          >
            <Square className="w-5 h-5 fill-current" /> إغلاق اليومية
          </button>
        ) : (
          <button
            onClick={handleStartShiftClick}
            type="button"
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-md transition-all"
          >
            <Play className="w-5 h-5 fill-current" /> فتح يومية جديدة
          </button>
        )}
      </div>

      {!activeShift ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[50vh] shadow-sm">
          <Wallet className="w-24 h-24 text-slate-200 mb-6" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">لا توجد يومية مفتوحة</h2>
          <p className="text-slate-500 max-w-md font-medium mb-8">
            يجب عليك فتح يومية كاشير جديدة للتمكن من تسجيل المدفوعات والاشتراكات والمصروفات.
          </p>
          <button
            onClick={handleStartShiftClick}
            type="button"
            className="px-8 py-4 bg-emerald-600 text-white text-lg rounded-2xl font-black shadow-xl shadow-emerald-600/20 hover:scale-105 transition-transform flex items-center gap-3"
          >
            <Play className="w-6 h-6 fill-current" /> فتح درج الكاشير وبدء العمل
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
              <div className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-1">
                <Clock className="w-4 h-4" /> بداية الوردية
              </div>
              <div className="text-xl font-black text-slate-800">
                {new Date(activeShift.startTime).toLocaleTimeString('ar-EG', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="text-xs text-emerald-600 mt-1 font-bold">يومية مفتوحة</div>
            </div>
            <div className="bg-indigo-50 p-6 rounded-2xl shadow-sm border border-indigo-100">
              <div className="text-sm font-bold text-indigo-600 mb-1">العهدة الافتتاحية</div>
              <div className="text-2xl font-black text-indigo-700">{activeShift.startCash} ج.م</div>
            </div>
            <div className="bg-emerald-50 p-6 rounded-2xl shadow-sm border border-emerald-100">
              <div className="text-sm font-bold text-emerald-600 mb-1">إجمالي المقبوضات (محصل)</div>
              <div className="text-2xl font-black text-emerald-700">+{totalCashIn} ج.م</div>
            </div>
            <div className="bg-rose-50 p-6 rounded-2xl shadow-sm border border-rose-100">
              <div className="text-sm font-bold text-rose-600 mb-1">المصروفات (مسدد)</div>
              <div className="text-2xl font-black text-rose-700">-{totalCashOut} ج.م</div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between">
            <div>
              <p className="text-slate-400 font-bold mb-1">المبلغ المتوقع بالخزنة (كاش)</p>
              <h3 className="text-4xl font-black text-emerald-400">{currentCashInDrawer} ج.م</h3>
            </div>
            <div className="text-left">
              <p className="text-slate-400 font-bold mb-1">المدفوعات الإلكترونية / بنكي</p>
              <h3 className="text-2xl font-black text-indigo-300">{totalCardPayments} ج.م</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex overflow-x-auto border-b border-slate-200">
              <button
                onClick={() => setActiveTab('receive')}
                className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === 'receive'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Receipt className="w-4 h-4" /> قبض مدفوعات طلاب
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === 'expenses'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4" /> إيصال مصروف / إيراد عام
              </button>
              <button
                onClick={() => setActiveTab('log')}
                className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === 'log'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4" /> حركة اليومية
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'receive' && (
                <ReceiveTab
                  shiftPayments={shiftPayments}
                  subscriptions={subscriptions}
                  getStudentName={getStudentName}
                  getFeeTypeName={getFeeTypeName}
                  setPaymentModalOpen={setPaymentModalOpen}
                />
              )}

              {activeTab === 'expenses' && (
                <ExpensesTab
                  shiftGeneralOps={shiftGeneralOps}
                  setTransactionModalOpen={setTransactionModalOpen}
                />
              )}

              {activeTab === 'log' && (
                <ShiftLogTab
                  shiftPayments={shiftPayments}
                  shiftGeneralOps={shiftGeneralOps}
                  getStudentName={getStudentName}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <SchoolPaymentModal
        paymentModalOpen={paymentModalOpen}
        setPaymentModalOpen={setPaymentModalOpen}
        handleSavePayment={handleSavePayment}
        paymentFormData={paymentFormData}
        setPaymentFormData={setPaymentFormData}
        students={students}
        subscriptions={subscriptions}
        getFeeTypeName={getFeeTypeName}
      />
      <SchoolTransactionModal
        transactionModalOpen={transactionModalOpen}
        setTransactionModalOpen={setTransactionModalOpen}
        handleSaveTransaction={handleSaveTransaction}
        transactionFormData={transactionFormData}
        setTransactionFormData={setTransactionFormData}
      />

      <StartShiftModal
        isOpen={startShiftModalOpen}
        onClose={() => setStartShiftModalOpen(false)}
        startCashValue={startCashValue}
        setStartCashValue={setStartCashValue}
        onConfirm={executeStartShift}
      />

      <CloseShiftModal
        isOpen={closeShiftModalOpen}
        onClose={() => setCloseShiftModalOpen(false)}
        activeShift={activeShift}
        totalCashIn={totalCashIn}
        totalCashOut={totalCashOut}
        expectedCash={currentExpectedCash()}
        actualCashValue={actualCashValue}
        setActualCashValue={setActualCashValue}
        onConfirm={executeCloseShift}
      />
    </div>
  );
};

export default SchoolCashier;
