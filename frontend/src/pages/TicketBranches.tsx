import React, { useState, useEffect } from 'react';
import { 
    Building2, Users, Wallet, CreditCard, Search, ArrowUpRight, 
    Briefcase, AlertTriangle, UserPlus, Clock, CheckCircle
} from 'lucide-react';
import { db } from '../db';
import { User, Branch, TicketBooking, Shift, Customer } from '../types';

const TicketBranches = () => {
    const [activeTab, setActiveTab] = useState<'agents' | 'creditCustomers'>('agents');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Data states
    const [users, setUsers] = useState<User[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [bookings, setBookings] = useState<TicketBooking[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [u, b, tb, s, c] = await Promise.all([
            db.users.toArray(),
            db.branches.toArray(),
            db.ticketBookings.toArray(),
            db.shifts.toArray(),
            db.customers.toArray()
        ]);
        
        setUsers(u);
        setBranches(b);
        setBookings(tb);
        setShifts(s);
        setCustomers(c);
    };

    const isToday = (dateString?: string | Date) => {
        if (!dateString) return false;
        const d = new Date(dateString);
        const today = new Date();
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    };

    const agentsList = users.filter(u => u.role === 'cashier' || u.role === 'agent' || u.name.includes('كاشير') || true); // Assuming active agents. Showing all for demo since standard schema lacks explicit 'agent' role.
    
    // Filter purely based on companyName presence or creditLimit existing (meaning they are corporate/credit clients)
    const creditCustomersList = customers.filter(c => c.companyName || c.creditLimit);

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-indigo-600" />
                        فروع المحل والمناديب
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">متابعة حسابات الكاشير، الفروع، وتسويات الشركات الآجلة والمحلية</p>
                </div>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6 overflow-x-auto w-full max-w-xl border border-slate-200">
                <button
                    onClick={() => setActiveTab('agents')}
                    className={`flex-1 min-w-[170px] font-bold py-2.5 rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'agents' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <Users className="w-4 h-4"/> حسابات الكاشير والمناديب
                </button>
                <button
                    onClick={() => setActiveTab('creditCustomers')}
                    className={`flex-1 min-w-[170px] font-bold py-2.5 rounded-lg transition-all text-sm flex justify-center items-center gap-2 ${activeTab === 'creditCustomers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    <Briefcase className="w-4 h-4"/> العملاء الآجلين / الشركات
                </button>
            </div>

            {activeTab === 'agents' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">نشاط مناديب الحجز لليوم</h2>
                    </div>
                    
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-right whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">اسم الموظف / الكاشير</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">الفرع</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">التذاكر التي باعها اليوم</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm text-indigo-600">إجمالي الكاش المتوفر في درجه</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">حالة الوردية</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {agentsList.map(user => {
                                    const userBranch = branches.find(b => b.id === user.branchId)?.name || 'الفرع الرئيسي';
                                    
                                    // Calculate today's tickets
                                    const todaysBookings = bookings.filter(b => 
                                        b.createdBy === user.name && 
                                        b.status !== 'cancelled' && 
                                        (b as any).createdAt && isToday((b as any).createdAt)
                                    );
                                    
                                    const ticketsSold = todaysBookings.reduce((sum, b) => sum + (b.passengers || 1), 0);
                                    
                                    // Get active shift
                                    const activeShift = shifts.find(s => s.userName === user.name && s.status === 'open');
                                    let drawerCash = 0;
                                    if (activeShift) {
                                        drawerCash = (activeShift.startCash || 0) + (activeShift.cashSales || 0); // Simplified calculation
                                    }

                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 font-black text-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-slate-100 p-2 rounded-full">
                                                        <UserPlus className="w-5 h-5 text-slate-500" />
                                                    </div>
                                                    {user.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-600">
                                                {userBranch}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="inline-flex items-center justify-center bg-indigo-50 text-indigo-700 font-black px-3 py-1 rounded-lg">
                                                    {ticketsSold} تذكرة
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-black text-indigo-600 text-lg">
                                                {activeShift ? drawerCash.toLocaleString() + ' ج.م' : '---'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {activeShift ? (
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-lg flex items-center gap-1 w-max">
                                                        <CheckCircle className="w-3 h-3"/> وردية نشطة
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 font-bold text-xs rounded-lg flex items-center gap-1 w-max">
                                                        <Clock className="w-3 h-3"/> مغلقة
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {agentsList.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold">لا يوجد كاشير أو مناديب مسجلين</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'creditCustomers' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input 
                                type="text"
                                placeholder="بحث عن شركة أو عميل آجل..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-right whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm">اسم الشركة/العميل</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm text-center">رصيد الحساب المديون (ج.م)</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm text-center">سقف الائتمان المسموح به</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm text-center">تاريخ آخر دفعة سداد</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-sm text-left">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {creditCustomersList
                                    .filter(c => c.companyName?.includes(searchTerm) || c.name.includes(searchTerm))
                                    .map(cust => {
                                        const isOverLimit = cust.creditLimit && cust.balance && cust.balance >= cust.creditLimit;
                                        return (
                                            <tr key={cust.id} className="hover:bg-slate-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-slate-800">{cust.companyName || cust.name}</div>
                                                    {cust.companyName && <div className="text-xs font-bold text-slate-500 mt-1">مسؤول التواصل: {cust.name}</div>}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className={`font-black text-lg ${cust.balance && cust.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                        {cust.balance?.toLocaleString() || 0} 
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-600">
                                                    {cust.creditLimit ? cust.creditLimit.toLocaleString() : 'مفتوح'}
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm font-bold text-slate-500">
                                                    {/* In a real app, you'd fetch from CustomerPayment table */}
                                                    --/--/----
                                                </td>
                                                <td className="px-6 py-4 text-left">
                                                    <div className="flex gap-2 justify-end">
                                                        {isOverLimit && (
                                                            <div className="bg-rose-100 text-rose-600 px-2 py-1.5 rounded-lg text-xs font-black flex items-center gap-1">
                                                                <AlertTriangle className="w-3 h-3"/> تجاوز السقف السموح
                                                            </div>
                                                        )}
                                                        <button className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-black hover:bg-indigo-600 hover:text-white transition">
                                                            تسجيل سداد
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                })}
                                {creditCustomersList.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold">لا يوجد شركات أو عملاء آجلين</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketBranches;
