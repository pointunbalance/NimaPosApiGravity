import React from 'react';
import { Play, Square, X, ShieldAlert } from 'lucide-react';

interface StartShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  startCashValue: string;
  setStartCashValue: (val: string) => void;
  onConfirm: () => Promise<void>;
}

export const StartShiftModal: React.FC<StartShiftModalProps> = ({
  isOpen,
  onClose,
  startCashValue,
  setStartCashValue,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Play className="w-5 h-5 text-emerald-600 fill-current" /> فتح يومية الكاشير جديدة
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-slate-500 font-medium text-sm leading-relaxed">أدخل قيمة العهدة النقدية الافتتاحية المتواجدة في درج الكاشير للبدء بالتوثيق وحساب الموازنات.</p>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">مبلغ العهدة الافتتاحية (ج.م)</label>
            <div className="relative">
              <input
                type="number"
                value={startCashValue}
                onChange={(e) => setStartCashValue(e.target.value)}
                className="w-full p-4 pr-12 bg-slate-50 rounded-2xl border border-slate-200 font-black text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">ج.م</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onConfirm}
              className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 active:scale-95 transition-all text-center"
            >
              تأكيد وفتح الوردية
            </button>
            <button
              onClick={onClose}
              className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift: any;
  totalCashIn: number;
  totalCashOut: number;
  expectedCash: number;
  actualCashValue: string;
  setActualCashValue: (val: string) => void;
  onConfirm: () => Promise<void>;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  isOpen,
  onClose,
  activeShift,
  totalCashIn,
  totalCashOut,
  expectedCash,
  actualCashValue,
  setActualCashValue,
  onConfirm
}) => {
  if (!isOpen) return null;

  const diff = (Number(actualCashValue) || 0) - expectedCash;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-rose-800 flex items-center gap-2">
            <Square className="w-5 h-5 text-rose-600 fill-current" /> إغلاق يومية الكاشير
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex justify-between text-sm font-bold text-slate-600">
              <span>العهدة الابتدائية الكاش:</span>
              <span>{activeShift?.startCash || 0} ج.م</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-600">
              <span>المقبوضات النقدية (+):</span>
              <span>{totalCashIn} ج.م</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-600">
              <span>المدفوعات النقدية (-):</span>
              <span>{totalCashOut} ج.م</span>
            </div>
            <div className="h-px bg-slate-200 my-2" />
            <div className="flex justify-between text-base font-black text-slate-800">
              <span>المبلغ المفترض تواجده:</span>
              <span className="text-emerald-600">{expectedCash} ج.م</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">المبلغ الفعلي المتواجد بالدرج حالياً</label>
            <div className="relative">
              <input
                type="number"
                value={actualCashValue}
                onChange={(e) => setActualCashValue(e.target.value)}
                className="w-full p-4 pr-12 bg-slate-50 rounded-2xl border border-slate-200 font-black text-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">ج.م</span>
            </div>
          </div>

          {diff !== 0 && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2 text-amber-800">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black">تنبيه بوجود فارق مالي ({diff > 0 ? 'زيادة' : 'عجز'})!</p>
                <p className="text-[11px] font-bold mt-0.5">تبلغ الفوارق المالية {Math.abs(diff)} ج.م. هل أنت متأكد من صحة الحصر وإغلاق اليدوية بهذا الفارق؟</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onConfirm}
              className="flex-1 py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-black shadow-lg active:scale-95 transition-all text-center"
            >
              تأكيد الإقفال والمطابقة
            </button>
            <button
              onClick={onClose}
              className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
            >
              تراجع
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
