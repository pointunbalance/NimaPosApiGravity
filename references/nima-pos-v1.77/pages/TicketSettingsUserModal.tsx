import React from 'react';
import { Shield, XCircle, Save, CheckSquare } from 'lucide-react';
import { User as DBUser } from '../types';

interface TicketSettingsUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    userForm: Partial<DBUser>;
    setUserForm: React.Dispatch<React.SetStateAction<Partial<DBUser>>>;
    onSave: (e: React.FormEvent) => void;
    togglePermission: (perm: string) => void;
    permissionsOptions: Array<{ id: string; label: string; desc: string }>;
}

export const TicketSettingsUserModal: React.FC<TicketSettingsUserModalProps> = ({
    isOpen,
    onClose,
    userForm,
    setUserForm,
    onSave,
    togglePermission,
    permissionsOptions
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <form onSubmit={onSave} className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <Shield className="w-5 h-5 text-indigo-500 ml-2" /> 
                        {userForm.id ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد للنظام'}
                    </h2>
                    <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">الاسم بالكامل *</label>
                            <input type="text" required value={userForm.name || ''} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" placeholder="مثال: ميكولا بافليوك" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">رمز تسجيل الدخول (PIN) *</label>
                            <input type="text" required value={userForm.pin || ''} onChange={e => setUserForm({...userForm, pin: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono tracking-widest font-black focus:border-indigo-500" placeholder="أرقام فقط (مثال: 1234)" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">الدور (المنصب) *</label>
                            <select value={userForm.role || 'cashier'} onChange={e => setUserForm({...userForm, role: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-indigo-500">
                                <option value="cashier">كاشير موظف حجز</option>
                                <option value="manager">مدير فرع / تشغيل</option>
                                <option value="admin">أدمن مدير نظام عام</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف التواصل</label>
                            <input type="text" value={userForm.phone || ''} onChange={e => setUserForm({...userForm, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" dir="ltr" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={userForm.isActive !== false} onChange={e => setUserForm({...userForm, isActive: e.target.checked})} />
                          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                        <span className={`font-bold text-sm ${userForm.isActive !== false ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {userForm.isActive !== false ? 'الحساب نشط ويمكنه تسجيل الدخول' : 'الحساب معطل (موقوف مؤقتاً)'}
                        </span>
                    </div>

                    {userForm.role !== 'admin' && (
                        <div className="mt-4">
                            <h4 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">صلاحيات استثنائية (تجاوز)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {permissionsOptions.map(p => (
                                    <label key={p.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${userForm.permissions?.includes(p.id) ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                        <div className="mt-0.5">
                                            {userForm.permissions?.includes(p.id) ? <CheckSquare className="w-5 h-5 text-indigo-600"/> : <div className="w-5 h-5 rounded border-2 border-slate-300 bg-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <input type="checkbox" className="hidden" checked={userForm.permissions?.includes(p.id)} onChange={() => togglePermission(p.id)} />
                                            <div className={`font-bold text-sm ${userForm.permissions?.includes(p.id) ? 'text-indigo-800' : 'text-slate-700'}`}>{p.label}</div>
                                            <div className="text-[10px] text-slate-500 mt-1 leading-snug">{p.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition">إلغاء</button>
                    <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center shadow-lg">
                        <Save className="w-5 h-5 ml-2"/> حفظ حساب المستخدم
                    </button>
                </div>
            </form>
        </div>
    );
};
