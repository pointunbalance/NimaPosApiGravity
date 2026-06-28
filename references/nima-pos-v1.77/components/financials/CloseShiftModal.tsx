import React, { useState } from 'react';
import { XCircle, Banknote, Clock, CheckCircle } from 'lucide-react';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (declaredCash: number, notes: string) => Promise<void>;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({ isOpen, onClose, onSave }) => {
  const [declaredCash, setDeclaredCash] = useState<number>(0);
  const [closeShiftNotes, setCloseShiftNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(declaredCash, closeShiftNotes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" dir="rtl">
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-indigo-100/50">
        <div className="p-6 border-b border-rose-100 flex justify-between items-center bg-rose-50/50">
          <h2 className="text-lg font-black text-rose-800 flex items-center gap-2">
            <Clock className="w-5 h-5"/> الإغلاق الأعمى للوردية (Blind Drop)
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 hover:bg-rose-100/50 text-rose-500 hover:text-rose-700 rounded-xl transition-all"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="bg-indigo-50 border border-indigo-100/40 text-indigo-700 p-4 rounded-2xl text-xs font-bold leading-relaxed">
            يرجى عد المبالغ النقدية (الكاش) الموجودة في الدرج الفعلي وإدخالها هنا. سيقوم النظام بمطابقتها سرياً وإرسال تقرير التطابق للإدارة مباشرة.
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-2">النقد الفعلي بالدرج (كاش فقط) *</label>
            <div className="relative">
              <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="number" 
                required 
                min="0" 
                step="0.01" 
                value={declaredCash || ''} 
                onChange={e => setDeclaredCash(parseFloat(e.target.value) || 0)} 
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-indigo-100/60 rounded-2xl outline-none font-black text-xl focus:border-rose-500 text-slate-800" 
                placeholder="أدخل الرقم النهائي للكاش" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-2">ملاحظات الإغلاق (اختياري)</label>
            <textarea 
              value={closeShiftNotes} 
              onChange={e => setCloseShiftNotes(e.target.value)} 
              rows={3} 
              className="w-full bg-slate-50 border border-indigo-100/60 py-2 px-4 rounded-2xl outline-none text-sm font-bold transition-all text-slate-800 resize-none" 
              placeholder="أي طوارئ أو أسباب لعجز/زيادة إن كنت تعلم..."
            />
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
            className="px-6 py-2.5 bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-750 text-white rounded-xl font-black shadow-md shadow-rose-500/10 flex items-center gap-2 text-sm transition-all cursor-pointer"
          >
            <CheckCircle size={18} className="stroke-[2.5]" />
            تأكيد وإغلاق نهائي
          </button>
        </div>
      </form>
    </div>
  );
};

export default CloseShiftModal;
