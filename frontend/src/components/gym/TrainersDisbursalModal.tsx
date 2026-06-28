import React from 'react';
import { CreditCard } from 'lucide-react';

interface TrainersDisbursalModalProps {
  isOpen: boolean;
  trainerPayrollData: {
    trainer: {
      name: string;
    };
    grossTotal: number;
  } | null;
  extraBonus: number;
  extraDeduction: number;
  payrollMethod: string;
  currency: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const TrainersDisbursalModal: React.FC<TrainersDisbursalModalProps> = ({
  isOpen,
  trainerPayrollData,
  extraBonus,
  extraDeduction,
  payrollMethod,
  currency,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !trainerPayrollData) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans text-right" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95 leading-relaxed text-right border border-slate-100">
        <div className="flex items-center gap-3 mb-4 text-emerald-600 flex-row-reverse text-right">
          <div className="p-2.5 bg-emerald-100 rounded-full">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-lg text-slate-800">تأكيد صرف الرواتب وتوليد القيود</h3>
        </div>
        
        <p className="text-xs text-slate-600 leading-relaxed mb-4 text-right">
          أنت على وشك اعتماد المستحقات المالية وحساب العمولات الخاص بالكابتن <strong className="text-indigo-600">{trainerPayrollData.trainer.name}</strong>. سيقوم النظام بالسحب التلقائي وإنشاء القيود المزدوجة بالدفتر الموحد.
        </p>

        <ul className="text-xs text-slate-500 list-inside space-y-1.5 bg-slate-50 p-3 rounded-xl border mb-6 text-right">
          <li>• صرف قيمة صافية قدرها: <strong>{(trainerPayrollData.grossTotal + extraBonus - extraDeduction).toLocaleString()} {currency}</strong></li>
          <li>• سحب النقدية من: <strong>{payrollMethod === 'bank' ? 'حساب البنك والشبكة الإلكترونية' : 'الصندوق النقدي الرياضي'}</strong></li>
          <li>• توليد سند قيد مزدوج آلياً بدفتر القيود اليومية تحت حساب الأجور المصروفة.</li>
        </ul>
        
        <div className="flex justify-end gap-3 text-xs flex-row-reverse">
          <button
            onClick={onConfirm}
            className="px-4 py-2.5 bg-emerald-600 text-white font-black hover:bg-emerald-700 rounded-lg transition-all cursor-pointer"
          >
            تأكيد واعتماد الصرف الدفتري ⚡
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-bold transition-all cursor-pointer border border-slate-150 bg-white"
          >
            تراجع وإلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainersDisbursalModal;
