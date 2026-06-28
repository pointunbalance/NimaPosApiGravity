import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { PeriodicMaintenanceSchedule, Customer, Product, User } from '../types';
import { 
    Calendar, Search, Phone, CheckCircle2, AlertCircle, Wrench, Clock, FileText, 
    Plus, Edit, Trash2, X, AlertTriangle, User as UserIcon, Tag, Banknote, ListTodo, Package, 
    BarChart4, PieChart as PieChartIcon, LayoutGrid, DollarSign, Activity, TrendingUp
} from 'lucide-react';
import { format, isPast, isToday, addDays } from 'date-fns';
import { 
    BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

export const PeriodicMaintenance = () => {
    const [activeTab, setActiveTab] = useState<'schedule' | 'assets' | 'reports'>('schedule');
    const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'due' | 'overdue' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<PeriodicMaintenanceSchedule | null>(null);

    const [templateFormData, setTemplateFormData] = useState({
        customerId: 0,
        productId: 0,
        purchaseDate: new Date(),
    });

    const [formData, setFormData] = useState<Partial<PeriodicMaintenanceSchedule>>({
        customerId: 0,
        productId: 0,
        purchaseDate: new Date(),
        nextMaintenanceDate: addDays(new Date(), 30),
        maintenanceIntervalDays: 30,
        status: 'upcoming',
        notes: '',
        maintenanceType: '',
        assignedTech: '',
        estimatedCost: undefined
    });

    const schedules = useLiveQuery(() => db.periodicMaintenanceSchedules.toArray()) || [];
    const customers = useLiveQuery(() => db.customers.toArray()) || [];
    const products = useLiveQuery(() => db.products.toArray()) || [];
    const users = useLiveQuery(() => db.users.toArray()) || [];

    // Process & Filter Data Dynamically
    const processedSchedules = useMemo(() => {
        return schedules.map(schedule => {
            const nextDate = new Date(schedule.nextMaintenanceDate);
            let dynamicStatus = schedule.status;

            if (dynamicStatus !== 'completed') {
                if (isPast(nextDate) && !isToday(nextDate)) {
                    dynamicStatus = 'overdue';
                } else if (isToday(nextDate) || (nextDate <= addDays(new Date(), 3) && nextDate > new Date())) {
                    dynamicStatus = 'due';
                }
            }
            return { ...schedule, dynamicStatus };
        }).sort((a, b) => {
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (a.status !== 'completed' && b.status === 'completed') return -1;
            return new Date(a.nextMaintenanceDate).getTime() - new Date(b.nextMaintenanceDate).getTime();
        });
    }, [schedules]);

    const filteredSchedules = useMemo(() => {
        return processedSchedules.filter(schedule => {
            const customer = customers.find(c => c.id === schedule.customerId);
            const product = products.find(p => p.id === schedule.productId);
            
            const matchesStatus = statusFilter === 'all' || schedule.dynamicStatus === statusFilter;
            const matchesSearch = 
                customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer?.phone?.includes(searchQuery) ||
                product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                schedule.productSerial?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                schedule.maintenanceType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                schedule.assignedTech?.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesStatus && matchesSearch;
        });
    }, [processedSchedules, statusFilter, searchQuery, customers, products]);

    // Group for Assets Tab (Customer Inventory)
    const assetsByCustomer = useMemo(() => {
        const map = new Map<number, { customer: Customer | undefined, assets: typeof processedSchedules }>();
        processedSchedules.forEach(schedule => {
            if (!map.has(schedule.customerId)) {
                map.set(schedule.customerId, {
                    customer: customers.find(c => c.id === schedule.customerId),
                    assets: []
                });
            }
            map.get(schedule.customerId)!.assets.push(schedule);
        });
        
        let arr = Array.from(map.values());
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            arr = arr.filter(item => 
                item.customer?.name.toLowerCase().includes(q) || 
                item.customer?.phone?.includes(q) ||
                item.assets.some(a => products.find(p => p.id === a.productId)?.name.toLowerCase().includes(q)) ||
                item.assets.some(a => a.productSerial?.toLowerCase().includes(q))
            );
        }
        return arr;
    }, [processedSchedules, customers, products, searchQuery]);

    // KPIs for Reports Tab
    const reportStats = useMemo(() => {
        const total = schedules.length;
        const completed = schedules.filter(s => s.status === 'completed').length;
        const overdue = processedSchedules.filter(s => s.dynamicStatus === 'overdue').length;
        const upcoming = total - completed - overdue;
        
        const byTech: Record<string, number> = {};
        schedules.forEach(s => {
            const t = s.assignedTech?.trim() || 'غير معين';
            byTech[t] = (byTech[t] || 0) + 1;
        });

        const pendingRevenue = processedSchedules.reduce((acc, s) => acc + (s.status !== 'completed' ? (Number(s.estimatedCost) || 0) : 0), 0);
        const completedRevenue = processedSchedules.reduce((acc, s) => acc + (s.status === 'completed' ? (Number(s.estimatedCost) || 0) : 0), 0);

        return { total, completed, overdue, upcoming, byTech, pendingRevenue, completedRevenue };
    }, [schedules, processedSchedules]);

    // Handlers
    const handleOpenModal = (schedule?: PeriodicMaintenanceSchedule) => {
        if (schedule) {
            setEditingSchedule(schedule);
            setFormData({ ...schedule });
        } else {
            setEditingSchedule(null);
            setFormData({
                customerId: customers.length > 0 ? customers[0].id : 0,
                productId: products.length > 0 ? products[0].id : 0,
                purchaseDate: new Date(),
                nextMaintenanceDate: addDays(new Date(), 30),
                maintenanceIntervalDays: 30,
                status: 'upcoming',
                notes: '',
                maintenanceType: '',
                assignedTech: '',
                estimatedCost: undefined
            });
        }
        setIsModalOpen(true);
    };

    const handleQuickAddAsset = (customerId: number) => {
        setEditingSchedule(null);
        setFormData({
            customerId: customerId,
            productId: products.length > 0 ? products[0].id : 0,
            purchaseDate: new Date(),
            nextMaintenanceDate: addDays(new Date(), 30),
            maintenanceIntervalDays: 30,
            status: 'upcoming',
            notes: '',
            maintenanceType: '',
            assignedTech: '',
            estimatedCost: undefined
        });
        setIsModalOpen(true);
    };

    const handleSaveSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const scheduleToSave = {
            ...formData,
            purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : new Date(),
            nextMaintenanceDate: formData.nextMaintenanceDate ? new Date(formData.nextMaintenanceDate) : new Date(),
            lastMaintenanceDate: formData.status === 'completed' ? (formData.lastMaintenanceDate ? new Date(formData.lastMaintenanceDate) : new Date()) : undefined,
        };

        if (editingSchedule && editingSchedule.id) {
            await db.periodicMaintenanceSchedules.update(editingSchedule.id, scheduleToSave);
            
            // Auto-schedule next maintenance if this one is completed
            if (formData.status === 'completed' && editingSchedule.status !== 'completed' && formData.maintenanceIntervalDays) {
                const nextScheduleDate = addDays(new Date(), formData.maintenanceIntervalDays);
                const nextSchedule = {
                    ...scheduleToSave,
                    id: undefined,
                    status: 'upcoming' as const,
                    lastMaintenanceDate: undefined,
                    nextMaintenanceDate: nextScheduleDate,
                    notes: '', // Clear notes for next cycle
                };
                await db.periodicMaintenanceSchedules.add(nextSchedule as PeriodicMaintenanceSchedule);
            }
        } else {
            await db.periodicMaintenanceSchedules.add(scheduleToSave as PeriodicMaintenanceSchedule);
        }
        setIsModalOpen(false);
    };

    const handleGenerate7StageFilter = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const filterStages = [
            { intervalDays: 90, type: 'تغيير شمعة أولى (المرحلة 1)' },
            { intervalDays: 180, type: 'تغيير شمعة ثانية (المرحلة 2)' },
            { intervalDays: 180, type: 'تغيير شمعة ثالثة (المرحلة 3)' },
            { intervalDays: 365, type: 'تغيير ممبرين (المرحلة 4)' },
            { intervalDays: 365, type: 'تغيير بوست كربون (المرحلة 5)' },
            { intervalDays: 365, type: 'تغيير كالسايت (المرحلة 6)' },
            { intervalDays: 365, type: 'تغيير انفراريد (المرحلة 7)' },
        ];

        const purchaseD = new Date(templateFormData.purchaseDate);

        for(const stage of filterStages) {
           await db.periodicMaintenanceSchedules.add({
               customerId: templateFormData.customerId,
               productId: templateFormData.productId,
               purchaseDate: purchaseD,
               nextMaintenanceDate: addDays(purchaseD, stage.intervalDays),
               maintenanceIntervalDays: stage.intervalDays,
               status: 'upcoming',
               notes: '',
               maintenanceType: stage.type
           } as PeriodicMaintenanceSchedule)
        }
        setIsTemplateModalOpen(false);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الجدولة؟')) {
            await db.periodicMaintenanceSchedules.delete(id);
        }
    };

    const handleMarkAsCompleted = async (id: number, intervalDays: number, currentNotes?: string) => {
        const nextDate = addDays(new Date(), intervalDays);
        const updatedNotes = currentNotes ? `${currentNotes}\n\n[اكتملت في ${format(new Date(), 'yyyy/MM/dd')}، تم التجديد تلقائياً للقادم]` : `[اكتملت في ${format(new Date(), 'yyyy/MM/dd')}، تم التجديد تلقائياً]`;

        await db.periodicMaintenanceSchedules.update(id, {
            status: 'completed',
            lastMaintenanceDate: new Date(),
        });
        await db.periodicMaintenanceSchedules.add({
            ...(processedSchedules.find(s => s.id === id)!),
            id: undefined, 
            status: 'upcoming',
            nextMaintenanceDate: nextDate,
            lastMaintenanceDate: undefined,
            notes: updatedNotes
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'overdue': return 'bg-rose-50 text-rose-700 border-rose-200 shadow-rose-100/50';
            case 'due': return 'bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100/50';
            case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100/50';
            case 'upcoming': return 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-indigo-100/50';
            default: return 'bg-slate-50 text-slate-700 border-slate-200 shadow-slate-100/50';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'overdue': return 'متأخرة عن الموعد';
            case 'due': return 'مستحقة قريباً';
            case 'completed': return 'مكتملة';
            case 'upcoming': return 'مجدولة';
            default: return status;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'overdue': return <AlertTriangle className="w-4 h-4 text-rose-600" />;
            case 'due': return <Clock className="w-4 h-4 text-amber-600" />;
            case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
            case 'upcoming': return <Calendar className="w-4 h-4 text-indigo-600" />;
            default: return <Wrench className="w-4 h-4" />;
        }
    };

    // Sub-renders
    const renderScheduleTab = () => (
        <div className="space-y-6 fade-in-up">
            <div className="flex flex-col xl:flex-row gap-4 items-center">
                <div className="flex-1 w-full relative group">
                    <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="ابحث برقم الهاتف، العميل، الصيانة، أو الفني..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-14 pl-5 py-4 bg-white border border-slate-200/80 rounded-2xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-medium text-slate-700 shadow-sm"
                    />
                </div>
                <div className="flex p-1.5 bg-white border border-slate-200/80 rounded-2xl w-full xl:w-auto overflow-x-auto hide-scrollbar shadow-sm">
                    {[
                        { id: 'all', label: 'الكل' },
                        { id: 'due', label: 'مستحقة قريباً' },
                        { id: 'overdue', label: 'متأخرة' },
                        { id: 'upcoming', label: 'مجدولة' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id as any)}
                            className={`px-6 py-2.5 rounded-xl whitespace-nowrap text-sm font-bold transition-all ${statusFilter === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSchedules.map(schedule => {
                    const customer = customers.find(c => c.id === schedule.customerId);
                    const product = products.find(p => p.id === schedule.productId);
                    
                    return (
                        <div key={schedule.id} className={`bg-white rounded-[2rem] border shadow-sm flex flex-col transition-all relative group overflow-hidden ${schedule.dynamicStatus === 'overdue' ? 'border-rose-200 ring-1 ring-rose-100 hover:shadow-rose-100' : schedule.dynamicStatus === 'due' ? 'border-amber-200 ring-1 ring-amber-100 hover:shadow-amber-100' : 'border-slate-200 hover:shadow-md'}`}>
                            <div className="absolute top-5 left-5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 z-10">
                                <button onClick={() => handleOpenModal(schedule)} className="p-2.5 bg-white/95 backdrop-blur-sm text-slate-600 hover:text-brand-600 rounded-xl shadow-lg border border-slate-100 transition-colors">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(schedule.id!)} className="p-2.5 bg-white/95 backdrop-blur-sm text-slate-600 hover:text-rose-600 rounded-xl shadow-lg border border-slate-100 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className={`h-1.5 w-full ${schedule.dynamicStatus === 'overdue' ? 'bg-rose-500' : schedule.dynamicStatus === 'due' ? 'bg-amber-400' : schedule.dynamicStatus === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />

                            <div className="p-6 md:p-7 flex-1 flex flex-col gap-6">
                                <div className="flex items-start justify-between pe-16">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">{customer?.name || 'عميل غير معروف'}</h3>
                                        {customer?.phone && (
                                            <a href={`tel:${customer.phone}`} className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-800 mt-1 font-medium text-sm transition-colors">
                                                <Phone className="w-3.5 h-3.5" />
                                                <span dir="ltr">{customer.phone}</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className={`self-start px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black tracking-wide border shadow-sm ${getStatusStyle(schedule.dynamicStatus)}`}>
                                    {getStatusIcon(schedule.dynamicStatus)}
                                    {getStatusText(schedule.dynamicStatus)}
                                </div>

                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/60 flex items-center justify-center shrink-0 shadow-sm">
                                            {product?.image ? <img src={product.image} className="w-full h-full object-cover rounded-2xl p-0.5" /> : <Package className="w-6 h-6 text-slate-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 text-sm truncate">{product?.name || 'منتج غير محدد'}</h4>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-1.5 font-medium text-xs text-slate-500">
                                                {schedule.maintenanceType ? (
                                                   <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm"><Tag className="w-3.5 h-3.5 text-indigo-400"/> {schedule.maintenanceType}</span> 
                                                ) : (
                                                   <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm"><Clock className="w-3.5 h-3.5 text-slate-400"/> كل {schedule.maintenanceIntervalDays} يوم</span> 
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {(schedule.assignedTech || schedule.estimatedCost || schedule.productSerial) && (
                                        <div className="pt-4 mt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
                                            {schedule.assignedTech && (
                                                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-indigo-100 text-indigo-700 shadow-sm"><UserIcon className="w-3.5 h-3.5"/><span>بواسطة: {schedule.assignedTech}</span></div>
                                            )}
                                            {schedule.estimatedCost && (
                                                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-emerald-100 text-emerald-700 shadow-sm"><Banknote className="w-3.5 h-3.5"/><span>التكلفة: {schedule.estimatedCost} د.ع</span></div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-sm font-medium pt-1 px-1">
                                    <div className="text-slate-500">
                                        <p className="text-xs text-slate-400 mb-1 font-bold">تاريخ التركيب</p>
                                        <span className="text-slate-700 font-mono bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">{format(new Date(schedule.purchaseDate), 'yyyy/MM/dd')}</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs text-slate-400 mb-1 font-bold">الموعد القادم</p>
                                        <span className={`font-black tracking-wide font-mono px-2 py-1 rounded-lg ${schedule.dynamicStatus === 'overdue' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-800 border border-slate-100'}`}>
                                            {format(new Date(schedule.nextMaintenanceDate), 'yyyy/MM/dd')}
                                        </span>
                                    </div>
                                </div>

                                {schedule.notes && (
                                    <div className="bg-amber-50/50 text-amber-900 p-4 rounded-2xl text-xs leading-relaxed border border-amber-200/50 shadow-sm relative overflow-hidden group/notes">
                                        <div className="absolute top-0 right-0 w-1 h-full bg-amber-400" />
                                        <span className="font-bold flex items-center gap-1.5 mb-1.5"><ListTodo className="w-4 h-4 text-amber-500"/> تفاصيل وإرشادات:</span>
                                        <p className="whitespace-pre-wrap opacity-90 ps-1">{schedule.notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                {schedule.status !== 'completed' ? (
                                    <button 
                                        onClick={() => handleMarkAsCompleted(schedule.id!, schedule.maintenanceIntervalDays, schedule.notes)}
                                        className={`flex-1 justify-center text-white px-5 py-3.5 rounded-2xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 ${schedule.dynamicStatus === 'overdue' ? 'bg-rose-600 hover:bg-rose-700 hover:shadow-rose-500/20 shadow-md' : 'bg-slate-900 hover:bg-slate-800 hover:shadow-slate-900/20 shadow-md'}`}
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> إغلاق كعملية مُنجزة
                                    </button>
                                ) : (
                                    <div className="w-full text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm">
                                        <CheckCircle2 className="w-5 h-5"/> اكتملت في {schedule.lastMaintenanceDate && format(new Date(schedule.lastMaintenanceDate), 'yyyy/MM/dd')}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {filteredSchedules.length === 0 && (
                <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                     <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-slate-100"><Wrench className="w-12 h-12 text-slate-300" /></div>
                     <h3 className="text-xl font-black text-slate-700">لا توجد عمليات مسجلة</h3>
                </div>
            )}
        </div>
    );

    const renderAssetsTab = () => (
        <div className="space-y-6 fade-in-up">
            <div className="flex flex-col xl:flex-row gap-4 items-center mb-6">
                <div className="flex-1 w-full relative group">
                    <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="ابحث بمنظومة العملاء (اسم العميل، الهاتف، أو اسم المنتج)..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-14 pl-5 py-4 bg-white border border-slate-200/80 rounded-2xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-medium text-slate-700 shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {assetsByCustomer.map(({customer, assets}) => {
                    const latestDate = Math.max(...assets.map(a => new Date(a.nextMaintenanceDate).getTime()));
                    return (
                        <div key={customer?.id || Math.random()} className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col overflow-hidden hover:border-brand-200 transition-colors duration-300">
                            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{customer?.name || 'عميل غير معروف'}</h3>
                                    {customer?.phone && (
                                        <div className="text-slate-500 font-medium text-sm flex items-center gap-1.5 mt-1">
                                            <Phone className="w-3.5 h-3.5"/> <span dir="ltr">{customer.phone}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-brand-50 text-brand-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-brand-100 flex items-center gap-1.5 shadow-sm">
                                    <Package className="w-3.5 h-3.5"/> {assets.length} عنصر
                                </div>
                            </div>
                            
                            <div className="p-6 space-y-4 flex-1">
                                <h4 className="text-xs font-bold text-slate-400 mb-2">الأصول المرتبطة والمُجردة</h4>
                                {assets.map(asset => {
                                    const product = products.find(p=>p.id === asset.productId);
                                    return (
                                        <div key={asset.id} className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
                                                    {product?.image ? <img src={product.image} className="w-full h-full object-cover rounded-xl p-0.5" /> : <LayoutGrid className="w-5 h-5 text-slate-400" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm line-clamp-1">{product?.name || 'منتج محذوف'}</p>
                                                    {asset.productSerial && <p className="text-[11px] font-mono font-bold text-slate-500 mt-0.5 border border-slate-200 bg-slate-50 px-1.5 py-0.5 rounded w-fit">S/N: {asset.productSerial}</p>}
                                                </div>
                                            </div>
                                            <div className="text-left shrink-0 pl-1">
                                                <p className="text-[10px] text-slate-400 font-bold mb-0.5">تاريخ التركيب</p>
                                                <p className="text-xs font-black font-mono text-slate-700">{format(new Date(asset.purchaseDate), 'yy/MM/dd')}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                                <button onClick={() => customer?.id && handleQuickAddAsset(customer.id)} className="w-full py-3 bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 text-slate-600 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2">
                                    <Plus className="w-4 h-4" /> إضافة منتج جديد لجرد العميل
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
            {assetsByCustomer.length === 0 && (
                <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-200 flex flex-col items-center justify-center"><Package className="w-12 h-12 text-slate-300 mb-4" /><h3 className="text-xl font-black text-slate-700">لا توجد أصول مسجلة بعد</h3></div>
            )}
        </div>
    );

    const renderReportsTab = () => {
        const pieData = [
            { name: 'منجزة', value: reportStats.completed, color: '#10b981' }, 
            { name: 'متأخرة', value: reportStats.overdue, color: '#f43f5e' }, 
            { name: 'مجدولة/قيد الانتظار', value: reportStats.upcoming, color: '#6366f1' }, 
        ];
        const techData = Object.entries(reportStats.byTech).map(([name, count]) => ({ name, count }));

        return (
            <div className="space-y-6 fade-in-up">
                {/* Top Metrics Rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-36">
                        <div className="flex items-center gap-2 text-slate-500 font-bold"><LayoutGrid className="w-4 h-4"/> إجمالي مجدولات الصيانة</div>
                        <p className="text-4xl font-black text-slate-800">{reportStats.total}</p>
                    </div>
                    <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
                        <div className="flex items-center gap-2 text-rose-800 font-bold relative z-10"><AlertTriangle className="w-4 h-4"/> متأخرة حَرِجة</div>
                        <p className="text-4xl font-black text-rose-600 relative z-10">{reportStats.overdue}</p>
                        <AlertTriangle className="absolute -left-4 -bottom-4 w-24 h-24 text-rose-500/10 rotate-12" />
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold relative z-10"><TrendingUp className="w-4 h-4"/> نسبة الإنجاز</div>
                        <p className="text-4xl font-black text-emerald-600 relative z-10">{reportStats.total > 0 ? Math.round((reportStats.completed / reportStats.total) * 100) : 0}%</p>
                    </div>
                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
                        <div className="flex items-center gap-2 text-indigo-800 font-bold relative z-10"><DollarSign className="w-4 h-4"/> العوائد التقديرية للطلبات</div>
                        <p className="text-2xl lg:text-3xl font-black text-indigo-600 relative z-10 font-mono tracking-tight">{reportStats.pendingRevenue.toLocaleString()} د.ع</p>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-brand-500"/> توزيع حالات الملفات</h3>
                        <div className="flex-1 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5}>
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <RTooltip 
                                        formatter={(value) => [`${value} عنصر`, 'العدد']} 
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontWeight: 'bold', fontSize: '0.875rem' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-brand-500"/> أداء ومهام الفنيين</h3>
                        <div className="flex-1 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RBarChart data={techData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontWeight: 600, fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontWeight: 600 }} dx={-10} />
                                    <RTooltip 
                                        cursor={{fill: '#F8FAFC'}} 
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="count" fill="#4f46e5" radius={[6,6,0,0]} name="المهام المسندة" barSize={35} />
                                </RBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200/60">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                        <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl shadow-sm border border-brand-100/50">
                            <Wrench className="w-7 h-7" />
                        </div>
                        صيانة المنتجات
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium ps-1">نظام إدارة ومتابعة الصيانة والأصول الشامل</p>
                </div>
                {activeTab === 'schedule' && (
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => {
                                setTemplateFormData({
                                    customerId: customers.length > 0 ? customers[0].id : 0,
                                    productId: products.length > 0 ? products[0].id : 0,
                                    purchaseDate: new Date(),
                                });
                                setIsTemplateModalOpen(true);
                            }}
                            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-6 py-3.5 rounded-2xl font-bold hover:bg-indigo-100 transition-all shadow-sm border border-indigo-200 whitespace-nowrap w-full sm:w-auto justify-center group"
                        >
                            <span className="group-hover:rotate-12 transition-transform">💧</span> توليد فلتر 7 مراحل
                        </button>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap w-full sm:w-auto justify-center"
                        >
                            <Plus className="w-5 h-5" />
                            جدولة يدوية
                        </button>
                    </div>
                )}
            </div>

            <div className="flex p-1.5 bg-slate-100/50 border border-slate-200/60 rounded-2xl w-full md:w-fit overflow-x-auto hide-scrollbar shadow-inner mt-4 mx-auto sm:mx-0">
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`px-6 py-3 rounded-xl whitespace-nowrap text-sm font-bold transition-all flex items-center gap-2 outline-none ${activeTab === 'schedule' ? 'bg-white text-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                >
                    <Calendar className="w-4 h-4"/> جداول المواعيد
                </button>
                <button
                    onClick={() => setActiveTab('assets')}
                    className={`px-6 py-3 rounded-xl whitespace-nowrap text-sm font-bold transition-all flex items-center gap-2 outline-none ${activeTab === 'assets' ? 'bg-white text-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                >
                    <Package className="w-4 h-4"/> جرد أصول العملاء
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    className={`px-6 py-3 rounded-xl whitespace-nowrap text-sm font-bold transition-all flex items-center gap-2 outline-none ${activeTab === 'reports' ? 'bg-white text-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                >
                    <BarChart4 className="w-4 h-4"/> التقارير والأداء
                </button>
            </div>

            <div className="pt-2">
                {activeTab === 'schedule' && renderScheduleTab()}
                {activeTab === 'assets' && renderAssetsTab()}
                {activeTab === 'reports' && renderReportsTab()}
            </div>

            {/* Modal Logic */}
            {isTemplateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsTemplateModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl w-full max-w-xl ring-1 ring-slate-100 shadow-2xl overflow-hidden flex flex-col relative z-20">
                        <div className="flex justify-between items-center px-8 py-7 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
                            <div>
                                <h2 className="text-2xl font-black text-indigo-700 flex items-center gap-3 tracking-tight">
                                    <div className="p-2.5 rounded-2xl border bg-indigo-50 border-indigo-100/50">
                                        <Package className="w-5 h-5"/>
                                    </div>
                                    جدولة فلتر 7 مراحل تلقائياً
                                </h2>
                                <p className="text-slate-500 font-medium text-sm mt-2 ms-[3.5rem]">سيتم توليد 7 صفقات صيانة (واحدة لكل شمعة) لهذا العميل بضغطة واحدة.</p>
                            </div>
                            <button onClick={() => setIsTemplateModalOpen(false)} className="bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-all border border-slate-200/50 shrink-0 self-start">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleGenerate7StageFilter} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-600">العميل</label>
                                    <select value={templateFormData.customerId} onChange={(e) => setTemplateFormData({...templateFormData, customerId: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 outline-none transition-all" required>
                                        <option value={0} disabled>-- اختر عميل --</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `- ${c.phone}` : ''}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-600">المنتج المقترن</label>
                                    <select value={templateFormData.productId} onChange={(e) => setTemplateFormData({...templateFormData, productId: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 outline-none transition-all" required>
                                        <option value={0} disabled>-- اختر منتج --</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-600">تاريخ تركيب الفلتر</label>
                                    <input type="date" value={format(new Date(templateFormData.purchaseDate || new Date()), 'yyyy-MM-dd')} onChange={(e) => setTemplateFormData({...templateFormData, purchaseDate: new Date(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 font-bold font-mono text-slate-700 transition-all shadow-sm" required />
                                </div>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mt-6">
                                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                    <strong className="block mb-1 text-amber-900"><AlertTriangle className="w-4 h-4 inline-block align-middle me-1"/>تنبيه:</strong> سيتم جدولة المواعيد التالية: الشمعة 1 (كل 3 أشهر)، الشمعتان 2 و 3 (كل 6 أشهر)، والشموع 4، 5، 6، 7 (كل سنة).
                                </p>
                            </div>
                            <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all shadow-lg hover:-translate-y-0.5 mt-8">
                                توليد الجدولة للفلتر بالكامل الآن
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl w-full max-w-3xl ring-1 ring-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] relative z-20">
                        <div className="flex justify-between items-center px-8 py-7 border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-30">
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                                    <div className={`p-2.5 rounded-2xl border ${editingSchedule ? 'bg-indigo-50 text-indigo-600 border-indigo-100/50' : 'bg-brand-50 text-brand-600 border-brand-100/50'}`}>
                                        {editingSchedule ? <Edit className="w-6 h-6"/> : <Plus className="w-6 h-6"/>}
                                    </div>
                                    {editingSchedule ? 'تعديل بيانات الصيانة' : 'إضافة للجرد والجدولة'}
                                </h2>
                                <p className="text-slate-500 font-medium text-sm mt-2 ms-[3.75rem]">قم بتسجيل أصول العميل لجدولة صيانتها.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 hover:scale-105 p-3 rounded-full transition-all border border-slate-200/50 shrink-0 self-start">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveSchedule} className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
                            <div className="overflow-y-auto flex-1 p-6 md:p-8 space-y-8">
                                <fieldset className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-6 relative hover:border-brand-200 transition-colors">
                                    <div className="absolute -top-4 right-8 bg-white px-4 py-1 font-black text-xs tracking-wider text-brand-600 flex items-center gap-2 border border-brand-100 rounded-full shadow-sm"><UserIcon className="w-3.5 h-3.5"/> بيانات العميل والمنتج</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-600 ms-1">العميل <span className="text-rose-500">*</span></label>
                                            <select value={formData.customerId} onChange={(e) => setFormData({...formData, customerId: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 font-bold text-slate-700 outline-none transition-all shadow-sm" required>
                                                <option value={0} disabled>-- اختر عميل --</option>
                                                {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `- ${c.phone}` : ''}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-600 ms-1">المنتج <span className="text-rose-500">*</span></label>
                                            <select value={formData.productId} onChange={(e) => setFormData({...formData, productId: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 font-bold text-slate-700 outline-none transition-all shadow-sm" required>
                                                <option value={0} disabled>-- اختر منتج --</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-bold text-slate-600 ms-1">الرقم التسلسلي S/N <span className="text-slate-400 font-medium">(اختياري)</span></label>
                                            <input type="text" value={formData.productSerial || ''} onChange={(e) => setFormData({...formData, productSerial: e.target.value})} placeholder="أدخل باركود أو سيريال المنتج لتتبعه في الجرد..." className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 font-mono font-bold text-slate-700 outline-none transition-all shadow-sm" dir="ltr" />
                                        </div>
                                    </div>
                                </fieldset>

                                <fieldset className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-6 relative hover:border-indigo-200 transition-colors">
                                    <div className="absolute -top-4 right-8 bg-white px-4 py-1 font-black text-xs tracking-wider text-indigo-600 flex items-center gap-2 border border-indigo-100 rounded-full shadow-sm"><Wrench className="w-3.5 h-3.5"/> إعدادات الصيانة</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-600 ms-1">نوع العملية <span className="text-slate-400 font-medium">(اختياري)</span></label>
                                            <input type="text" value={formData.maintenanceType || ''} onChange={(e) => setFormData({...formData, maintenanceType: e.target.value})} placeholder="مثال: تركيب فلتر، فحص شامل..." className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 outline-none transition-all shadow-sm" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-600 ms-1">تكلفة الصيانة القادمة التقديرية <span className="text-slate-400 font-medium">(اختياري)</span></label>
                                            <div className="relative">
                                                <input type="number" value={formData.estimatedCost || ''} onChange={(e) => setFormData({...formData, estimatedCost: e.target.value ? Number(e.target.value) : undefined})} placeholder="0" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 outline-none transition-all shadow-sm text-left pr-16" dir="ltr" />
                                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">د.ع</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-bold text-slate-600 ms-1">إسناد المهمة إلى فني <span className="text-slate-400 font-medium">(اختياري)</span></label>
                                            <select value={formData.assignedTech || ''} onChange={(e) => setFormData({...formData, assignedTech: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 outline-none transition-all shadow-sm">
                                                <option value="">-- تركت دون تعيين --</option>
                                                {users.filter(u => u.role === 'admin' || u.role === 'cashier').map(user => <option key={user.id} value={user.name}>{user.name}</option>)}
                                                <option value="جهة فنية خارجية">جهة أو فريق خارجي</option>
                                            </select>
                                        </div>
                                    </div>
                                </fieldset>

                                <fieldset className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-6 relative hover:border-emerald-200 transition-colors">
                                    <div className="absolute -top-4 right-8 bg-white px-4 py-1 font-black text-xs tracking-wider text-emerald-600 flex items-center gap-2 border border-emerald-100 rounded-full shadow-sm"><Calendar className="w-3.5 h-3.5"/> المواعيد والجدولة</div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-600 ms-1">تاريخ التركيب / الشراء</label>
                                            <input type="date" value={format(new Date(formData.purchaseDate || new Date()), 'yyyy-MM-dd')} onChange={(e) => setFormData({...formData, purchaseDate: new Date(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 font-bold font-mono text-slate-700 transition-all shadow-sm" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-600 ms-1">عمر التكرار الدائم (أيام)</label>
                                            <input type="number" min="1" value={formData.maintenanceIntervalDays || 30} onChange={(e) => setFormData({...formData, maintenanceIntervalDays: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 font-bold text-slate-700 transition-all shadow-sm" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-600 ms-1">تاريخ الزيارة القادمة</label>
                                            <input type="date" value={format(new Date(formData.nextMaintenanceDate || new Date()), 'yyyy-MM-dd')} onChange={(e) => setFormData({...formData, nextMaintenanceDate: new Date(e.target.value)})} className="w-full px-5 py-4 bg-emerald-50/50 border border-emerald-200/50 rounded-2xl focus:border-emerald-500 font-bold font-mono text-emerald-800 transition-all shadow-sm" required />
                                        </div>
                                    </div>
                                </fieldset>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <fieldset className="bg-white p-6 sm:p-8 rounded-[2rem] border border-amber-200/60 shadow-sm space-y-6 relative md:col-span-1 bg-gradient-to-b from-amber-50/30 to-white">
                                        <div className="absolute -top-4 right-8 bg-white px-4 py-1 font-black text-xs tracking-wider text-amber-600 flex items-center gap-2 border border-amber-100 rounded-full shadow-sm"><AlertCircle className="w-3.5 h-3.5"/> حالة الملف</div>
                                        <div className="space-y-2 pt-2">
                                            <label className="text-sm font-bold text-slate-600 ms-1">الحالة</label>
                                            <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:border-amber-500 font-bold text-slate-700 transition-all shadow-sm">
                                                <option value="upcoming">مجدولة / قيد الانتظار</option>
                                                <option value="completed">منجزة / مكتملة الدورة</option>
                                            </select>
                                        </div>
                                        {formData.status === 'completed' && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-emerald-700 ms-1">أنجزت بتاريخ</label>
                                                <input type="date" value={formData.lastMaintenanceDate ? format(new Date(formData.lastMaintenanceDate), 'yyyy-MM-dd') : ''} onChange={(e) => setFormData({...formData, lastMaintenanceDate: new Date(e.target.value)})} className="w-full px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl font-bold font-mono text-emerald-800 transition-all shadow-sm" />
                                            </div>
                                        )}
                                    </fieldset>

                                    <fieldset className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-6 relative hover:border-brand-200 transition-colors md:col-span-2">
                                        <div className="absolute -top-4 right-8 bg-white px-4 py-1 font-black text-xs tracking-wider text-slate-600 flex items-center gap-2 border border-slate-200 rounded-full shadow-sm"><FileText className="w-3.5 h-3.5"/> الملاحظات وسجل الأعمال</div>
                                        <div className="space-y-2 pt-2 h-full">
                                            <textarea rows={formData.status === 'completed' ? 7 : 4} value={formData.notes || ''} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="دوّن تفاصيل الزيارة، القطع التالفة، أو أي توصية للعميل للحفاظ عليها في أرشيف الجرد..." className="w-full h-full min-h-[120px] px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-500 font-medium text-slate-700 transition-all resize-none leading-loose shadow-input" />
                                        </div>
                                    </fieldset>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-end p-6 md:p-8 border-t border-slate-100 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-10 shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold transition-all shadow-sm">إلغاء</button>
                                <button type="submit" className="w-full sm:w-auto px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black transition-all shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2">
                                    {editingSchedule ? <Edit className="w-5 h-5"/> : <Plus className="w-5 h-5"/>} حفظ في السجل
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
