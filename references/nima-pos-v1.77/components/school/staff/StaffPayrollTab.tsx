import React from 'react';
import { Calculator, RefreshCw, Send, Printer } from 'lucide-react';
import { db } from '../../../db';
import { AccountingEngine } from '../../../services/AccountingEngine';

interface StaffPayrollTabProps {
  payrolls: any[];
  staff: any[];
  initiatePayrollGeneration: (month: string) => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  printSlip: (p: any, name: string, role: string) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
}

export const StaffPayrollTab: React.FC<StaffPayrollTabProps> = ({
  payrolls,
  staff,
  initiatePayrollGeneration,
  openConfirm,
  printSlip,
  success,
  error,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      <div className="bg-white p-6 border border-slate-200 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-indigo-600" /> توليد ومراجعة مسير الرواتب
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            اضغط على المعالجة ليقوم النظام بحساب المرتب الأساسي والخصومات والمكافآت وإخراج الصافي.
          </p>
        </div>
        <div className="flex gap-2 relative">
          <input
            type="month"
            id="payrollMonth"
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono font-bold"
            defaultValue={new Date().toISOString().slice(0, 7)}
          />
          <button
            onClick={() => {
              const m = (document.getElementById('payrollMonth') as HTMLInputElement).value;
              if (m) initiatePayrollGeneration(m);
            }}
            type="button"
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 transition-all hover:scale-105 shadow-md"
          >
            <RefreshCw className="w-5 h-5" /> معالجة الرواتب
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {payrolls
          .sort((a, b) => b.monthYear.localeCompare(a.monthYear))
          .map((p) => {
            const employee = staff.find((s) => s.id === p.userId);
            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 p-5 rounded-2xl hover:shadow-lg transition-all relative overflow-hidden group"
              >
                <div
                  className={`absolute top-0 right-0 w-1.5 h-full ${
                    p.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                ></div>
                <div className="flex justify-between items-start mb-4 pr-3">
                  <div>
                    <h3 className="font-black text-lg text-slate-800">
                      {employee?.name || 'محذوف'}
                    </h3>
                    <p className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 mt-1 rounded text-xs w-max">
                      {employee?.role}
                    </p>
                  </div>
                  <span className="font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded text-xs font-bold">
                    {p.monthYear}
                  </span>
                </div>
                <div className="space-y-2 text-sm bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
                  <div className="flex justify-between">
                    <span>الأساسي</span>
                    <span className="font-bold">{p.baseSalary}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>إضافي/مكافآت</span>
                    <span className="font-bold">+{p.totalBonuses}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>خصم/غياب</span>
                    <span className="font-bold">-{p.totalDeductions}</span>
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>سلف مسددة</span>
                    <span className="font-bold">-{p.totalAdvances}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pr-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 mb-0.5">الصافي</span>
                    <span className="font-black text-2xl text-slate-800">
                      {p.netSalary} <span className="text-sm font-medium">ج.م</span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {p.status !== 'paid' && (
                      <button
                        onClick={() => {
                          openConfirm(
                            'تأكيد صرف الراتب المعتمد',
                            `هل تود تأكيد صرف راتب شهر (${p.monthYear}) للموظف (${employee?.name}) بمبلغ صافي (${p.netSalary} ج.م)؟ سيتم ترحيل قيد هذا الصرف تلقائياً لليومية العامة ومدرجات المصاريف.`,
                            async () => {
                              try {
                                await db.payrolls.update(p.id!, { status: 'paid' });
                                await db.expenses?.add({
                                  date: new Date(),
                                  amount: p.netSalary,
                                  category: 'payroll',
                                  title: `صرف راتب شهر ${p.monthYear} للموظف ${employee?.name}`,
                                });

                                try {
                                  const expenseAccount = await db.accounts
                                    .where('code')
                                    .equals('5030')
                                    .first();
                                  const cashAccount = await db.accounts
                                    .where('code')
                                    .equals('1010')
                                    .first();

                                  if (expenseAccount && cashAccount) {
                                    await AccountingEngine.postEntry({
                                      date: new Date(),
                                      reference: `PAYROLL-${p.id}`,
                                      description: `صرف راتب شهر ${p.monthYear} للموظف: ${employee?.name}`,
                                      lines: [
                                        {
                                          accountId: expenseAccount.id!,
                                          accountName: expenseAccount.name,
                                          debit: p.netSalary,
                                          credit: 0,
                                          description: `رواتب موظفي المدرسة - ${employee?.role}`,
                                        },
                                        {
                                          accountId: cashAccount.id!,
                                          accountName: cashAccount.name,
                                          debit: 0,
                                          credit: p.netSalary,
                                          description: `الدفع النقدي من صندوق الكاش بمطابقة مسيرات مراتب الموظف`,
                                        },
                                      ],
                                      ignoreClosedPeriod: true,
                                    });
                                  }
                                } catch (ledgerErr) {
                                  console.error('Accounting ledger error:', ledgerErr);
                                }

                                success(
                                  'تم صرف الراتب وتوثيقه وربطه بالدفاتر العامة والمصاريف فورياً.'
                                );
                              } catch (err) {
                                error('فشل عملية صرف الراتب');
                              }
                            }
                          );
                        }}
                        type="button"
                        className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 p-2 rounded-lg font-bold transition flex items-center gap-1"
                        title="تصرف الراتب"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        printSlip(p, employee?.name || '', employee?.role || '')
                      }
                      type="button"
                      className="bg-slate-100 text-slate-600 hover:bg-slate-200 p-2 rounded-lg transition"
                      title="طباعة الإيصال"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        {payrolls.length === 0 && (
          <div className="col-span-full text-center p-12 text-slate-500 font-medium">
            لم يتم توليد أي مسيرات رواتب حتى الآن.
          </div>
        )}
      </div>
    </div>
  );
};
export default StaffPayrollTab;
