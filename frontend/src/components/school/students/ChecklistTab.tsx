import React from 'react';
import { CheckSquare } from 'lucide-react';

interface ChecklistTabProps {
  checklistForm: any;
  setChecklistForm: React.Dispatch<React.SetStateAction<any>>;
  handleSaveChecklist: (e: React.FormEvent) => void;
}

export const ChecklistTab: React.FC<ChecklistTabProps> = ({ checklistForm, setChecklistForm, handleSaveChecklist }) => {
  const form = checklistForm || {};
  
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-brand-50 border-b border-slate-200 p-4 shrink-0 flex gap-3 items-center">
             <CheckSquare className="w-6 h-6 text-brand-600" />
             <h3 className="text-xl font-black text-brand-800">قائمة المهام الإدارية (Checklist)</h3>
          </div>
          <div className="p-6">
             <p className="text-slate-500 mb-6 font-medium">قائمة لمتابعة تسليمات ومستندات الطفل الإدارية المطلوبة في الملف.</p>
             <form onSubmit={handleSaveChecklist} className="space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                   <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-slate-100 -translate-x-1/2"></div>
                   
                   <div className="space-y-4">
                      <h4 className="font-bold text-slate-700 bg-slate-50 p-2 rounded-lg text-center mb-4">التسليمات المادية (استلمها الطفل)</h4>
                      <label className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
                         <span className="font-bold text-slate-700 group-hover:text-brand-700 transition-colors">شنطة المدرسة / الحضانة</span>
                         <input 
                           type="checkbox" 
                           checked={!!form.bagDelivered} 
                           onChange={e => setChecklistForm({ ...form, bagDelivered: e.target.checked })} 
                           className="w-5 h-5 text-brand-600 rounded bg-slate-100 border-slate-300 focus:ring-brand-500" 
                         />
                      </label>
                      <label className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
                         <span className="font-bold text-slate-700 group-hover:text-brand-700 transition-colors">الزي المدرسي (Uniform)</span>
                         <input 
                           type="checkbox" 
                           checked={!!form.uniformDelivered} 
                           onChange={e => setChecklistForm({ ...form, uniformDelivered: e.target.checked })} 
                           className="w-5 h-5 text-brand-600 rounded bg-slate-100 border-slate-300 focus:ring-brand-500" 
                         />
                      </label>
                      <label className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
                         <span className="font-bold text-slate-700 group-hover:text-brand-700 transition-colors">الكتب التعليمية</span>
                         <input 
                           type="checkbox" 
                           checked={!!form.booksDelivered} 
                           onChange={e => setChecklistForm({ ...form, booksDelivered: e.target.checked })} 
                           className="w-5 h-5 text-brand-600 rounded bg-slate-100 border-slate-300 focus:ring-brand-500" 
                         />
                      </label>
                   </div>

                   <div className="space-y-4">
                      <h4 className="font-bold text-slate-700 bg-slate-50 p-2 rounded-lg text-center mb-4">المستندات والتوقيعات (مطلوبة من ولي الأمر)</h4>
                      <label className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
                         <span className="font-bold text-slate-700 group-hover:text-brand-700 transition-colors">صورة شهادة الميلاد</span>
                         <input 
                           type="checkbox" 
                           checked={!!form.birthCertificateReceived} 
                           onChange={e => setChecklistForm({ ...form, birthCertificateReceived: e.target.checked })} 
                           className="w-5 h-5 text-emerald-500 rounded bg-slate-100 border-slate-300 focus:ring-emerald-500" 
                         />
                      </label>
                      <label className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
                         <span className="font-bold text-slate-700 group-hover:text-brand-700 transition-colors">صورة هوية ولي الأمر</span>
                         <input 
                           type="checkbox" 
                           checked={!!form.guardianIdCopyReceived} 
                           onChange={e => setChecklistForm({ ...form, guardianIdCopyReceived: e.target.checked })} 
                           className="w-5 h-5 text-emerald-500 rounded bg-slate-100 border-slate-300 focus:ring-emerald-500" 
                         />
                      </label>
                      <label className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
                         <span className="font-bold text-slate-700 group-hover:text-brand-700 transition-colors">توقيع عقد الاشتراك</span>
                         <input 
                           type="checkbox" 
                           checked={!!form.subscriptionContractSigned} 
                           onChange={e => setChecklistForm({ ...form, subscriptionContractSigned: e.target.checked })} 
                           className="w-5 h-5 text-emerald-500 rounded bg-slate-100 border-slate-300 focus:ring-emerald-500" 
                         />
                      </label>
                      <label className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
                         <span className="font-bold text-slate-700 group-hover:text-brand-700 transition-colors">موافقة على تصوير الطفل للأنشطة</span>
                         <input 
                           type="checkbox" 
                           checked={!!form.photographyConsentSigned} 
                           onChange={e => setChecklistForm({ ...form, photographyConsentSigned: e.target.checked })} 
                           className="w-5 h-5 text-emerald-500 rounded bg-slate-100 border-slate-300 focus:ring-emerald-500" 
                         />
                      </label>
                      <label className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
                         <span className="font-bold text-slate-700 group-hover:text-brand-700 transition-colors">إقرار الرحلات الخارجية</span>
                         <input 
                           type="checkbox" 
                           checked={!!form.tripConsentSigned} 
                           onChange={e => setChecklistForm({ ...form, tripConsentSigned: e.target.checked })} 
                           className="w-5 h-5 text-emerald-500 rounded bg-slate-100 border-slate-300 focus:ring-emerald-500" 
                         />
                      </label>
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-row-reverse gap-3">
                   <button type="submit" className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 shadow-sm">حفظ التحديثات</button>
                </div>
             </form>
          </div>
       </div>
    </div>
  );
};
