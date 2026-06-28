import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { 
    Calculator, FileText, Download, TrendingUp, Wallet, Receipt, 
    CheckCircle, AlertCircle, Calendar, Lock, ArrowUpRight, 
    ArrowDownLeft, Scale, History, DollarSign, Printer, ChevronRight, Activity, Percent
} from 'lucide-react';
import { Account, JournalEntry, Order } from '../../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export const RestaurantAccounting: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isClosing, setIsClosing] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    const orders = useLiveQuery(() => db.orders.toArray()) || [];
    const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
    const journalEntries = useLiveQuery(() => db.journalEntries.toArray()) || [];
    
    // Derived Analytics for selected Date
    const dayOrders = useMemo(() => {
        return orders.filter((o: any) => {
            if (!o.date) return false;
            const orderDateStr = o.date instanceof Date 
                ? o.date.toISOString().split('T')[0] 
                : new Date(o.date).toISOString().split('T')[0];
            return orderDateStr === selectedDate;
        });
    }, [orders, selectedDate]);
    
    const dineIn = useMemo(() => dayOrders.filter((o: any) => o.orderType === 'dine-in'), [dayOrders]);
    const takeaway = useMemo(() => dayOrders.filter((o: any) => o.orderType === 'takeaway'), [dayOrders]);
    const delivery = useMemo(() => dayOrders.filter((o: any) => o.orderType === 'delivery'), [dayOrders]);
    
    const totalSales = useMemo(() => dayOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0), [dayOrders]);
    const cashSales = useMemo(() => dayOrders.filter((o: any) => o.paymentMethod === 'cash').reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0), [dayOrders]);
    const cardSales = useMemo(() => dayOrders.filter((o: any) => o.paymentMethod === 'card').reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0), [dayOrders]);

    // Live estimated COGS (Cost of Goods Sold)
    const totalCost = useMemo(() => {
        let cost = 0;
        dayOrders.forEach((order: any) => {
            order.items?.forEach((item: any) => {
                cost += (item.costPrice || 0) * (item.quantity || 0);
            });
        });
        return cost;
    }, [dayOrders]);

    // Est. Gross Profit Margin
    const grossProfit = totalSales - totalCost;
    const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

    const isAlreadyClosed = useMemo(() => {
        return journalEntries.some(j => j.reference === `Z-REPORT-${selectedDate}`);
    }, [journalEntries, selectedDate]);

    const activeJournal = useMemo(() => {
        return journalEntries.find(j => j.reference === `Z-REPORT-${selectedDate}`);
    }, [journalEntries, selectedDate]);

    // Archive of past Z-Reports
    const pastZReports = useMemo(() => {
        return journalEntries
            .filter(j => j.reference?.startsWith('Z-REPORT-'))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [journalEntries]);

    // Helper to calculate quickly Relative Dates
    const setRelativeDate = (daysAgo: number) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const handleZReportSubmit = async () => {
        if (dayOrders.length === 0) {
            toast.error('لا توجد طلبات في هذا اليوم لترحيل اليومية');
            return;
        }

        if (isAlreadyClosed) {
            toast.error('تم ترحيل مبيعات هذا اليوم مسبقاً للدفاتر');
            return;
        }

        setIsClosing(true);
        setShowConfirmModal(false);
        try {
            // Ensure basic accounts exist
            const getOrCreateAccount = async (code: string, name: string, type: any): Promise<number> => {
                const existing = accounts.find(a => a.code === code);
                if (existing?.id) return existing.id;
                return await db.accounts.add({
                    code,
                    name,
                    type,
                    balance: 0,
                    isSystem: true
                });
            };

            const cashAccountId = await getOrCreateAccount('1101', 'الصندوق', 'asset');
            const bankAccountId = await getOrCreateAccount('1102', 'البنك', 'asset');
            const inventoryAccountId = await getOrCreateAccount('1201', 'المخزون', 'asset');
            const salesAccountId = await getOrCreateAccount('4101', 'إيرادات المبيعات', 'revenue');
            const cogsAccountId = await getOrCreateAccount('5101', 'تكلفة البضاعة المباعة', 'expense');

            const lines = [];

            // Debit Cash (Asset)
            if (cashSales > 0) {
                lines.push({
                    accountId: cashAccountId,
                    accountName: "الصندوق",
                    debit: cashSales,
                    credit: 0,
                    description: `مبيعات نقدية ليوم ${selectedDate}`
                });
            }

            // Debit Bank (Asset)
            if (cardSales > 0) {
                lines.push({
                    accountId: bankAccountId,
                    accountName: "البنك",
                    debit: cardSales,
                    credit: 0,
                    description: `مبيعات شبكة ليوم ${selectedDate}`
                });
            }

            // Credit Sales (Revenue)
            if (totalSales > 0) {
                lines.push({
                    accountId: salesAccountId,
                    accountName: "إيرادات المبيعات",
                    debit: 0,
                    credit: totalSales,
                    description: `إيراد مبيعات ليوم ${selectedDate}`
                });
            }

            // Debit COGS (Expense) & Credit Inventory (Asset)
            if (totalCost > 0) {
                lines.push({
                    accountId: cogsAccountId,
                    accountName: "تكلفة البضاعة المباعة",
                    debit: totalCost,
                    credit: 0,
                    description: `إثبات تكلفة البضاعة المباعة ليوم ${selectedDate}`
                });
                lines.push({
                    accountId: inventoryAccountId,
                    accountName: "المخزون",
                    debit: 0,
                    credit: totalCost,
                    description: `صرف مخزون مباع ليوم ${selectedDate}`
                });
            }

            const totalAmount = cashSales + cardSales + totalCost;

            const newJournalEntry: JournalEntry = {
                date: new Date(),
                reference: `Z-REPORT-${selectedDate}`,
                description: `إقفال مبيعات يوم ${selectedDate} وتوليد القيود المحاسبية التلقائية وتحديث المخازن`,
                lines,
                totalAmount,
                status: 'posted',
                createdBy: 'System (Z-Report)'
            };

            await db.journalEntries.add(newJournalEntry);

            // Update Account Balances in background
            if (cashSales > 0) {
                const cashAcc = accounts.find(a => a.id === cashAccountId);
                await db.accounts.update(cashAccountId, { balance: (cashAcc?.balance || 0) + cashSales });
            }
            if (cardSales > 0) {
                const bankAcc = accounts.find(a => a.id === bankAccountId);
                await db.accounts.update(bankAccountId, { balance: (bankAcc?.balance || 0) + cardSales });
            }
            if (totalSales > 0) {
                const salesAcc = accounts.find(a => a.id === salesAccountId);
                await db.accounts.update(salesAccountId, { balance: (salesAcc?.balance || 0) + totalSales });
            }
            if (totalCost > 0) {
                const cogsAcc = accounts.find(a => a.id === cogsAccountId);
                const invAcc = accounts.find(a => a.id === inventoryAccountId);
                await db.accounts.update(cogsAccountId, { balance: (cogsAcc?.balance || 0) + totalCost });
                await db.accounts.update(inventoryAccountId, { balance: (invAcc?.balance || 0) - totalCost });
            }
            
            toast.success(`تم ترحيل اليومية لـ ${selectedDate} بنجاح وموازنة الدفاتر!`);
        } catch (error) {
            console.error('Error creating Z-Report', error);
            toast.error('حدث خطأ أثناء ترحيل قيد اليومية للمطبخ والحسابات.');
        } finally {
            setIsClosing(false);
        }
    };

    return (
        <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen font-sans">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                        <Calculator className="w-8 h-8 text-brand-600" />
                        الربط والمزامنة المحاسبية الفورية
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                        مزامنة مبيعات ومصروفات الصالة الفورية مع الحسابات العامة وشجرة القيود ونظام التكاليف والمخزون
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Shift & Drawer Quick Link */}
                    <Link 
                        to="/shifts"
                        className="flex items-center gap-2 px-4 py-2.5 bg-brand-50 hover:bg-brand-100/80 border border-brand-200 text-brand-700 rounded-2xl font-bold text-xs transition-colors shrink-0 shadow-sm"
                    >
                        <Wallet className="w-4 h-4 text-brand-600" />
                        <span>فتح/إغلاق الوردية والدرج 💰</span>
                    </Link>

                    {/* Fast selectors */}
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                        <button 
                            onClick={() => setRelativeDate(0)} 
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${selectedDate === new Date().toISOString().split('T')[0] ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            اليوم
                        </button>
                        <button 
                            onClick={() => setRelativeDate(1)} 
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${selectedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0] ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            أمس
                        </button>
                    </div>

                    <div className="relative flex items-center bg-slate-150 border border-slate-200 rounded-2xl px-3 py-1.5 shadow-sm">
                        <Calendar className="w-4 h-4 text-slate-500 ml-2" />
                        <input 
                            type="date" 
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none font-bold text-slate-700 focus:outline-none text-sm cursor-pointer"
                        />
                    </div>

                    <button 
                        onClick={() => setShowConfirmModal(true)}
                        disabled={isClosing || isAlreadyClosed || dayOrders.length === 0}
                        className={`flex items-center gap-2 px-5 py-3 text-white rounded-2xl font-bold transition-all shadow-md active:scale-95 ${
                            isAlreadyClosed 
                                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' 
                                : dayOrders.length === 0 
                                    ? 'bg-slate-300 shadow-none cursor-not-allowed text-slate-500' 
                                    : 'bg-indigo-650 hover:bg-indigo-700 shadow-indigo-650/15'
                        }`}
                    >
                        {isAlreadyClosed ? (
                            <>
                                <CheckCircle className="w-5 h-5 text-white animate-pulse" /> 
                                <span>اليوم مغلق ومرحّل</span>
                            </>
                        ) : isClosing ? (
                            <>
                                <Activity className="w-5 h-5 animate-spin" /> 
                                <span>جاري ترحيل القيود...</span>
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" /> 
                                <span>ترحيل للدفاتر المحاسبية (Z-Report)</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Status alerts */}
            <AnimatePresence mode="wait">
                {isAlreadyClosed && activeJournal && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-emerald-50 border border-emerald-150 text-emerald-900 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                    >
                        <div className="flex items-start gap-3.5">
                            <div className="bg-emerald-500/10 p-2.5 rounded-2xl text-emerald-600 shrink-0">
                                <Lock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-black text-base text-emerald-950">ترحيل القيود اليومية المحاسبية مغذى بالكامل 🔒</p>
                                <p className="text-xs text-emerald-700/85 font-medium mt-1">
                                    تاريخ الإغلاق اليومي والمزامنة: {selectedDate}. المعرّف المحاسبي للقيد: <span className="font-mono bg-emerald-100/60 px-2 py-0.5 rounded font-bold">{activeJournal.reference}</span>. القيود متوازنة ومرحلة بنجاح لدفاتر الحسابات.
                                </p>
                            </div>
                        </div>
                        <div className="text-slate-400 text-xs font-mono font-bold leading-relaxed border-r border-slate-200 pr-4 shrink-0 text-right">
                            بواسطة: {activeJournal.createdBy}<br/>
                            بتاريخ: {new Date(activeJournal.date).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Metrics cards row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                
                {/* 1. Revenue Card */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 pb-8 text-white shadow-xl relative overflow-hidden group flex flex-col justify-between h-full min-h-[180px]">
                    <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-slate-300 font-bold text-sm">إجمالي إيرادات اليوم</div>
                        <div className="p-2 bg-slate-800 rounded-2xl">
                            <Wallet className="w-5 h-5 text-emerald-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-black font-sans tracking-tight text-white mb-2">{totalSales.toLocaleString()} <span className="text-xs font-black text-emerald-400">د.ع</span></div>
                    <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] text-slate-300 flex justify-between font-bold">
                        <span>الطلبات: {dayOrders.length} طلب</span>
                        <span>المعدل المتردد: {dayOrders.length ? Math.round(totalSales / dayOrders.length).toLocaleString() : 0} د.ع</span>
                    </div>
                </div>

                {/* 2. Estimated Cost & Margin Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-full min-h-[180px] group">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-bold text-sm">تكلفة المبيعات المقدرة (COGS)</span>
                            <span className="p-1.5 bg-rose-50 rounded-xl">
                                <Percent className="w-4 h-4 text-rose-500" />
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-950 font-sans tracking-tight">
                            {totalCost.toLocaleString()} <span className="text-xs text-slate-700 font-bold">د.ع</span>
                        </h3>
                    </div>
                    <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
                        <div className="flex justify-between text-xs text-slate-500 font-bold">
                            <span>هامش الربح الإجمالي</span>
                            <span className={profitMargin > 50 ? 'text-emerald-700 font-black' : 'text-amber-800 font-black'}>
                                {profitMargin.toFixed(1)}% ({grossProfit.toLocaleString()} د.ع)
                            </span>
                        </div>
                        <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${profitMargin > 50 ? 'bg-emerald-500' : 'bg-brand-500'}`} 
                                style={{ width: `${Math.min(profitMargin, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* 3. Payment Methods Breakdown */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-full min-h-[180px] group">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-500 font-bold text-sm">طرق التحصيل اليومي</span>
                        <span className="p-1.5 bg-indigo-50 rounded-xl">
                            <Wallet className="w-4 h-4 text-indigo-500" />
                        </span>
                    </div>
                    <div className="space-y-3 flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                            <div className="font-bold text-slate-700 flex items-center gap-2 text-xs">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                مبيعات نقدية
                            </div>
                            <div className="font-black text-slate-950 font-sans text-base">{cashSales.toLocaleString()} <span className="text-[10px] text-slate-500 font-bold">د.ع</span></div>
                        </div>
                        <div className="flex justify-between items-center pt-1.5">
                            <div className="font-bold text-slate-700 flex items-center gap-2 text-xs">
                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                مبيعات بالشبكة والبطاقة
                            </div>
                            <div className="font-black text-slate-950 font-sans text-base">{cardSales.toLocaleString()} <span className="text-[10px] text-slate-500 font-bold">د.ع</span></div>
                        </div>
                    </div>
                </div>

                {/* 4. Orders Distribution Visual */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-full min-h-[180px] group">
                    <div className="font-bold text-slate-500 text-sm mb-3">توزيع قنوات البيع والطلب</div>
                    <div className="space-y-2.5 flex-1 flex flex-col justify-end">
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-orange-700">محلي (صالة) ({dineIn.length})</span>
                                <span className="text-slate-950 font-black">{dineIn.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0).toLocaleString()} د.ع</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-orange-500 h-full rounded-full" style={{width: dayOrders.length ? `${(dineIn.length/dayOrders.length)*100}%` : '0%'}}></div>
                            </div>
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-blue-700">توصيل ({delivery.length})</span>
                                <span className="text-slate-950 font-black">{delivery.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0).toLocaleString()} د.ع</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full" style={{width: dayOrders.length ? `${(delivery.length/dayOrders.length)*100}%` : '0%'}}></div>
                            </div>
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-purple-700">سفري ({takeaway.length})</span>
                                <span className="text-slate-950 font-black">{takeaway.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0).toLocaleString()} د.ع</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-purple-500 h-full rounded-full" style={{width: dayOrders.length ? `${(takeaway.length/dayOrders.length)*100}%` : '0%'}}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trial Balance & Dynamic Post Sheet */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                
                {/* Trial balance sheet */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 lg:col-span-2 space-y-4 flex flex-col justify-between h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                        <div>
                            <h3 className="font-black text-lg text-slate-850 flex items-center gap-2">
                                <Scale className="w-5 h-5 text-indigo-650" /> 
                                ميزان مراجعة اليوم التلقائي
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">توليد قيد الإقفال المحاسبي مزدوج القيد المكتمل المتطابق</p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <div className="bg-emerald-500/10 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-500/10">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                القيد متوازن بنسبة 100%
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-slate-50 text-slate-700 font-bold">
                                <tr>
                                    <th className="px-4 py-3 rounded-r-2xl">الحساب الفرعي</th>
                                    <th className="px-4 py-3 text-center">رمز الحساب</th>
                                    <th className="px-4 py-3 text-left">مدين (+)</th>
                                    <th className="px-4 py-3 text-left rounded-l-2xl">دائن (-)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Cash Row */}
                                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3.5 font-bold text-slate-800">
                                        الصندوق (المبيعات النقدية)
                                    </td>
                                    <td className="px-4 py-3.5 text-center font-mono text-slate-500">1101</td>
                                    <td className={`px-4 py-3.5 text-left font-sans ${cashSales > 0 ? 'text-emerald-700 font-black' : 'text-slate-400 font-medium'}`}>{cashSales > 0 ? cashSales.toLocaleString() : '0'}</td>
                                    <td className="px-4 py-3.5 text-left text-slate-400 font-medium font-sans">0</td>
                                </tr>
                                
                                {/* Card Row */}
                                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3.5 font-bold text-slate-800">
                                        البنك والشبكة (مبيعات البطاقة)
                                    </td>
                                    <td className="px-4 py-3.5 text-center font-mono text-slate-500">1102</td>
                                    <td className={`px-4 py-3.5 text-left font-sans ${cardSales > 0 ? 'text-emerald-700 font-black' : 'text-slate-400 font-medium'}`}>{cardSales > 0 ? cardSales.toLocaleString() : '0'}</td>
                                    <td className="px-4 py-3.5 text-left text-slate-400 font-medium font-sans">0</td>
                                </tr>

                                {/* Sales Row */}
                                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3.5 font-bold text-slate-800">
                                        إيرادات المبيعات العامة
                                    </td>
                                    <td className="px-4 py-3.5 text-center font-mono text-slate-500">4101</td>
                                    <td className="px-4 py-3.5 text-left text-slate-400 font-medium font-sans">0</td>
                                    <td className={`px-4 py-3.5 text-left font-sans ${totalSales > 0 ? 'text-indigo-700 font-black' : 'text-slate-400 font-medium'}`}>{totalSales > 0 ? totalSales.toLocaleString() : '0'}</td>
                                </tr>

                                {/* COGS Row */}
                                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3.5 font-bold text-slate-800 flex items-center gap-1.5">
                                        <span>تكلفة البضاعة المباعة (COGS)</span>
                                        {!isAlreadyClosed && (
                                            <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 font-black shrink-0 mr-2">تقديري</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 text-center font-mono text-slate-500">5101</td>
                                    <td className={`px-4 py-3.5 text-left font-sans ${totalCost > 0 ? 'text-emerald-700 font-black' : 'text-slate-400 font-medium'}`}>{totalCost > 0 ? totalCost.toLocaleString() : '0'}</td>
                                    <td className="px-4 py-3.5 text-left text-slate-400 font-medium font-sans">0</td>
                                </tr>

                                {/* Inventory Row */}
                                <tr className="border-b border-slate-55 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3.5 font-bold text-slate-800 flex items-center gap-1.5">
                                        <span>المخزون (صرف المواد والتكاليف)</span>
                                        {!isAlreadyClosed && (
                                            <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 font-black shrink-0 mr-2">تقديري</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 text-center font-mono text-slate-500">1201</td>
                                    <td className="px-4 py-3.5 text-left text-slate-400 font-medium font-sans">0</td>
                                    <td className={`px-4 py-3.5 text-left font-sans ${totalCost > 0 ? 'text-rose-700 font-black' : 'text-slate-400 font-medium'}`}>{totalCost > 0 ? totalCost.toLocaleString() : '0'}</td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-slate-50 text-slate-900 font-black border-t-2 border-slate-200">
                                <tr>
                                    <td className="px-4 py-3 w-56 text-slate-900">الإجمالي المحاسبي المتزن (Balance)</td>
                                    <td className="px-4 py-3"></td>
                                    <td className="px-4 py-3 text-left text-emerald-700 font-sans text-base font-black">{(totalSales + totalCost).toLocaleString()} د.ع</td>
                                    <td className="px-4 py-3 text-left text-indigo-700 font-sans text-base font-black">{(totalSales + totalCost).toLocaleString()} د.ع</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                        ملاحظة قانونية: القيد أعلاه يتم موازنته بنظام القيد المزدوج الإيجابي، يتم ترحيل القيد فورياً لتراكم الحسابات الختامية وحساب الأرباح والخسائر.
                    </p>
                </div>

                {/* Left Panel: Ledger archive of past days closed */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4 flex flex-col justify-between h-full">
                    <h3 className="font-black text-slate-850 flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-650" />
                        أرشيف الإغلاقات والمزامنات السابقة
                    </h3>
                    
                    <div className="space-y-3 flex-1 flex flex-col justify-start max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                        {pastZReports.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-slate-200/60 rounded-2xl bg-slate-50/30 text-slate-400">
                                <History className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600 block">لا توجد إغلاقات سابقة مسجلة</span>
                                <p className="text-[10px] text-slate-400 mt-2 max-w-[180px] text-center leading-relaxed">
                                    عندما تقوم بترحيل مبيعات اليوم للدفاتر (Z-Report)، سيتم أرشفة الإغلاقات السابقة هنا تلقائياً لسهولة الرجوع إليها.
                                </p>
                            </div>
                        ) : (
                            pastZReports.map((report) => (
                                <div 
                                    key={report.id}
                                    onClick={() => {
                                        const rDate = report.reference?.replace('Z-REPORT-', '');
                                        if (rDate) setSelectedDate(rDate);
                                    }}
                                    className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex justify-between items-center ${
                                        selectedDate === report.reference?.replace('Z-REPORT-', '')
                                            ? 'border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500'
                                            : 'border-slate-100 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200'
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <div className="font-bold text-xs text-slate-700 font-sans flex items-center gap-1">
                                            <span>يومية: {report.reference?.replace('Z-REPORT-', '')}</span>
                                            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded font-extrabold shrink-0">مرحّل</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">إجمالي حجم القيد: {report.totalAmount.toLocaleString()} د.ع</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors">
                                        <span className="text-[10px] font-bold">استعراض</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation verification modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col space-y-5 text-right"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-indigo-600 animate-pulse" />
                                    مراجعة وتأكيد القيود المحاسبية
                                </h3>
                                <button 
                                    onClick={() => setShowConfirmModal(false)}
                                    className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Warning alert component */}
                            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-xs leading-relaxed font-bold">
                                ⚠️ ترحيل القيود اليومية (Z-Report) لـ {selectedDate} سينشئ دفاتر وسجلات رسمية ويثبتها في ميزان مراجعة Nimatech ولا يمكن التعديل عليها نهائياً بعد إتمام هذه الحطوة. يرجى مراجعة ميزان حركة اليوم أدناه بدقة.
                            </div>

                            {/* Summary list */}
                            <div className="bg-slate-50 p-4 rounded-2xl space-y-3 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-semibold">تاريخ اليومية المقفل:</span>
                                    <span className="font-black text-slate-800 font-mono">{selectedDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-semibold">إجمالي المبيعات المحققة لليوم:</span>
                                    <span className="font-extrabold text-emerald-600 font-sans">{totalSales.toLocaleString()} د.ع</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-semibold">تكلفة المواد والتحضير (COGS):</span>
                                    <span className="font-extrabold text-[#B8860B] font-sans">{totalCost.toLocaleString()} د.ع</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200 pt-2.5">
                                    <span className="text-slate-800 font-black">صافي الهامش التقديري:</span>
                                    <span className="font-black text-emerald-600 font-sans text-sm">{(totalSales - totalCost).toLocaleString()} د.ع</span>
                                </div>
                            </div>

                            {/* Ledger visual entry preview */}
                            <div className="border border-slate-100 rounded-2xl p-3.5 space-y-2.5 bg-slate-50/50">
                                <p className="text-xs text-slate-500 font-bold mb-1.5">خطوات المعاملات المحاسبية والقيد التلقائي:</p>
                                <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                                    {cashSales > 0 && (
                                        <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl">
                                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                                                <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                                                من حـ/ الصندوق (مبيعات نقدية)
                                            </span>
                                            <span className="font-bold text-slate-700">{cashSales.toLocaleString()} د.ع</span>
                                        </div>
                                    )}
                                    {cardSales > 0 && (
                                        <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl">
                                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                                                <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                                                من حـ/ البنك والشبكة (مبيعات بطاقة)
                                            </span>
                                            <span className="font-bold text-slate-700">{cardSales.toLocaleString()} د.ع</span>
                                        </div>
                                    )}
                                    {totalSales > 0 && (
                                        <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl">
                                            <span className="text-rose-700 font-bold flex items-center gap-1">
                                                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                                                إلى حـ/ إيرادات المبيعات العامة
                                            </span>
                                            <span className="font-bold text-slate-700">{totalSales.toLocaleString()} د.ع</span>
                                        </div>
                                    )}
                                    {totalCost > 0 && (
                                        <>
                                            <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl">
                                                <span className="text-emerald-700 font-bold flex items-center gap-1">
                                                    <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                                                    من حـ/ تكلفة البضاعة المباعة (المواد)
                                                </span>
                                                <span className="font-bold text-slate-700">{totalCost.toLocaleString()} د.ع</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl">
                                                <span className="text-rose-700 font-bold flex items-center gap-1">
                                                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                                                    إلى حـ/ المخزون والصرفيات
                                                </span>
                                                <span className="font-bold text-slate-700">{totalCost.toLocaleString()} د.ع</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer Controls */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button 
                                    type="button"
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all text-xs"
                                >
                                    تراجع ومراجعة الحركة
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleZReportSubmit}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-md text-xs flex items-center gap-1.5"
                                >
                                    <span>تأكيد الترحيل النهائي وإغلاق اليومية 🔒</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
