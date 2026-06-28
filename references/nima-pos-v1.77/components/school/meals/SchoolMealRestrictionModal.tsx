import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export const SchoolMealRestrictionModal = ({
    isRestrictionModalOpen,
    setIsRestrictionModalOpen,
    allergies,
    setAllergies,
    dietaryNotes,
    setDietaryNotes,
    saveRestrictions
}: any) => {
    if (!isRestrictionModalOpen) return null;
    return (
<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl my-8">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50 rounded-t-3xl">
                            <h2 className="text-xl font-black text-red-800 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> تعديل الممنوعات</h2>
                            <button onClick={() => setIsRestrictionModalOpen(false)} className="p-2 hover:bg-red-200 rounded-full text-red-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-black text-red-700 mb-2">حساسية / ممنوعات طبية (الحساسية)</label>
                                <textarea value={allergies} onChange={e => setAllergies(e.target.value)} className="w-full px-4 py-3 bg-white border border-red-200 focus:border-red-500 rounded-xl focus:ring-2 focus:ring-red-500 font-medium resize-none" rows={2} placeholder="مثال: حساسية الفول السوداني، حساسية الألبان"></textarea>
                                <p className="text-xs text-red-500 mt-1 font-bold">هذه المعلومات سيتم عرضها كإنذار عند إطعام الطفل.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات غذائية (رغبة الأهل)</label>
                                <textarea value={dietaryNotes} onChange={e => setDietaryNotes(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 font-medium resize-none" rows={2} placeholder="مثال: لا يحب البيض، تقديم بدائل نباتية..."></textarea>
                            </div>
                            <div className="pt-4">
                                <button onClick={saveRestrictions} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors">حفظ البيانات المحدثة</button>
                            </div>
                        </div>
                    </div>
                </div>
    );
};
