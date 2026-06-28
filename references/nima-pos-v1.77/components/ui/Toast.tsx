import React, { useEffect } from 'react';
import { X, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 4500); // slightly longer to read
    return () => clearTimeout(timer);
  }, [id, onClose]);

  // Precise typographic separation of title and descriptive message
  const parts = message.split('\n');
  let title = parts[0];
  let body = parts.slice(1).join('\n');

  // Handle single line colons like "نقص مخزون: شاشة ايفون..."
  if (!body && title.includes(': ')) {
    const colonIdx = title.indexOf(': ');
    body = title.substring(colonIdx + 2);
    title = title.substring(0, colonIdx);
  }

  // Graceful fallback for titles if there was no body
  if (!body) {
    body = title;
    switch (type) {
      case 'success': title = 'نجحت العملية'; break;
      case 'error': title = 'حدث خطأ'; break;
      case 'warning': title = 'تنبيه النظام'; break;
      default: title = 'تنبيه إرشادي'; break;
    }
  }

  const getIconStyles = () => {
    switch (type) {
      case 'success': return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/15';
      case 'error': return 'bg-rose-500/10 text-rose-600 border border-rose-500/15';
      case 'warning': return 'bg-amber-500/10 text-amber-600 border border-amber-500/15';
      default: return 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/15';
    }
  };

  const getContainerStyles = () => {
    switch (type) {
      case 'success': return 'border-r-emerald-500 shadow-emerald-500/5';
      case 'error': return 'border-r-rose-500 shadow-rose-500/5';
      case 'warning': return 'border-r-amber-500 shadow-amber-500/5';
      default: return 'border-r-indigo-500 shadow-indigo-500/5';
    }
  };

  const getProgressBarStyles = () => {
    switch (type) {
      case 'success': return 'bg-emerald-500';
      case 'error': return 'bg-rose-500';
      case 'warning': return 'bg-amber-500';
      default: return 'bg-indigo-500';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 shrink-0" />;
      case 'error': return <XCircle className="w-5 h-5 shrink-0" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />;
      default: return <Info className="w-5 h-5 shrink-0" />;
    }
  };

  return (
    <motion.div
      id={`toast-${id}`}
      initial={{ opacity: 0, y: -12, scale: 0.93, x: 25 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: 40, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`relative flex items-start gap-4 p-4 pr-4 pl-3.5 rounded-2xl bg-white border border-slate-200/80 border-r-4 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all duration-200 w-full text-right select-none group pointer-events-auto overflow-hidden min-h-[75px] ${getContainerStyles()}`}
      dir="rtl"
    >
      {/* Dynamic Type Icon */}
      <div className={`p-2.5 rounded-xl shrink-0 ${getIconStyles()}`}>
        {getIcon()}
      </div>

      {/* Styled Typographic Content */}
      <div className="flex-1 min-w-0 pr-0.5 space-y-1">
        <h4 className="text-sm font-black text-slate-800 tracking-tight leading-none pt-0.5">
          {title}
        </h4>
        <p className="text-xs font-semibold text-slate-500 leading-relaxed break-words">
          {body}
        </p>
      </div>

      {/* Sleek Close Button */}
      <button 
        id={`toast-close-${id}`}
        onClick={() => onClose(id)} 
        className="p-1.5 -mt-1 -ml-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0 self-start"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Elegant Infinite Duration Meter */}
      <div className="absolute bottom-0 right-0 left-0 h-[3px] bg-slate-100">
        <motion.div 
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 4.5, ease: 'linear' }}
          className={`h-full ${getProgressBarStyles()}`}
        />
      </div>
    </motion.div>
  );
};

export default Toast;