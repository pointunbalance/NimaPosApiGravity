import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { FileText, Download } from 'lucide-react';

const CollectionReport = () => {
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

    const users = useLiveQuery(() => db.users.toArray());
    
    // Aggregate data
    const reportData = useLiveQuery(async () => {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);

        // 1. Get shift closures
        const shifts = await db.shifts.filter(s => 
            s.status === 'closed' && 
            new Date(s.endTime!) >= from && 
            new Date(s.endTime!) <= to
        ).toArray();

        // 2. Get customer direct payments
        const payments = await db.customerPayments.filter(p => 
            new Date(p.date) >= from && 
            new Date(p.date) <= to
        ).toArray();

        // 3. Get installments
        const installments = await db.installmentPayments.filter(ip => 
            ip.status === 'paid' && 
            ip.paidDate !== undefined &&
            new Date(ip.paidDate) >= from && 
            new Date(ip.paidDate) <= to
        ).toArray();

        // Aggregate by user/employee
        return {
            totalShiftCash: shifts.reduce((sum, s) => sum + (s.actualCash || 0), 0),
            totalDirectPayments: payments.reduce((sum, p) => sum + p.amount, 0),
            totalInstallments: installments.reduce((sum, p) => sum + p.amount + (p.lateFeeApplied || 0), 0),
        };
    }, [dateFrom, dateTo]);

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="w-6 h-6 text-indigo-600" />
                    تقرير التحصيل اليومي
                </h1>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    طباعة / PDF
                </button>
            </div>

            <div className="flex gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <label className="block text-sm text-slate-600 mb-1">من تاريخ</label>
                    <input 
                        type="date" 
                        value={dateFrom} 
                        onChange={e => setDateFrom(e.target.value)} 
                        className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm text-slate-600 mb-1">إلى تاريخ</label>
                    <input 
                        type="date" 
                        value={dateTo} 
                        onChange={e => setDateTo(e.target.value)} 
                        className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-slate-500 mb-2">إجمالي النقدية المقفلة (عبر الورديات)</h3>
                    <p className="text-3xl font-black text-slate-800">{reportData?.totalShiftCash?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-slate-500 mb-2">إجمالي تحصيلات العملاء المباشرة</h3>
                    <p className="text-3xl font-black text-indigo-600">{reportData?.totalDirectPayments?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-slate-500 mb-2">إجمالي الأقساط المحصلة والغرامات</h3>
                    <p className="text-3xl font-black text-brand-600">{reportData?.totalInstallments?.toLocaleString() || 0}</p>
                </div>
            </div>
            
            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm leading-relaxed border border-blue-100">
                <h4 className="font-bold mb-2">ملاحظات النظام والإغلاق المالي:</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li>تحصيل الأقساط ينعكس فورياً على نظام المديونية، ويُضاف إلى إيرادات الدرج الكلي في الوردية.</li>
                    <li>المبيعات الميدانية (Van Sales) تتطلب جرد العهدة عبر قائمة المركبات.</li>
                    <li>لتلافي تضارب الكميات عند الانقطاع (Offline)، يقوم التزامن بنظام Delta بحيث لا يتم تحميل المخزون الكلي بل المبيعات الفعلية فقط.</li>
                </ul>
            </div>
        </div>
    );
};

export default CollectionReport;
