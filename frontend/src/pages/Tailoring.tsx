import { AccountingEngine } from '../services/AccountingEngine';
import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { TailoringOrder, TailoringStatus, Customer } from '../types';
import { 
  Scissors, Search, Plus, Calendar as CalendarIcon, 
  CheckCircle2, Clock, Ruler, Shirt, AlertTriangle, List, MessagesSquare, Check, RotateCcw, MessageCircle, Edit, Trash2, Phone, DollarSign
} from 'lucide-react';
import TailoringOrderModal from '../components/tailoring/TailoringOrderModal';
import TailoringCalendar from '../components/tailoring/TailoringCalendar';

const formatCurrency = (amount: number, currencyCode = 'SAR') => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: currencyCode }).format(amount);
};

const Tailoring: React.FC = () => {
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<TailoringStatus | 'all'>('all');
    
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<TailoringOrder | null>(null);

    const tailoringOrders = useLiveQuery(() => db.tailoringOrders?.reverse().toArray()) || [];
    const customers = useLiveQuery(() => db.customers.toArray()) || [];

    const filteredOrders = useMemo(() => {
        if (!tailoringOrders) return [];
        return tailoringOrders.filter(o => {
            const matchesSearch = 
                o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (typeof o.id === 'number' && o.id.toString().includes(searchTerm));
            const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [tailoringOrders, searchTerm, filterStatus]);

    const stats = useMemo(() => {
        if (!tailoringOrders) return { active: 0, pendingDelivery: 0, completed: 0, upcomingFittings: 0 };
        return {
            active: tailoringOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length,
            pendingDelivery: tailoringOrders.filter(o => o.status === 'ready_for_delivery').length,
            completed: tailoringOrders.filter(o => o.status === 'delivered').length,
            upcomingFittings: tailoringOrders.flatMap(o => o.fittings || []).filter(f => f.status === 'scheduled').length
        };
    }, [tailoringOrders]);

    const getStatusLabel = (status: TailoringStatus) => {
        switch(status) {
            case 'fabric_selection': return 'اختيار القماش';
            case 'cutting': return 'القص';
            case 'first_fitting': return 'البروفة الأولى';
            case 'finishing': return 'التشطيب';
            case 'ready_for_delivery': return 'جاهز للتسليم';
            case 'delivered': return 'تم التسليم';
            case 'cancelled': return 'ملغي';
            default: return status;
        }
    };

    const getStatusColor = (status: TailoringStatus) => {
        switch(status) {
            case 'fabric_selection': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'cutting': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'first_fitting': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'finishing': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'ready_for_delivery': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            case 'delivered': return 'bg-slate-100 text-slate-800 border-slate-200';
            case 'cancelled': return 'bg-red-50 text-red-800 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const openOrderModal = (order?: TailoringOrder) => {
        setEditingOrder(order || null);
        setIsOrderModalOpen(true);
    };

    const updateOrderStatus = async (id: number, status: TailoringStatus) => {
        try {
            await (db as any).transaction('rw', db.tailoringOrders, db.shifts, db.journalEntries, db.accounts, async () => {
                const order = await db.tailoringOrders.get(id);
                if (!order) return;

                if (status === 'delivered' && order.status !== 'delivered') {
                    const remainingAmount = order.price - (order.deposit || 0);

                    if (remainingAmount > 0) {
                        const openShift = await db.shifts.where('status').equals('open').first();
                        if (openShift) {
                            await db.shifts.update(openShift.id!, {
                                expectedCash: openShift.expectedCash + remainingAmount,
                                cashSales: openShift.cashSales + remainingAmount
                            });
                        }
                    }

                    // Accounting Entry for receiving the rest
                    try {
                        const cashAccount = await db.accounts.where('code').equals('1010').first(); // النقدية
                        const arAccount = await db.accounts.where('code').equals('1030').first(); // ذمم مدينة
                        
                        if (remainingAmount > 0 && cashAccount && arAccount) {
                            await AccountingEngine.postEntry({
                                date: new Date(),
                                reference: `TLR-DEL-${id}`,
                                description: `استلام باقي مبلغ طلب تفصيل للعميل ${order.customerName}`,
                                lines: [
                                    { accountId: cashAccount.id!, accountName: cashAccount.name, debit: remainingAmount, credit: 0, description: `استلام نقدي باقي مستحق` },
                                    { accountId: arAccount.id!, accountName: arAccount.name, debit: 0, credit: remainingAmount, description: `سداد ذمم مدينة` }
                                ],
                                });
                        }
                    } catch (err) {
                         console.error("Failed to post automatic journal entry for tailoring delivery:", err);
                    }
                }
                await db.tailoringOrders.update(id, { status });
            });
        } catch (e) {
            console.error(e);
        }
    };

    const deleteOrder = async (id: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) {
            await db.tailoringOrders.delete(id);
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-6 max-h-screen overflow-hidden flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-inner">
                            <Scissors className="w-6 h-6 text-indigo-600" />
                        </div>
                        إدارة طلبات التفصيل
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">إدارة ومتابعة طلبات الخياطة، مواعيد البروفات، والتسليم.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <button 
                        onClick={() => openOrderModal()} 
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all font-bold whitespace-nowrap hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" /> طلب تفصيل جديد
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500"></div>
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100"><Scissors className="w-6 h-6" /></div>
                    <div><p className="text-sm text-slate-500 font-bold mb-1">نشط (قيد العمل)</p><h3 className="text-2xl font-black text-slate-800">{stats.active}</h3></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100"><CheckCircle2 className="w-6 h-6" /></div>
                    <div><p className="text-sm text-slate-500 font-bold mb-1">جاهز للتسليم</p><h3 className="text-2xl font-black text-slate-800">{stats.pendingDelivery}</h3></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 border border-amber-100"><CalendarIcon className="w-6 h-6" /></div>
                    <div><p className="text-sm text-slate-500 font-bold mb-1">مواعيد قادمة</p><h3 className="text-2xl font-black text-slate-800">{stats.upcomingFittings}</h3></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-slate-500"></div>
                    <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200"><Check className="w-6 h-6" /></div>
                    <div><p className="text-sm text-slate-500 font-bold mb-1">تم التسليم</p><h3 className="text-2xl font-black text-slate-800">{stats.completed}</h3></div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-4 shrink-0">
                 <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                        <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-bold text-sm ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title="قائمة الطلبات">
                            <List className="w-4 h-4"/>
                            <span className="hidden sm:inline">القائمة</span>
                        </button>
                        <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-bold text-sm ${viewMode === 'calendar' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title="التقويم (البروفات)">
                            <CalendarIcon className="w-4 h-4"/>
                            <span className="hidden sm:inline">التقويم (البروفات)</span>
                        </button>
                    </div>
                    {viewMode === 'list' && (
                        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                            {[
                                { id: 'all', label: 'الكل' },
                                { id: 'fabric_selection', label: 'اختيار قماش' },
                                { id: 'first_fitting', label: 'بروفة' },
                                { id: 'ready_for_delivery', label: 'جاهز' }
                            ].map(f => (
                                <button 
                                    key={f.id}
                                    onClick={() => setFilterStatus(f.id as any)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${filterStatus === f.id ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                            {filterStatus !== 'all' && !['fabric_selection', 'first_fitting', 'ready_for_delivery'].includes(filterStatus) && (
                                <button className="px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all bg-white shadow text-indigo-700">
                                    {getStatusLabel(filterStatus as TailoringStatus)}
                                </button>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="flex gap-2 w-full md:w-80 shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="بحث عن طلب..."
                            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-bold transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Content View */}
            <div className="flex-1 overflow-y-auto">
                {viewMode === 'list' ? (
                    <div className="space-y-4 pb-8">
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Scissors className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">لا توجد طلبات</h3>
                                <p className="text-slate-500">جرب البحث بكلمة مختلفة أو تغيير الفلتر</p>
                            </div>
                        ) : (
                            filteredOrders.map(order => (
                                <div key={order.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-md transition-all group">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                                        <div className="flex items-center gap-5 flex-1 w-full relative">
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border-2 ${getStatusColor(order.status).replace('bg-', 'bg-opacity-30 bg-')}`}>
                                                <Shirt className={`w-8 h-8 outline-none shadow-none text-current ${getStatusColor(order.status).split(' ')[1]}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-slate-800 text-lg sm:text-xl">{order.customerName}</h4>
                                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">#{order.id}</span>
                                                </div>
                                                <p className="text-sm text-slate-500 font-medium mb-2">
                                                    {order.fabricType && <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100 inline-block">القماش: {order.fabricType} ({order.fabricSource === 'store' ? 'من المحل' : 'خارجي'})</span>}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5 text-slate-400" /> <span className="font-medium text-slate-700">التسليم: {new Date(order.deliveryDate).toLocaleDateString('ar-EG', {month:'short', day:'numeric'})}</span></span>
                                                    <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-slate-400" /> <span className="font-medium text-slate-700 text-indigo-600 font-bold">{formatCurrency(order.price)}</span></span>
                                                    {order.deposit > 0 && <span className="flex items-center gap-1.5"><List className="w-3.5 h-3.5 text-slate-400" /> <span className="font-medium text-emerald-600 font-bold bg-emerald-50 px-2 rounded">مقدم: {formatCurrency(order.deposit)}</span></span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3 items-center md:items-end min-w-[200px] w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0">
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-xs font-bold text-slate-500 md:hidden block">حالة الطلب:</span>
                                                <select 
                                                    value={order.status}
                                                    onChange={(e) => updateOrderStatus(order.id!, e.target.value as TailoringStatus)}
                                                    className={`text-sm font-bold border rounded-xl px-3 py-1.5 outline-none appearance-none cursor-pointer transition-all ${getStatusColor(order.status)} hover:brightness-95 focus:ring-2`}
                                                    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'left 0.5rem center', backgroundSize: '1em', paddingLeft: '2rem' }}
                                                >
                                                    <option value="fabric_selection">اختيار القماش</option>
                                                    <option value="cutting">القص</option>
                                                    <option value="first_fitting">البروفة الأولى</option>
                                                    <option value="finishing">التشطيب</option>
                                                    <option value="ready_for_delivery">جاهز للتسليم</option>
                                                    <option value="delivered">تم التسليم</option>
                                                    <option value="cancelled">ملغي</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-2 w-full md:w-auto justify-end">
                                                {order.status === 'ready_for_delivery' && (
                                                    <button onClick={() => updateOrderStatus(order.id!, 'delivered')} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md shadow-emerald-200 flex items-center gap-2 transition-all hover:-translate-y-0.5">
                                                        <CheckCircle2 className="w-4 h-4" /> تسليم
                                                    </button>
                                                )}
                                                {customers.find(c => c.id === order.customerId)?.phone && (
                                                    <a href={`https://wa.me/${customers.find(c => c.id === order.customerId)?.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors border border-green-100" title="واتساب للعميل">
                                                        <MessageCircle className="w-5 h-5"/>
                                                    </a>
                                                )}
                                                <button onClick={() => openOrderModal(order)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100" title="تعديل وتفاصيل">
                                                    <Edit className="w-5 h-5"/>
                                                </button>
                                                <button onClick={() => deleteOrder(order.id!)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors border border-red-100" title="حذف">
                                                    <Trash2 className="w-5 h-5"/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <TailoringCalendar orders={tailoringOrders} />
                )}
            </div>

            {isOrderModalOpen && (
                <TailoringOrderModal
                    order={editingOrder || undefined}
                    onClose={() => setIsOrderModalOpen(false)}
                />
            )}
        </div>
    );
};

export default Tailoring;
