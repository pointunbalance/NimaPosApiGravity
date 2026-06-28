import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
    Wallet, TrendingDown, TrendingUp, Search, Plus, Clock, FileText, CheckCircle, 
    XCircle, FileSignature, Save, DollarSign
} from 'lucide-react';
import { db } from '../db';
import { Shift, FinancialVoucher, User as DBUser } from '../types';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import VoucherModal from '../components/financials/VoucherModal';
import OpenShiftModal from '../components/financials/OpenShiftModal';
import CloseShiftModal from '../components/financials/CloseShiftModal';

export const TicketFinancials: React.FC = () => {
    const { success, error: showError } = useToast();
    const [activeTab, setActiveTab] = useState<'shifts' | 'vouchers'>('shifts');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Data
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [vouchers, setVouchers] = useState<FinancialVoucher[]>([]);
    const [users, setUsers] = useState<DBUser[]>([]);
    
    // Modals
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
    const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
    const [shiftToClose, setShiftToClose] = useState<Shift | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; voucherId: number } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [s, v, u, bookings] = await Promise.all([
            db.shifts.toArray(),
            db.financialVouchers.toArray(),
            db.users.toArray(),
            db.ticketBookings.toArray()
        ]);
        
        // Dynamically compute cash/card sales for open shifts based on bookings
        for (let shift of s) {
            if (shift.status === 'open') {
                const shiftBookings = bookings.filter(b => b.createdAt && new Date(b.createdAt) >= shift.startTime);
                
                const cashSales = shiftBookings.filter(b => b.paymentMethod === 'cash').reduce((sum, b) => sum + (b.paidAmount || 0), 0);
                const cardSales = shiftBookings.filter(b => b.paymentMethod !== 'cash').reduce((sum, b) => sum + (b.paidAmount || 0), 0);
                
                if (shift.cashSales !== cashSales || shift.cardSales !== cardSales) {
                    shift.cashSales = cashSales;
                    shift.cardSales = cardSales;
                    await db.shifts.update(shift.id!, { cashSales, cardSales });
                }
            }
        }
        
        setShifts(s.sort((a,b) => b.startTime.getTime() - a.startTime.getTime()));
        setVouchers(v.sort((a,b) => b.date.getTime() - a.date.getTime()));
        setUsers(u);
    };

    const handleSaveVoucher = async (formData: Partial<FinancialVoucher>) => {
        try {
            const dataToSave = { 
                ...formData, 
                date: formData.date || new Date(),
                voucherNumber: formData.voucherNumber || `VCH-${Math.floor(Math.random()*100000)}`
            } as FinancialVoucher;
            
            // If there's an active shift, link it
            const activeShift = shifts.find(s => s.status === 'open');
            if (activeShift) {
                dataToSave.shiftId = activeShift.id;
            }

            await db.financialVouchers.add(dataToSave);
            setIsVoucherModalOpen(false);
            success('تم إنشاء السند المالي بنجاح');
            loadData();
        } catch (error) {
            console.error(error);
            showError('فشل إنشاء السند المالي');
        }
    };

    const handleOpenShiftSubmit = async (startCash: number) => {
        const activeShift = shifts.find(s => s.status === 'open');
        if (activeShift) {
            showError('يوجد وردية نشطة بالفعل مسبقاً!');
            return;
        }

        await db.shifts.add({
            startTime: new Date(),
            startCash: startCash,
            cashSales: 0,
            cardSales: 0,
            expectedCash: startCash,
            status: 'open',
            userId: 1, // Demo manager/staff id
            userName: 'بوهدان أندري' // Ukrainian Christian Name
        });
        
        setIsOpenShiftModalOpen(false);
        success('تم فتح الوردية بنجاح للكاشير');
        loadData();
    };

    const handleCloseShiftSubmit = async (declaredCash: number, notes: string) => {
        if (!shiftToClose || !shiftToClose.id) return;

        // Calculate expected manually:
        const vchs = vouchers.filter(v => v.shiftId === shiftToClose.id && v.paymentMethod === 'cash');
        const shiftExpenses = shiftToClose.shiftExpenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
        const voucherExpenses = vchs.filter(v => v.type === 'payment').reduce((acc, v) => acc + v.amount, 0);
        const voucherReceipts = vchs.filter(v => v.type === 'receipt').reduce((acc, v) => acc + v.amount, 0);
        
        const totalOut = shiftExpenses + voucherExpenses;
        const totalIn = shiftToClose.cashSales + voucherReceipts;
        const expectedCash = shiftToClose.startCash + totalIn - totalOut;

        const difference = declaredCash - expectedCash;
        const status = difference === 0 ? 'closed' : 'pending_confirmation';

        await db.shifts.update(shiftToClose.id, {
            endTime: new Date(),
            actualCash: declaredCash,
            expectedCash: expectedCash,
            difference: difference,
            status: status,
            notes: notes
        });

        setIsCloseShiftModalOpen(false);
        success(difference === 0 ? 'تم إغلاق الوردية ومطابقة النقدية بنجاح' : 'تم تعليق الوردية للمراجعة بسبب وجود فارق مالي');
        loadData();
    };

    const confirmDeleteVoucher = (id: number) => {
        setConfirmConfig({ isOpen: true, voucherId: id });
    };

    const handleDeleteVoucher = async () => {
        if (!confirmConfig) return;
        const id = confirmConfig.voucherId;
        try {
            await db.financialVouchers.delete(id);
            success('تم حذف السند المالي بنجاح');
            loadData();
        } catch (error) {
            console.error(error);
            showError('فشل حذف السند المالي');
        }
        setConfirmConfig(null);
    };

    const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
    const currencySymbol = settings?.currency || 'IQD';

    const filteredVouchers = vouchers.filter(v => 
        (v.voucherNumber && v.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.description && v.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.partyName && v.partyName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal'] min-h-screen rounded-2xl animate-in fade-in duration-350" dir="rtl">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-sm">
                        <Wallet className="w-8 h-8 stroke-[2]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">الحسابات والخزينة</h1>
                        <p className="text-slate-500 font-bold text-sm mt-1">إدارة الورديات للخزينة، وسندات القبض والصرف المتصلة بالنظام</p>
                    </div>
                </div>
            </div>

            {/* Glass Tabs */}
            <div className="flex bg-white/60 backdrop-blur-md p-1 border border-indigo-150/40 rounded-2xl max-w-md">
                <button
                    onClick={() => setActiveTab('shifts')}
                    className={`flex-1 font-black py-2 rounded-xl transition-all text-xs flex justify-center items-center gap-1.5 cursor-pointer ${activeTab === 'shifts' ? 'bg-gradient-to-r from-emerald-500 to-teal-650 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Clock className="w-4 h-4"/> حركة الوردية (الخزينة)
                </button>
                <button
                    onClick={() => setActiveTab('vouchers')}
                    className={`flex-1 font-black py-2 rounded-xl transition-all text-xs flex justify-center items-center gap-1.5 cursor-pointer ${activeTab === 'vouchers' ? 'bg-gradient-to-r from-emerald-500 to-teal-650 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <FileSignature className="w-4 h-4"/> سندات الصرف والقبض
                </button>
            </div>

            {/* Shifts Tab Content */}
            {activeTab === 'shifts' && (
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-indigo-100/30 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-base font-black text-slate-800">تفاصيل الورديات المغلقة والنشطة</h2>
                        {shifts.some(s => s.status === 'open') ? (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-black flex items-center animate-pulse gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                وردية نشطة مفتوحة حالياً
                            </span>
                        ) : (
                            <button 
                                onClick={() => setIsOpenShiftModalOpen(true)} 
                                className="bg-gradient-to-br from-emerald-500 to-teal-650 hover:from-emerald-600 hover:to-teal-750 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/10 font-black text-xs transition-all cursor-pointer"
                            >
                                <Plus size={16} className="stroke-[2.5]" /> فتح وردية كاشير
                            </button>
                        )}
                    </div>
                    
                    {shifts.some(s => s.status === 'open') && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-indigo-50/40">
                            {(() => {
                                const activeShift = shifts.find(s => s.status === 'open');
                                if (!activeShift) return null;
                                return (
                                    <>
                                        <div className="flex flex-col justify-center">
                                            <p className="text-slate-500 font-bold text-[11px]">الكاشير الحالي (أوكراني ميكولا)</p>
                                            <h3 className="text-base font-black text-slate-800 mt-0.5">{activeShift.userName || 'ميكولا'}</h3>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <p className="text-slate-500 font-bold text-[11px]">الرصيد الافتتاحي</p>
                                            <h3 className="text-base font-black text-slate-800 mt-0.5">{activeShift.startCash?.toLocaleString() || 0} {currencySymbol}</h3>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <p className="text-emerald-600 font-bold text-[11px]">الكاش المقبوض</p>
                                            <h3 className="text-base font-black text-emerald-700 mt-0.5">{activeShift.cashSales?.toLocaleString() || 0} {currencySymbol}</h3>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <p className="text-indigo-600 font-bold text-[11px]">الفيزا والمحافظ</p>
                                            <h3 className="text-base font-black text-indigo-700 mt-0.5">{activeShift.cardSales?.toLocaleString() || 0} {currencySymbol}</h3>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    <div className="overflow-x-auto rounded-2xl border border-indigo-50/50">
                        <table className="w-full text-right border-collapse whitespace-nowrap">
                            <thead className="bg-slate-50/50 border-b border-indigo-50/50">
                                <tr>
                                    <th className="p-4 text-slate-500 font-black text-xs">التاريخ والمرجع</th>
                                    <th className="p-4 text-slate-500 font-black text-xs">الموظف / الكاشير</th>
                                    <th className="p-4 text-slate-500 font-black text-xs">الرصيد الافتتاحي</th>
                                    <th className="p-4 text-slate-500 font-black text-xs">المقبوضات</th>
                                    <th className="p-4 text-slate-500 font-black text-xs">المصروفات والسندات</th>
                                    <th className="p-4 text-slate-500 font-black text-xs">الرصيد الفعلي</th>
                                    <th className="p-4 text-slate-500 font-black text-xs">الحالة</th>
                                    <th className="p-4 text-slate-500 font-black text-xs text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-50/30">
                                {shifts.map((s) => {
                                    const vchs = vouchers.filter(v => v.shiftId === s.id);
                                    let shiftExpenses = s.shiftExpenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
                                    let voucherExpenses = vchs.filter(v => v.type === 'payment').reduce((acc, v) => acc + v.amount, 0);
                                    let totalOut = shiftExpenses + voucherExpenses;
                                    
                                    return (
                                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-black text-slate-800 text-xs">{new Date(s.startTime).toLocaleDateString('ar-EG')}</div>
                                                <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                                                    {new Date(s.startTime).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                                                    {s.endTime && ` - ${new Date(s.endTime).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}`}
                                                </div>
                                            </td>
                                            <td className="p-4 font-black text-emerald-750 text-xs">{s.userName || 'أولغا'}</td>
                                            <td className="p-4 font-black text-slate-700 text-xs">{(s.startCash || 0).toLocaleString()} {currencySymbol}</td>
                                            <td className="p-4">
                                                <div className="text-xs font-black text-slate-800"><span className="text-slate-400 font-bold">كاش:</span> {s.cashSales?.toLocaleString() || 0}</div>
                                                <div className="text-xs font-black text-slate-800 mt-1"><span className="text-slate-400 font-bold">فيزا:</span> {s.cardSales?.toLocaleString() || 0}</div>
                                            </td>
                                            <td className="p-4 font-black text-rose-600 text-xs">-{totalOut.toLocaleString()} {currencySymbol}</td>
                                            <td className="p-4">
                                                {s.status === 'closed' || s.status === 'pending_confirmation' ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-black text-slate-800 text-xs">{s.actualCash?.toLocaleString()} {currencySymbol}</span>
                                                        {(s.difference || 0) > 0 ? (
                                                            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full w-max">زيادة: {s.difference}</span>
                                                        ) : (s.difference || 0) < 0 ? (
                                                            <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full w-max">عجز: {Math.abs(s.difference || 0)}</span>
                                                        ) : (
                                                            <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full w-max font-bold">مطابق</span>
                                                        )}
                                                    </div>
                                                ) : <span className="text-[10px] text-slate-400 font-bold">نشط</span>}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 w-max
                                                    ${s.status === 'open' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : s.status === 'closed' ? 'bg-slate-55 text-slate-650 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-100'}
                                                `}>
                                                    {s.status === 'open' ? 'مفتوحة' : s.status === 'closed' ? 'مغلقة' : 'بانتظار التأكيد'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {s.status === 'open' && (
                                                    <button 
                                                        onClick={() => { setShiftToClose(s); setIsCloseShiftModalOpen(true); }} 
                                                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150 rounded-lg font-black text-[10px] transition-all cursor-pointer"
                                                    >
                                                        الإغلاق الأعمى (Blind Drop)
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {shifts.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center text-slate-500 font-black text-xs">لا يوجد ورديات مسجلة حالياً</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Vouchers Tab Content */}
            {activeTab === 'vouchers' && (
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-indigo-100/30 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 stroke-[2] w-4 h-4" />
                            <input 
                                type="text"
                                placeholder="بحث برقم السند، البيان، اسم المستلم..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-indigo-100/60 py-2.5 pr-9 pl-4 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-xs font-bold transition-all text-slate-800"
                            />
                        </div>
                        <button 
                            onClick={() => setIsVoucherModalOpen(true)} 
                            className="w-full sm:w-auto bg-gradient-to-br from-emerald-500 to-teal-650 hover:from-emerald-600 hover:to-teal-750 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 font-black text-xs transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" /> سند جديد (قبض / صرف)
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-indigo-50/50">
                        <table className="w-full text-right border-collapse whitespace-nowrap">
                            <thead className="bg-slate-50/50 border-b border-indigo-50/50">
                                <tr>
                                    <th className="p-4 text-slate-500 font-black text-xs">نوع السند ورقمه</th>
                                    <th className="p-4 text-slate-500 font-black text-xs">التاريخ</th>
                                    <th className="p-4 text-slate-500 font-black text-xs">المبلغ وطريقة الدفع</th>
                                    <th className="p-4 text-slate-500 font-black text-xs">البيان / السبب</th>
                                    <th className="p-4 text-slate-500 font-black text-xs">المستلم/المسدد والمطابقة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-50/30">
                                {filteredVouchers.map(v => (
                                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg border ${v.type === 'receipt' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {v.type === 'receipt' ? <TrendingUp className="w-4 h-4 stroke-[2]"/> : <TrendingDown className="w-4 h-4 stroke-[2]"/>}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-800 text-xs">{v.type === 'receipt' ? 'سند قبض' : 'سند صرف'}</div>
                                                    <div className="font-mono text-[10px] text-slate-400 font-bold mt-0.5">{v.voucherNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs font-black text-slate-600">
                                            {new Date(v.date).toLocaleDateString('ar-EG')}
                                        </td>
                                        <td className="p-4">
                                            <div className={`font-black text-sm ${v.type === 'receipt' ? 'text-indigo-600' : 'text-rose-600'}`}>
                                                {v.amount.toLocaleString()} {currencySymbol}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                                                {v.paymentMethod === 'cash' ? 'كاش' : v.paymentMethod === 'card' ? 'فيزا' : v.paymentMethod === 'cheque' ? 'شيك' : 'تحويل'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-700 max-w-xs truncate text-xs" title={v.description}>{v.description}</div>
                                            {v.category && <div className="text-[10px] text-indigo-400 font-black mt-0.5">{v.category}</div>}
                                        </td>
                                        <td className="p-4 font-black text-slate-800 text-xs">
                                            <div className="flex items-center justify-between w-full">
                                                <span>{v.partyName || '-'}</span>
                                                <button 
                                                    onClick={() => v.id && confirmDeleteVoucher(v.id)} 
                                                    className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-100 rounded-lg transition-colors cursor-pointer mr-2"
                                                >
                                                    <XCircle className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredVouchers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-500 font-black text-xs">لا توجد أي سندات مالية حالياً</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Voucher Modals */}
            <VoucherModal 
                isOpen={isVoucherModalOpen}
                onClose={() => setIsVoucherModalOpen(false)}
                onSave={handleSaveVoucher}
            />

            <OpenShiftModal 
                isOpen={isOpenShiftModalOpen}
                onClose={() => setIsOpenShiftModalOpen(false)}
                onSave={handleOpenShiftSubmit}
            />

            <CloseShiftModal 
                isOpen={isCloseShiftModalOpen}
                onClose={() => setIsCloseShiftModalOpen(false)}
                onSave={handleCloseShiftSubmit}
            />

            {confirmConfig && (
                <ConfirmModal 
                    isOpen={confirmConfig.isOpen}
                    title="حذف السند المالي"
                    message="هل أنت متأكد من حذف هذا السند المالي نهائياً؟ ستلغى قيود المحاسبة المتعلقة به فوراً."
                    onConfirm={handleDeleteVoucher}
                    onCancel={() => setConfirmConfig(null)}
                    confirmText="تأكيد الحذف"
                    cancelText="إلغاء"
                />
            )}
        </div>
    );
};

export default TicketFinancials;
