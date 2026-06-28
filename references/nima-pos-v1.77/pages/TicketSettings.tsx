import React, { useState, useEffect } from 'react';
import { 
    Settings, Shield, Users, Building, Printer, Image as ImageIcon, 
    CheckCircle, XCircle, FileText, CheckSquare, Settings2, Save, CreditCard
} from 'lucide-react';
import { db } from '../db';
import { AppSettings, User as DBUser } from '../types';
import { useToast } from '../context/ToastContext';
import { TicketSettingsUserModal } from './TicketSettingsUserModal';

const TicketSettings = () => {
    const { success, error: showError } = useToast();
    const [activeTab, setActiveTab] = useState<'users' | 'system'>('users');
    
    // System Settings
    const [settings, setSettings] = useState<AppSettings | null>(null);
    
    // Users
    const [users, setUsers] = useState<DBUser[]>([]);
    
    // User Modal
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userForm, setUserForm] = useState<Partial<DBUser>>({});
    
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [u, s] = await Promise.all([
            db.users.toArray(),
            db.settings.toCollection().first()
        ]);
        setUsers(u);
        if (s) {
            setSettings(s);
        } else {
            setSettings({
                storeName: 'ترافيل إكسبريس لإدارة التذاكر',
                language: 'ar',
                currency: 'ج.م',
            } as AppSettings);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;
        try {
            if (settings.id) {
                await db.settings.update(settings.id, settings as any);
            } else {
                await db.settings.add(settings);
            }
            success('تم حفظ إعدادات النظام بنجاح');
            loadData();
        } catch (error) {
            console.error('Error saving settings:', error);
            showError('حدث خطأ أثناء حفظ الإعدادات');
        }
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userForm.name || !userForm.pin || !userForm.role) return;
        
        try {
            // Ensure permissions array exists
            const dataToSave = { 
                ...userForm, 
                isActive: userForm.isActive !== undefined ? userForm.isActive : true,
                permissions: userForm.permissions || [] 
            } as DBUser;
            
            if (userForm.id) {
                await db.users.update(userForm.id, dataToSave as any);
                success('تم تحديث بيانات المستخدم بنجاح');
            } else {
                await db.users.add(dataToSave);
                success('تمت إضافة المستخدم الجديد بنجاح');
            }
            setIsUserModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Error saving user", error);
            showError('حدث خطأ أثناء حفظ بيانات المستخدم');
        }
    };

    const togglePermission = (perm: string) => {
        const currentPerms = userForm.permissions || [];
        if (currentPerms.includes(perm)) {
            setUserForm({ ...userForm, permissions: currentPerms.filter(p => p !== perm) });
        } else {
            setUserForm({ ...userForm, permissions: [...currentPerms, perm] });
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'printHeaderLogo') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (settings) {
                    setSettings({ ...settings, [field]: reader.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const permissionsOptions = [
        { id: 'can_cancel_ticket', label: 'إلغاء الحجوزات', desc: 'يسمح بعملية استرجاع التذكرة وإلغاء الحجز.' },
        { id: 'can_discount', label: 'إضافة خصومات المبيعات', desc: 'يسمح للمستخدم بإعطاء نسبة خصم للعملاء.' },
        { id: 'can_edit_trips', label: 'تعديل جداول الرحلات', desc: 'يسمح بإلغاء رحلة مجدولة، أو تغيير الموعد والأسعار.' },
        { id: 'can_view_reports', label: 'الوصول للتقارير والإحصائيات', desc: 'يسمح بعرض الأرباح والمبيعات.' }
    ];

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Settings className="w-8 h-8 text-slate-700" />
                        الإعدادات وصلاحيات المستخدمين
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">التحكم الكامل في تشكيل النظام للمنشأة وأمن المعلومات والتصريحات</p>
                </div>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6 overflow-x-auto w-full max-w-xl">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex-1 min-w-[150px] font-bold py-2.5 rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'users' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <Users className="w-4 h-4"/> الموظفين والصلاحيات
                </button>
                <button
                    onClick={() => setActiveTab('system')}
                    className={`flex-1 min-w-[150px] font-bold py-2.5 rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'system' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <Settings2 className="w-4 h-4"/> إعدادات النظام العامة
                </button>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">إدارة حسابات النظام وتصاريحهم</h2>
                        <button onClick={() => { setUserForm({ isActive: true, role: 'cashier', permissions: [] }); setIsUserModalOpen(true); }} className="px-5 py-2 hover:bg-emerald-700 transition bg-emerald-600 text-white rounded-xl font-bold flex items-center shadow-lg shadow-emerald-200">
                            مستخدم جديد
                        </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-right whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-5 py-4 text-slate-500 font-bold text-sm">اسم المستخدم</th>
                                    <th className="px-5 py-4 text-slate-500 font-bold text-sm">رمز المرور (PIN)</th>
                                    <th className="px-5 py-4 text-slate-500 font-bold text-sm">الوظيفة / الدور</th>
                                    <th className="px-5 py-4 text-slate-500 font-bold text-sm">الحالة</th>
                                    <th className="px-5 py-4 text-slate-500 font-bold text-sm">الصلاحيات الإضافية</th>
                                    <th className="px-5 py-4 text-slate-500 font-bold text-sm">رقم الهاتف</th>
                                    <th className="px-5 py-4 text-slate-500 font-bold text-sm">الإجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50 transition">
                                        <td className="px-5 py-4 font-bold text-slate-800">{u.name}</td>
                                        <td className="px-5 py-4 font-mono text-slate-500 tracking-widest">{u.pin}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold w-max flex items-center gap-1
                                                ${u.role === 'admin' ? 'bg-rose-50 text-rose-600' : u.role === 'manager' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}
                                            `}>
                                                {u.role === 'admin' ? 'أدمن (مدير نظام)' : u.role === 'manager' ? 'مدير فرع' : 'كاشير (موظف حجز)'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {u.isActive ? (
                                                <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold border border-emerald-100 flex items-center gap-1 w-max"><CheckCircle className="w-3 h-3"/> مفعل</span>
                                            ) : (
                                                <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded text-xs font-bold border border-rose-100 flex items-center gap-1 w-max"><XCircle className="w-3 h-3"/> معطل</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {u.role === 'admin' ? (
                                                    <span className="text-xs text-rose-600 font-bold">صلاحيات كاملة مطلقة</span>
                                                ) : u.permissions && u.permissions.length > 0 ? (
                                                    u.permissions.map(p => (
                                                        <span key={p} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{p}</span>
                                                    ))
                                                ) : <span className="text-xs text-slate-400">بدون صلاحيات إضافية</span>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-bold text-slate-600">{u.phone || '-'}</td>
                                        <td className="px-5 py-4">
                                            <button onClick={() => { setUserForm({...u, permissions: u.permissions || []}); setIsUserModalOpen(true); }} className="text-indigo-600 font-bold hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm">تعديل</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && settings && (
                <form onSubmit={handleSaveSettings} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-5 relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 opacity-50"></div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Building className="w-5 h-5 text-indigo-500"/> هوية الشركة</h3>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">الاسم التجاري للمؤسسة</label>
                                <input type="text" value={settings.storeName || ''} onChange={e => setSettings({...settings, storeName: e.target.value})} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-indigo-500 transition-colors" />
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">العملة الافتراضية</label>
                                    <input type="text" value={settings.currency || ''} onChange={e => setSettings({...settings, currency: e.target.value})} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-indigo-500 transition-colors" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">الرقم الضريبي (إن وجد)</label>
                                    <input type="text" value={settings.taxNumber || ''} onChange={e => setSettings({...settings, taxNumber: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-slate-800 focus:border-indigo-500 transition-colors" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 drop-zone relative border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-indigo-300 transition-colors">
                                    {settings.logo ? (
                                        <img src={settings.logo} alt="الشعار" className="h-16 object-contain" />
                                    ) : (
                                        <>
                                            <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                                            <span className="text-slate-500">رفع شعار النظام (اللوجو)</span>
                                        </>
                                    )}
                                    <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logo')} className="hidden" />
                                </label>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-5 relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 opacity-50"></div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Printer className="w-5 h-5 text-emerald-500"/> إعدادات طباعة التذاكر</h3>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 text-emerald-600">اسم الشركة على رأس التذكرة</label>
                                <input type="text" value={settings.printStoreName || ''} onChange={e => setSettings({...settings, printStoreName: e.target.value})} className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none font-bold text-slate-800 focus:border-emerald-500 transition-colors" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 text-emerald-600">العنوان أو بيانات التواصل بالأسفل</label>
                                <input type="text" value={settings.printAddress || ''} onChange={e => setSettings({...settings, printAddress: e.target.value})} className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none font-bold text-slate-800 focus:border-emerald-500 transition-colors" placeholder="مثال: القاهرة، ميدان التحرير - هاتف: 0100..." />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 text-emerald-600">الشروط والأحكام (السياسة الخاصة بالتذكرة)</label>
                                <textarea rows={4} value={settings.printTermsText || ''} onChange={e => setSettings({...settings, printTermsText: e.target.value})} className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none font-bold text-slate-800 focus:border-emerald-500 transition-colors resize-none" placeholder="مثال: 1. لا يحق استرجاع التذكرة قبل الموعد بـ 24 ساعة. 2. حضور الراكب قبل الرحلة بنصف ساعة..."></textarea>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                            <Save className="w-6 h-6 ml-2" /> حفظ الإعدادات على مستوى النظام
                        </button>
                    </div>
                </form>
            )}

            {/* User Modal */}
            <TicketSettingsUserModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                userForm={userForm}
                setUserForm={setUserForm}
                onSave={handleSaveUser}
                togglePermission={togglePermission}
                permissionsOptions={permissionsOptions}
            />
        </div>
    );
};

export default TicketSettings;
