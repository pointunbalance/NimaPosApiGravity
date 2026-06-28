import React from "react";
import { CheckCircle2 } from "lucide-react";

interface FiscalYearClosingStepperProps {
  currentStep: number;
}

const FiscalYearClosingStepper: React.FC<FiscalYearClosingStepperProps> = ({
  currentStep,
}) => {
  const steps = [
    { id: 1, label: "الإعداد" },
    { id: 2, label: "التحقق" },
    { id: 3, label: "المعاينة" },
    { id: 4, label: "الإقفال" },
  ];

  return (
    <div className="flex justify-between mb-8 relative print:hidden">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded-full"></div>
      {steps.map((step) => (
        <div
          key={step.id}
          className={`flex flex-col items-center gap-2 bg-slate-50/50 px-4 transition-colors ${
            currentStep >= step.id ? "text-indigo-600" : "text-gray-400"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-4 transition-all ${
              currentStep >= step.id
                ? "bg-indigo-600 text-white border-indigo-100"
                : "bg-white text-gray-400 border-gray-200"
            }`}
          >
            {currentStep > step.id ? <CheckCircle2 className="w-6 h-6" /> : step.id}
          </div>
          <span className="text-xs font-bold">{step.label}</span>
        </div>
      ))}
    </div>
  );
};

export default FiscalYearClosingStepper;
