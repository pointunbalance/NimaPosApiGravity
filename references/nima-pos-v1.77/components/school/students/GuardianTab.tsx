import React from 'react';
import { Users } from 'lucide-react';

interface GuardianTabProps {
  guardianId: string;
  setGuardianId: React.Dispatch<React.SetStateAction<string>>;
  guardians: any[];
  handleLinkGuardian: () => void;
}

export const GuardianTab: React.FC<GuardianTabProps> = ({ guardianId, setGuardianId, guardians, handleLinkGuardian }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <Users className="w-6 h-6 text-brand-600" />
          <h3 className="text-xl font-black text-slate-800">بيانات ولي الأمر والأسرة</h3>
       </div>
       
       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <p className="text-slate-600 font-medium tracking-wide">
             قم بربط الطفل بولي أمر موجود في النظام، أو قم بإضافة ولي أمر جديد من شاشة أولياء الأمور أولاً.
          </p>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">اختر ولي الأمر من القائمة</label>
            <select 
              value={guardianId} 
              onChange={e => setGuardianId(e.target.value)} 
              className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-800"
            >
               <option value="" disabled>الرجاء اختيار ولي أمر...</option>
               {guardians.map(g => <option key={g.id} value={g.id}>{g.name} - {g.primaryPhone}</option>)}
            </select>
          </div>
          <div className="flex justify-start">
            <button onClick={handleLinkGuardian} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-sm relative overflow-hidden">
               <span>حفظ وتوثيق الارتباط</span>
            </button>
          </div>
       </div>

       {guardianId && guardians.find(g => g.id === Number(guardianId)) && (
         <div className="bg-white border-2 border-emerald-100 rounded-2xl p-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
            <h4 className="font-black text-emerald-800 text-lg mb-4">الملف التعريفي لولي الأمر</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               <div>
                  <p className="text-sm font-bold text-slate-500">الاسم</p>
                  <p className="font-bold text-slate-800 mt-1">{guardians.find(g => g.id === Number(guardianId))?.name}</p>
               </div>
               <div>
                  <p className="text-sm font-bold text-slate-500">الجوال</p>
                  <p className="font-mono text-slate-800 mt-1" dir="ltr">{guardians.find(g => g.id === Number(guardianId))?.primaryPhone}</p>
               </div>
               <div className="col-span-2">
                  <p className="text-sm font-bold text-slate-500">ملاحظات</p>
                  <p className="font-medium text-slate-800 mt-1">{guardians.find(g => g.id === Number(guardianId))?.notes || 'لا يوجد'}</p>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};
