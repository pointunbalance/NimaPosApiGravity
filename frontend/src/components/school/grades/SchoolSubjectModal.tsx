import React from 'react';
import { X, BookOpen, Star, User } from 'lucide-react';


interface SchoolSubjectModalProps {
isSubjectModalOpen: boolean;
setSubjectModalOpen: (val: boolean) => void;
handleSaveSubject: (e: any) => void;
subjectData: any;
setSubjectData: (val: any) => void;
}

export const SchoolSubjectModal: React.FC<SchoolSubjectModalProps> = (props) => {
   const { isSubjectModalOpen, setSubjectModalOpen, handleSaveSubject, subjectData, setSubjectData } = props;
   if (!isSubjectModalOpen) return null;
   return (
            <>
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800">
                                {subjectData.id ? 'تعديل مهارة / مادة' : 'إضافة مهارة/مادة جديدة'}
                            </h2>
                            <button onClick={() => setSubjectModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSaveSubject} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">الاسم (مهارة / مادة / نشاط)</label>
                                <input type="text" value={subjectData.name} onChange={e => setSubjectData({...subjectData, name: e.target.value})} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-slate-800" placeholder="مثال: اللغة العربية ، التركيز، الرسم.." />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">التصنيف والنوع</label>
                                <select value={subjectData.category} onChange={e => setSubjectData({...subjectData, category: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700">
                                    <option value="academic">أكاديمي وتعليمي</option>
                                    <option value="behavioral">سلوكي وتربوي</option>
                                    <option value="activities">أنشطة فنية وحركية</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">طريقة التقييم في نموذج المعلمة</label>
                                <select value={subjectData.evaluationMethod} onChange={e => setSubjectData({...subjectData, evaluationMethod: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700">
                                    <option value="score">رقمي (درجات - ٩٠/١٠٠ وهكذا)</option>
                                    <option value="color">رموز ألوان (أخضر / أصفر / أحمر)</option>
                                    <option value="text">كلمات الوصف والملاحظات</option>
                                </select>
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button type="submit" className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-bold hover:bg-indigo-700">حفظ المهارة</button>
                            </div>
                        </form>
                    </div>
                 </div>
            </>

            );
};
