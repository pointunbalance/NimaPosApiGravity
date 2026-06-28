import React from 'react';
import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';

interface ArabicKeyboardProps {
  loading: boolean;
  users: any[];
  keyboardNumRow: string[];
  arRow1: string[];
  arRow2: string[];
  arRow3: string[];
  handleNumClick: (num: string) => void;
  handleDelete: () => void;
}

export const ArabicKeyboard: React.FC<ArabicKeyboardProps> = ({
  loading,
  users,
  keyboardNumRow,
  arRow1,
  arRow2,
  arRow3,
  handleNumClick,
  handleDelete,
}) => {
  return (
    <div className="flex flex-col gap-2 w-full select-none" dir="rtl">
      {/* Numbers Row */}
      <div className="flex justify-center gap-1 animate-in fade-in zoom-in-95 duration-200">
        {keyboardNumRow.map((num) => (
          <motion.button
            key={num}
            type="button"
            onClick={() => handleNumClick(num)}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 450, damping: 10 }}
            disabled={loading || users.length === 0}
            className="flex-1 h-11 rounded-xl bg-white border border-slate-200 shadow-sm active:scale-95 transition-all text-xs md:text-sm font-black text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 cursor-pointer"
          >
            {num}
          </motion.button>
        ))}
      </div>

      {/* Row 1 */}
      <div className="flex justify-center gap-1 animate-in fade-in zoom-in-95 duration-200 delay-[30ms]">
        {arRow1.map((char) => (
          <motion.button
            key={char}
            type="button"
            onClick={() => handleNumClick(char)}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 450, damping: 10 }}
            disabled={loading || users.length === 0}
            className="flex-1 h-11 rounded-xl bg-white border border-slate-200 shadow-sm active:scale-95 transition-all text-xs md:text-sm font-black text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 cursor-pointer"
          >
            {char}
          </motion.button>
        ))}
      </div>

      {/* Row 2 */}
      <div className="flex justify-center gap-1 animate-in fade-in zoom-in-95 duration-200 delay-[60ms]">
        {arRow2.map((char) => (
          <motion.button
            key={char}
            type="button"
            onClick={() => handleNumClick(char)}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 450, damping: 10 }}
            disabled={loading || users.length === 0}
            className="flex-1 h-11 rounded-xl bg-white border border-slate-200 shadow-sm active:scale-95 transition-all text-xs md:text-sm font-black text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 cursor-pointer"
          >
            {char}
          </motion.button>
        ))}
      </div>

      {/* Row 3 */}
      <div className="flex justify-center gap-1 animate-in fade-in zoom-in-95 duration-200 delay-[90ms]">
        {arRow3.map((char) => (
          <motion.button
            key={char}
            type="button"
            onClick={() => handleNumClick(char)}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 450, damping: 10 }}
            disabled={loading || users.length === 0}
            className="flex-1 h-11 rounded-xl bg-white border border-slate-200 shadow-sm active:scale-95 transition-all text-xs md:text-sm font-black text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 cursor-pointer"
          >
            {char}
          </motion.button>
        ))}
        <motion.button
          type="button"
          onClick={handleDelete}
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 450, damping: 10 }}
          disabled={loading}
          className="w-14 h-11 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-500 hover:text-rose-600 hover:bg-rose-100 disabled:opacity-50 cursor-pointer flex items-center justify-center"
        >
          <Delete className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
};
