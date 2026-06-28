import React, { useState, useMemo } from 'react';
import { 
    Plus, Search, UserCircle, Briefcase, FileText, X, Check, Edit2, Trash2, 
    Calendar, DollarSign, Wallet, Clock, CreditCard, ChevronRight, Activity, 
    Lock, Scale, Receipt, UserPlus, AlertCircle, TrendingUp, ArrowDownLeft, 
    ArrowUpRight, UserCheck, Shield, BookOpen, Clock3, Percent, CheckCircle, Flame
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { User, Loan, Attendance, JournalEntry } from '../../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const RestaurantStaff = () => {
    // Basic definition of roles and accounts
    const rolesList = ["مدير مطعم", "شيف عمومي (Head Chef)", "شيف قسم", "مساعد طباخ", "كاشير", "مقدم طعام (Waiter)", "عامل نظافة", "مندوب توصيل"];
    
    // Page tabs
    const [activeTab, setActiveTab] = useState<'directory' | 'payroll' | 'attendance'>('directory');
    
    // Filtering states
    const [search, setSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    
    // Add & Edit staff states
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
    const [staffFormData, setStaffFormData] = useState({
        name: '',
        phone: '',
        role: rolesList[5], // Default: Waiter
        pin: '',
        baseSalary: 1200000, // standard default
        isActive: true,
        email: '',
        address: '',
        bankAccount: '',
        paymentMethod: 'cash' as 'cash' | 'bank',
        notes: '',
        startDate: new Date().toISOString().split('T')[0],
        permissions: [] as string[],
        shiftStartTime: '09:00',
        shiftEndTime: '17:00'
    });

    // Staff form modal active tab state
    const [staffModalTab, setStaffModalTab] = useState<'basic' | 'shifts' | 'permissions'>('basic');

    // Custom safety dialog states (replaces banned native dialogs)
    const [staffToDeleteId, setStaffToDeleteId] = useState<number | null>(null);
    const [staffToPayout, setStaffToPayout] = useState<User | null>(null);
    const [payoutForm, setPayoutForm] = useState({
        amount: 0,
        source: 'cash' as 'cash' | 'bank',
        deductLoan: true,
        notes: ''
    });

    // Advance/Loan states
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [selectedLoanUser, setSelectedLoanUser] = useState<User | null>(null);
    const [loanForm, setLoanForm] = useState({
        amount: 200000,
        reason: 'سلفة طارئة',
        installmentMonths: 2,
        monthlyDeduction: 100000
    });

    // Attendance configuration date state
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [allDailyAttendance, setAllDailyAttendance] = useState<Record<number, any>>({});

    // Live queries
    const staff = useLiveQuery(() => 
        db.users.filter(u => u.department === 'restaurant').toArray()
    ) || [];

    const loans = useLiveQuery(() => db.loans.toArray()) || [];
    const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
    const journalEntries = useLiveQuery(() => db.journalEntries.toArray()) || [];
    
    const attendanceRecords = useLiveQuery(() => {
        return db.attendance.filter(a => a.date === attendanceDate).toArray();
    }, [attendanceDate]) || [];

    // Filter staff for listings
    const filteredStaff = useMemo(() => {
        return staff.filter(emp => {
            const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || 
                                 (emp.phone && emp.phone.includes(search)) ||
                                 (emp.email && emp.email.toLowerCase().includes(search.toLowerCase()));
            const matchesRole = selectedRole ? emp.role === selectedRole : true;
            return matchesSearch && matchesRole;
        });
    }, [staff, search, selectedRole]);

    // Computed Statistics
    const stats = useMemo(() => {
        const total = staff.length;
        const active = staff.filter(s => s.isActive).length;
        const totalBasePayroll = staff.filter(s => s.isActive).reduce((sum, s) => sum + (s.baseSalary || 0), 0);
        
        // Find outstanding approved un-repaid loans for restaurant staff
        const restaurantUserIds = staff.map(s => s.id);
        const activeAdvances = loans
            .filter(l => restaurantUserIds.includes(l.userId) && l.status === 'approved')
            .reduce((sum, l) => sum + (l.amount - (l.paidAmount || 0)), 0);

        // Attendance rate today
        const presentCount = attendanceRecords.filter(a => ['present', 'late'].includes(a.status)).length;
        const attendancePercent = active > 0 ? Math.round((presentCount / active) * 100) : 0;

        return {
            total,
            active,
            inactive: total - active,
            totalBasePayroll,
            activeAdvances,
            attendancePercent
        };
    }, [staff, loans, attendanceRecords]);

    // Initialize/sync local accounts to guarantee double-entry accounting functions smoothly
    const getOrCreateAccount = async (code: string, name: string, type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'): Promise<number> => {
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

    // Helper to calculate actual decimal hours between check-in and check-out
    const calculateWorkingHours = (checkIn?: string, checkOut?: string): number => {
        if (!checkIn || !checkOut) return 0;
        const [inH, inM] = checkIn.split(':').map(Number);
        const [outH, outM] = checkOut.split(':').map(Number);
        if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return 0;
        const diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
        return Math.max(0, parseFloat((diffMinutes / 60).toFixed(2)));
    };

    // Safe trigger to open Staff Add/Edit Form
    const handleOpenStaffModal = (edit = false, emp: User | null = null) => {
        setIsEditMode(edit);
        setStaffModalTab('basic');
        if (edit && emp) {
            setSelectedStaffId(emp.id!);
            setStaffFormData({
                name: emp.name,
                phone: emp.phone || '',
                role: emp.role,
                pin: emp.pin || '',
                baseSalary: emp.baseSalary || 1200000,
                isActive: emp.isActive !== false,
                email: emp.email || '',
                address: emp.address || '',
                bankAccount: emp.bankAccount || '',
                paymentMethod: emp.paymentMethod || 'cash',
                notes: emp.notes || '',
                startDate: emp.startDate 
                    ? (emp.startDate instanceof Date ? emp.startDate.toISOString().split('T')[0] : new Date(emp.startDate).toISOString().split('T')[0])
                    : new Date().toISOString().split('T')[0],
                permissions: emp.permissions || [],
                shiftStartTime: emp.shiftStartTime || '09:00',
                shiftEndTime: emp.shiftEndTime || '17:00'
            });
        } else {
            setSelectedStaffId(null);
            setStaffFormData({
                name: '',
                phone: '',
                role: rolesList[5], // Waiter
                pin: String(Math.floor(1000 + Math.random() * 9000)), // dynamic PIN
                baseSalary: 1200000,
                isActive: true,
                email: '',
                address: '',
                bankAccount: '',
                paymentMethod: 'cash',
                notes: '',
                startDate: new Date().toISOString().split('T')[0],
                permissions: [],
                shiftStartTime: '09:00',
                shiftEndTime: '17:00'
            });
        }
        setIsStaffModalOpen(true);
    };

    // Save Staff Information in Client-side DB
    const handleSaveStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate safety
        if (!staffFormData.name.trim()) {
            toast.error('يرجى إدخال اسم الموظف');
            return;
        }
        if (!staffFormData.pin || staffFormData.pin.length < 4) {
            toast.error('رمز الدخول PIN يجب أن يتكون من 4 أرقام على الأقل');
            return;
        }

        try {
            const payload = {
                ...staffFormData,
                baseSalary: Number(staffFormData.baseSalary),
                startDate: new Date(staffFormData.startDate),
                department: 'restaurant',
            };

            if (isEditMode && selectedStaffId) {
                await db.users.update(selectedStaffId, payload);
                toast.success('تم تحديث بيانات الموظف بنجاح');
            } else {
                await db.users.add(payload);
                toast.success('تمت إضافة الموظف الجديد لطاقم المطعم');
            }
            setIsStaffModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error('حدث خطأ أثناء حفظ الملف الشخصي للموظف');
        }
    };

    // Custom Delete Execution
    const handleConfirmDelete = async () => {
        if (!staffToDeleteId) return;
        try {
            await db.users.delete(staffToDeleteId);
            toast.success('تم حذف ملف الموظف بنجاح من النظام');
        } catch (error) {
            toast.error('عذراً، فشل تدمير السجل');
        } finally {
            setStaffToDeleteId(null);
        }
    };

    // Attendance Toggle (Check in / Check out / Absent / Late)
    const handleUpdateAttendance = async (userId: number, status: 'present' | 'absent' | 'late' | 'excused', lateMin = 0) => {
        try {
            const emp = staff.find(s => s.id === userId);
            const defaultIn = emp?.shiftStartTime || '09:00';
            const existing = attendanceRecords.find(a => a.userId === userId);
            
            if (existing) {
                await db.attendance.update(existing.id!, {
                    status,
                    checkInTime: status === 'present' || status === 'late' ? (existing.checkInTime || defaultIn) : undefined,
                    lateMinutes: status === 'late' ? (lateMin || existing.lateMinutes || 30) : 0
                });
            } else {
                const newRecord: Attendance = {
                    userId,
                    date: attendanceDate,
                    status,
                    checkInTime: status === 'present' || status === 'late' ? defaultIn : undefined,
                    lateMinutes: status === 'late' ? (lateMin || 30) : 0,
                    notes: 'تسجيل يدوي بواسطة الإدارة'
                };
                await db.attendance.add(newRecord);
            }
            toast.success('تم تحديث حالة حضور الموظف بنجاح');
        } catch (error) {
            console.error(error);
            toast.error('فشل حفظ حركة الحضور اليومية');
        }
    };

    // Simulated Quick Clock Out
    const handleAttendanceCheckout = async (userId: number) => {
        try {
            const emp = staff.find(s => s.id === userId);
            const defaultOut = emp?.shiftEndTime || '17:00';
            const existing = attendanceRecords.find(a => a.userId === userId);
            if (!existing) {
                toast.error('الموظف لم يسجل دخوله اليوم');
                return;
            }
            await db.attendance.update(existing.id!, {
                checkOutTime: defaultOut,
                earlyLeaveMinutes: 0
            });
            toast.success('تم تسجيل انصراف الموظف بنجاح');
        } catch (error) {
            toast.error('لا يمكن تسجيل الانصراف');
        }
    };

    // Advanced Manual Save/Adjust for Attendance including times & wage tracking
    const handleSaveCustomAttendance = async (
        userId: number, 
        status: 'present' | 'absent' | 'late' | 'excused', 
        checkIn?: string, 
        checkOut?: string,
        notesText?: string
    ) => {
        try {
            const emp = staff.find(s => s.id === userId);
            const targetIn = emp?.shiftStartTime || '09:00';
            const targetOut = emp?.shiftEndTime || '17:00';

            let lateMinutes = 0;
            let earlyLeaveMinutes = 0;

            // Calculate late minutes if applicable
            if ((status === 'present' || status === 'late') && checkIn) {
                const [inH, inM] = checkIn.split(':').map(Number);
                const [tarH, tarM] = targetIn.split(':').map(Number);
                if (!isNaN(inH) && !isNaN(tarH)) {
                    const diff = (inH * 60 + inM) - (tarH * 60 + tarM);
                    if (diff > 0) {
                        lateMinutes = diff;
                        status = 'late'; // Promote automatically to late status
                    }
                }
            }

            // Calculate early leave minutes if checked out
            if (checkOut) {
                const [outH, outM] = checkOut.split(':').map(Number);
                const [tarH, tarM] = targetOut.split(':').map(Number);
                if (!isNaN(outH) && !isNaN(tarH)) {
                    const diff = (tarH * 60 + tarM) - (outH * 60 + outM);
                    earlyLeaveMinutes = Math.max(0, diff);
                }
            }

            const existing = attendanceRecords.find(a => a.userId === userId);
            if (existing) {
                await db.attendance.update(existing.id!, {
                    status,
                    checkInTime: (status === 'present' || status === 'late') ? (checkIn || targetIn) : undefined,
                    checkOutTime: checkOut || undefined,
                    lateMinutes,
                    earlyLeaveMinutes,
                    notes: notesText || existing.notes || 'تسجيل وتدقيق يدوي'
                });
            } else {
                const newRecord: Attendance = {
                    userId,
                    date: attendanceDate,
                    status,
                    checkInTime: (status === 'present' || status === 'late') ? (checkIn || targetIn) : undefined,
                    checkOutTime: checkOut || undefined,
                    lateMinutes,
                    earlyLeaveMinutes,
                    notes: notesText || 'تسجيل وتدقيق يدوي'
                };
                await db.attendance.add(newRecord);
            }
            toast.success('تم تدوين وتدقيق سجل ساعات العمل بنجاح');
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ أثناء مزامنة التدقيق اليومي');
        }
    };

    // Loan / Advance submit logic 
    const handleTriggerLoanModal = (emp: User) => {
        setSelectedLoanUser(emp);
        setLoanForm({
            amount: 250000,
            reason: 'سلفة معيشة طارئة',
            installmentMonths: 2,
            monthlyDeduction: 125000
        });
        setIsLoanModalOpen(true);
    };

    const handleCreateLoan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLoanUser?.id) return;

        try {
            const loanAmount = Number(loanForm.amount);
            const instMonths = Number(loanForm.installmentMonths);
            const monthlyD = Number(loanForm.monthlyDeduction);

            // Add Loan to DB
            const newLoan: Loan = {
                userId: selectedLoanUser.id,
                amount: loanAmount,
                reason: loanForm.reason,
                installmentMonths: instMonths,
                monthlyDeduction: monthlyD,
                startDate: new Date(),
                status: 'approved', // auto approved by manager console here
                paidAmount: 0,
                createdAt: new Date()
            };

            await db.loans.add(newLoan);

            // Generates Ledger Impact in real-time
            const cashAccId = await getOrCreateAccount('1101', 'الصندوق', 'asset');
            const advancesAccId = await getOrCreateAccount('1202', 'ذمم سلف الموظفين', 'asset');

            // Debit Loan (Asset up) 
            // Credit Cash (Asset down)
            const draftJournal: JournalEntry = {
                date: new Date(),
                reference: `EMP-ADV-${selectedLoanUser.id}-${Date.now()}`,
                description: `صرف سلفة مالية للموظف ${selectedLoanUser.name} - سبب: ${loanForm.reason}`,
                lines: [
                    {
                        accountId: advancesAccId,
                        accountName: 'ذمم سلف الموظفين',
                        debit: loanAmount,
                        credit: 0,
                        description: `قيد سلفة للموظف ${selectedLoanUser.name}`
                    },
                    {
                        accountId: cashAccId,
                        accountName: 'الصندوق',
                        debit: 0,
                        credit: loanAmount,
                        description: `صرف سلفة للموظف ${selectedLoanUser.name} نقداً`
                    }
                ],
                totalAmount: loanAmount,
                status: 'posted',
                createdBy: 'نظام إدارة الموارد البشرية'
            };

            await db.journalEntries.add(draftJournal);

            // Update Account Balances in Dexie index
            const cashAccount = accounts.find(a => a.id === cashAccId);
            const advAccount = accounts.find(a => a.id === advancesAccId);

            await db.accounts.update(cashAccId, { balance: (cashAccount?.balance || 0) - loanAmount });
            await db.accounts.update(advancesAccId, { balance: (advAccount?.balance || 0) + loanAmount });

            toast.success(`تم صرف السلفة (${loanAmount.toLocaleString()} د.ع) وإثباتها محاسبياً بالدفاتر!`);
            setIsLoanModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ مالي أثناء صرف السلفة');
        }
    };

    // Salary receipt payout modal trigger
    const handleTriggerPayoutModal = (emp: User) => {
        // Look up if employee has outstanding loans active to deduct from
        const userLoans = loans.filter(l => l.userId === emp.id && l.status === 'approved');
        const totalOwed = userLoans.reduce((sum, l) => sum + (l.amount - (l.paidAmount || 0)), 0);
        
        setOutstandingLoanForUser(totalOwed);
        setSelectedUserActiveLoans(userLoans);

        setStaffToPayout(emp);
        setPayoutForm({
            amount: emp.baseSalary || 1200000,
            source: emp.paymentMethod === 'bank' ? 'bank' : 'cash',
            deductLoan: totalOwed > 0,
            notes: `صرف راتب شهر ${new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}`
        });
    };

    const [outstandingLoanForUser, setOutstandingLoanForUser] = useState(0);
    const [selectedUserActiveLoans, setSelectedUserActiveLoans] = useState<Loan[]>([]);

    // Process Ledger Payout with real financial integration
    const handleProcessPayroll = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!staffToPayout?.id) return;

        try {
            const grossSalary = Number(payoutForm.amount);
            let loanDeduction = 0;

            // Compute deduction if checked and employee owes money
            if (payoutForm.deductLoan && outstandingLoanForUser > 0) {
                // deduct a portion: min of gross salary/salary deduction OR 1 installment
                // default deduction is 100,000 or the specific amount depending on active loans
                const targetDeduction = selectedUserActiveLoans[0]?.monthlyDeduction || outstandingLoanForUser;
                loanDeduction = Math.min(targetDeduction, outstandingLoanForUser, grossSalary);
            }

            const netPayable = grossSalary - loanDeduction;

            // Safe database accounts initialization
            const sourceAccCode = payoutForm.source === 'bank' ? '1102' : '1101';
            const sourceAccName = payoutForm.source === 'bank' ? 'البنك' : 'الصندوق';

            const sourceAccId = await getOrCreateAccount(sourceAccCode, sourceAccName, 'asset');
            const payrollExpenseAccId = await getOrCreateAccount('5201', 'مصاريف الأجور والرواتب', 'expense');
            const advancesAccId = await getOrCreateAccount('1202', 'ذمم سلف الموظفين', 'asset');

            // 1. Update Loan repayments in database if deduction took place
            if (loanDeduction > 0) {
                let remainingDeduction = loanDeduction;
                for (const l of selectedUserActiveLoans) {
                    if (remainingDeduction <= 0) break;
                    const lOwed = l.amount - (l.paidAmount || 0);
                    const payToThisLoan = Math.min(remainingDeduction, lOwed);
                    
                    const newPaidTotal = (l.paidAmount || 0) + payToThisLoan;
                    const isFullyPaid = newPaidTotal >= l.amount;
                    
                    await db.loans.update(l.id!, {
                        paidAmount: newPaidTotal,
                        status: isFullyPaid ? 'paid' : 'approved'
                    });
                    remainingDeduction -= payToThisLoan;
                }
            }

            // 2. Double-Entry Accounting journal posting
            // Debit Payroll Expense Account (Gross)
            // Credit Source cash/bank (Net paid)
            // Credit Advances Asset Account (repaid portion if any)
            const lines = [
                {
                    accountId: payrollExpenseAccId,
                    accountName: 'مصاريف الأجور والرواتب',
                    debit: grossSalary,
                    credit: 0,
                    description: `استحقاق الراتب الأساسي لـ ${staffToPayout.name}`
                },
                {
                    accountId: sourceAccId,
                    accountName: sourceAccName,
                    debit: 0,
                    credit: netPayable,
                    description: `صرف صافي الراتب لـ ${staffToPayout.name} - ${payoutForm.source === 'bank' ? 'حوالة بنكية' : 'نقداً'}`
                }
            ];

            if (loanDeduction > 0) {
                lines.push({
                    accountId: advancesAccId,
                    accountName: 'ذمم سلف الموظفين',
                    debit: 0,
                    credit: loanDeduction,
                    description: `استقطاع قسط سلفة مستردة من راتب الموظف ${staffToPayout.name}`
                });
            }

            const journalEntry: JournalEntry = {
                date: new Date(),
                reference: `PAY-EMP-${staffToPayout.id}-${Date.now()}`,
                description: `رواتب ومكافآت الموظف ${staffToPayout.name} - مضافاً للاستقطاعات المحققة`,
                lines,
                totalAmount: grossSalary,
                status: 'posted',
                createdBy: 'نظام إدارة الموارد البشرية'
            };

            await db.journalEntries.add(journalEntry);

            // Update Ledger account values
            const srcAcc = accounts.find(a => a.id === sourceAccId);
            const expenseAcc = accounts.find(a => a.id === payrollExpenseAccId);
            const advAcc = accounts.find(a => a.id === advancesAccId);

            await db.accounts.update(sourceAccId, { balance: (srcAcc?.balance || 0) - netPayable });
            await db.accounts.update(payrollExpenseAccId, { balance: (expenseAcc?.balance || 0) + grossSalary });
            
            if (loanDeduction > 0) {
                await db.accounts.update(advancesAccId, { balance: (advAcc?.balance || 0) - loanDeduction });
            }

            toast.success(`تم صرف الراتب لـ ${staffToPayout.name} بقيمة صافية ${netPayable.toLocaleString()} د.ع بنجاح!`);
            setStaffToPayout(null);
        } catch (error) {
            console.error(error);
            toast.error('حدث عجز محاسبي أثناء صرف الرعاية والرواتب');
        }
    };

    return (
        <div className="p-6 space-y-6 bg-[#FEFEFF] lg:bg-slate-50/50 min-h-screen font-sans antialiased text-slate-800" dir="rtl">
            
            {/* Standard Premium Page Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <UserCheck className="w-8 h-8 text-brand-600" />
                        منصة إدارة وطاقم موظفي المطعم
                    </h1>
                    <p className="text-sm font-medium text-slate-500">
                        تنظيم ملفات الموظفين، تتبع الحضور اليومي، تسييل الرواتب، وإصدار السلف المالية الفورية مع الربط القيّد المالي
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <button 
                        onClick={() => handleOpenStaffModal(false)}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-5  py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-brand-500/10 cursor-pointer w-full lg:w-auto"
                        id="add-staff-btn"
                    >
                        <UserPlus className="w-4 h-4 text-white" />
                        <span>إضافة موظف جديد للطاقم</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats Bento Elements */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Count Metrics */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4.5 group">
                    <div className="p-3.5 bg-brand-50 text-brand-600 rounded-2xl transition-transform duration-500 group-hover:scale-110">
                        <UserCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold">قوة العمل الحالية</p>
                        <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.active} <span className="text-xs text-slate-400 font-bold">نشط</span></p>
                    </div>
                    <div className="mr-auto text-xs font-bold font-mono text-slate-400">من {stats.total}</div>
                </div>

                {/* 2. Payroll Liability estimations */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4.5 group">
                    <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl transition-transform duration-500 group-hover:scale-110">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold">فاتورة الرواتب الشهرية</p>
                        <p className="text-2xl font-black text-emerald-600 mt-0.5">{stats.totalBasePayroll.toLocaleString()} <span className="text-xs font-bold">د.ع</span></p>
                    </div>
                </div>

                {/* 3. Active Loans Ledger */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4.5 group">
                    <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl transition-transform duration-500 group-hover:scale-110">
                        <Scale className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold">ذمم السلف والمستحقات</p>
                        <p className="text-2xl font-black text-amber-600 mt-0.5">{stats.activeAdvances.toLocaleString()} <span className="text-xs font-bold">د.ع</span></p>
                    </div>
                </div>

                {/* 4. Active attendance rate */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4.5 group">
                    <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl transition-transform duration-500 group-hover:scale-110">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold">مؤشر حضور اليوم</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-2xl font-black text-rose-600">{stats.attendancePercent}%</p>
                            <span className="text-[10px] bg-rose-50 border border-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded-full">
                                {attendanceRecords.length} مسجّل
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('directory')}
                    className={`pb-4 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'directory' 
                            ? 'border-brand-600 text-brand-600 font-extrabold' 
                            : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                >
                    <Briefcase className="w-4 h-4" />
                    سجل الموظفين المطول ({filteredStaff.length})
                </button>
                <button 
                    onClick={() => setActiveTab('payroll')}
                    className={`pb-4 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'payroll' 
                            ? 'border-brand-600 text-brand-600 font-extrabold' 
                            : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                >
                    <Receipt className="w-4 h-4" />
                    الحسابات والرواتب والسلف
                </button>
                <button 
                    onClick={() => setActiveTab('attendance')}
                    className={`pb-4 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'attendance' 
                            ? 'border-brand-600 text-brand-600 font-extrabold' 
                            : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                >
                    <Calendar className="w-4 h-4" />
                    سجل الحضور اليومي الفوري
                </button>
            </div>

            {/* TAB CONTENT: 1. Staff Directory */}
            {activeTab === 'directory' && (
                <div className="space-y-4">
                    {/* Filtering Panel */}
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text"
                                placeholder="ابحث باسم الموظف أو رقم الهاتف أو البريد الإلكتروني..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pr-10 pl-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/25 bg-slate-50/50 text-sm"
                            />
                        </div>
                        <div className="w-full md:w-64">
                            <select 
                                value={selectedRole}
                                onChange={e => setSelectedRole(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/25 bg-white text-sm font-bold cursor-pointer"
                            >
                                <option value="">جميع التخصصات</option>
                                {rolesList.map((role, idx) => (
                                    <option key={idx} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Directory List Representation */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-150 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50 text-slate-500 text-xs font-black">
                                    <tr className="border-b border-slate-100 text-right">
                                        <th className="px-6 py-4">الرقم التعريفي</th>
                                        <th className="px-6 py-4">الموظف الاسمي</th>
                                        <th className="px-6 py-4">التخصص والمهنة</th>
                                        <th className="px-6 py-4">رمز الدخول PIN</th>
                                        <th className="px-6 py-4">الراتب الأساسي</th>
                                        <th className="px-6 py-4">التفعيل</th>
                                        <th className="px-6 py-4 text-center">خدمات مالية</th>
                                        <th className="px-6 py-4 text-center">تحديث</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                                    {filteredStaff.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-16 text-center text-slate-400 font-bold">
                                                <UserCircle className="w-10 h-10 mx-auto opacity-30 mb-2" />
                                                لا يوجد موصلات أو موظفين متطابقين لمعايير البحث.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStaff.map((emp) => {
                                            // Dynamic badge coloring
                                            const roleColor = emp.role.includes('مدير') ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                                                            : emp.role.includes('شيف') ? 'bg-amber-50 border-amber-100 text-amber-700'
                                                            : emp.role.includes('كاشير') ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                                            : 'bg-slate-50 border-slate-200 text-slate-600';
                                            return (
                                                <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="font-mono text-xs font-extrabold bg-slate-100 text-slate-500 px-2 py-1 rounded">
                                                            EMP-{String(emp.id).padStart(4, '0')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 font-mono">
                                                                {emp.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-800 leading-none">{emp.name}</h4>
                                                                <span className="text-[11px] text-slate-400 mt-1 font-mono">{emp.phone || 'بدون هاتف'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 text-xs border rounded-full font-bold ${roleColor}`}>
                                                            {emp.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-500 tracking-wider">
                                                        •••• (رمز PIN: {emp.pin})
                                                    </td>
                                                    <td className="px-6 py-4 font-bold font-sans">
                                                        {(emp.baseSalary || 0).toLocaleString()} <span className="text-[10px] text-slate-400">د.ع</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {emp.isActive ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> نشط
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                                                موقوف
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button 
                                                                onClick={() => handleTriggerPayoutModal(emp)}
                                                                disabled={!emp.isActive}
                                                                className="px-2.5 py-1 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 rounded-lg flex items-center gap-1"
                                                            >
                                                                <DollarSign className="w-3.5 h-3.5" />
                                                                <span>صرف الراتب</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleTriggerLoanModal(emp)}
                                                                disabled={!emp.isActive}
                                                                className="px-2.5 py-1 text-xs font-black text-amber-700 bg-amber-50 border border-amber-100 hover:bg-amber-100 rounded-lg flex items-center gap-1"
                                                            >
                                                                <Scale className="w-3.5 h-3.5" />
                                                                <span>صرف سلفة</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button 
                                                                onClick={() => handleOpenStaffModal(true, emp)} 
                                                                className="p-1.5 text-indigo-650 hover:bg-indigo-50 rounded-xl transition-all"
                                                                title="تعديل الموظف"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={() => setStaffToDeleteId(emp.id!)} 
                                                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                                title="حذف الموظف"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 2. Financial & Salary Panel */}
            {activeTab === 'payroll' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left lists for Active system advances */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                            <div>
                                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                                    <Scale className="w-5 h-5 text-amber-600" />
                                    السجل النشط للعهد والسلف المالية
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">المبالغ المصروفة كسلف لمجموع طاقم العمل وتأكيد الاستقطاع الدوري</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-500 text-xs font-black text-right">
                                        <tr className="border-b border-slate-100">
                                            <th className="px-4 py-3">المستفيد</th>
                                            <th className="px-4 py-3">قيمة السلفة الدفترية</th>
                                            <th className="px-4 py-3">الاستقطاع الشهري</th>
                                            <th className="px-4 py-3">المدفوع المسترد</th>
                                            <th className="px-4 py-3">المتبقي المطلوب</th>
                                            <th className="px-4 py-3">الحالة القائمة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loans.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-bold">
                                                    لا توجد سلف أو عهد مالية نشطة حالياً بالنظام.
                                                </td>
                                            </tr>
                                        ) : (
                                            loans.map(loan => {
                                                const emp = staff.find(s => s.id === loan.userId);
                                                if (!emp) return null;
                                                const remaining = loan.amount - (loan.paidAmount || 0);
                                                return (
                                                    <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-4 py-3.5 font-bold text-slate-800">
                                                            {emp.name}
                                                        </td>
                                                        <td className="px-4 py-3.5 font-sans font-bold text-slate-700">
                                                            {loan.amount.toLocaleString()} د.ع
                                                        </td>
                                                        <td className="px-4 py-3.5 font-semibold text-slate-500 font-sans">
                                                            {loan.monthlyDeduction.toLocaleString()} د.ع
                                                        </td>
                                                        <td className="px-4 py-3.5 text-emerald-600 font-sans font-medium">
                                                            {(loan.paidAmount || 0).toLocaleString()} د.ع
                                                        </td>
                                                        <td className="px-4 py-3.5 text-rose-600 font-sans font-black">
                                                            {remaining.toLocaleString()} د.ع
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            {loan.status === 'paid' ? (
                                                                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">تم السداد كاملاً</span>
                                                            ) : (
                                                                <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">قيد السداد</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Accounting ledger preview */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                            <div>
                                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-600" />
                                    أخر المعاملات المحاسبية للرواتب بالدفاتر (ERP Journal Entries)
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">الربط التلقائي والقيود الصادرة لرواتب وسلف الموظفين في الحسابات العامة</p>
                            </div>

                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                                {journalEntries
                                    .filter(j => j.reference?.startsWith('PAY-') || j.reference?.startsWith('EMP-ADV-'))
                                    .map(je => (
                                        <div key={je.id} className="p-3.5 bg-slate-50/75 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded">
                                                        {je.reference}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(je.date).toLocaleDateString('ar-EG', { dateStyle: 'short' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-700 mt-1.5">{je.description}</p>
                                            </div>
                                            <div className="text-left shrink-0 self-end sm:self-auto">
                                                <div className="font-sans font-black text-sm text-slate-800">{je.totalAmount.toLocaleString()} د.ع</div>
                                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5 inline-block">رحل بنجاح</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Payroll summary statistics side ledger */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                            <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                                <TrendingUp className="w-5 h-5 text-brand-600" />
                                ملخص الالتزامات والأجور
                            </h3>

                            <div className="space-y-3.5 pt-2">
                                <div className="flex justify-between text-xs font-bold border-b border-slate-100 pb-2.5">
                                    <span className="text-slate-500">مجموع الرواتب المعطلة:</span>
                                    <span className="text-slate-800 font-sans font-extrabold">{stats.totalBasePayroll.toLocaleString()} د.ع</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold border-b border-slate-100 pb-2.5">
                                    <span className="text-slate-500">تمويل السلف الجارية:</span>
                                    <span className="text-amber-600 font-sans font-extrabold">{stats.activeAdvances.toLocaleString()} د.ع</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold pt-2">
                                    <span className="text-slate-500">تكلفة الرواتب المعتمدة:</span>
                                    <span className="text-emerald-700 font-sans font-black">{(stats.totalBasePayroll - stats.activeAdvances).toLocaleString()} د.ع</span>
                                </div>
                            </div>

                            <div className="bg-indigo-50/50 p-4 border border-indigo-100 text-indigo-950 font-medium text-xs rounded-2xl leading-relaxed mt-4">
                                <p className="font-bold flex items-center gap-1 mb-1">
                                    <Check className="w-4 h-4 text-indigo-700" /> 
                                    تذكير محاسبي:
                                </p>
                                يتم ترحيل مصاريف الرواتب لحساب الأرباح والخسائر وحساب الصندوق بنظام القيد المزدوج مباشرة لتجنب التكرار اليدوي.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 3. Daily Attendance simulator */}
            {activeTab === 'attendance' && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6 animate-fadeIn">
                    
                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                        <div className="space-y-0.5">
                            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-650" />
                                تحضير وتتبع حركة الحضور ونظام الأجر اليومي التفصيلي
                            </h3>
                            <p className="text-xs text-slate-400">سجل وتعديل أوقات الحضور الفعلي وحساب ساعات العمل المنجزة وتأثيراتها المالية تلقائياً</p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 shadow-sm">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <input 
                                type="date" 
                                value={attendanceDate}
                                onChange={e => setAttendanceDate(e.target.value)}
                                className="bg-transparent border-none text-slate-700 font-black text-xs focus:outline-none cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Attendance Grid list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {staff.filter(s => s.isActive).map((emp) => {
                            const att = attendanceRecords.find(a => a.userId === emp.id);
                            const presentStatus = att?.status || 'none';

                            // Target shift bounds
                            const shiftIn = emp.shiftStartTime || '09:00';
                            const shiftOut = emp.shiftEndTime || '17:00';
                            
                            // Calculate normal target hours
                            const [sInH, sInM] = shiftIn.split(':').map(Number);
                            const [sOutH, sOutM] = shiftOut.split(':').map(Number);
                            const targetHours = !isNaN(sInH) && !isNaN(sOutH) 
                                ? Math.max(1, parseFloat((((sOutH * 60 + sOutM) - (sInH * 60 + sInM)) / 60).toFixed(1)))
                                : 8;

                            // Calculate actual completed hours
                            const actualHours = presentStatus !== 'none' && (presentStatus === 'present' || presentStatus === 'late')
                                ? calculateWorkingHours(att?.checkInTime, att?.checkOutTime)
                                : 0;

                            // Calculate estimated daily wages based on hours
                            const standardDailyWage = Math.round((emp.baseSalary || 1200000) / 26);
                            let actualDailyWage = 0;
                            if (presentStatus === 'present' || presentStatus === 'late') {
                                if (att?.checkInTime && att?.checkOutTime) {
                                    // Proportionate to computed working hours
                                    actualDailyWage = Math.min(standardDailyWage, Math.round(standardDailyWage * (actualHours / targetHours)));
                                } else if (att?.checkInTime) {
                                    // Checked in, but not checked out yet -> partial estimate or full default if hours are standard, but let's assume they are present
                                    actualDailyWage = standardDailyWage;
                                }
                            } else if (presentStatus === 'excused') {
                                // Maybe paid or unpaid - let's say 50% or full, let's assume standard full or 50%
                                actualDailyWage = Math.round(standardDailyWage * 0.5);
                            } else if (presentStatus === 'absent') {
                                actualDailyWage = 0;
                            }

                            return (
                                <div 
                                    key={emp.id} 
                                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 bg-white shadow-sm ${
                                        presentStatus === 'present' ? 'border-emerald-250 ring-2 ring-emerald-500/5 bg-emerald-50/10' :
                                        presentStatus === 'late' ? 'border-amber-250 ring-2 ring-amber-500/5 bg-amber-50/10' :
                                        presentStatus === 'absent' ? 'border-rose-250 bg-rose-50/10' :
                                        presentStatus === 'excused' ? 'border-blue-250 bg-blue-50/10' :
                                        'border-slate-100'
                                    }`}
                                >
                                    
                                    {/* Employee Profile Section */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-sm font-black shrink-0">
                                                {emp.name.charAt(0)}
                                            </div>
                                            <div className="space-y-0.5 text-right">
                                                <h4 className="font-extrabold text-sm text-slate-800">{emp.name}</h4>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">{emp.role}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                                                        ⏱️ الوردية: {shiftIn} - {shiftOut}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-left shrink-0">
                                            {presentStatus === 'present' && (
                                                <span className="bg-emerald-100 text-emerald-850 text-[10px] font-black px-2.5 py-1 rounded-full">✓ حاضر</span>
                                            )}
                                            {presentStatus === 'late' && (
                                                <span className="bg-amber-100 text-amber-850 text-[10px] font-black px-2.5 py-1 rounded-full">⚠️ متأخر ({att?.lateMinutes || 0} د)</span>
                                            )}
                                            {presentStatus === 'absent' && (
                                                <span className="bg-rose-100 text-rose-850 text-[10px] font-black px-2.5 py-1 rounded-full">✕ غائب عن العمل</span>
                                            )}
                                            {presentStatus === 'excused' && (
                                                <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-1 rounded-full">📝 إجازة / عذر</span>
                                            )}
                                            {presentStatus === 'none' && (
                                                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full">غير مثبت</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Fast status switches */}
                                    <div className="grid grid-cols-4 gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                                        {[
                                            { key: 'present', label: 'حاضر', color: 'text-emerald-700 bg-transparent' },
                                            { key: 'late', label: 'متأخر', color: 'text-amber-700 bg-transparent' },
                                            { key: 'absent', label: 'غائب', color: 'text-rose-700 bg-transparent' },
                                            { key: 'excused', label: 'إجازة', color: 'text-blue-700 bg-transparent' }
                                        ].map((btn) => (
                                            <button
                                                key={btn.key}
                                                type="button"
                                                onClick={() => {
                                                    const defaultInTime = btn.key === 'present' ? shiftIn : (btn.key === 'late' ? '09:30' : undefined);
                                                    handleSaveCustomAttendance(
                                                        emp.id!, 
                                                        btn.key as any, 
                                                        defaultInTime, 
                                                        btn.key === 'present' || btn.key === 'late' ? att?.checkOutTime || shiftOut : undefined,
                                                        att?.notes
                                                    );
                                                }}
                                                className={`py-1.5 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer text-center ${
                                                    presentStatus === btn.key 
                                                        ? 'bg-white shadow-xs text-slate-900 border border-slate-200' 
                                                        : `text-slate-400 hover:bg-slate-100/60 ${btn.color}`
                                                }`}
                                            >
                                                {btn.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Action forms for simulation and manual logging */}
                                    {presentStatus !== 'none' && (
                                        <div className="space-y-3 pt-1 border-t border-slate-200/50">
                                            
                                            {/* Times row */}
                                            {(presentStatus === 'present' || presentStatus === 'late') && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="text-right">
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">وقت الحضور الفعلي:</label>
                                                        <input 
                                                            type="time" 
                                                            value={att?.checkInTime || ''}
                                                            onChange={(e) => {
                                                                handleSaveCustomAttendance(
                                                                    emp.id!, 
                                                                    presentStatus as any, 
                                                                    e.target.value, 
                                                                    att?.checkOutTime, 
                                                                    att?.notes
                                                                );
                                                            }}
                                                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs text-center font-mono font-bold"
                                                        />
                                                    </div>
                                                    <div className="text-right">
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">وقت الانصراف الفعلي:</label>
                                                        <input 
                                                            type="time" 
                                                            value={att?.checkOutTime || ''}
                                                            onChange={(e) => {
                                                                handleSaveCustomAttendance(
                                                                    emp.id!, 
                                                                    presentStatus as any, 
                                                                    att?.checkInTime, 
                                                                    e.target.value, 
                                                                    att?.notes
                                                                );
                                                            }}
                                                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs text-center font-mono font-bold"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Notes / Memos row */}
                                            <div className="text-right">
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">مذكرات وتبريرات الحضور والغياب:</label>
                                                <input 
                                                    type="text" 
                                                    value={att?.notes || ''}
                                                    onChange={(e) => {
                                                        const txt = e.target.value;
                                                        if (att?.id) {
                                                            db.attendance.update(att.id, { notes: txt });
                                                        }
                                                    }}
                                                    placeholder="تأخر بعذر، إذن مرضي، عمل إضافي..."
                                                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none text-xs text-slate-700 bg-slate-50/50 text-right"
                                                />
                                            </div>

                                            {/* Working hours metrics summary */}
                                            <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100 flex flex-col gap-1 text-[11px] text-right">
                                                <div className="flex justify-between font-medium">
                                                    <span className="text-slate-400">ساعات الوردية المستهدفة:</span>
                                                    <span className="font-extrabold text-slate-600 font-mono">{targetHours} ساعات</span>
                                                </div>
                                                
                                                {(presentStatus === 'present' || presentStatus === 'late') && (
                                                    <div className="flex justify-between font-medium">
                                                        <span className="text-slate-400">ساعات العمل الفعلية:</span>
                                                        <span className={`font-black font-mono flex items-center gap-1 ${
                                                            actualHours >= targetHours ? 'text-emerald-700' : 'text-amber-700'
                                                        }`}>
                                                            {att?.checkOutTime ? `${actualHours} ساعة عمل` : 'على رأس العمل (لم ينصرف بعد)'}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex justify-between font-semibold border-t border-slate-200/55 pt-1.5 mt-1">
                                                    <span className="text-slate-500">الأجر المستحق لليوم:</span>
                                                    <span className={`font-black font-sans ${
                                                        actualDailyWage === standardDailyWage ? 'text-slate-800' : 
                                                        actualDailyWage > 0 ? 'text-indigo-700' : 'text-rose-600'
                                                    }`}>
                                                        {actualDailyWage.toLocaleString()} د.ع 
                                                        <span className="text-[9px] text-slate-400 font-medium mr-1.5">
                                                            (من أصل {standardDailyWage.toLocaleString()})
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Quick Actions at bottom */}
                                            <div className="flex justify-end gap-1.5 pt-0.5">
                                                {!(presentStatus === 'absent' || presentStatus === 'excused') && !att?.checkOutTime && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleAttendanceCheckout(emp.id!)}
                                                        className="px-3 py-1.5 text-[10px] font-black bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer"
                                                    >
                                                        تسجيل انصراف مغادر ⏱️
                                                    </button>
                                                )}
                                                <button 
                                                    type="button"
                                                    onClick={async () => {
                                                        if (att?.id) {
                                                            await db.attendance.delete(att.id);
                                                            toast.success('تم تصفير سجل اليوم للموظف');
                                                        }
                                                    }}
                                                    className="px-2.5 py-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                                >
                                                    إلغاء الحضور اليومي
                                                </button>
                                            </div>

                                        </div>
                                    )}

                                    {presentStatus === 'none' && (
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold leading-relaxed pt-6 pb-6">
                                            الموظف غائب أو غير مسجل بعد لهذا التاريخ. حدد الحالة أعلاه لبدء رصد الوقت والأجر.
                                        </div>
                                    )}

                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* POPUP MODAL 1: ADD / EDIT EMPLOYEE */}
            <AnimatePresence>
                {isStaffModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">
                                        {isEditMode ? 'تعديل السجل المهني والمالي' : `إضافة موظف جديد لطاقم المطعم`}
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">الملف الشخصي والراتب ورمز الصلاحيات التابع للنظام</p>
                                </div>
                                <button 
                                    onClick={() => setIsStaffModalOpen(false)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                                    type="button"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSaveStaff} className="p-6 space-y-5">
                                {/* Custom High-Contrast Tabs System */}
                                <div className="flex border border-slate-200 bg-slate-50 p-1.5 gap-2 rounded-2xl animate-fade-in" dir="rtl">
                                    {[
                                        { id: 'basic', label: 'البيانات الشخصية والمالية 📋' },
                                        { id: 'shifts', label: 'مواعيد الدوام وملاحظات العمل ⏱️' },
                                        { id: 'permissions', label: 'صلاحيات النظام الموحدة 🔐', badge: staffFormData.permissions?.length || 0 }
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setStaffModalTab(t.id as any)}
                                            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 select-none transition-all duration-200 ${
                                                staffModalTab === t.id 
                                                    ? 'bg-brand-600 text-white shadow-md shadow-brand-550/10 scale-[1.01]' 
                                                    : 'text-slate-600 hover:text-slate-800 bg-white border border-slate-100 hover:bg-slate-50 cursor-pointer'
                                            }`}
                                        >
                                            <span>{t.label}</span>
                                            {t.badge !== undefined && t.badge > 0 && (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                    staffModalTab === t.id ? 'bg-white text-brand-600' : 'bg-slate-200 text-slate-700'
                                                }`}>
                                                    {t.badge}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab 1: Personal & Financial Data */}
                                {staffModalTab === 'basic' && (
                                    <div className="space-y-4 animate-in fade-in duration-150">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">الاسم رباعي للموظف *</label>
                                        <input 
                                            type="text" 
                                            value={staffFormData.name}
                                            onChange={(e) => setStaffFormData({...staffFormData, name: e.target.value})}
                                            required
                                            placeholder="أدخل الاسم رباعي لتجنب التشابه"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:outline-none text-sm bg-slate-50/50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">التصنيف الوظيفي الأساسي *</label>
                                        <select 
                                            value={staffFormData.role}
                                            onChange={(e) => setStaffFormData({...staffFormData, role: e.target.value})}
                                            required
                                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:outline-none text-sm bg-white"
                                        >
                                            {rolesList.map((role, idx) => (
                                                <option key={idx} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">رقم الهاتف النشط</label>
                                        <input 
                                            type="tel"
                                            value={staffFormData.phone}
                                            onChange={(e) => setStaffFormData({...staffFormData, phone: e.target.value})}
                                            placeholder="07xxxxxxxxx"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-left focus:ring-2 focus:ring-brand-500/20 focus:outline-none text-sm bg-slate-50/50 font-mono"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">رمز الكاشير / البينكود (PIN) *</label>
                                        <input 
                                            type="text" 
                                            maxLength={8}
                                            value={staffFormData.pin}
                                            onChange={(e) => setStaffFormData({...staffFormData, pin: e.target.value.replace(/\D/g, '')})}
                                            required
                                            placeholder="أدخل بحد أدنى 4 أرقام عددية"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-center text-sm font-semibold tracking-widest focus:ring-2 focus:ring-brand-500/20 focus:outline-none bg-slate-50/50 font-mono"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">الراتب الأساسي الشهري *</label>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                min={0}
                                                value={staffFormData.baseSalary}
                                                onChange={(e) => setStaffFormData({...staffFormData, baseSalary: Number(e.target.value)})}
                                                required
                                                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:outline-none text-sm bg-slate-50/50 font-sans font-bold text-slate-800"
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">د.ع</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">قناة صرف الرواتب المفضلة</label>
                                        <select 
                                            value={staffFormData.paymentMethod}
                                            onChange={(e) => setStaffFormData({...staffFormData, paymentMethod: e.target.value as 'cash' | 'bank'})}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:outline-none text-sm bg-white cursor-pointer"
                                        >
                                            <option value="cash">نقداً (الصندوق)</option>
                                            <option value="bank">حوالة بنكية</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">تاريخ مباشرة العمل</label>
                                        <input 
                                            type="date"
                                            value={staffFormData.startDate}
                                            onChange={(e) => setStaffFormData({...staffFormData, startDate: e.target.value})}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:outline-none text-sm bg-white cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">البريد الإلكتروني</label>
                                        <input 
                                            type="email" 
                                            value={staffFormData.email}
                                            onChange={(e) => setStaffFormData({...staffFormData, email: e.target.value})}
                                            placeholder="example@restaurant.com"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-left focus:ring-2 focus:ring-brand-500/20 focus:outline-none text-sm bg-slate-50/50 font-mono"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">رقم الحساب البنكي / الايبان</label>
                                        <input 
                                            type="text" 
                                            value={staffFormData.bankAccount}
                                            onChange={(e) => setStaffFormData({...staffFormData, bankAccount: e.target.value})}
                                            placeholder="IQ.........................."
                                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-left focus:ring-2 focus:ring-brand-500/20 focus:outline-none text-sm bg-slate-50/50 font-mono"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">العنوان السكني الحالي</label>
                                    <input 
                                        type="text" 
                                        value={staffFormData.address}
                                        onChange={(e) => setStaffFormData({...staffFormData, address: e.target.value})}
                                        placeholder="المحافظة - المدينة - الحي السكني"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:outline-none text-sm bg-slate-50/50"
                                    />
                                </div>

                            </div>
                        )}

                        {/* Tab 2: Shift Timings & Notes */}
                        {staffModalTab === 'shifts' && (
                            <div className="space-y-4 animate-in fade-in duration-150">
                                {/* Shift target hours */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">بداية وردية الدوام الجاري الحضور</label>
                                        <input 
                                            type="time" 
                                            value={staffFormData.shiftStartTime}
                                            onChange={(e) => setStaffFormData({...staffFormData, shiftStartTime: e.target.value})}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:outline-none text-sm bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">نهاية وردية الدوام الانصراف</label>
                                        <input 
                                            type="time" 
                                            value={staffFormData.shiftEndTime}
                                            onChange={(e) => setStaffFormData({...staffFormData, shiftEndTime: e.target.value})}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:outline-none text-sm bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5 font-sans">مذكرات خاصة وسوابق طبية/إدارية</label>
                                    <textarea 
                                        rows={3}
                                        value={staffFormData.notes}
                                        onChange={(e) => setStaffFormData({...staffFormData, notes: e.target.value})}
                                        placeholder="أي ملاحظات حول الموظف أو شروط التعاقد الخاصة"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:outline-none text-sm bg-slate-50/50"
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Unified Permissions System */}
                        {staffModalTab === 'permissions' && (
                            <div className="space-y-4 animate-in fade-in duration-150">
                                {/* Permissions checklist grouped by screen section */}
                                <div className="space-y-4">
                                    <label className="block text-xs font-bold text-slate-700">تحديد صلاحيات الموظف التفصيلية والgranular على النظام الموحد</label>
                                    
                                    {[
                                        {
                                            categoryName: 'إدارة صالة الطعام والخدمة الطاولات 🏛️',
                                            bg: 'bg-indigo-50/20 border-indigo-100',
                                            items: [
                                                { id: 'tables_manage', label: 'إضافة/تعديل/حذف الطاولات 📋', desc: 'حق تعديل تشكيل طاولات الصالون، فتح زونات جديدة وحذف طاولات معينة من النظام' }
                                            ]
                                        },
                                        {
                                            categoryName: 'عمليات نقطة البيع والكاشير المتقدمة 🛒',
                                            bg: 'bg-emerald-50/20 border-emerald-100',
                                            items: [
                                                { id: 'pos_sales', label: 'صلاحية البيع وإصدار الفواتير 💸', desc: 'إمساك الكاونتر، أخذ طلبيات الزبائن، دفع الكاش والدليفري والذهاب للمطبخ' },
                                                { id: 'pos_discount', label: 'صلاحية إدراج خصم مالي 🏷️', desc: 'تخفيض قيمة الفاتورة بنسبة مئوية أو قيمة مالية ثابتة للزبون' },
                                                { id: 'pos_offers', label: 'تقديم العروض الترويجية والكومبو 🎁', desc: 'تفعيل وتطبيق باقات العروض (اشترِ قطعة واحصل على الثانية، خصومات العشاء)' },
                                                { id: 'pos_returns', label: 'إجراء المرتجعات وإلغاء فواتير 🔁', desc: 'إلغاء وجبات من الطلبات المسددة وإجراء المرتجع المالي وVoid Items' },
                                            ]
                                        },
                                        {
                                            categoryName: 'حقوق الأقسام والتحكم الفني الخلفي 🧪',
                                            bg: 'bg-slate-50 border-slate-200',
                                            items: [
                                                { id: 'kitchen_prep', label: 'شاشة المطبخ والتحضير 🍳', desc: 'تجهيز وتدوير طلببات الأكل وتسليم الكولير' },
                                                { id: 'inventory_edit', label: 'المخزن وإمدادات المواد 📦', desc: 'متابعة بضاعة المطبخ وقبول الاستلامات والإتلاف' },
                                                { id: 'hr_attendance', label: 'شؤون الموظفين والرواتب 👥', desc: 'تسجيل الحضور والانصراف وترحيل المعاملات والرواتب' },
                                                { id: 'accounting_ledger', label: 'المحاسبة والقيود والتقارير 📊', desc: 'استعراض القيود المالية ودفاتر الأستاذ لعموم المطعم' },
                                                { id: 'cost_admin', label: 'الوصول والسيطرة الإدارية الشاملة 🔐', desc: 'حق تعديل أي معلومات، تخفيضات، أو حذف قيود' },
                                            ]
                                        }
                                    ].map((group, groupIdx) => (
                                        <div key={groupIdx} className={`p-4 rounded-2xl border ${group.bg} space-y-3`}>
                                            <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5 pb-1 border-b border-dashed border-slate-200">
                                                {group.categoryName}
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                                {group.items.map((perm) => {
                                                    const isChecked = staffFormData.permissions?.includes(perm.id);
                                                    return (
                                                        <div 
                                                            key={perm.id} 
                                                            onClick={() => {
                                                                const current = staffFormData.permissions || [];
                                                                const next = isChecked 
                                                                    ? current.filter(x => x !== perm.id)
                                                                    : [...current, perm.id];
                                                                setStaffFormData({...staffFormData, permissions: next});
                                                            }}
                                                            className={`p-3 rounded-xl border text-right cursor-pointer transition-all flex items-start gap-3 select-none ${
                                                                isChecked 
                                                                    ? 'border-brand-550 bg-white shadow-xs ring-2 ring-brand-500/10' 
                                                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            <input 
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                readOnly
                                                                className="mt-1 w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
                                                            />
                                                            <div className="space-y-0.5 pointer-events-none">
                                                                <p className="text-xs font-black text-slate-800">{perm.label}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold leading-normal">{perm.desc}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="hidden">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5 font-sans">مذكرات خاصة وسوابق طبية/إدارية</label>
                                    <textarea 
                                        rows={3}
                                        value={staffFormData.notes}
                                        onChange={(e) => setStaffFormData({...staffFormData, notes: e.target.value})}
                                        placeholder="أي ملاحظات حول الموظف أو شروط التعاقد الخاصة"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:outline-none text-sm bg-slate-50/50"
                                    ></textarea>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <input 
                                        type="checkbox" 
                                        id="modal-isActive"
                                        checked={staffFormData.isActive}
                                        onChange={(e) => setStaffFormData({...staffFormData, isActive: e.target.checked})}
                                        className="w-4.5 h-4.5 text-brand-600 border-slate-300 rounded focus:ring-brand-500 transition-colors cursor-pointer"
                                    />
                                    <label htmlFor="modal-isActive" className="text-xs text-slate-600 font-bold cursor-pointer">
                                        تفعيل حساب الموظف (يمكنه تسجيل الدخول واستقبال الطلبيات كويتر أو شيف بالدخول الموحد)
                                    </label>
                                </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                    <button 
                                        type="button"
                                        onClick={() => setIsStaffModalOpen(false)}
                                        className="px-6 py-3 border border-slate-200 text-slate-600 text-xs font-bold rounded-2xl hover:bg-slate-50 transition-colors"
                                    >
                                        إلغاء الإجراء
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-8 py-3 bg-brand-600 text-white text-xs font-black rounded-2xl hover:bg-brand-700 transition-colors flex items-center gap-1.5"
                                    >
                                        <span>حفظ بيانات الموظف بنجاح</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* POPUP MODAL 2: LOAN / ADVANCE ISSUING */}
            <AnimatePresence>
                {isLoanModalOpen && selectedLoanUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden text-right"
                        >
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-amber-50 rounded-t-3xl text-amber-900">
                                <div>
                                    <h3 className="text-sm font-black flex items-center gap-1.5">
                                        <Scale className="w-5 h-5 text-amber-700 animate-pulse" />
                                        طلب وصرف سلفة مالية فورية للموظف
                                    </h3>
                                    <p className="text-[10px] text-amber-700/85 font-medium mt-0.5">المستفيد: {selectedLoanUser.name}</p>
                                </div>
                                <button 
                                    onClick={() => setIsLoanModalOpen(false)}
                                    className="p-1 text-amber-900 hover:bg-amber-100/50 rounded-full cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleCreateLoan} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">مبلغ السلفة المطلوب صرفه نقداً *</label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            value={loanForm.amount}
                                            onChange={e => {
                                                const amt = Number(e.target.value);
                                                setLoanForm({
                                                    ...loanForm,
                                                    amount: amt,
                                                    monthlyDeduction: Math.round(amt / (loanForm.installmentMonths || 1))
                                                });
                                            }}
                                            required
                                            min={10000}
                                            className="w-full pr-4 pl-12 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-sans font-bold"
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">د.ع</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">شهور تقسيط السداد *</label>
                                        <input 
                                            type="number"
                                            value={loanForm.installmentMonths}
                                            onChange={e => {
                                                const months = Math.max(1, Number(e.target.value));
                                                setLoanForm({
                                                    ...loanForm,
                                                    installmentMonths: months,
                                                    monthlyDeduction: Math.round(loanForm.amount / months)
                                                });
                                            }}
                                            required
                                            min={1}
                                            max={24}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-sans font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">الاستقطاع المالي الشهري</label>
                                        <div className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 text-xs font-sans font-black leading-tight text-center">
                                            {loanForm.monthlyDeduction.toLocaleString()} د.ع
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">سبب استدعاء السلفة</label>
                                    <input 
                                        type="text"
                                        value={loanForm.reason}
                                        onChange={e => setLoanForm({...loanForm, reason: e.target.value})}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-sm"
                                        placeholder="سبب السلفة (اختياري)"
                                    />
                                </div>

                                <div className="bg-amber-50/70 p-3.5 border border-amber-100 rounded-2xl text-[11px] text-amber-950 font-semibold leading-relaxed">
                                    ⚠️ بمجرد ترحيل الرابط المالي، سيتم تخفيض رصيد حساب الصندوق بمقدار السلفة، وزيادة أصل حساب سلف الموظفين بالدفاتر.
                                </div>

                                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsLoanModalOpen(false)}
                                        className="px-4 py-2.5 border border-slate-200 text-slate-600 text-[11px] rounded-xl font-bold cursor-pointer hover:bg-slate-50"
                                    >
                                        إغلاق
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-black tracking-wide"
                                    >
                                        صرف السلفة المحاسبية للفرد 💵
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* POPUP MODAL 3: PAYROLL DISBURSEMENT WITH LOAN DEDUCTION INTEGRATION */}
            <AnimatePresence>
                {staffToPayout && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden text-right"
                        >
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50 rounded-t-3xl text-emerald-900">
                                <div>
                                    <h3 className="text-sm font-black flex items-center gap-1.5">
                                        <Wallet className="w-5 h-5 text-emerald-700" />
                                        صرف الراتب المالي المعتمد وتوليد السجل
                                    </h3>
                                    <p className="text-[10px] text-emerald-700/85 font-semibold mt-0.5">المستفيد: {staffToPayout.name}</p>
                                </div>
                                <button 
                                    onClick={() => setStaffToPayout(null)}
                                    className="p-1 text-emerald-900 hover:bg-emerald-100/50 rounded-full cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleProcessPayroll} className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">الراتب المراد صرفه</label>
                                        <input 
                                            type="number"
                                            value={payoutForm.amount}
                                            onChange={e => setPayoutForm({...payoutForm, amount: Number(e.target.value)})}
                                            required
                                            min={0}
                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-sans font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">صندوق البند المالي الصارف</label>
                                        <select 
                                            value={payoutForm.source}
                                            onChange={e => setPayoutForm({...payoutForm, source: e.target.value as 'cash' | 'bank'})}
                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-none text-xs font-bold cursor-pointer bg-white"
                                        >
                                            <option value="cash">الصندوق النقدي (1101)</option>
                                            <option value="bank">الحساب البنكي (1102)</option>
                                        </select>
                                    </div>
                                </div>

                                {outstandingLoanForUser > 0 && (
                                    <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-2xl space-y-2">
                                        <p className="text-xs text-amber-900 font-extrabold flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4 text-amber-700" />
                                            سلف وذمم الموظف القائمة بالنظام!
                                        </p>
                                        <div className="flex justify-between text-[11px] text-slate-600 font-semibold">
                                            <span>إجمالي ذمة الموظف:</span>
                                            <span className="font-bold text-rose-600 font-sans">{outstandingLoanForUser.toLocaleString()} د.ع</span>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1 border-t border-amber-200/50">
                                            <input 
                                                type="checkbox"
                                                id="deduct-loan-check"
                                                checked={payoutForm.deductLoan}
                                                onChange={e => setPayoutForm({...payoutForm, deductLoan: e.target.checked})}
                                                className="w-4 h-4 text-amber-600 border-slate-300 rounded cursor-pointer"
                                            />
                                            <label htmlFor="deduct-loan-check" className="text-[10px] text-slate-700 font-bold cursor-pointer">
                                                استقطاع القسط المستحق لهذا الشهر ({Math.min(selectedUserActiveLoans[0]?.monthlyDeduction || 100000, outstandingLoanForUser).toLocaleString()} د.ع)
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">المرئيات التفصيلية</label>
                                    <input 
                                        type="text"
                                        value={payoutForm.notes}
                                        onChange={e => setPayoutForm({...payoutForm, notes: e.target.value})}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
                                    />
                                </div>

                                {/* Live Calculations */}
                                <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-2 border border-slate-100">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-bold">إجمالي الرائفة والمكافأة:</span>
                                        <span className="font-bold font-sans text-slate-700">{payoutForm.amount.toLocaleString()} د.ع</span>
                                    </div>
                                    {payoutForm.deductLoan && outstandingLoanForUser > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-bold">الاستقطاع المسترد لصالح السلفة:</span>
                                            <span className="font-bold font-sans text-rose-600">
                                                -{Math.min(selectedUserActiveLoans[0]?.monthlyDeduction || 100000, outstandingLoanForUser).toLocaleString()} د.ع
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-sm text-slate-900">
                                        <span>صافي المبلغ المدفوع باليد / الحساب:</span>
                                        <span className="text-emerald-700 font-sans">
                                            {(payoutForm.amount - (payoutForm.deductLoan && outstandingLoanForUser > 0 ? Math.min(selectedUserActiveLoans[0]?.monthlyDeduction || 100050, outstandingLoanForUser) : 0)).toLocaleString()} د.ع
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2.5">
                                    <button 
                                        type="button" 
                                        onClick={() => setStaffToPayout(null)}
                                        className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-50"
                                    >
                                        تراجع
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black"
                                    >
                                        اعتماد وصرف الراتب النهائي 🔒
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* POPUP MODAL 4: SAFELY REPLACES DESTRUCTIVE WINDOWY CONFIRMS */}
            <AnimatePresence>
                {staffToDeleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-right flex flex-col space-y-4"
                        >
                            <div className="text-rose-600 bg-rose-50 p-3.5 rounded-2xl w-fit">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-base font-black text-slate-900">تاكيد حذف ملف الموظف نهائياً؟</h3>
                            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                                انتبه! سيتم حذف كافة السجلات والبيانات الأساسية وصلاحيات الدخول الخاصة بالموظف من النظام الموحد. لا يمكن التراجع عن هذا القرار لاحقاً.
                            </p>
                            <div className="flex items-center justify-end gap-2.5 pt-3">
                                <button 
                                    onClick={() => setStaffToDeleteId(null)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                                >
                                    إلغاء الإجراء
                                </button>
                                <button 
                                    onClick={handleConfirmDelete}
                                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                                >
                                    تأكيد الحذف نهائياً 🗑️
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};
