import React, { useState, useEffect } from 'react';
import { Building2, Save, Trash2, Edit, Plus, XCircle, Map, DollarSign, Percent, Phone, User, Store } from 'lucide-react';
import { db } from '../db';
import { TicketVendor, TicketVendorRoute } from '../types';
import toast from 'react-hot-toast';

const TicketVendors = () => {
    const [activeTab, setActiveTab] = useState<'providers' | 'routes' | 'ledgers'>('providers');
    
    // Data
    const [vendors, setVendors] = useState<TicketVendor[]>([]);
    const [routes, setRoutes] = useState<TicketVendorRoute[]>([]);
    const [bookings, setBookings] = useState<any[]>([]); // TicketBooking
    
    // Modals
    const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
    
    const [providerForm, setProviderForm] = useState<Partial<TicketVendor>>({ transportType: 'bus', commissionType: 'percentage', commissionValue: 10 });
    const [routeForm, setRouteForm] = useState<Partial<TicketVendorRoute>>({ dailySeatQuota: 20 });
    
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [v, r, b] = await Promise.all([
            (db as any).ticketVendors.toArray(),
            (db as any).ticketVendorRoutes.toArray(),
            (db as any).ticketBookings.toArray()
        ]);
        setVendors(v);
        setRoutes(r);
        setBookings(b);
    };

    const handleSaveProvider = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSave = { ...providerForm } as TicketVendor;
            if (isEdit && dataToSave.id) {
                await (db as any).ticketVendors.update(dataToSave.id, dataToSave);
                toast.success('تم التحديث بنجاح');
            } else {
                await (db as any).ticketVendors.add(dataToSave);
                toast.success('تمت الإضافة بنجاح');
            }
            setIsProviderModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ');
        }
    };

    const deleteProvider = async (id: number) => {
        if(window.confirm('هل أنت متأكد من الحذف؟ سيتم حذف جميع خطوط هذه الشركة أيضاً.')) {
            await (db as any).ticketVendors.delete(id);
            // Also delete related routes
            const relatedRoutes = routes.filter(r => r.vendorId === id);
            for(const r of relatedRoutes) {
                await (db as any).ticketVendorRoutes.delete(r.id);
            }
            loadData();
            toast.success('تم الحذف');
        }
    };

    const handleSaveRoute = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSave = { ...routeForm } as TicketVendorRoute;
            if (isEdit && dataToSave.id) {
                await (db as any).ticketVendorRoutes.update(dataToSave.id, dataToSave);
                toast.success('تم التحديث بنجاح');
            } else {
                await (db as any).ticketVendorRoutes.add(dataToSave);
                toast.success('تمت الإضافة بنجاح');
            }
            setIsRouteModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ');
        }
    };

    const deleteRoute = async (id: number) => {
        if(window.confirm('هل أنت متأكد من حذف الخط؟')) {
            await (db as any).ticketVendorRoutes.delete(id);
            loadData();
            toast.success('تم الحذف');
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Store className="w-8 h-8 text-indigo-600" />
                        إدارة الشركات والخطوط
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Vendors & Partners</p>
                </div>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-xl self-start w-fit">
                <button
                    onClick={() => setActiveTab('providers')}
                    className={`flex-1 min-w-[150px] md:min-w-[180px] font-bold py-2.5 rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'providers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <Building2 className="w-4 h-4" /> دليل شركات النقل
                </button>
                <button
                    onClick={() => setActiveTab('routes')}
                    className={`flex-1 min-w-[150px] md:min-w-[180px] font-bold py-2.5 rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'routes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <Map className="w-4 h-4" /> أسعار الخطوط الرسمية
                </button>
                <button
                    onClick={() => setActiveTab('ledgers')}
                    className={`flex-1 min-w-[150px] md:min-w-[180px] font-bold py-2.5 rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'ledgers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <DollarSign className="w-4 h-4" /> تسوية حسابات الشركات
                </button>
            </div>

            {activeTab === 'providers' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">شركات النقل المزودة للخدمة</h2>
                        <button onClick={() => { setIsEdit(false); setProviderForm({ transportType: 'bus', commissionType: 'percentage', commissionValue: 10 }); setIsProviderModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center hover:bg-indigo-700 transition">
                            <Plus className="w-5 h-5 ml-1" /> إضافة شركة
                        </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-right whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">كود الشركة</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">اسم الشركة</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">هاتف الحسابات</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">نوع النقل</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">نوع العمولة</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">قيمة العمولة المتفق عليها</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {vendors.map(v => (
                                    <tr key={v.id} className="hover:bg-slate-50/50 transition">
                                        <td className="px-6 py-4 font-black text-slate-500 uppercase">{v.vendorCode || '-'}</td>
                                        <td className="px-6 py-4 font-black text-slate-800">{v.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-slate-700 flex items-center gap-1"><Phone className="w-4 h-4 text-slate-400"/> {v.phone}</div>
                                            {v.contactPerson && <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><User className="w-3 h-3 text-slate-400"/> {v.contactPerson}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-600">
                                            {v.transportType === 'bus' ? 'باص' : v.transportType === 'limo' ? 'ليموزين' : v.transportType === 'airplane' ? 'طيران' : v.transportType === 'train' ? 'قطار' : 'سفينة'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-600">
                                            {v.commissionType === 'percentage' ? 'نسبة مئوية (%)' : 'مبلغ ثابت ($)'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center w-fit ${v.commissionType === 'percentage' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                {v.commissionValue} {v.commissionType === 'percentage' ? '%' : 'ج.م'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => { setIsEdit(true); setProviderForm(v); setIsProviderModalOpen(true); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => v.id && deleteProvider(v.id)} className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {vendors.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold">لم يتم إضافة شركات نقل بعد</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'routes' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">أسعار الخطوط للشركات المتعاقدة</h2>
                        <button onClick={() => { setIsEdit(false); setRouteForm({ dailySeatQuota: 20 }); setIsRouteModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center hover:bg-indigo-700 transition">
                            <Plus className="w-5 h-5 ml-1" /> إضافة خط
                        </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-right whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">اسم الشركة</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">التسعير الرسمي (ج.م)</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">الكمية المتاحة (يومياً)</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {routes.map(r => {
                                    const v = vendors.find(x => x.id === r.vendorId);
                                    let profit = 0;
                                    if(v) {
                                        profit = v.commissionType === 'percentage' 
                                            ? Math.round((r.officialPrice * v.commissionValue) / 100) 
                                            : v.commissionValue;
                                    }
                                    
                                    return (
                                        <tr key={r.id} className="hover:bg-slate-50/50 transition">
                                            <td className="px-6 py-4">
                                                <div className="font-black text-slate-800">{v?.name || '-'}</div>
                                                <div className="text-xs text-indigo-600 font-bold mt-1 bg-indigo-50 w-fit px-2 py-0.5 rounded-md">{r.routeName}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-black text-slate-800 text-lg">{r.officialPrice} <span className="text-xs text-slate-500 font-bold">ج.م</span></div>
                                                {profit > 0 && <div className="text-xs text-emerald-600 font-bold mt-1 inline-flex items-center"><DollarSign className="w-3 h-3 mr-0.5"/> ربح متوقع: {profit} ج.م/تذكرة</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 font-black rounded-lg">{r.dailySeatQuota} مقعد</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => { setIsEdit(true); setRouteForm(r); setIsRouteModalOpen(true); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => r.id && deleteRoute(r.id)} className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {routes.length === 0 && (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-400 font-bold">لم يتم إضافة خطوط مخصصة بعد</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'ledgers' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">تسوية حسابات الشركات (Brokerage)</h2>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-right whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">اسم شركة النقل</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">التذاكر المباعة (الإجمالي)</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm text-emerald-600">إجمالي المبالغ المحصلة من الزبائن لحساب الشركة</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm text-indigo-600">صافي العمولات المحتجزة في المحل (مكسبك الصافي)</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm text-rose-600">المبلغ الصافي المستحق الإرسال للشركة</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">إجراء مالي</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {vendors.map(v => {
                                    // Aggregate for this vendor
                                    const vendorBookings = bookings.filter(b => b.vendorId === v.id && b.status !== 'cancelled' && b.status !== 'refunded');
                                    const totalTickets = vendorBookings.reduce((sum, b) => sum + (b.passengers || 1), 0);
                                    const totalCollected = vendorBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
                                    const totalCommission = vendorBookings.reduce((sum, b) => sum + ((b.expectedCommission || 0) * (b.passengers || 1)), 0);
                                    const netPayable = totalCollected - totalCommission;

                                    if(totalTickets === 0) return null;

                                    return (
                                        <tr key={`ledg_${v.id}`} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 font-black text-slate-800">
                                                {v.name}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-600">
                                                {totalTickets} تذكرة
                                            </td>
                                            <td className="px-6 py-4 font-black text-emerald-600">
                                                {totalCollected.toLocaleString()} ج.م
                                            </td>
                                            <td className="px-6 py-4 font-black text-indigo-600">
                                                {totalCommission.toLocaleString()} ج.م
                                            </td>
                                            <td className="px-6 py-4 font-black text-rose-600">
                                                {netPayable.toLocaleString()} ج.م
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-black hover:bg-indigo-600 hover:text-white transition">
                                                    تسجيل تحويل مالي للشركة
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {vendors.length === 0 || bookings.filter(b => b.vendorId).length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-bold">لا توجد حركات تسوية مالية بعد</td></tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Provider Modal */}
            {isProviderModalOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                     <form onSubmit={handleSaveProvider} className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-200">
                         <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                             <h2 className="text-xl font-bold text-slate-800">{isEdit ? 'تعديل بيانات الشركة' : 'إضافة شركة نقل جديدة'}</h2>
                             <button type="button" onClick={() => setIsProviderModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"><XCircle className="w-6 h-6" /></button>
                         </div>
                         <div className="p-6 space-y-5">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-2">كود الشركة (اختياري)</label>
                                     <input type="text" value={providerForm.vendorCode || ''} onChange={e => setProviderForm({...providerForm, vendorCode: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500 uppercase" placeholder="VEND-001" />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-2">اسم الشركة *</label>
                                     <input type="text" required value={providerForm.name || ''} onChange={e => setProviderForm({...providerForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" placeholder="مثال: جو باص" />
                                 </div>
                                 <div className="md:col-span-2">
                                     <label className="block text-sm font-bold text-slate-700 mb-2">نوع النقل *</label>
                                     <select required value={providerForm.transportType || 'bus'} onChange={e => setProviderForm({...providerForm, transportType: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-indigo-500">
                                         <option value="bus">حافلات (أتوبيس)</option>
                                         <option value="limo">ليموزين</option>
                                         <option value="airplane">طيران الجو</option>
                                         <option value="train">قطارات</option>
                                         <option value="ship">نقل بحري</option>
                                     </select>
                                 </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف *</label>
                                     <input type="text" required value={providerForm.phone || ''} onChange={e => setProviderForm({...providerForm, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-left dir-ltr focus:border-indigo-500" placeholder="01X XXXX" />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-2">اسم المسؤول المباشر (اختياري)</label>
                                     <input type="text" value={providerForm.contactPerson || ''} onChange={e => setProviderForm({...providerForm, contactPerson: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" />
                                 </div>
                             </div>

                             <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                <h3 className="font-bold text-indigo-900 mb-3 text-sm">إعدادات العمولة المسبقة</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">نوع العمولة</label>
                                        <div className="flex border border-slate-200 rounded-xl overflow-hidden">
                                            <button type="button" onClick={() => setProviderForm({...providerForm, commissionType: 'percentage'})} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1 ${providerForm.commissionType === 'percentage' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}><Percent className="w-4 h-4"/> نسبة %</button>
                                            <button type="button" onClick={() => setProviderForm({...providerForm, commissionType: 'fixed'})} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1 ${providerForm.commissionType === 'fixed' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}><DollarSign className="w-4 h-4"/> مبلغ ثابت</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">القيمة</label>
                                        <input type="number" required min="0" value={providerForm.commissionValue || ''} onChange={e => setProviderForm({...providerForm, commissionValue: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500 text-indigo-700" placeholder="مثال: 10 أو 50" />
                                    </div>
                                </div>
                             </div>
                         </div>
                         <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                             <button type="button" onClick={() => setIsProviderModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition">إلغاء</button>
                             <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center shadow-lg shadow-indigo-200"><Save className="w-5 h-5 ml-2" /> حفظ</button>
                         </div>
                     </form>
                 </div>
            )}

            {/* Route Modal */}
            {isRouteModalOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                     <form onSubmit={handleSaveRoute} className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-200">
                         <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                             <h2 className="text-xl font-bold text-slate-800">{isEdit ? 'تعديل الخط' : 'تسجيل خط واسعار رسمية'}</h2>
                             <button type="button" onClick={() => setIsRouteModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"><XCircle className="w-6 h-6" /></button>
                         </div>
                         <div className="p-6 space-y-4">
                             <div>
                                 <label className="block text-sm font-bold text-slate-700 mb-2">الشركة المزودة *</label>
                                 <select required value={routeForm.vendorId || ''} onChange={e => setRouteForm({...routeForm, vendorId: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-indigo-500">
                                     <option value="">-- اختر الشركة --</option>
                                     {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.transportType})</option>)}
                                 </select>
                             </div>

                             <div>
                                 <label className="block text-sm font-bold text-slate-700 mb-2">اسم الخط / الوجهة *</label>
                                 <input type="text" required value={routeForm.routeName || ''} onChange={e => setRouteForm({...routeForm, routeName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" placeholder="مثال: القاهرة الماظة - الاسكندرية سيدي جابر" />
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-2">سعر التذكرة الرسمي (ج.م) *</label>
                                     <input type="number" required min="0" value={routeForm.officialPrice || ''} onChange={e => setRouteForm({...routeForm, officialPrice: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black focus:border-indigo-500 text-indigo-700" />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-2">الحصة / المقاعد لك (يومياً) *</label>
                                     <input type="number" required min="1" value={routeForm.dailySeatQuota || ''} onChange={e => setRouteForm({...routeForm, dailySeatQuota: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black focus:border-indigo-500" />
                                 </div>
                             </div>
                             
                         </div>
                         <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                             <button type="button" onClick={() => setIsRouteModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition">إلغاء</button>
                             <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center shadow-lg shadow-indigo-200"><Save className="w-5 h-5 ml-2" /> حفظ</button>
                         </div>
                     </form>
                 </div>
            )}
        </div>
    );
};

export default TicketVendors;
