import React from 'react';
import { History, X, Plus } from 'lucide-react';
import { format } from 'date-fns';

export const SchoolAdmissionFollowupModal = ({
    isFollowupModalOpen,
    setIsFollowupModalOpen,
    selectedRequest,
    crmLogs,
    employees,
    followupForm,
    setFollowupForm,
    handleAddFollowup
}: any) => {
    if (!isFollowupModalOpen || !selectedRequest) return null;
    return (
<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><History className="w-6 h-6 text-indigo-500"/> متابعة الطلب: {selectedRequest.childName}</h2>
                            <button onClick={() => setIsFollowupModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                            <div className="p-6 border-l border-slate-100 bg-slate-50/50">
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><History className="w-4 h-4"/> السجل وتاريخ التواصل</h3>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {crmLogs.filter(l => l.requestId === selectedRequest.id).map(log => {
                                        const emp = employees.find(e => e.id === Number(log.employeeId));
                                        return (
                                            <div key={log.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                                        {log.action === 'call' ? 'مكالمة هاتفية' : log.action === 'whatsapp' ? 'محادثة واتساب' : 'زيارة ميدانية'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-bold">{format(new Date(log.date), 'yyyy-MM-dd HH:mm')}</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-800 whitespace-pre-line">{log.notes}</p>
                                                {log.result && <p className="text-[11px] mt-2 font-medium text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-100">النتيجة: {log.result}</p>}
                                                <div className="text-[10px] text-slate-400 mt-2 text-right">الموظف: {emp ? emp.name : 'غير محدد'}</div>
                                            </div>
                                        )
                                    })}
                                    {crmLogs.filter(l => l.requestId === selectedRequest.id).length === 0 && (
                                        <div className="text-center py-6 text-slate-400 font-bold text-sm bg-slate-100 rounded-xl border border-slate-200 border-dashed">
                                            لم يتم تسجيل أي متابعة بعد.
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Plus className="w-4 h-4"/> إضافة متابعة جديدة</h3>
                                <form onSubmit={handleAddFollowup} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">نوع المتابعة</label>
                                        <select value={followupForm.action} onChange={e => setFollowupForm({...followupForm, action: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500">
                                            <option value="call">مكالمة هاتفية</option>
                                            <option value="whatsapp">محادثة واتساب/رسائل</option>
                                            <option value="visit">زيارة بالحضانة</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">الموظف القائم بالمتابعة</label>
                                        <select required value={followupForm.employeeId} onChange={e => setFollowupForm({...followupForm, employeeId: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500">
                                            <option value="">-- اختر --</option>
                                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">تفاصيل المحادثة/الملاحظات <span className="text-red-500">*</span></label>
                                        <textarea required value={followupForm.notes} onChange={e => setFollowupForm({...followupForm, notes: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-indigo-500" rows={3} placeholder="اكتب ما تم في المحادثة..."></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">النتيجة/الرد</label>
                                        <input type="text" value={followupForm.result} onChange={e => setFollowupForm({...followupForm, result: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="مثال: مهتم، مشغول، سيقوم بالزيارة..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">موعد الزيارة القادم (إن وجد)</label>
                                        <input type="date" value={followupForm.nextVisitDate} onChange={e => setFollowupForm({...followupForm, nextVisitDate: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                                        <span className="text-[10px] text-slate-400">سيتم تحديث موعد زيارة الطلب بهذا التاريخ</span>
                                    </div>
                                    <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition mt-2">
                                        حفظ المتابعة
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
    );
};
