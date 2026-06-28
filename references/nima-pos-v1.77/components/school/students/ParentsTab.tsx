import React from 'react';
import { Users } from 'lucide-react';

interface ParentsTabProps {
  parentsForm: any;
  setParentsForm: React.Dispatch<React.SetStateAction<any>>;
  handleSaveParents: (e: React.FormEvent) => void;
}

export const ParentsTab: React.FC<ParentsTabProps> = ({ parentsForm, setParentsForm, handleSaveParents }) => {
  return (
    <form onSubmit={handleSaveParents} className="space-y-8 animate-in fade-in duration-300">
       <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <Users className="w-6 h-6 text-brand-600" />
          <h3 className="text-xl font-black text-slate-800">بيانات الوالدين المؤهلات والأرقام</h3>
       </div>

       {/* Father's Info */}
       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
         <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-blue-500"></span> بيانات الأب
         </h4>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <div>
             <label className="block text-sm font-bold text-slate-700 mb-2">اسم الأب</label>
             <input type="text" value={parentsForm?.fatherName || ''} onChange={e => setParentsForm({...parentsForm, fatherName: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-800" placeholder="مثال: أندري لسينكو" />
           </div>
           <div>
             <label className="block text-sm font-bold text-slate-700 mb-2">رقم هاتف الأب</label>
             <input type="text" value={parentsForm?.fatherPhone || ''} onChange={e => setParentsForm({...parentsForm, fatherPhone: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-mono text-slate-800" dir="ltr" placeholder="01..." />
           </div>
           <div>
             <label className="block text-sm font-bold text-slate-700 mb-2">المؤهل</label>
             <input type="text" value={parentsForm?.fatherQualification || ''} onChange={e => setParentsForm({...parentsForm, fatherQualification: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-800" placeholder="مثال: بكالوريوس تجارة" />
           </div>
           <div>
             <label className="block text-sm font-bold text-slate-700 mb-2">الوظيفة</label>
             <input type="text" value={parentsForm?.fatherJob || ''} onChange={e => setParentsForm({...parentsForm, fatherJob: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-800" placeholder="مثال: محاسب" />
           </div>
         </div>
       </div>

       {/* Mother's Info */}
       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
         <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-pink-500"></span> بيانات الأم
         </h4>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <div>
             <label className="block text-sm font-bold text-slate-700 mb-2">اسم الأم</label>
             <input type="text" value={parentsForm?.motherName || ''} onChange={e => setParentsForm({...parentsForm, motherName: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-800" placeholder="مثال: أولغا شفتشينكو" />
           </div>
           <div>
             <label className="block text-sm font-bold text-slate-700 mb-2">رقم هاتف الأم</label>
             <input type="text" value={parentsForm?.motherPhone || ''} onChange={e => setParentsForm({...parentsForm, motherPhone: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-mono text-slate-800" dir="ltr" placeholder="01..." />
           </div>
           <div>
             <label className="block text-sm font-bold text-slate-700 mb-2">المؤهل</label>
             <input type="text" value={parentsForm?.motherQualification || ''} onChange={e => setParentsForm({...parentsForm, motherQualification: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-800" placeholder="مثال: ليسانس آداب" />
           </div>
           <div>
             <label className="block text-sm font-bold text-slate-700 mb-2">الوظيفة</label>
             <input type="text" value={parentsForm?.motherJob || ''} onChange={e => setParentsForm({...parentsForm, motherJob: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-800" placeholder="مثال: مدرسة" />
           </div>
         </div>
       </div>

       <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button type="submit" className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 shadow-sm">حفظ بيانات الوالدين</button>
       </div>
    </form>
  );
};
