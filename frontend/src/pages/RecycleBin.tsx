import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Trash2, RefreshCcw, Search, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';

export const RecycleBin = () => {
    const { success, error } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; type: 'single' | 'all'; id?: number } | null>(null);
    const deletedItems = useLiveQuery(() => db.recycleBin.toArray()) || [];

    // Auto purge logic (30 days)
    React.useEffect(() => {
        const autoPurge = async () => {
             const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
             const itemsToPurge = await db.recycleBin.where('deletedAt').below(thirtyDaysAgo).toArray();
             if (itemsToPurge.length > 0) {
                 const ids = itemsToPurge.map(i => i.id!);
                 await db.recycleBin.bulkDelete(ids);
                 console.log(`Auto-purged ${itemsToPurge.length} related items from Recycle Bin.`);
             }
        };
        autoPurge();
    }, []);

    const handleRestore = async (item: any) => {
        try {
            await db.transaction('rw', db[item.originalTable], db.recycleBin, async () => {
                const targetTable = db[item.originalTable] as any;
                await targetTable.put(item.data); 
                await db.recycleBin.delete(item.id);
            });
            success('تم استعادة العنصر بنجاح.');
        } catch (err: any) {
            console.error(err);
            error('فشل في استعادة العنصر: ' + err.message);
        }
    };

    const confirmPermanentDelete = (id: number) => {
        setConfirmConfig({ isOpen: true, type: 'single', id });
    };

    const confirmEmptyBin = () => {
        setConfirmConfig({ isOpen: true, type: 'all' });
    };

    const handleConfirmAction = async () => {
        if (!confirmConfig) return;
        try {
            if (confirmConfig.type === 'single' && confirmConfig.id) {
                await db.recycleBin.delete(confirmConfig.id);
                success('تم الحذف النهائي للعنصر.');
            } else if (confirmConfig.type === 'all') {
                await db.recycleBin.clear();
                success('تم تفريغ سلة المهملات بالكامل.');
            }
        } catch (err: any) {
            console.error(err);
            error('فشل الإجراء: ' + err.message);
        }
        setConfirmConfig(null);
    };

    const filteredItems = useMemo(() => {
        if (!searchQuery) return deletedItems.sort((a, b) => b.deletedAt - a.deletedAt);
        return deletedItems.filter(item => 
            item.originalTable.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.summary.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => b.deletedAt - a.deletedAt);
    }, [deletedItems, searchQuery]);

    const formatTableName = (name: string) => {
        const dictionary: Record<string, string> = {
            'orders': 'المبيعات',
            'products': 'المنتجات',
            'customers': 'العملاء',
            'expenses': 'المصروفات',
            'commodityContracts': 'عقود البضائع',
            'users': 'المستخدمين'
        };
        return dictionary[name] || name;
    };

    return (
        <div className="space-y-6 min-h-full bg-gradient-to-tr from-sky-50/60 via-slate-50 to-pink-50/40 p-2 font-['Tajawal']" dir="rtl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Trash2 className="w-8 h-8 text-red-500 animate-pulse" />
                        سلة المهملات والنظام الآمن
                    </h1>
                    <p className="text-slate-500 mt-1">تصفح واسترجع أو احذف العناصر المحذوفة نهائياً من كافة وحدات النظام</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="بحث في المحذوفات..." 
                            className="w-full sm:w-64 pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-red-500 transition-colors bg-white/60"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {deletedItems.length > 0 && (
                        <button onClick={confirmEmptyBin} className="flex items-center gap-2 bg-red-50 text-red-600 px-5 py-2.5 rounded-xl hover:bg-red-100 transition-colors font-semibold shadow-xs">
                            <ShieldAlert className="w-5 h-5" />
                            تفريغ السلة بالكامل
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="py-4 px-6 font-semibold text-slate-600">المصدر</th>
                                <th className="py-4 px-6 font-semibold text-slate-600">التفاصيل</th>
                                <th className="py-4 px-6 font-semibold text-slate-600">تاريخ الحذف</th>
                                <th className="py-4 px-6 font-semibold text-slate-600 text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredItems.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-6 align-top">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/40">
                                            {formatTableName(item.originalTable)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <p className="text-sm font-medium text-slate-800 line-clamp-2">{item.summary}</p>
                                        <p className="text-xs text-slate-400 mt-1 font-mono">ID: {item.originalId}</p>
                                    </td>
                                    <td className="py-4 px-6 align-top font-mono">
                                        <p className="text-sm text-slate-600" dir="ltr">
                                            {new Date(item.deletedAt).toLocaleString('en-GB')}
                                        </p>
                                    </td>
                                    <td className="py-4 px-6 align-top text-left">
                                        <div className="flex justify-end gap-2 text-left">
                                            <button 
                                                onClick={() => handleRestore(item)}
                                                className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all tooltip-trigger border border-emerald-100"
                                                title="استرجاع العنصر"
                                            >
                                                <RefreshCcw className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => confirmPermanentDelete(item.id!)}
                                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all tooltip-trigger border border-red-100"
                                                title="حذف نهائي"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                             ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-slate-500">
                                        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-300 animate-pulse" />
                                        <p className="text-lg font-semibold text-slate-700">سلة المهملات فارغة</p>
                                        <p className="text-sm text-slate-400 mt-1">كل ملفاتك وعناصرك المؤقتة في أمان تام.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {confirmConfig && (
                <ConfirmModal
                    isOpen={confirmConfig.isOpen}
                    title={confirmConfig.type === 'single' ? "حذف نهائي للملف" : "تفريغ سلة المهملات"}
                    message={confirmConfig.type === 'single' 
                        ? "هل أنت متأكد من حذف هذا العنصر نهائياً من قاعدة البيانات المحلية وسلة المحذوفات؟ لا يمكن استرجاع هذا الملف مجدداً."
                        : "هل أنت متأكد من تفريغ كافة محتويات سلة المهملات؟ هذه الخطوة ستقوم بمسح جميع البيانات المخزنة مؤقتاً نهائياً ولا يمكن التراجع عنها."
                    }
                    onConfirm={handleConfirmAction}
                    onCancel={() => setConfirmConfig(null)}
                    confirmText={confirmConfig.type === 'single' ? "تأكيد الحذف النهائي" : "تأكيد تفريغ السلة"}
                    cancelText="إلغاء"
                />
            )}
        </div>
    );
};
