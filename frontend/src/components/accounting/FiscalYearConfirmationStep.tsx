import React from "react";
import { Lock } from "lucide-react";

interface FiscalYearConfirmationStepProps {
  isProcessing: boolean;
  onPrev: () => void;
  onExecute: () => void;
}

const FiscalYearConfirmationStep: React.FC<FiscalYearConfirmationStepProps> = ({
  isProcessing,
  onPrev,
  onExecute,
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 text-center animate-in fade-in slide-in-from-bottom-4">
      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 border-4 border-red-100">
        <Lock className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">
        تأكيد الإقفال النهائي
      </h2>
      <p className="text-slate-500 max-w-md mx-auto mb-8 font-bold text-sm">
        أنت على وشك إغلاق الفترة المالية وترحيل الأرصدة. لا يمكن التراجع عن هذه العملية
        بسهولة وسيتم منع التعديل على العمليات السابقة لهذا التاريخ.
      </p>

      <div className="flex justify-center gap-4 font-bold">
        <button
          onClick={onPrev}
          className="px-6 py-3 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
        >
          تراجع
        </button>
        <button
          onClick={onExecute}
          disabled={isProcessing}
          className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 flex items-center gap-2"
        >
          {isProcessing ? "جاري التنفيذ..." : "تنفيذ الإقفال"}
        </button>
      </div>
    </div>
  );
};

export default FiscalYearConfirmationStep;
