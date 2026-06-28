import React from 'react';
import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';

interface NumericKeypadProps {
  loading: boolean;
  pin: string;
  setPin: React.Dispatch<React.SetStateAction<string>>;
  handleNumClick: (num: string) => void;
  handleDelete: () => void;
  playSound: (type: 'click' | 'success' | 'error' | 'delete' | 'typing') => void;
  disabled: boolean;
}

const getButtonColorClass = (num: string) => {
  switch (num) {
    case '1': return 'bg-[#4ade80] text-white shadow-[0_8px_20px_-4px_rgba(74,222,128,0.35)]';
    case '2': return 'bg-[#ffbc12] text-white shadow-[0_8px_20px_-4px_rgba(255,188,18,0.35)]';
    case '3': return 'bg-[#5ecf81] text-white shadow-[0_8px_20px_-4px_rgba(94,207,129,0.35)]';
    case '4': return 'bg-[#48b3ff] text-white shadow-[0_8px_20px_-4px_rgba(72,179,255,0.35)]';
    case '5': return 'bg-[#ff6599] text-white shadow-[0_8px_20px_-4px_rgba(255,101,153,0.35)]';
    case '6': return 'bg-[#a29bfe] text-white shadow-[0_8px_20px_-4px_rgba(162,155,254,0.35)]';
    case '7': return 'bg-[#badc58] text-white shadow-[0_8px_20px_-4px_rgba(186,220,88,0.35)]';
    case '8': return 'bg-[#00d2d3] text-white shadow-[0_8px_20px_-4px_rgba(0,210,211,0.35)]';
    case '9': return 'bg-[#ff9f43] text-white shadow-[0_8px_20px_-4px_rgba(255,159,67,0.35)]';
    case '0': return 'bg-[#1e90ff] text-white shadow-[0_8px_20px_-4px_rgba(30,144,255,0.35)]';
    default: return 'bg-slate-100 text-slate-700';
  }
};

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  loading,
  pin,
  setPin,
  handleNumClick,
  handleDelete,
  playSound,
  disabled,
}) => {
  return (
    <div className="grid grid-cols-3 gap-4" dir="ltr">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <motion.button
          key={num}
          type="button"
          onClick={() => handleNumClick(num.toString())}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 450, damping: 10 }}
          disabled={disabled}
          className={`h-[74px] rounded-[22px] transition-all text-[28px] font-black active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-sans select-none cursor-pointer border border-white/10 ${getButtonColorClass(num.toString())}`}
        >
          <span className="font-sans font-black leading-none">{num}</span>
        </motion.button>
      ))}
      
      <motion.button
        type="button"
        onClick={() => { setPin(''); playSound('delete'); }}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 450, damping: 10 }}
        disabled={loading || pin.length === 0}
        className="h-[74px] rounded-[22px] bg-[#ff4757] text-white border border-white/10 shadow-[0_8px_20px_-4px_rgba(255,71,87,0.35)] transition-all text-[25px] font-[1000] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center select-none cursor-pointer group"
        title="مسح الكل"
      >
        <span className="font-sans font-[1000] leading-none group-hover:scale-110 transition-transform">C</span>
      </motion.button>

      <motion.button
        type="button"
        onClick={() => handleNumClick('0')}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 450, damping: 10 }}
        disabled={disabled}
        className={`h-[74px] rounded-[22px] transition-all text-[28px] font-black active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-sans select-none cursor-pointer border border-white/10 ${getButtonColorClass('0')}`}
      >
        <span className="font-sans font-black leading-none">0</span>
      </motion.button>

      <motion.button
        type="button"
        onClick={handleDelete}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 450, damping: 10 }}
        disabled={loading}
        className="h-[74px] rounded-[22px] bg-[#eef2f7] border border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:bg-[#e2e8f0] transition-all flex items-center justify-center text-slate-500 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
      >
        <Delete className="w-7 h-7 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.75} />
      </motion.button>
    </div>
  );
};
