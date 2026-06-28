import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit, Trash2, Printer, CheckCircle, Truck, PackageCheck, AlertTriangle } from 'lucide-react';
import { db } from '../db';
import { TicketCargo, TicketTripSchedule } from '../types';

const TicketCargoPage = () => {
    const [cargos, setCargos] = useState<TicketCargo[]>([]);
    const [trips, setTrips] = useState<TicketTripSchedule[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState<Partial<TicketCargo>>({
        status: 'received',
        weightKg: 1,
        codAmount: 0,
        price: 0,
        insuranceFee: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [c, t] = await Promise.all([
            db.ticketCargos.toArray(),
            db.ticketTripSchedules.toArray()
        ]);
        setCargos(c);
        setTrips(t);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let calculatedPrice = formData.price || ((formData.weightKg || 1) * 10); // Base calculation logic
        let total = calculatedPrice + (formData.insuranceFee || 0);

        const savedData = {
            ...formData,
            price: calculatedPrice,
            totalAmount: total,
            createdAt: formData.createdAt || new Date().toISOString(),
            parcelRef: formData.parcelRef || `PAR-${Math.floor(Date.now() / 1000).toString().slice(-6)}`
        } as TicketCargo;

        if (isEdit && formData.id) {
            await db.ticketCargos.update(formData.id, savedData);
        } else {
            const newId = await db.ticketCargos.add(savedData);
            
            // Financial Entry for Revenue
            await (db as any).journalEntries.add({
                date: new Date().toISOString().split('T')[0],
                description: `إيراد شحن طرد - ${savedData.parcelRef}`,
                reference: savedData.parcelRef,
                lines: [
                    { accountId: 1, accountName: 'الخزينة الرئيسية', debit: total, credit: 0 },
                    { accountId: 4, accountName: 'إيرادات الحجوزات', debit: 0, credit: total }
                ],
                totalAmount: total,
                status: 'posted',
                createdBy: 'النظام',
                createdAt: new Date().toISOString()
            });
        }
        
        setIsModalOpen(false);
        loadData();
    };

    const openCreate = () => {
        setIsEdit(false);
        setFormData({
            status: 'received',
            weightKg: 1,
            codAmount: 0,
            price: 50, // default base
            insuranceFee: 0,
            senderName: '',
            senderPhone: '',
            receiverName: '',
            receiverPhone: '',
            dimensions: ''
        });
        setIsModalOpen(true);
    };

    const openEdit = (c: TicketCargo) => {
        setIsEdit(true);
        setFormData(c);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if(window.confirm('هل أنت متأكد من حذف هذا الطرد؟ هذه العملية لا يمكن التراجع عنها.')) {
            await db.ticketCargos.delete(id);
            loadData();
        }
    };

    const getStatusParams = (status: string) => {
        switch(status) {
            case 'received': return { label: 'استلم بالفرع', icon: <Package className="w-4 h-4"/>, color: 'bg-slate-100 text-slate-700' };
            case 'in_transit': return { label: 'قيد النقل', icon: <Truck className="w-4 h-4"/>, color: 'bg-amber-100 text-amber-700' };
            case 'ready_for_pickup': return { label: 'جاهز للاستلام', icon: <PackageCheck className="w-4 h-4"/>, color: 'bg-indigo-100 text-indigo-700' };
            case 'delivered': return { label: 'تم التسليم', icon: <CheckCircle className="w-4 h-4"/>, color: 'bg-emerald-100 text-emerald-700' };
            default: return { label: status, icon: <Package className="w-4 h-4"/>, color: 'bg-slate-100 text-slate-700' };
        }
    };

    const filteredCargos = cargos.filter(c => 
        (c.parcelRef && c.parcelRef.includes(searchTerm)) ||
        (c.senderPhone && c.senderPhone.includes(searchTerm)) ||
        (c.receiverPhone && c.receiverPhone.includes(searchTerm))
    );

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                            <Package className="w-7 h-7" />
                        </div>
                        إدارة شحن الطرود والأنشطة اللوجستية
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Cargo & Parcel Express - إدارة لوجستيات السفر وتوليد الإيرادات الإضافية</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="بحث برقم الباركود / الجوال..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium w-full md:w-64 transition-all"
                        />
                    </div>
                    <button onClick={openCreate} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center shadow-md shadow-indigo-200">
                        <Plus className="w-5 h-5 ml-2" /> طرد جديد
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-slate-500 font-bold text-sm">بيانات الطرد</th>
                                <th className="px-6 py-4 text-slate-500 font-bold text-sm">المرسل / المستلم</th>
                                <th className="px-6 py-4 text-slate-500 font-bold text-sm">الرحلة والأبعاد</th>
                                <th className="px-6 py-4 text-slate-500 font-bold text-sm">الماليات (ج.م)</th>
                                <th className="px-6 py-4 text-slate-500 font-bold text-sm">الحالة</th>
                                <th className="px-6 py-4 text-slate-500 font-bold text-sm text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCargos.map((cargo, idx) => (
                                <tr key={cargo.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-indigo-700 mb-1">{cargo.parcelRef}</span>
                                            <span className="text-xs text-slate-500 line-clamp-1">{cargo.createdAt?.split('T')[0]}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-2">
                                            <div className="text-sm">
                                                <span className="text-slate-500 text-xs ml-1">من:</span>
                                                <span className="font-bold text-slate-800">{cargo.senderName}</span>
                                                <span className="text-xs text-slate-400 block dir-ltr text-right">{cargo.senderPhone}</span>
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-slate-500 text-xs ml-1">إلى:</span>
                                                <span className="font-bold text-slate-800">{cargo.receiverName}</span>
                                                <span className="text-xs text-slate-400 block dir-ltr text-right">{cargo.receiverPhone}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{trips.find(t => String(t.id) === String(cargo.tripId))?.tripCode || 'غير محدد'}</p>
                                        <p className="text-xs font-bold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 inline-block">{cargo.weightKg} كجم {cargo.dimensions ? `- ${cargo.dimensions}` : ''}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-slate-500">القيمة:</span>
                                            <span className="font-bold">{cargo.price}</span>
                                        </div>
                                        {cargo.insuranceFee! > 0 && (
                                            <div className="flex justify-between mb-1 text-xs">
                                                <span className="text-slate-400">التأمين:</span>
                                                <span className="font-bold text-slate-500">{cargo.insuranceFee}</span>
                                            </div>
                                        )}
                                        {cargo.codAmount! > 0 && (
                                            <div className="flex justify-between text-xs mt-1 border-t border-slate-100 pt-1">
                                                <span className="text-rose-500 font-bold">الدفع عند الاستلام:</span>
                                                <span className="font-black text-rose-600">{cargo.codAmount}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold w-max flex items-center gap-1.5 ${getStatusParams(cargo.status).color}`}>
                                            {getStatusParams(cargo.status).icon}
                                            {getStatusParams(cargo.status).label}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => window.print()} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="طباعة بوليصة / باركود">
                                                <Printer className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => openEdit(cargo)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(cargo.id!)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCargos.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-500 font-bold">لا توجد طرود مسجلة بهذا البحث</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-xl w-full max-w-3xl my-8 overflow-hidden flex flex-col animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Package className="w-6 h-6 text-indigo-600" />
                                {isEdit ? 'تعديل بيانات الطرد' : 'تسجيل طرد جديد (شحن إكسبريس)'}
                            </h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"><Trash2 className="w-6 h-6 hidden" /><span className="text-2xl leading-none">&times;</span></button>
                        </div>
                        
                        <div className="flex-1 p-6 space-y-6 overflow-y-auto" style={{maxHeight: '65vh'}}>
                            {/* Sender Info */}
                            <div>
                                <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">تفاصيل المرسل والمستلم</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                        <p className="font-bold text-indigo-700 text-sm">المرسل</p>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">الاسم *</label>
                                            <input type="text" required value={formData.senderName || ''} onChange={e => setFormData({...formData, senderName: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                                            <input type="tel" required value={formData.senderPhone || ''} onChange={e => setFormData({...formData, senderPhone: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono text-right dir-ltr" />
                                        </div>
                                    </div>
                                    <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                        <p className="font-bold text-indigo-700 text-sm">المستلم</p>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">الاسم *</label>
                                            <input type="text" required value={formData.receiverName || ''} onChange={e => setFormData({...formData, receiverName: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                                            <input type="tel" required value={formData.receiverPhone || ''} onChange={e => setFormData({...formData, receiverPhone: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono text-right dir-ltr" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Trip and Logistics */}
                            <div>
                                <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">بيانات الشحنة اللوجستية</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">الرحلة المحمل عليها *</label>
                                        <select required value={formData.tripId || ''} onChange={e => setFormData({...formData, tripId: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-indigo-500">
                                            <option value="" disabled>اختر الرحلة</option>
                                            {trips.map(t => <option key={t.id} value={t.id}>{t.tripCode} - {t.departureTime}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">حالة الطرد</label>
                                        <select value={formData.status || 'received'} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl outline-none font-bold text-indigo-700">
                                            <option value="received">استلم بالفرع</option>
                                            <option value="in_transit">قيد النقل</option>
                                            <option value="ready_for_pickup">جاهز للاستلام</option>
                                            <option value="delivered">تم التسليم</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">الوزن (كجم)</label>
                                        <input type="number" min="0" step="0.1" value={formData.weightKg || ''} onChange={e => {
                                            const weight = parseFloat(e.target.value) || 0;
                                            setFormData({...formData, weightKg: weight, price: weight * 10}); // Auto-calculate example
                                        }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">الأبعاد (اختياري)</label>
                                        <input type="text" value={formData.dimensions || ''} onChange={e => setFormData({...formData, dimensions: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" placeholder="مثال: 30x40x20 سم" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2 text-rose-600">دفع عند الاستلام COD</label>
                                        <input type="number" min="0" value={formData.codAmount || ''} onChange={e => setFormData({...formData, codAmount: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl outline-none font-black text-rose-700 focus:border-rose-500" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">رسوم تأمين</label>
                                        <input type="number" min="0" value={formData.insuranceFee || ''} onChange={e => setFormData({...formData, insuranceFee: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl outline-none font-bold text-amber-700" placeholder="0" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Summary Financials */}
                            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mt-4 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-indigo-700 text-sm mb-1">تكلفة الشحن (يتم حسابها تلقائياً)</p>
                                    <div className="flex items-center gap-2">
                                        <input type="number" min="0" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} className="w-32 px-3 py-2 bg-white border border-indigo-200 rounded-lg outline-none font-black text-lg focus:border-indigo-500" />
                                        <span className="font-bold text-indigo-400">ج.م (قيمة الشحن فقط بدون التأمين)</span>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-bold text-indigo-400 mb-1">إجمالي المطلوب من العميل الآن</p>
                                    <p className="text-3xl font-black text-indigo-800">
                                        {((formData.price || ((formData.weightKg || 1) * 10)) + (formData.insuranceFee || 0)).toLocaleString()} <span className="text-base text-indigo-500">ج.م</span>
                                    </p>
                                </div>
                            </div>

                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition">إلغاء</button>
                            <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/30">حفظ بوليصة الشحن</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default TicketCargoPage;
