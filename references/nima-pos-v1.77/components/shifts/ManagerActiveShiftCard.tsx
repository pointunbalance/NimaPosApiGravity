import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Shift } from '../../types';
import { Clock, DollarSign, CreditCard, Wallet, FileText } from 'lucide-react';

interface ManagerActiveShiftCardProps {
    shift: Shift;
    formatCurrency: (amount: number) => string;
    formatDate: (date: Date) => string;
    onViewDetails: (shift: Shift) => void;
}

export const ManagerActiveShiftCard: React.FC<ManagerActiveShiftCardProps> = ({ shift, formatCurrency, formatDate, onViewDetails }) => {
    const stats = useLiveQuery(async () => {
        if (!shift || !shift.startTime) return { cashSales: 0, cardSales: 0, totalExpenses: 0 };
        
        try {
            const startDate = new Date(shift.startTime);
            
            // Simplified stats for dashboard
            let cash = 0;
            let card = 0;
            
            const allOrders = await db.orders.toArray();
            allOrders.forEach(o => {
                const orderDate = new Date(o.date);
                if (orderDate >= startDate) {
                    if (o.paymentMethod === 'split' && o.splitDetails) {
                        cash += o.splitDetails.cash;
                        card += o.splitDetails.card;
                    } else if (o.paymentMethod === 'cash') {
                        cash += o.totalAmount;
                    } else if (o.paymentMethod === 'card') {
                        card += o.totalAmount;
                    }
                }
            });
            
            const allExpenses = await db.expenses.toArray();
            const shiftExpenses = allExpenses.filter(e => new Date(e.date) >= startDate && (e.paymentMethod === 'cash' || !e.paymentMethod)).reduce((sum, e) => sum + e.amount, 0);
            
            const allCustomerPayments = await db.customerPayments.toArray();
            const customerPaymentsTotal = allCustomerPayments.filter(p => new Date(p.date) >= startDate).reduce((sum, p) => sum + p.amount, 0);
            
            const allLogs = await db.logs.toArray();
            const supplierRefundsTotal = allLogs.filter(l => new Date(l.date) >= startDate && l.type === 'refund' && l.action.includes('استرداد مالي من مورد')).reduce((sum, l) => sum + (l.amount || 0), 0);

            const installmentsTotal = (await db.installmentPayments.toArray()).filter(ip => ip.paidDate && ip.status === 'paid' && new Date(ip.paidDate) >= startDate).reduce((sum, ip) => sum + ip.amount + (ip.lateFeeApplied || 0), 0);
            
            return { 
                cashSales: cash + customerPaymentsTotal + installmentsTotal + supplierRefundsTotal, 
                cardSales: card, 
                totalExpenses: shiftExpenses 
            };
        } catch (e) {
            return { cashSales: 0, cardSales: 0, totalExpenses: 0 };
        }
    }, [shift.id, shift.startTime]);

    if (!stats) return <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-48"></div>;

    const drawerExpensesTotal = shift.shiftExpenses ? shift.shiftExpenses.reduce((sum, exp) => sum + exp.amount, 0) : 0;
    const expectedCash = (shift.startCash + stats.cashSales) - stats.totalExpenses - drawerExpensesTotal;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-100/80 overflow-hidden hover:shadow-md transition-all">
            <div className="bg-brand-50/30 flex items-center justify-between p-4 border-b border-brand-100/40">
                <span className="bg-brand-600 text-white px-3 py-1 rounded-full text-xs font-black font-mono shadow-sm">
                    وردية #{shift.id}
                </span>
                <span className="text-brand-750 font-black text-xs flex items-center gap-1.5 bg-brand-50/80 px-2.5 py-1 rounded-lg border border-brand-100/60 shadow-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    شغالة حالياً
                </span>
            </div>
            <div className="p-5 space-y-4">
                <div className="flex justify-between text-sm border-b border-slate-50 pb-2.5">
                    <span className="text-slate-400 text-xs font-medium">تاريخ الفتح:</span>
                    <span className="font-bold text-slate-700 text-xs">{formatDate(shift.startTime)}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/50 flex flex-col justify-between">
                        <span className="text-slate-500 text-[10px] font-black mb-1.5 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500"/> نقدية (كاش)
                        </span>
                        <span className="font-extrabold text-slate-800 text-base tracking-tight">{formatCurrency(stats.cashSales)}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/50 flex flex-col justify-between">
                        <span className="text-slate-500 text-[10px] font-black mb-1.5 flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-blue-500"/> بطاقة (شبكة)
                        </span>
                        <span className="font-extrabold text-slate-800 text-base tracking-tight">{formatCurrency(stats.cardSales)}</span>
                    </div>
                </div>

                <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
                    <div>
                        <span className="text-emerald-700 text-xs font-black flex items-center gap-1.5">
                            <Wallet className="w-4 h-4 text-emerald-600" />
                            النقدية المتوقعة في الدرج
                        </span>
                        <span className="font-black text-xl text-emerald-900 mt-1.5 block">
                            {formatCurrency(expectedCash)}
                        </span>
                    </div>
                </div>

                <div className="pt-2">
                    <button 
                         onClick={() => onViewDetails(shift)}
                         className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm shadow-brand-200 text-xs tracking-wide"
                    >
                        <FileText className="w-4 h-4" />
                        التفاصيل وإدارة الوردية
                    </button>
                </div>
            </div>
        </div>
    );
};
