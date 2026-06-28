import React from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning';
  message: string;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  type,
  message,
  onClose,
}) => {
  if (!isOpen) return null;

  const config = {
    success: {
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      title: 'عملية ناجحة',
    },
    error: {
      icon: AlertCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
      title: 'فشل العملية',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      title: 'تنبيه هام',
    },
  }[type];

  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${config.bg} ${config.color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-800">{config.title}</h3>
        </div>

        <p className="text-sm font-bold text-slate-600 mb-6 leading-relaxed" dir="rtl">
          {message}
        </p>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            موافق
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
