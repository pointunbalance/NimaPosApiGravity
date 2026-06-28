import React from 'react';
import { X, Calendar, Edit2, Archive, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';


interface SchoolPromoteModalProps {
isPromoteModalOpen: boolean;
setIsPromoteModalOpen: (val: boolean) => void;
handlePromote: () => void;
}

export const SchoolPromoteModal: React.FC<SchoolPromoteModalProps> = (props) => {
   const { isPromoteModalOpen, setIsPromoteModalOpen, handlePromote } = props;
   if (!isPromoteModalOpen) return null;
   return (
            <>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                            <h2 className="text-xl font-black text-indigo-900 flex items-center gap-2"><RotateCcw className="w-5 h-5"/> ترقية واستمرار الأطفال</h2>
                            <button onClick={() => setIsPromoteModalOpen(false)} className="p-2 hover:bg-indigo-100 rounded-full text-indigo-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-600 text-sm font-medium mb-6 leading-relaxed">قم بتحديد المرحلة الحالية التي تود نقل الأطفال منها، والمرحلة الجديدة التي سينتقلون إليها (مثال: من KG1 إلى KG2). هذه العملية ستنقل جميع الأطفال "النشطين" فقط في المرحلة الحالية، وستحتفظ بسجلاتهم السابقة من تقييمات وفواتير كما هي.</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">من مرحلة (الحالية)</label>
                                    <select value={promoteFromLevel} onChange={(e) => setPromoteFromLevel(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="">-- اختر المرحلة --</option>
                                        {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>
                                
                                <div className="flex justify-center text-slate-300 py-1">
                                    <RotateCcw className="w-6 h-6 rotate-90" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">إلى مرحلة (الجديدة)</label>
                                    <select value={promoteToLevel} onChange={(e) => setPromoteToLevel(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="">-- اختر المرحلة --</option>
                                        {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsPromoteModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">إلغاء</button>
                                <button type="button" onClick={handlePromote} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md">تأكيد الترقية</button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
   );
};