import React from 'react';
import { X } from 'lucide-react';

export const SchoolStaffDirectoryModal = ({
    isModalOpen,
    setIsModalOpen,
    isEdit,
    formData,
    setFormData,
    handleSave
}: any) => {
    if (!isModalOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">{isEdit ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</h2>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSave} className="p-6 flex flex-col gap-6 max-h-[80vh] overflow-y-auto w-full">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">اسم الموظف بالكامل *</label>
                        <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">الدور الوظيفي *</label>
                        <select value={formData.role || ''} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" required>
                            <option value="" disabled>-- نوع الوظيفة --</option>
                            <option value="teacher">مدرس / معلم</option>
                            <option value="admin">إداري</option>
                            <option value="driver">سائق</option>
                            <option value="nanny">دادة / عاملة</option>
                            <option value="guard">فرد أمن</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">الراتب الأساسي *</label>
                            <input type="number" value={formData.baseSalary || 0} onChange={(e) => setFormData({...formData, baseSalary: Number(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label>
                            <input type="text" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">سنة التعيين (الافتراضي: الحالي)</label>
                        <input type="number" min="2000" value={(formData as any).yearJoined || new Date().getFullYear()} onChange={(e) => setFormData({...formData, yearJoined: Number(e.target.value)} as any)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 w-full">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">إلغاء</button>
                        <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg">حفظ التغييرات</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
