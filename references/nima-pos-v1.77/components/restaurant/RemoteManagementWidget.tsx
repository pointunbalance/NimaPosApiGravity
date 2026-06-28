import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { ShieldCheck, Tag, CheckCircle2, XCircle, TrendingDown, ArrowDownToLine, Users, Building, Activity, DollarSign, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import ConfirmModal from '../ui/ConfirmModal';

export const RemoteManagementWidget: React.FC = () => {
    const pendingExpenses = useLiveQuery(() => db.expenses.filter(e => e.status === 'pending').toArray()) || [];
    const staff = useLiveQuery(() => db.users.filter(u => u.department === 'restaurant').toArray()) || [];
    const products = useLiveQuery(() => db.products.limit(10).toArray()) || [];

    const [selectedExpense, setSelectedExpense] = useState<any>(null);
    const [confirmStaff, setConfirmStaff] = useState<{ id: number; name: string; currentStatus: boolean } | null>(null);
    const [discountProd, setDiscountProd] = useState<{ id: number; name: string; currentPrice: number } | null>(null);
    const [discountValue, setDiscountValue] = useState<string>("10");

    const approveExpense = async (id: number) => {
        await db.expenses.update(id, { status: 'approved' });
        setSelectedExpense(null);
    };

    const rejectExpense = async (id: number) => {
        await db.expenses.update(id, { status: 'rejected' });
        setSelectedExpense(null);
    };

    const handleToggleStaffStatus = (id: number, name: string, currentStatus: boolean) => {
        setConfirmStaff({ id, name, currentStatus });
    };

    const executeStaffToggle = async () => {
        if (confirmStaff) {
            await db.users.update(confirmStaff.id, { isActive: !confirmStaff.currentStatus });
            setConfirmStaff(null);
        }
    };

    const handleApplyQuickDiscount = (id: number, name: string, currentPrice: number) => {
        setDiscountProd({ id, name, currentPrice });
        setDiscountValue("10");
    };

    const executeApplyDiscount = async () => {
        if (discountProd) {
            const amount = Number(discountValue);
            if (!isNaN(amount) && amount >= 0) {
                const newPrice = Math.max(0, discountProd.currentPrice - amount);
                await db.products.update(discountProd.id, { price: newPrice });
            }
            setDiscountProd(null);
        }
    };

    return (
        <div className="bg-gradient-to-br from-[#111827] to-[#1E293B] rounded-3xl p-6 md:p-8 shadow-xl text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
            
            <h2 className="text-2xl font-black mb-1 flex items-center gap-3 relative z-10 text-white">
                <ShieldCheck className="w-8 h-8 text-indigo-400" />
                التحكم عن بُعد وصلاحيات الإدارة (Remote Management)
            </h2>
            <p className="text-indigo-200 text-sm mb-6 relative z-10 font-bold">تغيير إعدادات الفرع مباشرة من لوحة التحكم (المنزل)</p>
 
            <div className="flex flex-col md:flex-row gap-[16px] items-stretch relative z-10">
                
                {/* Pending Expenses Approval */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col flex-1 w-full md:w-auto">
                    <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-400" /> الموافقة على المصروفات</span>
                        {pendingExpenses.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">{pendingExpenses.length} معلق</span>}
                    </h3>
                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                        {pendingExpenses.length === 0 ? (
                            <div className="text-center text-slate-400 py-6 text-sm">لا توجد مصروفات معلقة.</div>
                        ) : pendingExpenses.map(exp => (
                            <div key={exp.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-white">{exp.title}</div>
                                        <div className="text-xs text-slate-400 mt-1">{new Date(exp.date).toLocaleDateString()}</div>
                                    </div>
                                    <div className="font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                                        {exp.amount.toLocaleString()} ج.م
                                    </div>
                                </div>
                                {exp.attachment && (
                                   <div className="mt-2 mb-3">
                                        <button onClick={() => setSelectedExpense(exp)} className="text-xs text-indigo-300 hover:text-indigo-200 flex items-center gap-1 font-bold bg-indigo-500/20 px-2 py-1 rounded-md w-max">
                                            <Camera className="w-3 h-3" /> عرض الفاتورة (مرفق)
                                        </button>
                                   </div>
                                )}
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => approveExpense(exp.id!)} className="flex-1 bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 transition-colors">
                                        <CheckCircle2 className="w-4 h-4" /> تأكيد واعتماد
                                    </button>
                                    <button onClick={() => rejectExpense(exp.id!)} className="flex-1 bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 transition-colors">
                                        <XCircle className="w-4 h-4" /> رفض
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
 
                {/* Staff Remote Status Toggle */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col flex-1 w-full md:w-auto">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                         <Users className="w-5 h-5 text-blue-400" /> إدارة صلاحيات الموظفين
                    </h3>
                    <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                        {staff.map(user => (
                            <div key={user.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                                <div>
                                    <div className="font-bold text-sm">{user.name}</div>
                                    <div className="text-xs text-slate-400">{user.role}</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={user.isActive} onChange={() => handleToggleStaffStatus(user.id!, user.name, user.isActive)} />
                                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
 
                {/* Quick Price/Discount Manipulation */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col flex-1 w-full md:w-auto">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                         <Tag className="w-5 h-5 text-indigo-400" /> تعديل الأسعار وعروض فلاش
                    </h3>
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-center w-full" style={{ padding: '20px' }}>
                             <TrendingDown className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                             <p className="text-sm font-bold text-indigo-100">تحكم بأسعار المنتجات فوراً وعمل خصومات سريعة من هنا ليتم تطبيقها بفرع المطعم المباشر لحظيا.</p>
                        </div>
                        <div className="w-full space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                            {products.map(prod => (
                                <div key={prod.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700 gap-[12px]">
                                    <span className="text-sm font-bold truncate max-w-[120px]">{prod.name}</span>
                                    <div className="flex items-center gap-[12px]">
                                        <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded shrink-0">{prod.price} ج</span>
                                        <button onClick={() => handleApplyQuickDiscount(prod.id!, prod.name, prod.price)} className="bg-indigo-600 shrink-0 text-white text-xs px-2 py-1 rounded hover:bg-indigo-500 transition-colors">
                                            خصم سريع
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
 
            {/* Custom Modal for Image Preview */}
            {selectedExpense && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedExpense(null)}>
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl max-w-lg w-full relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedExpense(null)} className="absolute top-4 right-4 bg-slate-800 p-2 rounded-full text-slate-300 hover:text-white">
                           <XCircle className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Camera className="w-5 h-5 text-indigo-400" /> الفاتورة المرفقة: {selectedExpense.title}
                        </h3>
                        {selectedExpense.attachment ? (
                            <img src={selectedExpense.attachment} alt="Receipt" className="w-full h-auto max-h-[60vh] object-contain rounded-xl border border-slate-700" />
                        ) : (
                            <div className="text-center text-slate-400 py-10 bg-slate-800 rounded-xl">المرفق غير صالح لعرضه</div>
                        )}
                        <div className="flex justify-end mt-6">
                            <button onClick={() => setSelectedExpense(null)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
 
            {/* Staff Status Change Confirmation Modal */}
            {confirmStaff && (
                <ConfirmModal
                    isOpen={confirmStaff !== null}
                    title="تعديل حالة الموظف"
                    message={`هل أنت متأكد من ${confirmStaff.currentStatus ? 'إيقاف' : 'تفعيل'} الموظف "${confirmStaff.name}" عن بُعد؟`}
                    confirmText={`${confirmStaff.currentStatus ? 'إيقاف' : 'تفعيل'}`}
                    cancelText="تراجع"
                    onConfirm={executeStaffToggle}
                    onCancel={() => setConfirmStaff(null)}
                />
            )}
 
            {/* Price Adjustment Overlay/Modal (Anti-Alert/Prompt) */}
            {discountProd && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setDiscountProd(null)}>
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Tag className="w-5 h-5 text-indigo-400" /> خصم سريع: {discountProd.name}
                        </h3>
                        <p className="text-sm text-slate-300 mb-4">
                            السعر الحالي للمنتج هو: <span className="font-mono text-emerald-400 font-bold">{discountProd.currentPrice} ج.م</span>
                        </p>
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-400 mb-2">أدخل قيمة الخصم بالجنيه المصري (ج.م)</label>
                            <input
                                type="number"
                                min="0"
                                max={discountProd.currentPrice}
                                value={discountValue}
                                onChange={e => setDiscountValue(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white font-bold rounded-xl outline-none focus:border-indigo-500 transition-colors"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-between gap-3">
                            <button onClick={() => setDiscountProd(null)} className="px-5 py-2.5 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition">إلغاء</button>
                            <button onClick={executeApplyDiscount} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-1 shadow-lg">تطبيق الخصم</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
