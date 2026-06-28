import React from 'react';
import { FileText } from 'lucide-react';

interface NotesTabProps {
  childNotes: string;
  setChildNotes: React.Dispatch<React.SetStateAction<string>>;
  handleSaveNotes: () => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({ childNotes, setChildNotes, handleSaveNotes }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <FileText className="w-6 h-6 text-amber-600" />
          <h3 className="text-xl font-black text-slate-800">ملاحظات الإدارة والمعلمين</h3>
       </div>
       <div className="bg-white border-2 border-amber-50 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-600 mb-3">يمكنك ترك أي ملاحظات تخص الطفل (نفسية، سلوكية، متطلبات خاصة) سيراها طاقم الإدارة.</p>
          <textarea 
             rows={8}
             value={childNotes}
             onChange={e => setChildNotes(e.target.value)}
             placeholder="اكتب ملاحظاتك هنا..."
             className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 outline-none font-medium resize-none text-slate-800"
          />
          <div className="mt-4 flex justify-end">
             <button onClick={handleSaveNotes} className="bg-brand-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-sm hover:bg-brand-700">حفظ الملاحظات</button>
          </div>
       </div>
    </div>
  );
};
