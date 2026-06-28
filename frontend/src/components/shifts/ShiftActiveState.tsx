import React, { useState } from 'react';
import { Printer, Wallet, Banknote, TrendingDown, CreditCard, CheckCircle2, Calculator, AlertTriangle, LockKeyhole, Plus, Clock, CheckCircle } from 'lucide-react';
import { Shift } from '../../types';
import { db } from '../../db';

interface ShiftActiveStateProps {
  currentShift: Shift;
  currentShiftStats: { cashSales: number; cardSales: number; totalExpenses: number } | undefined;
  currencyCode: string;
  endCashInput: number;
  setEndCashInput: (val: number) => void;
  closingNotes: string;
  setClosingNotes: (val: string) => void;
  setIsMoneyCounterOpen: (val: boolean) => void;
  handleCloseShift: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  printZReport: (shift: Shift, stats?: { cashSales: number; cardSales: number; totalExpenses: number }) => void;
  hasViewExpectedCashPermission: boolean;
  hasShiftExpensesPermission: boolean;
  onBackToDashboard?: () => void;
}

const ShiftActiveState: React.FC<ShiftActiveStateProps> = ({
  currentShift,
  currentShiftStats,
  currencyCode,
  endCashInput,
  setEndCashInput,
  closingNotes,
  setClosingNotes,
  setIsMoneyCounterOpen,
  handleCloseShift,
  formatCurrency,
  formatDate,
  printZReport,
  hasViewExpectedCashPermission,
  hasShiftExpensesPermission,
  onBackToDashboard
}) => {
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseNote, setExpenseNote] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<string>('other');
  const [expenseError, setExpenseError] = useState<string>('');
  const [isAddingExpense, setIsAddingExpense] = useState<boolean>(false);

  // Re-calculate expected cash factoring in drawer expenses
  const drawerExpensesTotal = currentShift.shiftExpenses ? currentShift.shiftExpenses.reduce((sum, exp) => sum + exp.amount, 0) : 0;
  const expectedCash = currentShift.startCash + (currentShiftStats?.cashSales || 0) + (currentShift.cashSales || 0) - (currentShiftStats?.totalExpenses || 0) - drawerExpensesTotal;
  const difference = endCashInput - expectedCash;

  const handleAddExpense = async () => {
      if (!currentShift) return;
      setExpenseError('');
      if (expenseAmount <= 0) {
          setExpenseError('الرجاء إدخال مبلغ صحيح أكبر من الصفر');
          return;
      }
      if (!expenseNote.trim()) {
          setExpenseError('الرجاء إدخال وصف مبسط أو ملاحظة للمصروف');
          return;
      }
      
      try {
          const newExpense = {
              id: crypto.randomUUID(),
              amount: expenseAmount,
              description: expenseNote,
              category: expenseCategory,
              timestamp: new Date(),
              isConfirmed: false
          };
          
          const updatedExpenses = [...(currentShift.shiftExpenses || []), newExpense];
          
          let newExpectedCash = currentShift.expectedCash;
          // In Shifts page, expectedCash calculation is dynamic or saved. 
          // If we also want to deduct here:
          if(typeof newExpectedCash === 'number') {
              newExpectedCash = newExpectedCash - expenseAmount;
          }
          
          await db.shifts.update(currentShift.id!, {
              shiftExpenses: updatedExpenses,
              expectedCash: newExpectedCash
          });
          
          setExpenseAmount(0);
          setExpenseNote('');
          setExpenseCategory('other');
          setExpenseError('');
          setIsAddingExpense(false);
      } catch (err) {
          console.error(err);
          setExpenseError('حدث خطأ أثناء حفظ المصروف بالصندوق الاستيضاحي');
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Stats Dashboard */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h2 className="text-lg font-bold text-gray-800">الوردية الحالية نشطة</h2>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">بدأت: {formatDate(currentShift.startTime)}</p>
                </div>
                <div className="flex items-center gap-2">
                    {onBackToDashboard && (
                        <button 
                            onClick={onBackToDashboard}
                            className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-sm text-sm"
                        >
                            إغلاق وعودة للوحة التحكم
                        </button>
                    )}
                    <button 
                        onClick={() => printZReport(currentShift, currentShiftStats)}
                        className="p-2.5 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-colors shadow-sm"
                        title="طباعة تقرير لحظي (X-Report)"
                    >
                        <Printer className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {hasViewExpectedCashPermission && (
              <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-slate-900/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors"></div>
                  <div className="relative z-10 text-center">
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">النقد المتوقع في الدرج</p>
                      <p className="text-4xl font-black tracking-tight" dir="ltr">
                          {formatCurrency(expectedCash)}
                          <span className="text-lg text-slate-500 ml-2 font-medium">{currencyCode}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-2 font-mono bg-white/5 inline-block px-2 py-1 rounded">
                          (افتتاحي + مبيعات نقدية - مصروفات)
                      </p>
                  </div>
              </div>
            )}

            {/* Breakdown Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <Wallet className="w-4 h-4" />
                        <span className="text-xs font-bold">الرصيد الافتتاحي</span>
                    </div>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(currentShift.startCash)}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-2 mb-2 text-emerald-600">
                        <Banknote className="w-4 h-4" />
                        <span className="text-xs font-bold">مبيعات نقدية</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-700">+{formatCurrency((currentShiftStats?.cashSales || 0) + (currentShift.cashSales || 0))}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                    <div className="flex items-center gap-2 mb-2 text-red-600">
                        <TrendingDown className="w-4 h-4" />
                        <span className="text-xs font-bold">مصروفات بالنظام</span>
                    </div>
                    <p className="text-lg font-bold text-red-700">-{formatCurrency(currentShiftStats?.totalExpenses || 0)}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 opacity-70">
                    <div className="flex items-center gap-2 mb-2 text-blue-600">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-xs font-bold">مبيعات البطاقة (Bank)</span>
                    </div>
                    <p className="text-lg font-bold text-blue-700">{formatCurrency((currentShiftStats?.cardSales || 0) + (currentShift.cardSales || 0))}</p>
                </div>
            </div>
            
            {/* Drawer Expenses */}
            <div className="mt-2 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-gray-800">مصروفات تم سحبها من الدرج:</h3>
                    <span className="font-bold text-red-600 text-sm">-{formatCurrency(drawerExpensesTotal)}</span>
                </div>
                
                {currentShift.shiftExpenses && currentShift.shiftExpenses.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 border border-gray-100 rounded-xl p-2 bg-gray-50/50">
                        {currentShift.shiftExpenses.map(exp => (
                            <div key={exp.id} className="bg-white p-3 rounded-xl flex justify-between items-center text-sm border border-gray-100/80 shadow-sm">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-black text-xs text-gray-800">{exp.description}</p>
                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold font-sans">
                                            {exp.category === 'rent' ? 'إيجار' :
                                             exp.category === 'salary' ? 'رواتب / سلف' :
                                             exp.category === 'utilities' ? 'فواتير ومنافع' :
                                             exp.category === 'purchase' ? 'مشتريات بضاعة' :
                                             exp.category === 'marketing' ? 'تسويق وإشهار' :
                                             exp.category === 'maintenance' ? 'صيانة وإصلاح' :
                                             exp.category === 'supplies' ? 'ضيافة ومستلزمات' :
                                             exp.category === 'transportation' ? 'نقل ومواصلات' : 'نثريات وأخرى'}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-mono">{new Date(exp.timestamp).toLocaleTimeString('ar-EG')}</p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="font-extrabold text-red-600 text-xs">-{formatCurrency(exp.amount)}</span>
                                    {exp.isConfirmed ? (
                                        <span title="تم التأكيد بقسم المصروفات"><CheckCircle className="w-4 h-4 text-emerald-500" /></span>
                                    ) : (
                                        <span title="بانتظار تأكيد المدير"><Clock className="w-4 h-4 text-amber-550 animate-pulse" /></span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {hasShiftExpensesPermission && (
                    <div className="pt-2">
                        {!isAddingExpense ? (
                            <button 
                                onClick={() => {
                                    setIsAddingExpense(true);
                                    setExpenseError('');
                                }}
                                className="w-full py-3 bg-red-50 hover:bg-red-100/80 active:scale-[0.99] text-red-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs border border-red-200 border-dashed cursor-pointer"
                            >
                                <Plus className="w-4 h-4" /> إضافة مصروف مسحوب من الدرج
                            </button>
                        ) : (
                            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 space-y-3">
                                <h4 className="font-bold text-xs text-red-800 flex items-center gap-1.5">
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                    تسجيل سحب مصروف نقدى من الصندوق
                                </h4>
                                
                                <div className="space-y-2.5">
                                    {/* Amount Input */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-red-800/80 mb-1">المبلغ المطلوب سحبه</label>
                                        <input
                                            type="number"
                                            value={expenseAmount || ''}
                                            onChange={e => setExpenseAmount(Number(e.target.value))}
                                            placeholder="المبلع بالعملة المحلية"
                                            className="w-full p-2.5 text-xs bg-white border border-red-100 rounded-lg outline-none focus:ring-2 focus:ring-red-400 font-extrabold"
                                        />
                                    </div>
                                    
                                    {/* Category Select */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-red-800/80 mb-1">تصنيف المصروف</label>
                                        <select
                                            value={expenseCategory}
                                            onChange={e => setExpenseCategory(e.target.value)}
                                            className="w-full p-2.5 text-xs bg-white border border-red-100 rounded-lg outline-none focus:ring-2 focus:ring-red-400 font-medium cursor-pointer"
                                        >
                                            <option value="other">نثريات / أخرى</option>
                                            <option value="purchase">مشتريات بضاعة وعينات</option>
                                            <option value="supplies">ضيافة، شاي ومستلزمات</option>
                                            <option value="maintenance">صيانة وأعمال إصلاح</option>
                                            <option value="transportation">نقل ومواصلات وتوصيل</option>
                                            <option value="salary">سلف رواتب / أجور عمالة يومية</option>
                                            <option value="utilities">فواتير ومنافع طارئة</option>
                                        </select>
                                    </div>

                                    {/* Details input */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-red-800/80 mb-1">البيان / تفصيل السحب</label>
                                        <input
                                            type="text"
                                            value={expenseNote}
                                            onChange={e => setExpenseNote(e.target.value)}
                                            placeholder="فيما تم صرف المبلغ بالتفصيل؟"
                                            className="w-full p-2.5 text-xs bg-white border border-red-100 rounded-lg outline-none focus:ring-2 focus:ring-red-400 font-medium"
                                        />
                                    </div>
                                </div>

                                {expenseError && (
                                    <p className="text-[11px] text-red-600 font-bold bg-white/80 p-2 rounded-lg border border-red-200">
                                        ⚠️ {expenseError}
                                    </p>
                                )}

                                <div className="flex gap-2 pt-2 text-xs">
                                    <button 
                                        onClick={handleAddExpense} 
                                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white rounded-xl font-bold shadow-sm transition-all"
                                    >
                                        حفظ وتسجيل السحب
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setIsAddingExpense(false);
                                            setExpenseError('');
                                        }} 
                                        className="px-4 py-2.5 bg-white border border-red-200 hover:bg-red-100/50 text-red-800 rounded-xl font-bold transition-all"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Close Shift Form */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
            <div className="mb-6">
                <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-brand-600" />
                    إغلاق الوردية (الجرد)
                </h3>
                <p className="text-sm text-gray-500 mt-1">قم بعد النقد في الدرج وأدخل القيمة للمطابقة.</p>
            </div>
            
            <div className="space-y-6 flex-1">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">المبلغ الفعلي (الجرد)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input 
                                type="number" onFocus={(e) => e.target.select()}
                                className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-2xl font-bold text-center text-gray-800 transition-all"
                                value={endCashInput}
                                onChange={e => setEndCashInput(Number(e.target.value))}
                                placeholder="0"
                            />
                        </div>
                        <button 
                            onClick={() => setIsMoneyCounterOpen(true)}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-4 rounded-xl shadow-lg shadow-brand-200 transition-all flex flex-col items-center justify-center gap-1 min-w-[80px]"
                            title="استخدام الحاسبة"
                        >
                            <Calculator className="w-6 h-6" />
                            <span className="text-[10px] font-bold">حاسبة</span>
                        </button>
                    </div>
                </div>

                {endCashInput > 0 && (
                    <div className={`p-4 rounded-2xl flex justify-between items-center text-sm border-2 ${
                         difference === 0 
                         ? 'bg-green-50 border-green-200 text-green-800' 
                         : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                        <span className="font-bold flex items-center gap-2">
                            {difference === 0 
                            ? <CheckCircle2 className="w-5 h-5" /> 
                            : <AlertTriangle className="w-5 h-5" />}
                            النتيجة:
                        </span>
                        <span className="text-lg font-black" dir="ltr">
                            {formatCurrency(difference)}
                        </span>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات الإغلاق</label>
                    <textarea 
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none text-sm"
                        placeholder="اذكر سبب العجز أو الزيادة إن وجد..."
                        value={closingNotes}
                        onChange={e => setClosingNotes(e.target.value)}
                    />
                </div>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-100">
                <button 
                    onClick={() => handleCloseShift()}
                    className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-xl transition-all flex items-center justify-center gap-3 text-lg"
                >
                    <LockKeyhole className="w-5 h-5" />
                    إغلاق الوردية وترحيل الحسابات
                </button>
            </div>
        </div>
    </div>
  );
};

export default ShiftActiveState;

