import React from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Info, 
  Briefcase 
} from 'lucide-react';
import { TrainerType } from './trainersTypes';

interface TrainersTabPayrollProps {
  trainers: TrainerType[];
  classes: any[];
  selectedTrainerId: number | null;
  setSelectedTrainerId: (id: number) => void;
  trainerPayrollData: any;
  extraBonus: number;
  setExtraBonus: (val: number) => void;
  extraDeduction: number;
  setExtraDeduction: (val: number) => void;
  payrollMethod: 'cash' | 'bank';
  setPayrollMethod: (val: 'cash' | 'bank') => void;
  payrollNotes: string;
  setPayrollNotes: (val: string) => void;
  onOpenPayoutConfirm: () => void;
  currency: string;
}

export const TrainersTabPayroll: React.FC<TrainersTabPayrollProps> = ({
  trainers,
  classes,
  selectedTrainerId,
  setSelectedTrainerId,
  trainerPayrollData,
  extraBonus,
  setExtraBonus,
  extraDeduction,
  setExtraDeduction,
  payrollMethod,
  setPayrollMethod,
  payrollNotes,
  setPayrollNotes,
  onOpenPayoutConfirm,
  currency
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-right font-sans" dir="rtl">
      
      {/* Trainers selector vertical column */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2.5 flex items-center gap-1.5 flex-row-reverse text-right">
          <Users className="w-4 h-4 text-slate-500" />
          <span>اختر المدرب لتسوية رواتبه:</span>
        </h3>

        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {trainers.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-8">يرجى تسجيل مدرب بالدليل أولاً.</p>
          ) : (
            trainers.map((trObj) => {
              const trainerClasses = classes.filter(c => c.trainerId === trObj.name);
              let studentsNum = 0;
              trainerClasses.forEach(c => {
                studentsNum += Array.isArray(c.enrolledMembers) ? c.enrolledMembers.length : 0;
              });

              return (
                <div
                  key={trObj.id}
                  onClick={() => setSelectedTrainerId(trObj.id!)}
                  className={`p-3 rounded-xl border text-right cursor-pointer transition-all flex justify-between items-center ${
                    trObj.id === selectedTrainerId 
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500' 
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="text-left flex flex-col items-start gap-1">
                    <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-slate-100 text-slate-700">
                      {trainerClasses.length} حصص
                    </span>
                    <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-indigo-100 text-indigo-800">
                      {studentsNum} متدرب
                    </span>
                  </div>

                  <div className="text-right">
                    <h4 className="font-extrabold text-xs text-slate-800">{trObj.name}</h4>
                    <span className="text-[10px] text-indigo-500 font-bold block mt-0.5">{trObj.specialization}</span>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">الراتب الأساسي: {trObj.baseSalary} {currency}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main calculation workspace */}
      <div className="lg:col-span-8 space-y-6">
        {trainerPayrollData ? (
          <>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              
              {/* Ledger header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4 flex-row-reverse">
                <div className="bg-slate-50 p-2.5 border border-slate-100 rounded-xl text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">معيار القيد والعمولة المطبقة</span>
                  <strong className="text-indigo-600 text-[11px] font-extrabold">
                    {trainerPayrollData.trainer.commissionType === 'fixed_per_student' 
                      ? `عمولة ثابتة ${trainerPayrollData.trainer.commissionValue} ${currency} لكل متدرب مسجل` 
                      : `وفق نسبة هرمية قدرها ${trainerPayrollData.trainer.commissionValue}% من رسوم الدورة`}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-1 rounded">
                    تسوية الفترات المالية والعمولة الجارية
                  </span>
                  <h3 className="text-lg font-black text-slate-800 mt-1">{trainerPayrollData.trainer.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    التخصص: <strong className="text-indigo-600">{trainerPayrollData.trainer.specialization}</strong> | هاتف: {trainerPayrollData.trainer.phone}
                  </p>
                </div>
              </div>

              {/* Stats Block */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 p-3 h-18 rounded-xl border border-indigo-50">
                  <span className="text-[10px] text-slate-400 font-bold block">الراتب التعاقدي الأساسي</span>
                  <strong className="text-sm font-black text-slate-800 font-mono">{trainerPayrollData.baseSalary} {currency}</strong>
                </div>
                <div className="bg-slate-50 p-3 h-18 rounded-xl border border-indigo-50">
                  <span className="text-[10px] text-slate-400 font-bold block">الحصص المسجلة بالدورة</span>
                  <strong className="text-sm font-black text-slate-800 font-mono">{trainerPayrollData.totalClassesCount} حِصّة جارية</strong>
                </div>
                <div className="bg-slate-50 p-3 h-18 rounded-xl border border-indigo-50">
                  <span className="text-[10px] text-slate-400 font-bold block">عائدات التدريب المحصلة</span>
                  <strong className="text-sm font-black text-emerald-600 font-mono">+{trainerPayrollData.computedCommission.toLocaleString()} {currency}</strong>
                </div>
              </div>

              {/* Sliders components */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700">مكافآت وحوافز إضافية ({currency})</label>
                  <input 
                    type="number"
                    min={0}
                    value={extraBonus || ''}
                    onChange={(e) => setExtraBonus(Number(e.target.value))}
                    placeholder="مكافآت التميز..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-mono text-right text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700">خصومات واستقطاعات تأخير وغياب ({currency})</label>
                  <input 
                    type="number"
                    min={0}
                    value={extraDeduction || ''}
                    onChange={(e) => setExtraDeduction(Number(e.target.value))}
                    placeholder="خصومات الدوام..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-mono text-right text-xs font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/10"
                  />
                </div>
              </div>

              {/* Mode, notes and calculations */}
              <div className="bg-indigo-50/20 p-5 rounded-2xl border border-indigo-100/50 space-y-4">
                
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 flex-row-reverse text-right">
                  <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                    <button
                      type="button"
                      onClick={() => setPayrollMethod('cash')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${payrollMethod === 'cash' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500'}`}
                    >
                      💵 صرف نقدي (كاش الصندوق)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayrollMethod('bank')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${payrollMethod === 'bank' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500'}`}
                    >
                      🏦 تحويل بنكي / شيكات
                    </button>
                  </div>

                  <div>
                    <span className="text-[10px] text-indigo-700 font-extrabold block">طريقة الصرف وتوليد القيود المحاسبية</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">البيانات الإيضاحية وتفاصيل صرف السند</label>
                  <input 
                    type="text"
                    value={payrollNotes}
                    onChange={(e) => setPayrollNotes(e.target.value)}
                    placeholder="سداد مستحقات الكابتن للتمرين بانتظام، شهادة التدريب بولوغ..."
                    className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-between items-center border-t border-indigo-100 pt-4 flex-row-reverse text-right">
                  <div className="text-left font-mono">
                    <span className="text-[10px] text-slate-400 block font-sans font-bold">المستحق النهائي للتحويل</span>
                    <strong className="text-2xl font-black text-indigo-700">
                      {(trainerPayrollData.grossTotal + Number(extraBonus) - Number(extraDeduction)).toLocaleString()} {currency}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenPayoutConfirm}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-emerald-100 flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>اعتماد وصرف المستحقات 💸</span>
                  </button>
                </div>

              </div>

            </div>

            {/* Historical list pay logs for selected trainer */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 flex-row-reverse text-right">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <span>سجل الدفعات والمستحقات السابقة للمدرب:</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-black">
                      <th className="px-4 py-2.5">تاريخ الصرف</th>
                      <th className="px-4 py-2.5">المرتب الأساسي</th>
                      <th className="px-4 py-2.5">العمولة</th>
                      <th className="px-4 py-2.5">الحوافز/الخصومات</th>
                      <th className="px-4 py-2.5">الصافي الكلي</th>
                      <th className="px-4 py-2.5">طريقة الدفع</th>
                      <th className="px-4 py-2.5">مرجع القيد المحاسبي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {!trainerPayrollData.trainer.payoutHistory || trainerPayrollData.trainer.payoutHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          لم يتم رصد أي حوالات أو مدفوعات تاريخية مسجلة لهذا الكابتن سابقاً.
                        </td>
                      </tr>
                    ) : (
                      trainerPayrollData.trainer.payoutHistory.map((ptObj: any) => (
                        <tr key={ptObj.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-mono text-slate-600">{ptObj.date}</td>
                          <td className="px-4 py-2.5 font-mono">{ptObj.baseSalary} {currency}</td>
                          <td className="px-4 py-2.5 font-mono text-emerald-600">+{ptObj.commissionAmount} {currency}</td>
                          <td className="px-4 py-2.5 font-mono">
                            <span className="text-emerald-600">+{ptObj.extraBonus || 0}</span> / <span className="text-rose-600">-{ptObj.extraDeduction || 0}</span>
                          </td>
                          <td className="px-4 py-2.5 font-mono font-black text-slate-900">{ptObj.totalAmount} {currency}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-600">{ptObj.paymentMethod}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[9px] text-slate-500 font-bold block truncate max-w-[120px]" title={ptObj.journalRef}>
                              {ptObj.journalRef || 'تلقائي للنواة'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white border border-slate-200 text-slate-400 text-center py-16 rounded-3xl">
            <Info className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold">يرجى اختيار أحد الكباتن من اللوحة للمضي في التدابير المالية.</p>
          </div>
        )}
      </div>

    </div>
  );
};
