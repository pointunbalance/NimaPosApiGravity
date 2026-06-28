import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Award, Search, Plus, Save, X, Calculator, ShieldCheck, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const AnnualBonuses: React.FC = () => {
    const { showToast } = useToast();
    const users = useLiveQuery(() => db.users.filter(u => u.isActive === true).toArray()) || [];
    const commissions = useLiveQuery(() => db.commissions.toArray()) || [];
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [bonusToDeleteId, setBonusToDeleteId] = useState<number | null>(null);

    const [bonusForm, setBonusForm] = useState({
        employeeId: 0,
        amount: 0,
        percentage: 0,
        notes: `مكافأة أداء سنوية للعام ${new Date().getFullYear()}`
    });

    const annualBonuses = useMemo(() => {
        return commissions
            .filter(c => c.notes?.includes('مكافأة') && new Date(c.date).getFullYear().toString() === selectedYear)
            .map(c => {
                const user = users.find(u => u.id === c.employeeId);
                return { ...c, userName: user?.name, jobTitle: user?.jobTitle };
            });
    }, [commissions, users, selectedYear]);

    const handlePercentageCalc = (percentage: number) => {
        const user = users.find(u => u.id === bonusForm.employeeId);
        if (user && user.baseSalary) {
            const calculatedAmount = (user.baseSalary * percentage) / 100;
            setBonusForm(prev => ({ ...prev, percentage, amount: calculatedAmount }));
        } else {
            showToast('الرجاء اختيار الموظف أولاً وتأكد من وجود راتب أساسي له', 'error');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await db.commissions.add({
                employeeId: bonusForm.employeeId,
                amount: bonusForm.amount,
                date: new Date().toISOString(),
                status: 'pending',
                notes: bonusForm.notes
            });
            showToast('تم اعتماد المكافأة السنوية للموظف', 'success');
            setIsModalOpen(false);
            setBonusForm({ employeeId: 0, amount: 0, percentage: 0, notes: `مكافأة أداء سنوية للعام ${selectedYear}` });
        } catch (error) {
            showToast('حدث خطأ أثناء حفظ المكافأة', 'error');
        }
    };

    const handleDeleteClick = (id: number) => {
        setBonusToDeleteId(id);
        setIsDeleteConfirmOpen(true);
    };

    const executeDelete = async () => {
        if (bonusToDeleteId) {
            try {
                await db.commissions.delete(bonusToDeleteId);
                showToast("تم إلغاء المكافأة", "success");
            } catch (err) {
                showToast("حدث خطأ أثناء الإلغاء", "error");
            }
            setBonusToDeleteId(null);
        }
        setIsDeleteConfirmOpen(false);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Award className="text-amber-500" />
                        نظام إدارة المكافآت السنوية
                    </h1>
                    <p className="text-slate-500 mt-1">تخصيص وتقييم المكافآت السنوية المستندة لتقييم الأداء والربحية</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 font-bold shadow-lg shadow-indigo-200"
                >
                    <Plus size={20} />
                    صرف مكافأة جديدة
                </button>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="بحث باسم الموظف..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div className="relative w-full md:w-48">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                    >
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-gradient-to-l from-amber-50 to-transparent border-b border-amber-100">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600">الموظف</th>
                            <th className="p-4 font-semibold text-slate-600">القيمة</th>
                            <th className="p-4 font-semibold text-slate-600">تاريخ الاعتماد</th>
                            <th className="p-4 font-semibold text-slate-600">البيان</th>
                            <th className="p-4 font-semibold text-slate-600">الحالة</th>
                            <th className="p-4 font-semibold text-slate-600">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {annualBonuses
                          .filter(b => b.userName?.toLowerCase().includes(searchTerm.toLowerCase()))
                          .map((bonus) => (
                            <tr key={bonus.id} className="hover:bg-slate-50">
                                <td className="p-4 font-bold text-slate-800">
                                    {bonus.userName}
                                    <div className="text-xs text-slate-500 font-normal">{bonus.jobTitle}</div>
                                </td>
                                <td className="p-4 font-black text-amber-600">{bonus.amount.toLocaleString()}</td>
                                <td className="p-4 text-slate-600">{new Date(bonus.date).toLocaleDateString()}</td>
                                <td className="p-4 text-slate-600 text-sm max-w-xs">{bonus.notes}</td>
                                <td className="p-4">
                                     <span className={`px-2 py-1 rounded-lg text-xs font-bold ${bonus.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                         {bonus.status === 'paid' ? 'تم الدفع' : 'معلق للصرف (سيضاف للراتب)'}
                                     </span>
                                </td>
                                <td className="p-4">
                                     {bonus.status === 'pending' && (
                                         <button onClick={() => handleDeleteClick(bonus.id!)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
                                             <Trash2 size={18} />
                                         </button>
                                     )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Award className="text-amber-500" />
                                اعتماد مكافأة سنوية جديدة
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">الموظف المستحق</label>
                                <select
                                    required
                                    value={bonusForm.employeeId}
                                    onChange={(e) => setBonusForm({...bonusForm, employeeId: Number(e.target.value)})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value={0}>اختر الموظف...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} - {u.jobTitle}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">النسبة من الراتب الأساسي (%)</label>
                                    <div className="relative">
                                        <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input
                                            type="number"
                                            min="0"
                                            max="500"
                                            value={bonusForm.percentage}
                                            onChange={(e) => handlePercentageCalc(Number(e.target.value))}
                                            className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-left"
                                            dir="ltr"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">اختياري للتقييم السريع</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">قيمة المكافأة الإجمالية</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={bonusForm.amount || ''}
                                        onChange={(e) => setBonusForm({...bonusForm, amount: Number(e.target.value), percentage: 0})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-left font-bold"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">البيان ومبرر المكافأة</label>
                                <textarea
                                    required
                                    value={bonusForm.notes}
                                    onChange={(e) => setBonusForm({...bonusForm, notes: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold">
                                    إلغاء
                                </button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex justify-center items-center gap-2 font-bold shadow-lg shadow-indigo-200">
                                    <ShieldCheck size={20} />
                                    اعتماد المكافأة
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={executeDelete}
                title="إلغاء المكافأة"
                message="هل أنت متأكد من رغبتك في إلغاء هذه المكافأة السنوية المعلقة؟ لا يمكن التراجع عن هذا الإجراء."
            />
        </div>
    );
};

export default AnnualBonuses;
