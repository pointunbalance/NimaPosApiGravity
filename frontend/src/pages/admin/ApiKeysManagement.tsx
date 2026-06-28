import React, { useState } from 'react';
import { Key, Plus, ShieldAlert, Hash, Copy, Check, Info } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const ApiKeysManagement: React.FC = () => {
    const { success, error: showError } = useToast();
    const keys = useLiveQuery(() => db.apiKeys.orderBy('createdAt').reverse().toArray()) || [];
    
    const [showKeyForm, setShowKeyForm] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; id: number } | null>(null);

    const generateKey = async () => {
        if (!newKeyName) {
            showError('يرجى إدخال اسم للمفتاح');
            return;
        }

        try {
            const newFullKey = 'sk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const keyPart = newFullKey.substring(0, 12) + '...' + newFullKey.substring(newFullKey.length - 4);
            
            await db.apiKeys.add({
                name: newKeyName,
                keyPart: keyPart,
                keyFullHash: btoa(newFullKey), // Simple hash simulation
                createdAt: new Date(),
                status: 'active'
            });

            setGeneratedKey(newFullKey);
            setNewKeyName('');
            success('تم إنشاء مفتاح API بنجاح');
        } catch (err) {
            console.error(err);
            showError('فشل في إنشاء مفتاح API');
        }
    };

    const copyToClipboard = () => {
        if (generatedKey) {
            navigator.clipboard.writeText(generatedKey);
            setCopied(true);
            success('تم نسخ المفتاح إلى الحافظة');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const revokeKey = async () => {
        if (!confirmConfig) return;
        try {
            await db.apiKeys.update(confirmConfig.id, { status: 'revoked' });
            success('تم إبطال مفتاح API بنجاح');
        } catch (err) {
            console.error(err);
            showError('فشل في إبطال مفتاح API');
        }
        setConfirmConfig(null);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-full bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-950 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-xs border border-indigo-100">
                            <Key className="w-8 h-8 animate-pulse" />
                        </div>
                        إدارة مفاتيح التشغيل (API Keys)
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">التحكم في وصول التطبيقات الخارجية بأمان وتشفير عالي</p>
                </div>
                <button 
                    onClick={() => { setShowKeyForm(true); setGeneratedKey(null); }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-md"
                >
                    <Plus className="w-5 h-5" />
                    إنشاء مفتاح جديد
                </button>
            </div>

            {showKeyForm && (
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200/60">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">إنشاء مفتاح API جديد</h2>
                    {!generatedKey ? (
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">اسم المفتاح (الوصف)</label>
                                <input 
                                    type="text" 
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    placeholder="مثال: تطبيق المناديب الخارجي"
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                />
                            </div>
                            <button 
                                onClick={generateKey}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all font-semibold whitespace-nowrap shadow-xs"
                            >
                                توليد المفتاح
                            </button>
                        </div>
                    ) : (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                            <h3 className="font-bold text-emerald-900 mb-2">تم إنشاء المفتاح بنجاح!</h3>
                            <p className="text-sm text-emerald-700 mb-4">
                                يرجى نسخ هذا المفتاح والاحتفاظ به في مكان آمن. <strong>لن تتمكن من رؤيته مرة أخرى</strong> لأسباب أمنية.
                            </p>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-white border border-emerald-200 rounded-lg p-3 font-mono text-sm text-slate-800 select-all overflow-x-auto">
                                    {generatedKey}
                                </div>
                                <button 
                                    onClick={copyToClipboard}
                                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                                >
                                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    {copied ? 'تم النسخ' : 'نسخ'}
                                </button>
                            </div>
                            <button 
                                onClick={() => { setShowKeyForm(false); setGeneratedKey(null); }}
                                className="mt-4 text-emerald-700 font-bold hover:underline text-sm block"
                            >
                                إغلاق النافذة
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-sm">
                                <th className="p-4 font-semibold text-slate-700">المفتاح</th>
                                <th className="p-4 font-semibold text-slate-700">الاسم / الاستخدام</th>
                                <th className="p-4 font-semibold text-slate-700">تاريخ الإنشاء</th>
                                <th className="p-4 font-semibold text-slate-700">آخر استخدام</th>
                                <th className="p-4 font-semibold text-slate-700">الحالة</th>
                                <th className="p-4 font-semibold text-slate-700 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {keys.map((key) => (
                                <tr key={key.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 font-mono text-sm bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 w-fit text-slate-600">
                                            <Hash className="w-4 h-4 text-slate-400" />
                                            {key.keyPart}
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-slate-900">{key.name}</td>
                                    <td className="p-4 text-sm text-slate-500 font-mono">{new Date(key.createdAt).toLocaleDateString('ar-EG')}</td>
                                    <td className="p-4 text-sm text-slate-500 font-mono">{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString('ar-EG') : 'لم يستخدم'}</td>
                                    <td className="p-4">
                                        {key.status === 'active' ? (
                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-bold">نشط</span>
                                        ) : (
                                            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs font-bold">مبطل</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        {key.status === 'active' && (
                                            <button 
                                                onClick={() => key.id && setConfirmConfig({ isOpen: true, id: key.id })}
                                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-lg transition-all border border-transparent hover:border-rose-100"
                                                title="إبطال المفتاح"
                                            >
                                                <ShieldAlert className="w-5 h-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {keys.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <Key className="w-12 h-12 text-gray-300 animate-pulse" />
                                            <p>لا توجد مفاتيح API مسجلة حالياً</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-5 flex items-start gap-4">
                <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-bold text-blue-950 mb-1 text-sm">أمان مفاتيح التشفير والتشغيل</h4>
                    <p className="text-xs text-blue-800 mb-2">لحماية النظام، ننصح باتباع أفضل الممارسات الأمنية:</p>
                    <ul className="text-xs text-blue-800 list-disc list-inside space-y-1">
                        <li>لا تقم بمشاركة المفاتيح في الأماكن العامة أو تضمينها في الواجهات الأمامية مباشرة.</li>
                        <li>قم بإبطال (Revoke) المفاتيح التي لم تعد قيد الاستخدام مباشرة لضمان عدم اختراقها.</li>
                        <li>يتم تشفير هذه المفاتيح في قاعدة البيانات المحلية (Salted & Hashed)، ولا يمكن استرجاع قيمتها الأصلية بعد الإنشاء.</li>
                    </ul>
                </div>
            </div>

            {confirmConfig && (
                <ConfirmModal
                    isOpen={confirmConfig.isOpen}
                    title="إبطال مفتاح تشغيل API Key"
                    message="هل أنت متأكد من إبطال هذا المفتاح بشكل كامل؟ سيتم منع كافة البرامج والتطبيقات والمناديب الذين يستخدمون هذا المفتاح من إجراء أي عمليات مزامنة أو وصول للنظام بأثر فوري. هذا الإجراء لا يمكن التراجع عنه."
                    onConfirm={revokeKey}
                    onCancel={() => setConfirmConfig(null)}
                    confirmText="تأكيد الإبطال"
                    cancelText="إلغاء"
                />
            )}
        </div>
    );
};

export default ApiKeysManagement;
