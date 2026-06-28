import React from 'react';
import { X, Coffee, Apple, Salad } from 'lucide-react';

export const SchoolMealScheduleModal = ({
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    scheduleForm,
    setScheduleForm,
    saveSchedule,
    WEEK_DAYS
}: any) => {
    if (!isScheduleModalOpen) return null;
    return (
<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl my-8">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h2 className="text-xl font-black text-slate-800">تعديل جدول: {WEEK_DAYS.find(d => d.id === scheduleForm.day)?.label}</h2>
                            <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={saveSchedule} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Coffee className="w-4 h-4 text-orange-500"/> وجبة الإفطار</label>
                                <textarea required value={scheduleForm.breakfast} onChange={e => setScheduleForm({...scheduleForm, breakfast: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 font-medium resize-none" rows={2} placeholder="مثال: حبوب شوفان مع حليب وتمر"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Apple className="w-4 h-4 text-rose-500"/> السناك</label>
                                <textarea required value={scheduleForm.snack} onChange={e => setScheduleForm({...scheduleForm, snack: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 font-medium resize-none" rows={2} placeholder="مثال: فواكه مشكلة وبسكويت"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Salad className="w-4 h-4 text-emerald-500"/> وجبة الغداء</label>
                                <textarea required value={scheduleForm.lunch} onChange={e => setScheduleForm({...scheduleForm, lunch: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 font-medium resize-none" rows={2} placeholder="مثال: أرز بالخضار وشريحة دجاج مشوي"></textarea>
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors">حفظ الجدول</button>
                            </div>
                        </form>
                    </div>
                </div>
    );
};
