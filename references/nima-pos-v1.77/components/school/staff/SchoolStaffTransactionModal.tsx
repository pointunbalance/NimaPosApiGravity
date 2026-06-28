import React, { SetStateAction } from 'react';
import { X } from 'lucide-react';

export const SchoolStaffTransactionModal = ({
    transModalOpen,
    setTransModalOpen,
    transFormData,
    setTransFormData,
    handleSaveTrans,
    staff
}: any) => {
    if (!transModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">تسجيل حركة مالية أو إدارية</h2>
                    <button onClick={() => setTransModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSaveTrans} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">الموظف المعني <span className="text-rose-500">*</span></label>
                        <select value={transFormData.userId} onChange={(e) => setTransFormData({...transFormData, userId: Number(e.target.value)})} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800">
                            <option value={0} disabled>-- اختر --</option>
                            {staff.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">نوع الحركة</label>
                            <select value={transFormData.type} onChange={(e) => setTransFormData({...transFormData, type: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700">
                                <option value="bonus">مكافأة / حافز</option>
                                <option value="deduction">خصم / جزاء</option>
                                <option value="advance">سلفة مالية</option>
                                <option value="lateness">تأخير</option>
                                <option value="absence">غياب</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">المبلغ (ج.م) <span className="text-rose-500">*</span></label>
                            <input type="number" min="0" value={transFormData.amount} onChange={(e) => setTransFormData({...transFormData, amount: Number(e.target.value)})} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black text-rose-700" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">التاريخ</label>
                        <input type="date" value={transFormData.date} onChange={(e) => setTransFormData({...transFormData, date: e.target.value})} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">بيان الحركة والسبب</label>
                        <input type="text" value={transFormData.description} onChange={(e) => setTransFormData({...transFormData, description: e.target.value})} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="مثال: خصم لغياب يومين، سلفة للعلاج.." />
                    </div>
                    <div className="pt-6">
                        <button type="submit" className="w-full px-6 py-4 font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg">حفظ واعتماد الحركة الآلية</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
