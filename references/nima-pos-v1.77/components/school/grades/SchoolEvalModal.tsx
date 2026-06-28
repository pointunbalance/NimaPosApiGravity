import React from 'react';
import { X, BookOpen, Star, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface SchoolEvalModalProps {
isEvalModalOpen: boolean;
setEvalModalOpen: (val: boolean) => void;
handleSaveEvaluation: (e: any) => void;
evalFormData: any;
setEvalFormData: (val: any) => void;
selectedStudentForEval: any;
subjects: any[];
evalDate: string; setEvalDate: any; evalType: string; setEvalType: any; handleEvalChange: any; generalNotes: string; setGeneralNotes: any;
}

export const SchoolEvalModal: React.FC<SchoolEvalModalProps> = (props) => {
   const { isEvalModalOpen, setEvalModalOpen, handleSaveEvaluation, evalFormData, setEvalData, selectedStudentForEval, subjects } = props;
   if (!isEvalModalOpen) return null;
   return (
            <>
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-200 border-2 border-indigo-500">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50 shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-indigo-900 flex items-center gap-2"><Star className="w-5 h-5"/> تقييم الطفل: {selectedStudentForEval.name}</h2>
                                <p className="text-sm text-indigo-700 font-bold mt-1">تاريخ: {evalDate} - {evalType === 'monthly' ? 'شهري' : evalType === 'weekly' ? 'أسبوعي' : 'يومي'}</p>
                            </div>
                            <button onClick={() => setEvalModalOpen(false)} className="bg-white text-indigo-400 p-2 hover:text-rose-500 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        
                        <div className="p-5 overflow-y-auto w-full flex-1 bg-slate-50">
                            {subjects.length === 0 ? (
                                <div className="text-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                    <p className="text-slate-500 font-bold">لا يوجد مهارات مسجلة للتقييم. الرجاء إعدادها من التبويب الخاص بها أولاً.</p>
                                </div>
                            ) : (
                                <form id="evalForm" onSubmit={handleSaveEvaluation} className="space-y-4 max-w-2xl mx-auto">
                                    {subjects.map(sub => {
                                        const eData = evalFormData[sub.id] || {};
                                        return (
                                        <div key={sub.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="flex-1">
                                                <h4 className="font-black text-slate-800 text-lg">{sub.name}</h4>
                                                <p className="text-xs text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded w-max mt-1 text-[10px] uppercase">{sub.category}</p>
                                            </div>
                                            <div className="w-full md:w-1/2">
                                                {sub.evaluationMethod === 'score' && (
                                                    <div className="flex gap-2 items-center w-full">
                                                        <input type="number" min="0" placeholder="الدرجة" value={eData.grade || ''} onChange={e => handleEvalChange(sub.id, 'grade', e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg font-bold outline-none" />
                                                        <span className="text-slate-400 font-bold text-xs w-max">/ 100</span>
                                                    </div>
                                                )}
                                                {sub.evaluationMethod === 'color' && (
                                                    <div className="flex gap-3 w-full justify-between sm:justify-start">
                                                        <label className={`cursor-pointer flex-1 text-center py-2 px-1 rounded-lg border-2 transition ${eData.colorRating === 'green' ? 'border-emerald-500 bg-emerald-50' : 'border-transparent bg-slate-100 hover:bg-slate-200'}`}>
                                                            <input type="radio" name={`color_${sub.id}`} className="hidden" checked={eData.colorRating === 'green'} onChange={() => handleEvalChange(sub.id, 'colorRating', 'green')} />
                                                            <div className="w-5 h-5 mx-auto bg-emerald-500 rounded-full mb-1"></div>
                                                            <span className="text-xs font-bold text-emerald-800 hidden sm:block">ممتاز</span>
                                                        </label>
                                                        <label className={`cursor-pointer flex-1 text-center py-2 px-1 rounded-lg border-2 transition ${eData.colorRating === 'yellow' ? 'border-amber-500 bg-amber-50' : 'border-transparent bg-slate-100 hover:bg-slate-200'}`}>
                                                            <input type="radio" name={`color_${sub.id}`} className="hidden" checked={eData.colorRating === 'yellow'} onChange={() => handleEvalChange(sub.id, 'colorRating', 'yellow')} />
                                                            <div className="w-5 h-5 mx-auto bg-amber-400 rounded-full mb-1"></div>
                                                            <span className="text-xs font-bold text-amber-800 hidden sm:block">مقبول</span>
                                                        </label>
                                                        <label className={`cursor-pointer flex-1 text-center py-2 px-1 rounded-lg border-2 transition ${eData.colorRating === 'red' ? 'border-rose-500 bg-rose-50' : 'border-transparent bg-slate-100 hover:bg-slate-200'}`}>
                                                            <input type="radio" name={`color_${sub.id}`} className="hidden" checked={eData.colorRating === 'red'} onChange={() => handleEvalChange(sub.id, 'colorRating', 'red')} />
                                                            <div className="w-5 h-5 mx-auto bg-rose-500 rounded-full mb-1"></div>
                                                            <span className="text-xs font-bold text-rose-800 hidden sm:block">تحسين</span>
                                                        </label>
                                                    </div>
                                                )}
                                                {sub.evaluationMethod === 'text' && (
                                                    <input type="text" placeholder="اكتب تقييم الطفل (كلمات الوصف).." value={eData.textRating || ''} onChange={e => handleEvalChange(sub.id, 'textRating', e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg font-bold outline-none" />
                                                )}
                                            </div>
                                        </div>
                                    )})}
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm mt-6">
                                        <h4 className="font-bold text-amber-900 mb-2 text-sm">ملاحظات المعلمة الإضافية عن الطفل بهذه الفترة (ستظهر بالشهادة)</h4>
                                        <textarea rows={3} value={generalNotes} onChange={e => setGeneralNotes(e.target.value)} className="w-full bg-white border border-amber-200 p-3 rounded-lg outline-none resize-none font-medium text-slate-800" placeholder="ملاحظات حول التركيز، السلوك الطارئ، أو التوصيات للأهل..."></textarea>
                                    </div>
                                </form>
                            )}
                        </div>
                        
                        <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                            <button form="evalForm" type="submit" disabled={subjects.length === 0} className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-md transition disabled:opacity-50">
                                حفظ التقييم 
                            </button>
                        </div>
                    </div>
                </div>
            </>

   );
};
