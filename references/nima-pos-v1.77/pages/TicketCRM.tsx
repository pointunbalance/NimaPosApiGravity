import React, { useState, useEffect } from 'react';
import { 
    Users, Plus, Edit, ShieldAlert, Star, Phone, Mail, FileText, Search, CreditCard, 
    Gift, CheckCircle, Ticket, Wallet, Download, Clock, User, XCircle
} from 'lucide-react';
import { db } from '../db';
import { Customer, TicketBooking } from '../types';

const TicketCRM = () => {
    const [activeTab, setActiveTab] = useState<'customers' | 'loyalty'>('customers');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [bookings, setBookings] = useState<TicketBooking[]>([]);
    
    // Modal state
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [customerForm, setCustomerForm] = useState<Partial<Customer>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [c, b] = await Promise.all([
            db.customers.toArray(),
            db.ticketBookings.toArray()
        ]);
        setCustomers(c);
        setBookings(b);
    };

    const handleSaveCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSave = { ...customerForm } as Customer;
            if (!dataToSave.createdAt) dataToSave.createdAt = new Date();
            
            if (isEdit && dataToSave.id) {
                await db.customers.update(dataToSave.id, dataToSave as any);
            } else {
                await db.customers.add(dataToSave);
            }
            setIsCustomerModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    // Calculate metrics
    const getCustomerBookingsCount = (customerId: number) => bookings.filter(b => b.customerId === customerId).length;
    const getCustomerTotalSpent = (customerId: number) => bookings.filter(b => b.customerId === customerId && b.status === 'confirmed').reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.phone.includes(searchTerm) || 
        (c.nationalId && c.nationalId.includes(searchTerm)) ||
        (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-600" />
                        إدارة العملاء والركاب
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">قاعدة بيانات الركاب، السجلات وتحديثات الولاء</p>
                </div>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6 overflow-x-auto w-full max-w-lg">
                <button
                    onClick={() => setActiveTab('customers')}
                    className={`flex-1 min-w-[120px] font-bold py-2.5 rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'customers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <FileText className="w-4 h-4"/> سجل العملاء
                </button>
                <button
                    onClick={() => setActiveTab('loyalty')}
                    className={`flex-1 min-w-[120px] font-bold py-2.5 rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'loyalty' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <Gift className="w-4 h-4"/> الولاء والنقاط
                </button>
            </div>

            {/* Customers Tab */}
            {activeTab === 'customers' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input 
                                type="text"
                                placeholder="بحث بالاسم، الجوال، الهوية، الكود..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all font-medium"
                            />
                        </div>
                        <button onClick={() => { setIsEdit(false); setCustomerForm({ rating: 5, totalSpent: 0, loyaltyPoints: 0 }); setIsCustomerModalOpen(true); }} className="px-5 py-3 w-full md:w-auto bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center hover:bg-indigo-700 transition">
                            <Plus className="w-5 h-5 ml-2" /> إضافة راكب جديد
                        </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-right whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">العميل</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">التواصل</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">الهوية</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm text-center">التاريخ والحجوزات</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm text-center">التقييم والحالة</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm text-left">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCustomers.map(c => {
                                    const bCount = c.id ? getCustomerBookingsCount(c.id) : 0;
                                    return (
                                        <tr key={c.id} className={`hover:bg-slate-50/50 transition ${c.isBanned ? 'bg-rose-50/30' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-800 flex items-center gap-1">
                                                        {c.name} {c.isBanned && <ShieldAlert className="w-4 h-4 text-rose-500"/>}
                                                    </span>
                                                    <span className="text-xs text-slate-500 max-w-[120px] truncate">{c.code || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <a href={`tel:${c.phone}`} className="text-sm font-bold text-indigo-600 dir-ltr text-right hover:underline">{c.phone}</a>
                                                    {c.phone2 && <span className="text-xs text-slate-500 dir-ltr text-right">{c.phone2}</span>}
                                                    {c.email && <span className="text-xs text-slate-500">{c.email}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-600">
                                                {c.nationalId || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex flex-col items-center justify-center">
                                                    <span className="text-lg font-black text-slate-800">{bCount}</span>
                                                    <span className="text-[10px] text-slate-500 font-bold">حجوزات سابقة</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="flex items-center text-amber-500">
                                                        {Array.from({length: 5}).map((_, i) => (
                                                            <Star key={i} className={`w-3.5 h-3.5 ${i < (c.rating || 0) ? 'fill-amber-500' : 'text-slate-200 fill-slate-200'}`} />
                                                        ))}
                                                    </div>
                                                    {c.isBanned && <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full mt-1 line-clamp-1 max-w-[100px]" title={c.banReason}>حظر: {c.banReason}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-left">
                                                <button onClick={() => { setIsEdit(true); setCustomerForm(c); setIsCustomerModalOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-block"><Edit className="w-5 h-5"/></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredCustomers.length === 0 && (
                                    <tr><td colSpan={6} className="p-12 text-center text-slate-500 font-bold">لا يوجد عملاء مطابقين</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Loyalty Tab */}
            {activeTab === 'loyalty' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">نقاط الولاء والخصومات</h2>
                            <p className="text-sm text-slate-500">رصيد النقاط والخصومات المستحقة بناءً على الحجوزات السابقة.</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {customers.filter(c => (c.loyaltyPoints || 0) > 0 || getCustomerTotalSpent(c.id || 0) > 0).sort((a,b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0)).map(c => {
                            const spent = c.id ? getCustomerTotalSpent(c.id) : 0;
                            // Example rule: 1 point per 100 spent, if not explicitly maintained
                            const earnedPoints = c.loyaltyPoints || Math.floor(spent / 100);
                            
                            return (
                                <div key={c.id} className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 hover:shadow-md transition">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-slate-800 truncate">{c.name}</h3>
                                            <p className="text-xs font-mono text-slate-500 mt-1">{c.phone}</p>
                                        </div>
                                        <div className="bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm flex flex-col items-center">
                                            <span className="text-xl font-black text-indigo-600">{earnedPoints}</span>
                                            <span className="text-[10px] font-bold text-indigo-400">نقطة</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between items-center text-sm font-bold border-b border-indigo-100/50 pb-2">
                                            <span className="text-slate-500 flex items-center"><Wallet className="w-3.5 h-3.5 ml-1"/> إجمالي الإنفاق</span>
                                            <span className="text-slate-800">{spent.toLocaleString()} ج.م</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span className="text-slate-500 flex items-center"><Gift className="w-3.5 h-3.5 ml-1 text-emerald-500"/> الخصم المستحق</span>
                                            <span className="text-emerald-600">{Math.floor(earnedPoints / 10) * 5} ج.م</span>
                                        </div>
                                    </div>
                                    
                                    <div className="text-[10px] text-slate-400 font-bold bg-white p-2 rounded-lg text-center">
                                        يمكن استبدال النقاط بخصم في الحجز القادم
                                    </div>
                                </div>
                            );
                        })}
                        {customers.filter(c => (c.loyaltyPoints || 0) > 0 || getCustomerTotalSpent(c.id || 0) > 0).length === 0 && (
                            <div className="col-span-full p-8 text-center text-slate-400 font-bold">لا يوجد عملاء لديهم نقاط ولاء أو مشتريات نشطة</div>
                        )}
                    </div>
                </div>
            )}

            {isCustomerModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <form onSubmit={handleSaveCustomer} className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-xl font-bold text-slate-800">{isEdit ? 'تعديل سِجل العميل/الراكب' : 'إضافة راكب جديد'}</h2>
                            <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"><XCircle className="w-6 h-6" /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Basic Info */}
                            <div>
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center border-b border-slate-100 pb-2"><User className="w-5 h-5 ml-2 text-indigo-500"/> البيانات الأساسية</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">اسم الراكب *</label>
                                        <input type="text" required value={customerForm.name || ''} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">الرقم القومي / جواز السفر</label>
                                        <input type="text" value={customerForm.nationalId || ''} onChange={e => setCustomerForm({...customerForm, nationalId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف الأساسي *</label>
                                        <input type="tel" required value={customerForm.phone || ''} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono dir-ltr text-right focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">رقم هاتف بديل</label>
                                        <input type="tel" value={customerForm.phone2 || ''} onChange={e => setCustomerForm({...customerForm, phone2: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono dir-ltr text-right focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">كود العميل (اختياري)</label>
                                        <input type="text" value={customerForm.code || ''} onChange={e => setCustomerForm({...customerForm, code: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
                                        <input type="email" value={customerForm.email || ''} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none dir-ltr text-right focus:border-indigo-500" />
                                    </div>
                                </div>
                            </div>

                            {/* CRM Metrics */}
                            <div>
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center border-b border-slate-100 pb-2"><Star className="w-5 h-5 ml-2 text-indigo-500"/> الإعدادات والتقييم</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">تقييم العميل (1-5)</label>
                                        <select value={customerForm.rating || 5} onChange={e => setCustomerForm({...customerForm, rating: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-indigo-500">
                                            <option value={5}>⭐⭐⭐⭐⭐ ممتاز</option>
                                            <option value={4}>⭐⭐⭐⭐ جيد جداً</option>
                                            <option value={3}>⭐⭐⭐ مقبول</option>
                                            <option value={2}>⭐⭐ سيء</option>
                                            <option value={1}>⭐ حذر</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">نقاط الولاء يدوياً (اختياري)</label>
                                        <input type="number" min="0" value={customerForm.loyaltyPoints || ''} onChange={e => setCustomerForm({...customerForm, loyaltyPoints: parseInt(e.target.value) || 0})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Travel History */}
                            {isEdit && customerForm.id && (
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center border-b border-slate-100 pb-2"><Ticket className="w-5 h-5 ml-2 text-indigo-500"/> سجل الرحلات السابقة (Travel History)</h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                                        {bookings.filter(b => b.customerId === customerForm.id || (b.customerPhone && b.customerPhone === customerForm.phone) || (b.identityNumber && b.identityNumber === customerForm.nationalId)).length > 0 ? (
                                            <table className="w-full text-right text-sm">
                                                <thead className="bg-slate-100 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 text-slate-600 font-bold">الرحلة</th>
                                                        <th className="px-4 py-2 text-slate-600 font-bold">التاريخ</th>
                                                        <th className="px-4 py-2 text-slate-600 font-bold">الحالة</th>
                                                        <th className="px-4 py-2 text-slate-600 font-bold text-left">المدفوع</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {bookings.filter(b => b.customerId === customerForm.id || (b.customerPhone && b.customerPhone === customerForm.phone) || (b.identityNumber && b.identityNumber === customerForm.nationalId))
                                                        .sort((a,b) => new Date(b.departureDate).getTime() - new Date(a.departureDate).getTime())
                                                        .map(b => (
                                                        <tr key={b.id} className="hover:bg-white transition-colors">
                                                            <td className="px-4 py-3 font-bold text-slate-700">{b.destination}</td>
                                                            <td className="px-4 py-3 text-slate-500 dir-ltr text-right">{b.departureDate}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                                                    b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                                                    b.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                                                                    'bg-slate-200 text-slate-700'
                                                                }`}>
                                                                    {b.status === 'confirmed' ? 'مؤكد' : b.status === 'cancelled' ? 'ملغى' : b.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-left font-black text-indigo-700">{(b.totalAmount || 0).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="p-6 text-center text-slate-400 font-bold">لا يوجد سجل رحلات لهذا العميل</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Ban Status */}
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={customerForm.isBanned || false} 
                                        onChange={e => setCustomerForm({...customerForm, isBanned: e.target.checked})}
                                        className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                                    />
                                    <span className="font-bold text-rose-800 flex items-center"><ShieldAlert className="w-4 h-4 ml-1"/> حظر العميل التلقائي</span>
                                </label>
                                {customerForm.isBanned && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-bold text-rose-800 mb-2">سبب الحظر / ملاحظة للإدارة</label>
                                        <textarea 
                                            value={customerForm.banReason || ''} 
                                            onChange={e => setCustomerForm({...customerForm, banReason: e.target.value})}
                                            className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl outline-none font-medium focus:border-rose-500 min-h-[80px]"
                                            placeholder="مثال: يتهرب من دفع المتبقي، يسجل حجوزات وهمية..."
                                        />
                                    </div>
                                )}
                            </div>

                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                            <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition">إلغاء</button>
                            <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center shadow-lg"><CheckCircle className="w-5 h-5 ml-2"/> حفظ الراكب</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default TicketCRM;
