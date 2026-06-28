import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { FileText, Search, Printer, Download, Filter, Eye, X } from 'lucide-react';
import { format } from 'date-fns';

export const Payslips: React.FC = () => {
    const expenses = useLiveQuery(() => db.expenses.where('category').equals('salary').toArray()) || [];
    const users = useLiveQuery(() => db.users.toArray()) || [];
    const [searchTerm, setSearchTerm] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

    const payslips = useMemo(() => {
        let filtered = expenses.map(exp => {
            const user = users.find(u => u.id === exp.employeeId) || users.find(u => exp.title.includes(u.name));
            return {
                ...exp,
                userName: user?.name || 'مجهول',
                jobTitle: user?.jobTitle || '',
            };
        });

        if (searchTerm) {
            filtered = filtered.filter(p => p.userName.toLowerCase().includes(searchTerm.toLowerCase()) || p.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (monthFilter) {
            filtered = filtered.filter(p => p.title.includes(monthFilter) || format(new Date(p.date), 'yyyy-MM').includes(monthFilter));
        }

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, users, searchTerm, monthFilter]);

    const handlePrint = () => {
        window.print();
    };

    const handlePrintSingle = () => {
         const printContent = document.getElementById('payslip-print-view');
         if (printContent) {
             const originalContent = document.body.innerHTML;
             document.body.innerHTML = printContent.innerHTML;
             window.print();
             document.body.innerHTML = originalContent;
             window.location.reload(); // Reload to restore event listeners that get destroyed by innerHTML swap
         }
    };


    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-indigo-600" />
                        أرشيف قسائم الرواتب (Payslips)
                    </h1>
                    <p className="text-slate-500 mt-1">عرض وطباعة قسائم مسيرات الرواتب السابقة للموظفين</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handlePrint} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium">
                        <Printer size={18} />
                        طباعة السجل
                    </button>
                    <button className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2 font-medium">
                        <Download size={18} />
                        تصدير PDF
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="بحث باسم الموظف أو البيان..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div className="relative w-full md:w-64">
                    <input
                        type="month"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">التاريخ</th>
                                <th className="p-4 font-semibold text-slate-600">الموظف</th>
                                <th className="p-4 font-semibold text-slate-600">البيان</th>
                                <th className="p-4 font-semibold text-slate-600">الصافي المدفوع</th>
                                <th className="p-4 font-semibold text-slate-600">طريقة الدفع</th>
                                <th className="p-4 font-semibold text-slate-600">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payslips.map((slip) => (
                                <tr key={slip.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-600">{format(new Date(slip.date), 'yyyy-MM-dd')}</td>
                                    <td className="p-4 font-bold text-slate-800">
                                        <div className="flex flex-col">
                                            <span>{slip.userName}</span>
                                            <span className="text-xs text-slate-500 font-normal">{slip.jobTitle}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600 max-w-xs truncate" title={slip.notes || slip.title}>
                                        {slip.title} <br/>
                                        <span className="text-xs text-slate-400">{slip.notes}</span>
                                    </td>
                                    <td className="p-4 font-bold text-emerald-600">{slip.amount.toLocaleString()}</td>
                                    <td className="p-4 text-sm">
                                        <span className={`px-2 py-1 rounded-lg ${slip.paymentMethod === 'bank' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                            {slip.paymentMethod === 'bank' ? 'تحويل بنكي' : 'نقدي'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => setSelectedPayslip(slip)}
                                            className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                                        >
                                            <Eye size={16} /> عرض
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {payslips.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        لا توجد قسائم رواتب مسجلة
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedPayslip && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="text-indigo-600" />
                                تفاصيل قسيمة الراتب
                            </h2>
                            <button onClick={() => setSelectedPayslip(null)} className="text-slate-400 hover:text-slate-600 p-2">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto" id="payslip-print-view" dir="rtl">
                            <div className="text-center mb-8 pb-6 border-b border-slate-200">
                                <h1 className="text-2xl font-black text-slate-800 mb-2">قسيمة راتب (Payslip)</h1>
                                <p className="text-slate-500 font-medium">عن فترة: <span className="font-bold text-slate-700">{format(new Date(selectedPayslip.date), 'MM-yyyy')}</span></p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b pb-1">
                                        <span className="text-slate-500">اسم الموظف:</span>
                                        <span className="font-bold text-slate-800">{selectedPayslip.userName}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-1">
                                        <span className="text-slate-500">المسمى الوظيفي:</span>
                                        <span className="font-bold text-slate-800">{selectedPayslip.jobTitle}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-1">
                                        <span className="text-slate-500">طريقة الدفع:</span>
                                        <span className="font-bold text-slate-800">{selectedPayslip.paymentMethod === 'bank' ? 'حوالة بنكية' : 'نقدي الكاشير'}</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b pb-1">
                                        <span className="text-slate-500">تاريخ الصرف:</span>
                                        <span className="font-bold text-slate-800" dir="ltr">{format(new Date(selectedPayslip.date), 'yyyy-MM-dd')}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-1">
                                        <span className="text-slate-500">الرقم المرجعي:</span>
                                        <span className="font-bold text-slate-800">EXP-{selectedPayslip.id}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-5 mb-6 border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">تفاصيل الصرف والخصومات</h3>
                                <div className="whitespace-pre-line text-slate-700 leading-relaxed text-sm format-pre">
                                    {selectedPayslip.notes || 'لم يتم تسجيل تفاصيل إضافية'}
                                </div>
                            </div>

                            <div className="bg-emerald-50 text-emerald-800 rounded-xl p-6 flex justify-between items-center border border-emerald-100">
                                <span className="font-bold text-lg">الصافي المدفوع:</span>
                                <span className="text-3xl font-black" dir="ltr">{selectedPayslip.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
                            <button 
                                onClick={() => setSelectedPayslip(null)} 
                                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 font-bold"
                            >
                                إغلاق
                            </button>
                            <button 
                                onClick={handlePrintSingle}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold flex items-center gap-2"
                            >
                                <Printer size={18} />
                                طباعة القسيمة
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payslips;
