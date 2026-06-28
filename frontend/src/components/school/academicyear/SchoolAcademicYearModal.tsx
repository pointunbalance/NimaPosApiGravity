import React from 'react';
import { X, Calendar, Edit2, Archive, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';


interface SchoolAcademicYearModalProps {
isModalOpen: boolean;
setIsModalOpen: (val: boolean) => void;
handleSave: (e: React.FormEvent) => void;
formData: any;
setFormData: (val: any) => void;
isEdit: boolean;
}

export const SchoolAcademicYearModal: React.FC<SchoolAcademicYearModalProps> = (props) => {
   const { isModalOpen, setIsModalOpen, handleSubmit, formData, setFormData, isEdit } = props;
   if (!isModalOpen) return null;
   return (
            <>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl my-8">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl sticky top-0 z-10">
                            <h2 className="text-xl font-black text-slate-800">{selectedYearId ? 'تعديل العام الدراسي' : 'إضافة عام دراسي'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 overflow-y-auto max-h-[70vh]">
                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div>
                                    <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">البيانات الأساسية</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-full">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">اسم المسمى الدراسي (مثال: 2025/2026)</label>
                                            <input required dir="ltr" type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full text-right px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ البدء العام</label>
                                            <input required type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الانتهاء العام</label>
                                            <input required type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl cursor-pointer">
                                            <input type="checkbox" checked={formData.isCurrent} onChange={(e) => setFormData({...formData, isCurrent: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
                                            <span className="font-bold text-indigo-900 text-sm">تعيين كعام دراسي حالي نشط</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Terms */}
                                <div>
                                    <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">الفصول الدراسية (الأتـرام)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3">
                                            <h4 className="font-bold text-slate-700 text-sm">الترم الأول</h4>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">بداية الترم الأول</label>
                                                <input type="date" value={formData.term1Start} onChange={(e) => setFormData({...formData, term1Start: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">نهاية الترم الأول</label>
                                                <input type="date" value={formData.term1End} onChange={(e) => setFormData({...formData, term1End: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3">
                                            <h4 className="font-bold text-slate-700 text-sm">الترم الثاني</h4>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">بداية الترم الثاني</label>
                                                <input type="date" value={formData.term2Start} onChange={(e) => setFormData({...formData, term2Start: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">نهاية الترم الثاني</label>
                                                <input type="date" value={formData.term2End} onChange={(e) => setFormData({...formData, term2End: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Working Days */}
                                <div>
                                    <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">أيام العمل والإجازات الأسبوعية</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {daysOfWeek.map(day => {
                                            const isWorking = formData.workingDays.includes(day.id);
                                            return (
                                                <button
                                                    key={day.id}
                                                    type="button"
                                                    onClick={() => handleToggleWorkingDay(day.id)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${isWorking ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50 hover:opacity-100'}`}
                                                >
                                                    {day.name} {isWorking ? '✓' : ''}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">انقر على اليوم لتغيير حالته بين يوم عمل وإجازة أسبوعية.</p>
                                </div>

                                {/* Holidays */}
                                <div>
                                    <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">الإجازات الرسمية</h3>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 mb-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ الإجازة</label>
                                            <input type="date" value={newHolidayDate} onChange={(e) => setNewHolidayDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div className="flex-1 border-r border-slate-200 md:pr-3">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">اسم/مناسبة الإجازة</label>
                                            <input type="text" placeholder="مثال: عيد الفطر" value={newHolidayName} onChange={(e) => setNewHolidayName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div className="flex items-end">
                                            <button type="button" onClick={addHoliday} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition w-full md:w-auto h-10">إضافة</button>
                                        </div>
                                    </div>

                                    {formData.holidays.length > 0 ? (
                                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                                            <table className="w-full text-right text-sm">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr className="text-slate-500">
                                                        <th className="p-3 font-bold w-32">التاريخ</th>
                                                        <th className="p-3 font-bold">المناسبة</th>
                                                        <th className="p-3 font-bold w-12 text-center">حذف</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {formData.holidays.map((h, i) => (
                                                        <tr key={i} className="hover:bg-slate-50">
                                                            <td className="p-3 font-mono font-bold text-slate-600">{h.date}</td>
                                                            <td className="p-3 font-bold text-slate-800">{h.name}</td>
                                                            <td className="p-3 text-center">
                                                                <button type="button" onClick={() => removeHoliday(i)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center p-4 bg-slate-50 rounded-xl text-slate-500 font-medium text-sm">
                                            لا توجد إجازات رسمية مضافة حتى الآن.
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mt-8 flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">إلغاء</button>
                                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md">{selectedYearId ? 'حفظ التعديلات' : 'إضافة العام الدراسي'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </>
   );
};