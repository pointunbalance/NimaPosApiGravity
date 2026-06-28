import React, { useState, useEffect } from 'react';
import { X, Play, Square, Banknote, AlertTriangle, Plus, FileText, CheckCircle, Clock } from 'lucide-react';
import { Shift } from '../../types';
import { db } from '../../db';
import { useToast } from '../../context/ToastContext';

interface ShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    formatCurrency: (amount: number) => string;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose, formatCurrency }) => {
    const { success, error } = useToast();
    const [currentShift, setCurrentShift] = useState<Shift | null>(null);
    const [startCash, setStartCash] = useState<number>(0);
    const [actualCash, setActualCash] = useState<number>(0);
    const [notes, setNotes] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [expenseAmount, setExpenseAmount] = useState<number>(0);
    const [expenseNote, setExpenseNote] = useState<string>('');
    const [isAddingExpense, setIsAddingExpense] = useState<boolean>(false);

    useEffect(() => {
        const userStr = localStorage.getItem('nima_user');
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr));
            } catch (e) {}
        }
    }, []);

    const hasViewExpectedCashPermission = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.permissions?.includes('view_expected_cash') || currentUser?.permissions?.includes('all');

    useEffect(() => {
        if (isOpen && currentUser !== null) {
            loadCurrentShift();
        }
    }, [isOpen, currentUser]);

    const loadCurrentShift = async () => {
        setIsLoading(true);
        try {
            const shift = await db.shifts.where('status').equals('open').first();
            setCurrentShift(shift || null);
            if (shift) {
                setActualCash(hasViewExpectedCashPermission ? (shift.expectedCash || 0) : 0);
            }
        } catch (err) {
            console.error('Error loading shift:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenShift = async () => {
        try {
            const newShift: Shift = {
                startTime: new Date(),
                startCash: startCash,
                cashSales: 0,
                cardSales: 0,
                expectedCash: startCash,
                status: 'open',
                notes: notes
            };
            await db.shifts.add(newShift);
            
            import('../../utils/notifications').then(({ notificationService }) => {
                notificationService.addNotification(
                    "تنبيه الوردية: بدء وردية", 
                    `قام ${currentUser?.name || 'المستخدم'} بفتح الوردية برصيد افتتاحي قدره ${startCash} ج.م.`,
                    "info"
                );
            });

            success('تم فتح الوردية بنجاح');
            loadCurrentShift();
            setNotes('');
        } catch (err) {
            error('حدث خطأ أثناء فتح الوردية');
        }
    };

    const handleCloseShift = async () => {
        if (!currentShift) return;
        try {
            const difference = actualCash - currentShift.expectedCash;
            await db.shifts.update(currentShift.id!, {
                endTime: new Date(),
                actualCash: actualCash,
                difference: difference,
                status: 'closed',
                notes: notes
            });

            import('../../utils/notifications').then(({ notificationService }) => {
                notificationService.addNotification(
                    "تنبيه الوردية: إغلاق وردية", 
                    `قام ${currentUser?.name || 'المستخدم'} بإغلاق الوردية. إجمالي المبيعات، عجز/زيادة درج: ${difference} ج.م.`,
                    "info"
                );
            });

            success('تم إغلاق الوردية بنجاح');
            setCurrentShift(null);
            setNotes('');
            onClose();
        } catch (err) {
            error('حدث خطأ أثناء إغلاق الوردية');
        }
    };

    const handleAddExpense = async () => {
        if (!currentShift) return;
        if (expenseAmount <= 0) {
            error('الرجاء إدخال مبلغ صحيح');
            return;
        }
        if (!expenseNote.trim()) {
            error('الرجاء إدخال ملاحظة للمصروف');
            return;
        }
        
        try {
            const newExpense = {
                id: crypto.randomUUID(),
                amount: expenseAmount,
                description: expenseNote,
                timestamp: new Date(),
                isConfirmed: false
            };
            
            const updatedExpenses = [...(currentShift.shiftExpenses || []), newExpense];
            
            await db.shifts.update(currentShift.id!, {
                shiftExpenses: updatedExpenses,
                expectedCash: currentShift.expectedCash - expenseAmount // Deduct from expected cash immediately
            });
            
            success('تمت إضافة المصروف للوردية والدرج');
            setExpenseAmount(0);
            setExpenseNote('');
            setIsAddingExpense(false);
            loadCurrentShift();
        } catch (err) {
            error('حدث خطأ أثناء حفظ المصروف');
        }
    };

    const hasShiftExpensesPermission = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.permissions?.includes('shift_expenses') || currentUser?.permissions?.includes('all');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">
                        {currentShift ? 'إغلاق الوردية' : 'فتح وردية جديدة'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>
                    ) : currentShift ? (
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">وقت البدء:</span>
                                    <span className="font-bold">{new Date(currentShift.startTime).toLocaleString('ar-EG')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">الرصيد الافتتاحي:</span>
                                    <span className="font-bold">{formatCurrency(currentShift.startCash)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">مبيعات نقدية:</span>
                                    <span className="font-bold text-emerald-600">{formatCurrency(currentShift.cashSales)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">مبيعات بطاقة:</span>
                                    <span className="font-bold text-blue-600">{formatCurrency(currentShift.cardSales)}</span>
                                </div>
                                {hasViewExpectedCashPermission && (
                                    <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold">
                                        <span className="text-slate-800">النقد المتوقع:</span>
                                        <span className="text-brand-600">{formatCurrency(currentShift.expectedCash)}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">النقد الفعلي في الدرج</label>
                                <div className="relative">
                                    <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="number" 
                                        value={actualCash === 0 && !hasViewExpectedCashPermission ? '' : actualCash} 
                                        onChange={e => setActualCash(Number(e.target.value))}
                                        className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {hasViewExpectedCashPermission && actualCash !== currentShift.expectedCash && (
                                <div className={`p-3 rounded-xl flex items-start gap-2 text-sm font-bold ${actualCash > currentShift.expectedCash ? 'bg-emerald-50 text-emerald-700 ' : 'bg-red-50 text-red-700 '}`}>
                                    <AlertTriangle className="w-5 h-5 shrink-0" />
                                    <div>
                                        <p>يوجد {actualCash > currentShift.expectedCash ? 'زيادة' : 'عجز'} بقيمة {formatCurrency(Math.abs(actualCash - currentShift.expectedCash))}</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">ملاحظات الإغلاق</label>
                                <textarea 
                                    value={notes} 
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none h-20"
                                    placeholder="أي ملاحظات حول العجز أو الزيادة..."
                                />
                            </div>

                            {/* Section: Shift Expenses */}
                            {currentShift.shiftExpenses && currentShift.shiftExpenses.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="font-bold text-sm text-slate-800">مصروفات تم سحبها من الدرج (الوردية الحالية):</h3>
                                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                        {currentShift.shiftExpenses.map(exp => (
                                            <div key={exp.id} className="bg-slate-50 p-2 rounded-lg flex justify-between items-center text-sm border border-slate-100">
                                                <div>
                                                    <p className="font-medium text-slate-800">{exp.description}</p>
                                                    <p className="text-xs text-slate-500">{new Date(exp.timestamp).toLocaleTimeString('ar-EG')}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-red-600">-{formatCurrency(exp.amount)}</span>
                                                    {exp.isConfirmed ? (
                                                        <span title="تم التأكيد"><CheckCircle className="w-4 h-4 text-emerald-500" /></span>
                                                    ) : (
                                                        <span title="بانتظار تأكيد المدير"><Clock className="w-4 h-4 text-amber-500" /></span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {hasShiftExpensesPermission && (
                                <div className="border-t border-slate-200 pt-4 mt-2">
                                    {!isAddingExpense ? (
                                        <button 
                                            onClick={() => setIsAddingExpense(true)}
                                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Plus className="w-4 h-4" /> إضافة مصروف مسحوب من الدرج
                                        </button>
                                    ) : (
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                                            <h4 className="font-bold text-sm text-slate-800">إضافة مصروف من الدرج</h4>
                                            <div>
                                                <input
                                                    type="number"
                                                    value={expenseAmount || ''}
                                                    onChange={e => setExpenseAmount(Number(e.target.value))}
                                                    placeholder="قيمة المصروف"
                                                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none mb-2"
                                                />
                                                <input
                                                    type="text"
                                                    value={expenseNote}
                                                    onChange={e => setExpenseNote(e.target.value)}
                                                    placeholder="فيما تم صرف المبلغ؟"
                                                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={handleAddExpense} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold">حفظ المصروف</button>
                                                <button onClick={() => setIsAddingExpense(false)} className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-bold">إلغاء</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button onClick={handleCloseShift} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 mt-4">
                                <Square className="w-5 h-5" /> إغلاق الوردية
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">الرصيد الافتتاحي (العهدة)</label>
                                <div className="relative">
                                    <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="number" 
                                        value={startCash || ''} 
                                        onChange={e => setStartCash(Number(e.target.value))}
                                        className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">ملاحظات</label>
                                <textarea 
                                    value={notes} 
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none h-20"
                                    placeholder="ملاحظات اختيارية..."
                                />
                            </div>
                            <button onClick={handleOpenShift} className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                                <Play className="w-5 h-5" /> فتح الوردية
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
