import React from 'react';
import { useToast } from '../context/ToastContext';
import { useShiftsState } from '../components/shifts/useShiftsState';
import { AlertTriangle, X, LayoutDashboard } from 'lucide-react';

import MoneyCounterModal from '../components/shifts/MoneyCounterModal';
import ShiftHeader from '../components/shifts/ShiftHeader';
import ShiftClosedState from '../components/shifts/ShiftClosedState';
import ShiftActiveState from '../components/shifts/ShiftActiveState';
import ShiftHistoryTable from '../components/shifts/ShiftHistoryTable';
import ShiftDetailsModal from '../components/shifts/ShiftDetailsModal';
import { ManagerActiveShiftCard } from '../components/shifts/ManagerActiveShiftCard';
import { Shift } from '../types';

const Shifts: React.FC = () => {
  const { success, error: showError } = useToast();

  const {
    currentShift,
    setCurrentShift,
    isLoading,
    startCashInput,
    setStartCashInput,
    endCashInput,
    setEndCashInput,
    closingNotes,
    setClosingNotes,
    isMoneyCounterOpen,
    setIsMoneyCounterOpen,
    selectedShiftForDetails,
    setSelectedShiftForDetails,
    isConfirmCloseOpen,
    setIsConfirmCloseOpen,
    confirmMessage,
    isConfirmReceiptOpen,
    setIsConfirmReceiptOpen,
    shiftToConfirm,
    setShiftToConfirm,
    isOpeningShift,
    setIsOpeningShift,
    currentUser,
    isManagerOrAdmin,
    activeShifts,
    pendingShifts,
    pendingExpenses,
    shiftHistory,
    settings,
    currencyCode,
    currentShiftStats,
    handleOpenShift,
    handleCloseShift,
    handleConfirmShift,
    handleConfirmExpense,
    formatCurrency,
    formatDate,
    handleExportCSV
  } = useShiftsState(success, showError);

  const printZReport = (shift: Shift, stats?: { cashSales: number, cardSales: number, totalExpenses: number }) => {
    const printWindow = window.open('', '', 'width=300,height=600');
    if (!printWindow) return;

    const hasViewExpectedCashPermission = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.permissions?.includes('view_expected_cash') || currentUser?.permissions?.includes('all');

    const sCash = shift.cashSales || stats?.cashSales || 0;
    const sCard = shift.cardSales || stats?.cardSales || 0;
    const impliedExpenses = shift.status === 'closed' 
      ? (shift.startCash + sCash) - shift.expectedCash 
      : (stats?.totalExpenses || 0);

    const expensesVal = shift.shiftExpenses ? shift.shiftExpenses.reduce((acc, curr) => acc + curr.amount, 0) : Math.max(0, impliedExpenses);
    
    const expectedCash = shift.status === 'closed' 
      ? shift.expectedCash 
      : (shift.startCash + sCash) - expensesVal;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>Z-Report #${shift.id}</title>
          <style>
            body { font-family: 'Courier New', monospace; text-align: center; padding: 10px; font-size: 12px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; text-align: right; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed black; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h3>${settings?.storeName || 'Nima POS'}</h3>
          <p>تقرير إغلاق وردية (Z-Report)</p>
          <p>رقم: #${shift.id}</p>
          <p>${formatDate(shift.startTime)}</p>
          <div class="line"></div>
          
          <div class="row"><span>الرصيد الافتتاحي:</span><span>${formatCurrency(shift.startCash)}</span></div>
          <div class="row"><span>مبيعات نقدية (بما فيها السداد):</span><span>+${formatCurrency(sCash)}</span></div>
          <div class="row"><span>مصروفات من الدرج:</span><span>-${formatCurrency(expensesVal)}</span></div>
          <div class="line"></div>
          
          ${hasViewExpectedCashPermission ? `
          <div class="row bold"><span>المتوقع في الدرج:</span><span>${formatCurrency(expectedCash)}</span></div>
          ` : ''}
          
          ${shift.status === 'closed' ? `
          <div class="row"><span>العد الفعلي:</span><span>${formatCurrency(shift.actualCash || 0)}</span></div>
          ${hasViewExpectedCashPermission ? `
          <div class="row"><span>الفارق:</span><span>${formatCurrency(shift.difference || 0)}</span></div>
          ` : ''}
          ` : ''}
          
          <div class="line"></div>
          <div class="row"><span>مبيعات البطاقة (Bank):</span><span>${formatCurrency(sCard)}</span></div>
          <div class="line"></div>
          <p>وقت الطباعة: ${new Date().toLocaleTimeString()}</p>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintList = () => {
    window.print();
  };

  if (isLoading) return <div className="p-8 text-slate-500 font-sans">جاري تحميل بيانات الورديات...</div>;

  return (
    <div className="p-8 h-full overflow-y-auto bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-sans print:p-0 print:bg-white" dir="rtl">
      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
        <h2 className="text-2xl font-bold">{settings?.storeName || 'Nima POS'}</h2>
        <h3 className="text-xl font-bold mt-2">أرشيف الورديات</h3>
        <p className="text-sm mt-2">تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
      </div>

      {isMoneyCounterOpen && (
        <MoneyCounterModal 
          currency={currencyCode} 
          onTotalChange={(val) => setEndCashInput(val)} 
          onClose={() => setIsMoneyCounterOpen(false)} 
        />
      )}

      {selectedShiftForDetails && (
        <ShiftDetailsModal
          shift={selectedShiftForDetails}
          onClose={() => setSelectedShiftForDetails(null)}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}

      <ShiftHeader onExportCSV={handleExportCSV} onPrintList={handlePrintList} />

      <div className="print:hidden">
        {isManagerOrAdmin && activeShifts !== undefined && activeShifts.length > 0 && (
          <div className="mb-8 border-b border-gray-100 pb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-indigo-600" />
              لوحة تحكم الورديات الفعالة للمدير
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeShifts.map(shift => (
                <ManagerActiveShiftCard key={shift.id} shift={shift} formatCurrency={formatCurrency} formatDate={formatDate} onViewDetails={(s) => {
                  setCurrentShift(s);
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }} />
              ))}
            </div>
          </div>
        )}

        {!currentShift ? (
          isManagerOrAdmin && !isOpeningShift ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center my-6">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner border border-slate-100">
                <LayoutDashboard className="w-8 h-8"/>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">وضع المراقبة للمدير</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
                أنت الآن في وضع مراقبة الورديات. يمكنك عرض الورديات الفعالة، تأكيد استلام النقدية، ومراجعة الأرشيف.
                <br />
                لفتح وردية صندوق للعمل عليها، انقر أدناه.
              </p>
              <button
                onClick={() => setIsOpeningShift(true)}
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer"
              >
                فتح وردية جديدة
              </button>
            </div>
          ) : (
            <ShiftClosedState 
              currencyCode={currencyCode}
              startCashInput={startCashInput}
              setStartCashInput={setStartCashInput}
              handleOpenShift={handleOpenShift}
              onCancel={isManagerOrAdmin ? () => setIsOpeningShift(false) : undefined}
            />
          )
        ) : (
          <ShiftActiveState 
            currentShift={currentShift}
            currentShiftStats={currentShiftStats}
            currencyCode={currencyCode}
            endCashInput={endCashInput}
            setEndCashInput={setEndCashInput}
            closingNotes={closingNotes}
            setClosingNotes={setClosingNotes}
            setIsMoneyCounterOpen={setIsMoneyCounterOpen}
            handleCloseShift={handleCloseShift}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            printZReport={printZReport}
            hasViewExpectedCashPermission={currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.permissions?.includes('view_expected_cash') || currentUser?.permissions?.includes('all')}
            hasShiftExpensesPermission={true}
            onBackToDashboard={isManagerOrAdmin ? () => setCurrentShift(null) : undefined}
          />
        )}

        {isManagerOrAdmin && pendingShifts && pendingShifts.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">ورديات بانتظار التأكيد (استلام النقدية)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingShifts.map((shift) => (
                <div key={shift.id} className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-amber-200 text-amber-800 px-3 py-1 rounded-full text-xs font-bold font-mono">
                      وردية #{shift.id}
                    </span>
                    <span className="text-amber-700 text-sm font-medium">بانتظار التأكيد</span>
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between">
                      <span className="text-amber-600/80">تاريخ الفتح:</span>
                      <span className="font-bold text-amber-900">{formatDate(shift.startTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-600/80">تاريخ الإغلاق:</span>
                      <span className="font-bold text-amber-900">{shift.endTime ? formatDate(shift.endTime) : '...'}</span>
                    </div>
                    <div className="flex justify-between text-lg pt-2 border-t border-amber-200/50">
                      <span className="text-amber-700">النقدية الفعلية للتسليم:</span>
                      <span className="font-bold text-amber-900">{formatCurrency(shift.actualCash || 0)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleConfirmShift(shift)}
                      className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                      تأكيد استلام النقدية
                    </button>
                    <button 
                      onClick={() => setSelectedShiftForDetails(shift)}
                      className="px-4 py-3 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-xl transition-colors border border-amber-300"
                    >
                      التفاصيل
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isManagerOrAdmin && pendingExpenses && pendingExpenses.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">مصروفات بانتظار التأكيد (مصروف من الدرج)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pendingExpenses.map((pe) => (
                <div key={pe.expense.id} className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-bold font-mono">
                      وردية #{pe.shiftId}
                    </span>
                    <span className="text-blue-700 text-xs font-medium">{new Date(pe.expense.timestamp).toLocaleString('ar-EG')}</span>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-blue-600/80 mb-1">وصف المصروف:</p>
                    <p className="font-bold text-blue-900">{pe.expense.description}</p>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                    <span className="font-black text-xl text-red-600">-{formatCurrency(pe.expense.amount)}</span>
                    <button 
                      onClick={() => handleConfirmExpense(pe.shiftId, pe.expense.id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-sm text-sm"
                    >
                      تأكيد المصروف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isConfirmCloseOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                تأكيد إغلاق الوردية
              </h2>
              <button 
                onClick={() => setIsConfirmCloseOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-slate-700 text-lg mb-6 leading-relaxed">
                {confirmMessage}
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsConfirmCloseOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  إلغاء التراجع
                </button>
                <button 
                  onClick={() => handleCloseShift(true)}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm"
                >
                  نعم، إغلاق الوردية
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isConfirmReceiptOpen && shiftToConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                تأكيد استلام النقدية
              </h2>
              <button 
                onClick={() => {
                  setIsConfirmReceiptOpen(false);
                  setShiftToConfirm(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-slate-700 text-lg mb-6 leading-relaxed">
                هل أنت متأكد من استلام النقدية وإقفال الوردية نهائياً؟
                <br />
                <span className="font-bold">المبلغ الفعلي للنقدية: {formatCurrency(shiftToConfirm.actualCash || 0)}</span>
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setIsConfirmReceiptOpen(false);
                    setShiftToConfirm(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  إلغاء التراجع
                </button>
                <button 
                  onClick={() => handleConfirmShift(shiftToConfirm, true)}
                  className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors shadow-md"
                >
                  تأكيد الاستلام
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ShiftHistoryTable 
        shiftHistory={shiftHistory}
        formatCurrency={formatCurrency}
        printZReport={printZReport}
        onViewDetails={setSelectedShiftForDetails}
        hasViewExpectedCashPermission={currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.permissions?.includes('view_expected_cash') || currentUser?.permissions?.includes('all')}
      />
    </div>
  );
};

export default Shifts;
