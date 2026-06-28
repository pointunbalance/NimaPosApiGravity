import React from "react";
import { ShieldAlert, CheckCircle2, Download, ArrowLeft } from "lucide-react";

interface FiscalYearValidationStepProps {
  validationIssues: string[];
  hasBackedUp: boolean;
  onBackup: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const FiscalYearValidationStep: React.FC<FiscalYearValidationStepProps> = ({
  validationIssues,
  hasBackedUp,
  onBackup,
  onPrev,
  onNext,
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">
        التحقق من سلامة البيانات
      </h2>

      <div className="space-y-4 mb-8 font-bold">
        {validationIssues.length > 0 ? (
          validationIssues.map((issue, idx) => (
            <div
              key={idx}
              className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-200"
            >
              <ShieldAlert className="w-6 h-6 shrink-0" />
              {issue}
            </div>
          ))
        ) : (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-3 border border-emerald-200">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            جميع القيود متوازنة ومرحلة. النظام جاهز للإغلاق.
          </div>
        )}

        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            hasBackedUp ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                hasBackedUp ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
              }`}
            >
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-gray-800">نسخة احتياطية (إلزامي)</p>
              <p className="text-xs text-gray-500">يجب أخذ نسخة احتياطية قبل المتابعة</p>
            </div>
          </div>
          <button
            onClick={onBackup}
            className={`px-4 py-2 rounded-lg font-bold text-sm ${
              hasBackedUp
                ? "bg-green-200 text-green-800 cursor-default"
                : "bg-amber-500 text-white hover:bg-amber-600"
            }`}
          >
            {hasBackedUp ? "تم النسخ" : "تحميل النسخة"}
          </button>
        </div>
      </div>

      <div className="flex justify-between font-bold">
        <button onClick={onPrev} className="text-gray-500 hover:text-gray-700">
          السابق
        </button>
        <button
          onClick={onNext}
          disabled={validationIssues.length > 0 || !hasBackedUp}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          التالي <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FiscalYearValidationStep;
