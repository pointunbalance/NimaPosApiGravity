import React from 'react';
import { X, Users } from 'lucide-react';
import { Student, Staff } from '../../../types';

interface SchoolSubModalProps {
subModalOpen: boolean;
setSubModalOpen: (val: boolean) => void;
handleSaveSub: (e: any) => void;
subFormData: any;
setSubFormData: (val: any) => void;
students: Student[];
routes: any[];
}

export const SchoolSubModal: React.FC<SchoolSubModalProps> = (props) => {
   const { subModalOpen, setSubModalOpen, handleSaveSub, subFormData, setSubFormData, students, routes } = props;
   if (!subModalOpen) return null;
   return (
            <>
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                       <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                          <h3 className="text-xl font-black text-slate-800">اشتراك طالب في باص</h3>
                          <button onClick={() => setSubModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X className="w-5 h-5"/></button>
                       </div>
                       <form onSubmit={handleSaveSub} className="p-6 space-y-4 text-sm">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">الطالب</label>
                                <select required value={subFormData.studentId} onChange={e => setSubFormData({...subFormData, studentId: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none">
                                    <option value={0} disabled>-- اختر الطالب --</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">الخط</label>
                                <select required value={subFormData.routeId} onChange={e => setSubFormData({...subFormData, routeId: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none">
                                    <option value={0} disabled>-- اختر --</option>
                                    {routes.filter(r => r.status === 'active').map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">نوع الاشتراك</label>
                                <select value={subFormData.type} onChange={e => setSubFormData({...subFormData, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none">
                                    <option value="both">ذهاب وعودة (كامل)</option>
                                    <option value="morning">ذهاب للمدرسة فقط (صباحي)</option>
                                    <option value="afternoon">عودة للمنزل فقط (مسائي)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">نقطة الركوب / النزول</label>
                                <input type="text" value={subFormData.stopName} onChange={e => setSubFormData({...subFormData, stopName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none" placeholder="أمام صيدلية العزبي، عمارة ٢.." />
                            </div>
                           <div className="pt-4 border-t border-slate-100 flex gap-3">
                               <button type="submit" className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-bold hover:bg-indigo-700">تأكيد الاشتراك</button>
                           </div>
                       </form>
                    </div>
                 </div>
            </>

            );
};
