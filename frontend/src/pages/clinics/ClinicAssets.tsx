import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Plus, Search, MapPin, Wrench, AlertTriangle, ShieldCheck, User, Trash2, Edit2, X, Power, BatteryCharging, CheckCircle2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';

export const ClinicAssets = () => {
    const { success, error, warning } = useToast();
    const assets = useLiveQuery(() => db.assets.where('category').equals('clinic').toArray()) || [];
    const clinicStaff = useLiveQuery(() => db.users.filter(u => u.department === 'clinics').toArray()) || [];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [formData, setFormData] = useState({
        id: undefined as number | undefined,
        name: '',
        cost: 0,
        value: 0,
        lifeInYears: 5,
        purchaseDate: new Date().toISOString().split('T')[0],
        category: 'clinic',
        location: '',
        custodianId: '',
        status: 'active',
        usageCount: 0,
        maintenanceIntervalUses: 1000
    });

    const filteredAssets = useMemo(() => {
        return assets.filter(a => {
            const matchesSearch = a.name.includes(search) || a.location?.includes(search);
            const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [assets, search, filterStatus]);

    const handleOpenModal = (asset?: any) => {
        if (asset) {
            setFormData({
                id: asset.id,
                name: asset.name,
                cost: asset.cost,
                value: asset.value,
                lifeInYears: asset.lifeInYears,
                purchaseDate: new Date(asset.purchaseDate).toISOString().split('T')[0],
                category: 'clinic',
                location: asset.location || '',
                custodianId: asset.custodianId ? String(asset.custodianId) : '',
                status: asset.status || 'active',
                usageCount: asset.usageCount || 0,
                maintenanceIntervalUses: asset.maintenanceIntervalUses || 1000
            });
        } else {
            setFormData({
                id: undefined,
                name: '',
                cost: 0,
                value: 0,
                lifeInYears: 5,
                purchaseDate: new Date().toISOString().split('T')[0],
                category: 'clinic',
                location: '',
                custodianId: '',
                status: 'active',
                usageCount: 0,
                maintenanceIntervalUses: 1000
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                cost: Number(formData.cost),
                value: Number(formData.value),
                lifeInYears: Number(formData.lifeInYears),
                purchaseDate: new Date(formData.purchaseDate),
                category: 'clinic',
                location: formData.location,
                custodianId: formData.custodianId ? Number(formData.custodianId) : undefined,
                status: formData.status as any,
                usageCount: Number(formData.usageCount),
                maintenanceIntervalUses: Number(formData.maintenanceIntervalUses)
            };

            if (formData.id) {
                await db.assets.update(formData.id, payload);
                success('تم التحديث بنجاح');
            } else {
                await db.assets.add(payload as any);
                success('تم الاسترداد بنجاح');
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
            error('حدث خطأ أثناء الحفظ');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذا السجل الثابت؟')) {
            await db.assets.delete(id);
            success('تم الحذف');
        }
    };

    // Simulate usage
    const simulateUsage = async (asset: any) => {
        try {
            const currentUses = asset.usageCount || 0;
            const newUses = currentUses + 50; // add 50 hours/uses
            const interval = asset.maintenanceIntervalUses || 1000;
            
            let status = asset.status;
            if (newUses >= interval) {
                status = 'needs_maintenance';
                warning(`تحذير مبكر: تجاوز ${asset.name} الحد المسموح للاستخدام (${newUses}/${interval}) وهو الآن يحتاج إلى صيانة.`);
            }

            await db.assets.update(asset.id, { usageCount: newUses, status });
        } catch (err) {
            error('تعذر تسجيل الاستخدام');
        }
    };

    const performMaintenance = async (asset: any) => {
        try {
            await db.assets.update(asset.id, {
                status: 'active',
                usageCount: 0,
                lastMaintenanceDate: new Date().toISOString()
            });
            success(`تم إتمام الصيانة للأصل ${asset.name} وتصفير العداد.`);
        } catch (err) {
            error('حدث خطأ');
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Wrench className="w-8 h-8 text-indigo-600" />
                        إدارة الأصول الطبية والصيانة
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">جرد أصول، تعيين عُهد، وتتبع صيانة الأجهزة الطبية الذكي</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> سجل أصل جديد
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="ابحث باسم الجهاز، الطراز، أو الغرفة..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                    />
                </div>
                <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="all">جميع الحالات</option>
                    <option value="active">يعمل بحالة جيدة</option>
                    <option value="needs_maintenance">يحتاج صيانة (تجاوز المدة)</option>
                    <option value="under_maintenance">قيد الصيانة</option>
                </select>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssets.map(asset => {
                    const usageCount = asset.usageCount || 0;
                    const maxUses = asset.maintenanceIntervalUses || 1000;
                    const usagePercent = Math.min(100, Math.round((usageCount / maxUses) * 100));
                    const isCritical = usagePercent >= 90;
                    
                    const custodian = clinicStaff.find(s => s.id === asset.custodianId);

                    return (
                        <motion.div 
                            key={asset.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                        >
                            <div className={`p-4 border-b flex justify-between items-center ${isCritical ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Activity className={`w-5 h-5 ${isCritical ? 'text-rose-500' : 'text-indigo-500'}`} />
                                    {asset.name}
                                </h3>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleOpenModal(asset)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-white rounded-lg transition-colors border border-transparent hover:border-indigo-100">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(asset.id!)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-white rounded-lg transition-colors border border-transparent hover:border-rose-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-5 flex-1 space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-500 font-bold mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> الغرفة/القسم</p>
                                        <p className="font-medium text-slate-800">{asset.location || 'غير محدد'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-bold mb-1 flex items-center gap-1"><User className="w-3.5 h-3.5"/> عهدة الموظف</p>
                                        <p className="font-medium text-slate-800">{custodian ? custodian.name : 'لا يوجد (للقسم)'}</p>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-slate-600">عمر الاستهلاك (حتى الصيانة القادمة)</span>
                                        <span className={isCritical ? 'text-rose-600' : 'text-slate-800'}>
                                            {usageCount} / {maxUses} {isCritical && <AlertTriangle className="w-4 h-4 inline mr-1 text-rose-500"/>}
                                        </span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-500 ${isCritical ? 'bg-rose-500' : (usagePercent > 60 ? 'bg-amber-400' : 'bg-emerald-500')}`}
                                            style={{ width: `${usagePercent}%` }}
                                        />
                                    </div>
                                </div>
                                
                                {asset.lastMaintenanceDate && (
                                    <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                        آخر صيانة: {new Date(asset.lastMaintenanceDate).toLocaleDateString('ar-SA')}
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => simulateUsage(asset)}
                                    className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
                                >
                                    <Power className="w-3.5 h-3.5" /> محاكاة: تشغيل 50س
                                </button>
                                <button
                                    onClick={() => performMaintenance(asset)}
                                    className={`flex items-center justify-center gap-2 py-2 px-3 bg-white border ${asset.status === 'needs_maintenance' ? 'border-amber-300 hover:border-amber-400 hover:bg-amber-50 text-amber-700' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-600'} rounded-xl text-xs font-bold transition-colors`}
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> صيانة (Reset)
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-slate-800">
                                    {formData.id ? 'تعديل بيانات أصل/جهاز' : 'إضافة جهاز أو أصل جديد'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-200 p-1 rounded-lg transition-colors">
                                    <X className="w-5 h-5"/>
                                </button>
                            </div>
                            
                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-700">اسم الجهاز / الأصل</label>
                                    <input 
                                        type="text" required
                                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500"
                                        placeholder="مثال: جهاز ليزر كانديلا 2"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-slate-700">الغرفة / العيادة</label>
                                        <input 
                                            type="text" required
                                            value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                                            className="w-full border border-slate-200 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500"
                                            placeholder="مثال: غرفة 3 - ليزر"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-slate-700">في عُهدة (الموظف)</label>
                                        <select 
                                            value={formData.custodianId} onChange={e => setFormData({...formData, custodianId: e.target.value})}
                                            className="w-full border border-slate-200 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="">لا يوجد عهدة مخصصة</option>
                                            {clinicStaff.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-slate-700">دورة الصيانة (بالساعات/الاستخدام)</label>
                                        <input 
                                            type="number" required
                                            value={formData.maintenanceIntervalUses} onChange={e => setFormData({...formData, maintenanceIntervalUses: Number(e.target.value)})}
                                            className="w-full border border-slate-200 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500"
                                            placeholder="1000"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-slate-700">قيمة الأصل (ر.س)</label>
                                        <input 
                                            type="number" required
                                            value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value), value: Number(e.target.value)})}
                                            className="w-full border border-slate-200 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-indigo-800 text-xs font-bold leading-relaxed">
                                    <ShieldCheck className="w-5 h-5 text-indigo-600 mb-1" />
                                    سيقوم هذا المنطق بربط الجهاز بالغرفة المحددة، وتسجيل عهدة الموظف المختص. سيتم إطلاق تحذير الصيانة الوقائية عندما يقترب من حد الاستخدام المسموح لمنع تعطل الجهاز في العمليات.
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors">إلغاء</button>
                                    <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-shadow shadow-md shadow-indigo-200">
                                        حفظ الأصل
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
