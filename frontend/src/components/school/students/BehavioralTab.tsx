import React from 'react';
import { Brain } from 'lucide-react';

interface BehavioralTabProps {
  behavioralForm: any;
  setBehavioralForm: React.Dispatch<React.SetStateAction<any>>;
  handleSaveBehavioral: (e: React.FormEvent) => void;
}

export const BehavioralTab: React.FC<BehavioralTabProps> = ({ behavioralForm, setBehavioralForm, handleSaveBehavioral }) => {
  const form = behavioralForm || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-indigo-50 border-b border-slate-200 p-4 shrink-0 flex gap-3 items-center">
             <Brain className="w-6 h-6 text-indigo-600" />
             <h3 className="text-xl font-black text-indigo-800">السجل السلوكي والتربوي</h3>
          </div>
          <div className="p-6">
             <form onSubmit={handleSaveBehavioral} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <input type="checkbox" id="isShy" checked={!!form.isShy} onChange={e => setBehavioralForm({...form, isShy: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
                      <label htmlFor="isShy" className="font-bold text-slate-700 cursor-pointer">هل الطفل خجول؟</label>
                   </div>
                   <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <input type="checkbox" id="criesALot" checked={!!form.criesALot} onChange={e => setBehavioralForm({...form, criesALot: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
                      <label htmlFor="criesALot" className="font-bold text-slate-700 cursor-pointer">هل الطفل كثير البكاء؟</label>
                   </div>
                   <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <input type="checkbox" id="isAggressive" checked={!!form.isAggressive} onChange={e => setBehavioralForm({...form, isAggressive: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
                      <label htmlFor="isAggressive" className="font-bold text-slate-700 cursor-pointer">هل الطفل عدواني؟</label>
                   </div>
                   <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <input type="checkbox" id="needsSpeechFollowUp" checked={!!form.needsSpeechFollowUp} onChange={e => setBehavioralForm({...form, needsSpeechFollowUp: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
                      <label htmlFor="needsSpeechFollowUp" className="font-bold text-slate-700 cursor-pointer">يحتاج متابعة نطق؟</label>
                   </div>
                   <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <input type="checkbox" id="needsMovementFollowUp" checked={!!form.needsMovementFollowUp} onChange={e => setBehavioralForm({...form, needsMovementFollowUp: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
                      <label htmlFor="needsMovementFollowUp" className="font-bold text-slate-700 cursor-pointer">يحتاج متابعة حركة؟</label>
                   </div>
                   <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <input type="checkbox" id="difficultyIntegrating" checked={!!form.difficultyIntegrating} onChange={e => setBehavioralForm({...form, difficultyIntegrating: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
                      <label htmlFor="difficultyIntegrating" className="font-bold text-slate-700 cursor-pointer">عنده صعوبة اندماج؟</label>
                   </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات المعلمة عند أول أسبوع</label>
                      <textarea value={form.firstWeekNotes || ""} onChange={e => setBehavioralForm({...form, firstWeekNotes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none text-slate-800 h-24" placeholder="كيف كانت استجابة الطفل في الأيام الأولى؟..." />
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">خطة تأقلم للطفل الجديد</label>
                      <textarea value={form.acclimatizationPlan || ""} onChange={e => setBehavioralForm({...form, acclimatizationPlan: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none text-slate-800 h-24" placeholder="خطوات لمساعدة الطفل على الاندماج مع زملائه..." />
                   </div>
                </div>
                <div className="border-t border-slate-100 pt-6 flex justify-end">
                   <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-sm transition flex gap-2 items-center">
                      <Brain className="w-5 h-5" />
                      حفظ السجل السلوكي
                   </button>
                </div>
             </form>
          </div>
       </div>
    </div>
  );
};
