import React from 'react';
import { MessageSquare, X, Coffee } from 'lucide-react';
import { CartItem } from '../../types';

interface RestaurantNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeNoteItem: CartItem | null;
  tempNote: string;
  setTempNote: (val: string) => void;
  saveNotes: () => void;
}

export const RestaurantNotesModal: React.FC<RestaurantNotesModalProps> = ({
  isOpen, onClose, activeNoteItem, tempNote, setTempNote, saveNotes
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">تعديل الملاحظات</h2>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-sm p-2 rounded-full transition-all"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6">
                <div className="mb-4 bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3">
                    <Coffee className="w-8 h-8 text-orange-400" />
                    <div>
                        <p className="text-xs font-bold text-orange-600 mb-0.5">الصنف المحدد</p>
                        <p className="text-base font-bold text-orange-900">{activeNoteItem?.name}</p>
                    </div>
                </div>
                <textarea 
                    value={tempNote}
                    onChange={(e) => setTempNote(e.target.value)}
                    placeholder="أضف تعليمات للطاهي (مثال: بدون بصل، صوص جانبي، تسوية كاملة...)"
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 min-h-[140px] focus:ring-4 focus:border-orange-500 focus:ring-orange-500/20 outline-none resize-none font-medium text-slate-700 transition-all mb-6"
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors">
                        تراجع
                    </button>
                    <button onClick={saveNotes} className="flex-[2] py-3.5 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 active:scale-[0.98]">
                        تطبيق الملاحظة
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
