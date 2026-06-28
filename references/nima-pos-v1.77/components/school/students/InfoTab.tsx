import React from 'react';
import { UserIcon } from 'lucide-react';

interface InfoTabProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleSaveInfo: (e: React.FormEvent) => void;
  levels: any[];
  classesList: any[];
  handleClose: () => void;
}

export const InfoTab: React.FC<InfoTabProps> = ({ formData, setFormData, handleSaveInfo, levels, classesList, handleClose }) => {
  return (
    <form onSubmit={handleSaveInfo} className="space-y-6 animate-in fade-in duration-300">
       <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <UserIcon className="w-6 h-6 text-brand-600" />
          <h3 className="text-xl font-black text-slate-800">البيانات الأساسية والأكاديمية</h3>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">اسم الطفل بالعربية <span className="text-rose-500">*</span></label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-800" placeholder="مثال: تاراس كوزا" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">الكود التسلسلي <span className="text-rose-500">*</span></label>
            <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-mono text-slate-800" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الميلاد <span className="text-rose-500">*</span></label>
            <input type="date" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-800" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">الرقم القومي (شهادة الميلاد)</label>
            <input type="text" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-mono text-slate-800" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">الجنس</label>
            <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-800">
               <option value="ذكر">ذكر</option>
               <option value="أنثى">أنثى</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">المستوى التعليمي <span className="text-rose-500">*</span></label>
            <select required value={formData.levelId} onChange={e => setFormData({...formData, levelId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-800">
               <option value="" disabled>اختر المستوى...</option>
               {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">الفصل <span className="text-rose-500">*</span></label>
            <select required value={formData.classroomId} onChange={e => setFormData({...formData, classroomId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-800">
               <option value="" disabled>اختر الفصل...</option>
               {classesList.filter(c => c.levelId === Number(formData.levelId)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">حالة التسجيل</label>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-800">
               <option value="نشط">نشط (حالي)</option>
               <option value="متوقف">إيقاف مؤقت</option>
               <option value="منسحب">منسحب (أرشيف)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الانضمام</label>
            <input type="date" value={formData.enrollmentDate} onChange={e => setFormData({...formData, enrollmentDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-800" />
          </div>
       </div>
       <div className="pt-6 border-t border-slate-100 flex flex-row-reverse gap-3">
          <button type="submit" className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 shadow-sm">حفظ البيانات الأساسية</button>
          <button type="button" onClick={handleClose} className="bg-slate-100 text-slate-700 px-8 py-3 rounded-xl font-bold hover:bg-slate-200">إلغاء</button>
       </div>
    </form>
  );
};
