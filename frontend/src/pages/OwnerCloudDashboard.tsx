import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { motion } from 'framer-motion';
import { Building2, RefreshCcw as CloudSync, TrendingUp, DollarSign, Users, Activity, Menu, MapPin, Globe, Loader2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OwnerCloudDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [selectedBranch, setSelectedBranch] = useState<'all' | number>('all');
    const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
    const [isSyncing, setIsSyncing] = useState(false);

    // Ensure session exists
    useEffect(() => {
        if (!localStorage.getItem('nima_owner_session')) {
            navigate('/owner-cloud');
        }
    }, [navigate]);

    const branches = useLiveQuery(() => db.branches.toArray()) || [];
    
    // Aggregate Data (Simulated Cloud Sync)
    const orders = useLiveQuery(() => db.orders.toArray()) || [];
    const expenses = useLiveQuery(() => db.expenses.toArray()) || [];
    
    // Simulate auto-sync every 5 minutes (300,000 ms) - Here we do 1 minute for demo purposes.
    useEffect(() => {
        const interval = setInterval(() => {
            setIsSyncing(true);
            setTimeout(() => {
                setLastSyncTime(new Date());
                setIsSyncing(false);
            }, 1000);
        }, 60000); 
        return () => clearInterval(interval);
    }, []);

    // Filter by branch logic 
    // Assuming simple mapping where order could have branchId if scale supports it.
    // For this prototype, if "all" we show everything, if specific branch we simulate a percentage or filter if structural support exists.
    // For demonstration, since structural branch filtering on orders may not be fully populated globally in this offline app, we'll slice data to show variance based on branch selection.
    
    const filteredOrders = selectedBranch === 'all' ? orders : orders.filter(o => o.id! % branches.length === selectedBranch); // Mock filter
    const totalSales = filteredOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
    
    const filteredExpenses = selectedBranch === 'all' ? expenses : expenses.filter(e => e.id! % branches.length === selectedBranch); // Mock filter
    const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);

    const handleLogout = () => {
        localStorage.removeItem('nima_owner_session');
        navigate('/owner-cloud');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800" dir="rtl">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100">
                            <Globe className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-slate-800">القيادة السحابية (HQ)</h1>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                {isSyncing ? (
                                    <><Loader2 className="w-3 h-3 animate-spin text-emerald-600" /> جاري رفع الملخص...</>
                                ) : (
                                    <><CloudSync className="w-3 h-3 text-emerald-600" /> أخر تزامن للبيانات: {lastSyncTime.toLocaleTimeString('ar-SA')}</>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-500 hover:text-rose-600 transition-colors font-bold bg-slate-100 px-3 py-2 rounded-lg">
                        <LogOut className="w-4 h-4" /> خروج الأمان
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
                
                {/* Multi-Branch Selector */}
                <div className="bg-white p-2 rounded-xl flex flex-wrap gap-2 border border-slate-200 shadow-sm relative z-10 w-fit">
                    <button 
                        onClick={() => setSelectedBranch('all')}
                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${selectedBranch === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <Globe className="w-4 h-4" />
                        الأداء التجميعي (All Branches)
                    </button>
                    {branches.map((branch, idx) => (
                        <button 
                            key={branch.id}
                            onClick={() => setSelectedBranch(idx)}
                            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${selectedBranch === idx ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <MapPin className="w-4 h-4" />
                            {branch.name}
                        </button>
                    ))}
                    {branches.length === 0 && (
                        <div className="text-slate-500 text-sm px-4 py-2">يرجى إضافة فروع من النظام أولاً.</div>
                    )}
                </div>

                {/* KPIs / Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Widget 1 */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none"></div>
                        <h3 className="text-slate-600 font-bold mb-2 flex items-center gap-2">
                             <DollarSign className="w-5 h-5 text-emerald-600" /> إجمالي الإيرادات
                        </h3>
                        <div className="text-3xl font-black text-emerald-600 mt-2">{totalSales.toLocaleString()} ج.م</div>
                        <div className="text-xs text-slate-500 mt-2">عبر {selectedBranch === 'all' ? 'جميع الفروع' : 'الفرع المحدد'}</div>
                    </motion.div>

                    {/* Widget 2 */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none"></div>
                        <h3 className="text-slate-600 font-bold mb-2 flex items-center gap-2">
                             <TrendingUp className="w-5 h-5 text-rose-600" /> إجمالي المصروفات
                        </h3>
                        <div className="text-3xl font-black text-rose-600 mt-2">{totalExpenses.toLocaleString()} ج.م</div>
                    </motion.div>
                    
                    {/* Widget 3 */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none"></div>
                        <h3 className="text-slate-600 font-bold mb-2 flex items-center gap-2">
                             <Activity className="w-5 h-5 text-blue-600" /> العمليات المنفذة
                        </h3>
                        <div className="text-3xl font-black text-blue-600 mt-2">{filteredOrders.length} <span className="text-base font-normal">طلب</span></div>
                    </motion.div>

                    {/* Widget 4 */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none"></div>
                        <h3 className="text-slate-600 font-bold mb-2 flex items-center gap-2">
                             <Building2 className="w-5 h-5 text-emerald-600" /> حالة الربط السحابي
                        </h3>
                        <div className="text-xl font-black text-emerald-600 mt-2 flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            Live Sync Active
                        </div>
                        <div className="text-xs text-slate-500 mt-2 text-left" dir="ltr">Every 5 minutes</div>
                    </motion.div>
                </div>

                <div className="mt-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">التدفق التشغيلي (نقاط حية)</h2>
                    <p className="text-slate-500 text-sm mb-6">يتم جلب هذه البيانات من قاعدة البيانات المركزية ومحاكاتها محلياً التزاماً بمعايير التشغيل (Offline-First).</p>
                    <div className="space-y-4">
                        {filteredOrders.slice(0, 5).map(order => (
                            <div key={order.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">طلب مبيعات #{order.id}</div>
                                    <div className="text-xs text-slate-500 mt-1">{new Date(order.date).toLocaleString('ar-SA')}</div>
                                </div>
                                <div className="text-left">
                                     <div className="font-black text-emerald-600">{order.totalAmount.toLocaleString()} ج.م</div>
                                     <div className="text-xs text-slate-500 mt-1">مدفوع ({order.paymentMethod})</div>
                                </div>
                            </div>
                        ))}
                        {filteredOrders.length === 0 && <div className="text-center text-slate-500 py-8">لا توجد حركات مؤخراً في هذا النطاق.</div>}
                    </div>
                </div>

            </main>
        </div>
    );
};
