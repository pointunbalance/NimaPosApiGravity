import React from 'react';
import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';

interface EnglishKeyboardProps {
  loading: boolean;
  users: any[];
  isShift: boolean;
  setIsShift: React.Dispatch<React.SetStateAction<boolean>>;
  keyboardNumRow: string[];
  enRow1: string[];
  enRow2: string[];
  enRow3: string[];
  handleNumClick: (num: string) => void;
  handleDelete: () => void;
  playSound: (type: 'click' | 'success' | 'error' | 'delete' | 'typing') => void;
}

export const EnglishKeyboard: React.FC<EnglishKeyboardProps> = ({
  loading,
  users,
  isShift,
  setIsShift,
  keyboardNumRow,
  enRow1,
  enRow2,
  enRow3,
  handleNumClick,
  handleDelete,
  playSound,
}) => {
  return (
    <div className="flex flex-col gap-2 w-full select-none" dir="ltr">
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
            className="flex-1 h-11 rounded-xl bg-white border border-slate-200 shadow-sm active:scale-95 transition-all text-sm font-black text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 cursor-pointer"
          >
            {num}
          </motion.button>
        ))}
      </div>

      {/* Row 1 */}
      <div className="flex justify-center gap-1 animate-in fade-in zoom-in-95 duration-200 delay-[30ms]">
        {enRow1.map((char) => {
          const keyText = isShift ? char.toUpperCase() : char;
          return (
            <motion.button
              key={char}
              type="button"
              onClick={() => handleNumClick(keyText)}
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 450, damping: 10 }}
              disabled={loading || users.length === 0}
              className="flex-1 h-11 rounded-xl bg-white border border-slate-200 shadow-sm active:scale-95 transition-all text-sm font-black text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 cursor-pointer"
            >
              {keyText}
            </motion.button>
          );
        })}
      </div>

      {/* Row 2 */}
      <div className="flex justify-center gap-1 animate-in fade-in zoom-in-95 duration-200 delay-[60ms]">
        {enRow2.map((char) => {
          const keyText = isShift ? char.toUpperCase() : char;
          return (
            <motion.button
              key={char}
              type="button"
              onClick={() => handleNumClick(keyText)}
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 450, damping: 10 }}
              disabled={loading || users.length === 0}
              className="flex-1 h-11 rounded-xl bg-white border border-slate-200 shadow-sm active:scale-95 transition-all text-sm font-black text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 cursor-pointer"
            >
              {keyText}
            </motion.button>
          );
        })}
      </div>

      {/* Row 3 */}
      <div className="flex justify-center gap-1 animate-in fade-in zoom-in-95 duration-200 delay-[90ms]">
        <motion.button
          type="button"
          onClick={() => { setIsShift(prev => !prev); playSound('click'); }}
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 450, damping: 10 }}
          className={`w-16 h-11 rounded-xl border text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
            isShift 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-indigo-500 shadow-md active:scale-95' 
              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
          }`}
        >
          Shift
        </motion.button>
        {enRow3.map((char) => {
          const keyText = isShift ? char.toUpperCase() : char;
          return (
            <motion.button
              key={char}
              type="button"
              onClick={() => handleNumClick(keyText)}
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 450, damping: 10 }}
              disabled={loading || users.length === 0}
              className="flex-1 h-11 rounded-xl bg-white border border-slate-200 shadow-sm active:scale-95 transition-all text-sm font-black text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 cursor-pointer"
            >
              {keyText}
            </motion.button>
          );
        })}
        <motion.button
          type="button"
          onClick={handleDelete}
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 450, damping: 10 }}
          disabled={loading}
          className="w-16 h-11 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-500 hover:text-rose-600 hover:bg-rose-100 disabled:opacity-50 cursor-pointer flex items-center justify-center"
        >
          <Delete className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
};
