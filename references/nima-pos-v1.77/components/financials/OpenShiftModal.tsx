import React, { useState } from 'react';
import { XCircle, Banknote, Clock } from 'lucide-react';

interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startCash: number) => Promise<void>;
}

export const OpenShiftModal: React.FC<OpenShiftModalProps> = ({ isOpen, onClose, onSave }) => {
  const [openShiftStartCash, setOpenShiftStartCash] = useState<number>(0);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(openShiftStartCash);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" dir="rtl">
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-indigo-100/50">
        <div className="p-6 border-b border-indigo-50 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-800">فتح وردية جديدة</h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl transition-all"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-2">الرصيد الافتتاحي (كاش في الدرج) *</label>
            <div className="relative">
              <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="number" 
                required 
                min="0" 
                step="0.01" 
                value={openShiftStartCash} 
                onChange={e => setOpenShiftStartCash(parseFloat(e.target.value) || 0)} 
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-indigo-100/60 rounded-2xl outline-none font-black text-lg focus:border-indigo-500" 
                placeholder="0.00" 
              />
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-indigo-50 bg-slate-50/50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-xl font-black text-slate-600 hover:bg-slate-200 transition-all text-sm cursor-pointer"
          >
            إلغاء
          </button>
          <button 
            type="submit" 
            className="px-6 py-2.5 bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white rounded-xl font-black shadow-md shadow-indigo-500/10 flex items-center gap-2 text-sm transition-all cursor-pointer"
          >
            <Clock size={18} className="stroke-[2.5]" />
            بدء الوردية
          </button>
        </div>
      </form>
    </div>
  );
};

export default OpenShiftModal;
