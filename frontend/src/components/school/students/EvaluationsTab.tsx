import React from 'react';
import { ClipboardList, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { logActivity } from '../../../utils/logger';

interface EvaluationsTabProps {
  selectedChildId: number;
  evalForm: any;
  setEvalForm: React.Dispatch<React.SetStateAction<any>>;
  handleAddEvaluation: (e: React.FormEvent) => void;
}

export const EvaluationsTab: React.FC<EvaluationsTabProps> = ({ selectedChildId, evalForm, setEvalForm, handleAddEvaluation }) => {
  const evaluationsLogs = useLiveQuery(() => db.studentEvaluations.where('studentId').equals(selectedChildId || 0).toArray()) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <ClipboardList className="w-6 h-6 text-fuchsia-600" />
          <h3 className="text-xl font-black text-slate-800">التقييمات الأكاديمية والسلوكية</h3>
       </div>

       <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <h4 className="font-black text-slate-800 mb-4">إضافة تقييم جديد</h4>
          <form onSubmit={handleAddEvaluation} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <input required type="text" value={evalForm.subject} onChange={e => setEvalForm({...evalForm, subject: e.target.value})} placeholder="المادة / النشاط" className="bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold" />
             <select value={evalForm.score} onChange={e => setEvalForm({...evalForm, score: e.target.value})} className="bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold">
                <option value="">التقييم...</option>
                <option value="ممتاز">ممتاز (A)</option>
                <option value="جيد جداً">جيد جداً (B)</option>
                <option value="جيد">جيد (C)</option>
                <option value="مقبول">مقبول (D)</option>
                <option value="ضعيف">ضعيف (E)</option>
             </select>
             <input required type="date" value={evalForm.date} onChange={e => setEvalForm({...evalForm, date: e.target.value})} className="bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold" />
             <button type="submit" className="bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-sm">حفظ التقييم</button>
             <div className="col-span-full">
                <input type="text" value={evalForm.comments} onChange={e => setEvalForm({...evalForm, comments: e.target.value})} placeholder="ملاحظات المعلم (اختياري)..." className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-medium" />
             </div>
          </form>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {evaluationsLogs.length === 0 ? (
             <div className="col-span-full p-8 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">لا توجد تقييمات</div>
          ) : (
             evaluationsLogs.map((e: any) => (
                <div key={e.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col gap-2 relative group">
                   <button onClick={async () => {
                       await db.studentEvaluations.delete(e.id!);
                       await logActivity('studentEvaluations', 'حذف تقييم', `تم حذف تقييم لمادة: ${e.subject}`, undefined, selectedChildId!);
                   }} className="absolute top-4 left-4 p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4"/></button>
                   <div className="flex justify-between items-start">
                      <div>
                         <h4 className="font-bold text-slate-800 text-lg">{e.subject}</h4>
                         <p className="text-xs text-slate-500 font-mono mt-1">{e.date}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                         e.score.includes('ممتاز') ? 'bg-emerald-100 text-emerald-700' :
                         e.score.includes('جيد جداً') ? 'bg-blue-100 text-blue-700' :
                         e.score.includes('ضعيف') ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                         {e.score}
                      </span>
                   </div>
                   {e.comments && <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">{e.comments}</p>}
                </div>
             ))
          )}
       </div>
    </div>
  );
};
