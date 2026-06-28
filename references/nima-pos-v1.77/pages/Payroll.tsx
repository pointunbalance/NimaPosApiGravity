import { AccountingEngine } from '../services/AccountingEngine';
import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { User } from '../types';
import PayrollHeader from '../components/payroll/PayrollHeader';
import PayrollStats from '../components/payroll/PayrollStats';
import PayrollTable from '../components/payroll/PayrollTable';
import PayrollHistoryModal from '../components/payroll/PayrollHistoryModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';

const Payroll: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchTerm, setSearchTerm] = useState('');
  
  // Payroll Processing State
  const [bonuses, setBonuses] = useState<Record<number, number>>({});
  const [deductions, setDeductions] = useState<Record<number, number>>({});
  const [daysWorked, setDaysWorked] = useState<Record<number, number>>({}); // New: Days Worked
  const [notes, setNotes] = useState<Record<number, string>>({}); // New: Notes for bonus/deduction

  const [processedUsers, setProcessedUsers] = useState<Set<number>>(new Set());
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [historyUser, setHistoryUser] = useState<User | null>(null);

  const { success, error: toastError } = useToast();
  const [confirmState, setConfirmState] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      onConfirm: () => void;
      confirmText?: string;
      cancelText?: string;
  }>({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {}
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => {
      setConfirmState({
          isOpen: true,
          title,
          message,
          onConfirm,
          confirmText,
          cancelText
      });
  };

  const users = useLiveQuery(() => db.users.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const expenses = useLiveQuery(() => db.expenses.toArray(), []);
  const loans = useLiveQuery(() => db.loans.where('status').equals('approved').toArray(), []);
  const appraisals = useLiveQuery(() => db.performanceAppraisals.toArray(), []);
  const fiscalYears = useLiveQuery(() => db.fiscalYears.toArray(), []);
  const employeeBenefits = useLiveQuery(() => db.employeeBenefits.toArray(), []);
  const attendance = useLiveQuery(() => db.attendance.toArray(), []);

  const currencyCode = settings?.currencyCode || 'IQD';
  const STANDARD_WORK_DAYS = 30; // Default days in month for salary calc

  // --- Auto-calculate bonuses and deductions ---
  useEffect(() => {
    if (!users) return;

    const newBonuses: Record<number, number> = {};
    const newDeductions: Record<number, number> = {};
    const newDaysWorked: Record<number, number> = {};
    const newNotes: Record<number, string> = {};

    users.forEach(u => {
      if (!u.id) return;
      
      let userBonus = 0;
      let userDeduction = 0;
      let absentDays = 0;
      let lateDays = 0;

      // Calculate attendance
      if (attendance) {
        const userAttendance = attendance.filter(a => 
          a.userId === u.id && 
          a.date.startsWith(selectedMonth)
        );

        absentDays = userAttendance.filter(a => a.status === 'absent').length;
        lateDays = userAttendance.filter(a => a.status === 'late').length;

        // Auto-calculate days worked (assuming 30 standard - absent)
        const activeDays = STANDARD_WORK_DAYS - absentDays;
        newDaysWorked[u.id] = Math.max(0, activeDays);

        // Deduct for lateness (e.g., 0.25 day per late)
        if (lateDays > 0) {
          const daySalary = (u.baseSalary || 0) / STANDARD_WORK_DAYS;
          const latePenalty = lateDays * (daySalary * 0.25); // 25% of day's pay
          userDeduction += latePenalty;
          newNotes[u.id] = (newNotes[u.id] ? newNotes[u.id] + ' | ' : '') + `تأخير ${lateDays} أيام`;
        }
        
        if (absentDays > 0) {
          newNotes[u.id] = (newNotes[u.id] ? newNotes[u.id] + ' | ' : '') + `غياب ${absentDays} أيام`;
        }
      }

      // Calculate deductions from active loans
      if (loans) {
        const userLoans = loans.filter(l => l.userId === u.id);
        userLoans.forEach(loan => {
          // Check if loan is active for this month
          const startDate = new Date(loan.startDate);
          const currentMonth = new Date(selectedMonth + '-01');
          
          if (currentMonth >= startDate) {
            const remaining = loan.amount - (loan.paidAmount || 0);
            if (remaining > 0) {
              userDeduction += Math.min(loan.monthlyDeduction, remaining);
            }
          }
        });
      }

      // Calculate bonuses from appraisals for this month
      if (appraisals) {
        const userAppraisals = appraisals.filter(a => 
          a.employeeId === u.id && 
          new Date(a.date).toISOString().startsWith(selectedMonth) &&
          a.bonusAmount
        );
        userAppraisals.forEach(appraisal => {
          userBonus += appraisal.bonusAmount || 0;
        });
      }

      // Calculate deductions from employee benefits (cost to employee)
      if (employeeBenefits) {
        const userBenefits = employeeBenefits.filter(b => b.employeeIds?.includes(u.id!));
        userBenefits.forEach(benefit => {
          if (benefit.costToEmployee) {
            userDeduction += benefit.costToEmployee;
          }
          if (benefit.type === 'allowance' && benefit.monthlyCost) {
             // If monthlyCost is an allowance paid directly to the employee
             // Let's assume costToCompany is added to bonus if it's an allowance
             userBonus += benefit.costToCompany || benefit.monthlyCost;
          }
        });
      }

      if (userBonus > 0) newBonuses[u.id] = userBonus;
      if (userDeduction > 0) newDeductions[u.id] = userDeduction;
    });

    setBonuses(prev => ({ ...newBonuses, ...prev })); // Keep manual overrides
    setDeductions(prev => ({ ...newDeductions, ...prev })); // Keep manual overrides
    setDaysWorked(prev => ({ ...newDaysWorked, ...prev })); // Keep manual overrides
    setNotes(prev => ({ ...newNotes, ...prev })); // Keep manual overrides
  }, [users, loans, appraisals, employeeBenefits, attendance, selectedMonth]);

  // --- Check Processed Status from DB ---
  useEffect(() => {
      if (expenses) {
          const processed = new Set<number>();
          expenses.forEach(e => {
              if (e.category === 'salary' && e.title.includes(selectedMonth)) {
                  if (e.employeeId) {
                      processed.add(e.employeeId);
                  } else {
                      // Fallback for older records
                      users?.forEach(u => {
                          if (e.title.includes(u.name)) processed.add(u.id!);
                      });
                  }
              }
          });
          setProcessedUsers(processed);
      }
  }, [expenses, selectedMonth, users]);

  // --- Helpers ---
  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(amount);

  const getMonthName = (dateStr: string) => {
      const [y, m] = dateStr.split('-');
      return new Date(Number(y), Number(m)-1).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  };

  const filteredUsers = useMemo(() => {
      if (!users) return [];
      return users.filter(u => u.isActive && u.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [users, searchTerm]);

  const taxRate = settings?.payrollTaxRate || 0;
  const insuranceRate = settings?.socialInsuranceRate || 0;

  const calculateSalaryDetails = (user: User) => {
      const base = user.baseSalary || 0;
      const bonus = bonuses[user.id!] || 0;
      const deduction = deductions[user.id!] || 0;
      const days = daysWorked[user.id!] !== undefined ? daysWorked[user.id!] : STANDARD_WORK_DAYS;
      
      // Calculate salary based on days worked (Pro-rata)
      const earnedBase = (base / STANDARD_WORK_DAYS) * days;
      
      const taxAmount = earnedBase * (taxRate / 100);
      const insuranceAmount = earnedBase * (insuranceRate / 100);
      
      const net = earnedBase + bonus - deduction - taxAmount - insuranceAmount;
      return {
          earnedBase,
          taxAmount,
          insuranceAmount,
          net: Math.max(0, Number(net.toFixed(2)))
      };
  };

  const calculateNetSalary = (user: User) => {
      return calculateSalaryDetails(user).net;
  };

  const stats = useMemo(() => {
      let totalEstimated = 0;
      let totalPaid = 0;
      let countPaid = 0;

      filteredUsers.forEach(u => {
          const net = calculateNetSalary(u);
          totalEstimated += net;
          
          if (processedUsers.has(u.id!)) {
              totalPaid += net;
              countPaid++;
          }
      });

      return { totalEstimated, totalPaid, countPaid, totalCount: filteredUsers.length };
  }, [filteredUsers, bonuses, deductions, daysWorked, processedUsers]);

  // --- Handlers ---
  
  const handleValueChange = (userId: number, type: 'bonus' | 'deduction' | 'days', value: string) => {
      const num = parseFloat(value) || 0;
      if (type === 'bonus') setBonuses(prev => ({ ...prev, [userId]: num }));
      else if (type === 'deduction') setDeductions(prev => ({ ...prev, [userId]: num }));
      else if (type === 'days') setDaysWorked(prev => ({ ...prev, [userId]: Math.min(31, Math.max(0, num)) }));
  };

  const handleBaseSalaryChange = async (userId: number, value: string) => {
      const num = parseFloat(value);
      const baseSalary = isNaN(num) ? 0 : num;
      await db.users.update(userId, { baseSalary });
  };

  const togglePaymentMethod = async (user: User) => {
      const paymentMethod = user.paymentMethod === 'bank' ? 'cash' : 'bank';
      await db.users.update(user.id!, { paymentMethod });
  };

  const printSlip = (user: User, details: ReturnType<typeof calculateSalaryDetails>, bonus: number, deduction: number, days: number, notesStr: string) => {
      const printWindow = window.open('', '', 'width=600,height=700');
      if (!printWindow) return;

      const html = `
        <html dir="rtl">
          <head>
            <title>قسيمة راتب - ${user.name}</title>
            <style>
              body { font-family: 'Tahoma', sans-serif; padding: 20px; text-align: center; }
              .slip { border: 2px solid #333; padding: 20px; border-radius: 10px; max-width: 400px; margin: 0 auto; background: #fff;}
              h2 { margin-bottom: 5px; }
              .date { color: #666; font-size: 14px; margin-bottom: 20px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #ddd; padding-bottom: 5px; font-size: 14px; }
              .total { font-weight: bold; font-size: 18px; margin-top: 20px; border-top: 2px solid #333; padding-top: 10px; }
              .footer { margin-top: 30px; font-size: 12px; color: #888; }
              .notes { text-align: right; background: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 15px; font-size: 13px; color: #555;}
            </style>
          </head>
          <body>
            <div class="slip">
              <div style="text-align:center; padding-bottom:15px; border-bottom: 2px solid #333; margin-bottom: 15px;">
                <h2>${settings?.storeName || 'الشركة'}</h2>
                <div style="font-size: 16px; font-weight: bold;">قسيمة مفردات راتب (Payslip)</div>
                <div class="date">عن شهر: ${getMonthName(selectedMonth)}</div>
              </div>
              
              <div style="text-align: right; margin-bottom: 20px; background: #f0f4f8; padding: 10px; border-radius: 5px;">
                <div style="margin-bottom: 5px;"><strong>الموظف:</strong> ${user.name}</div>
                <div><strong>الوظيفة/القسم:</strong> ${user.jobTitle || user.role}</div>
              </div>

              <div class="row"><span>الراتب الأساسي (عقد):</span> <span>${formatCurrency(user.baseSalary || 0)}</span></div>
              <div class="row"><span>أيام العمل الفعلية:</span> <span>${days} يوم</span></div>
              <div class="row"><span>الراتب المستحق (للأيام):</span> <span>${formatCurrency(details.earnedBase)}</span></div>
              <div class="row"><span>المكافآت والإضافي:</span> <span style="color:green">+${formatCurrency(bonus)}</span></div>
              ${details.taxAmount > 0 ? `<div class="row"><span>ضريبة الدخل (${taxRate}%):</span> <span style="color:red">-${formatCurrency(details.taxAmount)}</span></div>` : ''}
              ${details.insuranceAmount > 0 ? `<div class="row"><span>تأمينات اجتماعية (${insuranceRate}%):</span> <span style="color:red">-${formatCurrency(details.insuranceAmount)}</span></div>` : ''}
              <div class="row"><span>سلف وخصومات أخرى:</span> <span style="color:red">-${formatCurrency(deduction)}</span></div>
              
              <div class="row total"><span>صافي الراتب المستحق:</span> <span>${formatCurrency(details.net)}</span></div>

              ${notesStr ? `<div class="notes"><strong>ملاحظات الغياب والتأخير:</strong><br/>${notesStr.replace(/ \| /g, '<br/>')}</div>` : ''}

              <div class="footer">
                طريقة الدفع: ${user.paymentMethod === 'bank' ? 'تحويل بنكي' : 'نقدي'}<br/>
                تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}<br/>
                توقيع المستلم: ............................
              </div>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
  };

  const executeProcessSalary = async (user: User, silent = false) => {
      setProcessingId(user.id!);
      try {
          const baseSalary = user.baseSalary || 0;
          const bonus = bonuses[user.id!] || 0;
          const deduction = deductions[user.id!] || 0;
          const days = daysWorked[user.id!] !== undefined ? daysWorked[user.id!] : STANDARD_WORK_DAYS;
          const method = user.paymentMethod || 'cash';
          const userNotes = notes[user.id!] || '';
          const note = userNotes ? ` | ملاحظات: ${userNotes}` : '';
          
          const details = calculateSalaryDetails(user);
          const netSalary = details.net;

          await (db as any).transaction('rw', db.expenses, db.journalEntries, db.accounts, db.loans, db.auditLogs, async () => {
              // Deduct from active loans if there are deductions
              let remainingDeduction = deduction;
              if (remainingDeduction > 0) {
                  const activeLoans = await db.loans.where('userId').equals(user.id!).filter(l => l.status === 'approved').toArray();
                  for (const loan of activeLoans) {
                      const startDate = new Date(loan.startDate);
                      const currentMonthDate = new Date(selectedMonth + '-01');
                      if (currentMonthDate >= startDate) {
                          const remainingLoan = loan.amount - (loan.paidAmount || 0);
                          if (remainingLoan > 0) {
                              const toDeduct = Math.min(loan.monthlyDeduction, remainingLoan);
                              if (toDeduct > 0 && remainingDeduction >= toDeduct) {
                                  const newPaidAmount = (loan.paidAmount || 0) + toDeduct;
                                  await db.loans.update(loan.id!, { 
                                      paidAmount: newPaidAmount,
                                      status: newPaidAmount >= loan.amount ? 'paid' : 'approved'
                                  });
                                  remainingDeduction -= toDeduct;
                              } else if (toDeduct > 0 && remainingDeduction > 0) {
                                  // Deduct whatever is left
                                  const newPaidAmount = (loan.paidAmount || 0) + remainingDeduction;
                                  await db.loans.update(loan.id!, {
                                      paidAmount: newPaidAmount,
                                      status: newPaidAmount >= loan.amount ? 'paid' : 'approved'
                                  });
                                  remainingDeduction = 0;
                              }
                          }
                      }
                  }
              }

              // 1. Record Expense
              await db.expenses.add({
                  title: `راتب شهر ${selectedMonth} - ${user.name}`,
                  amount: netSalary,
                  category: 'salary',
                  date: new Date(),
                  paymentMethod: method,
                  employeeId: user.id,
                  notes: `راتب أساسي: ${baseSalary} | أيام: ${days} | مكافآت: ${bonus} | خصومات: ${deduction}${note}`
              });

              // 2. Accounting Entry (If enabled)
              if (settings?.enableAccounting) {
                  const salaryAcc = await db.accounts.where('code').equals('5030').first(); // Expense: Salaries
                  const cashAcc = await db.accounts.where('code').equals('1010').first(); // Cash
                  const bankAcc = await db.accounts.where('code').equals('1020').first(); // Bank
                  const employeeReceivableAcc = await db.accounts.where('code').equals('1030').first(); // عهد موظفين/سلف
                  const taxPayableAcc = await db.accounts.where('code').equals('2020').first(); // Liability: Taxes
                  
                  let insurancePayableAcc = await db.accounts.where('code').equals('2040').first();
                  if (!insurancePayableAcc) {
                      insurancePayableAcc = taxPayableAcc;
                  }

                  const creditAcc = method === 'bank' ? bankAcc : cashAcc;

                  if (salaryAcc && creditAcc) {
                      const lines = [];
                      const totalGross = details.earnedBase + bonus;
                      
                      lines.push({ accountId: salaryAcc.id!, accountName: salaryAcc.name, debit: totalGross, credit: 0, description: `راتب إجمالي ${user.name} (${days} يوم)` });
                      
                      if (deduction > 0 && employeeReceivableAcc) {
                          lines.push({ accountId: employeeReceivableAcc.id!, accountName: employeeReceivableAcc.name, debit: 0, credit: deduction, description: `استرداد سلف أو خصم` });
                      }
                      
                      if (details.taxAmount > 0 && taxPayableAcc) {
                          lines.push({ accountId: taxPayableAcc.id!, accountName: taxPayableAcc.name, debit: 0, credit: details.taxAmount, description: `ضريبة مستقطعة من ${user.name}` });
                      }
                      
                      if (details.insuranceAmount > 0 && insurancePayableAcc) {
                          lines.push({ accountId: insurancePayableAcc.id!, accountName: insurancePayableAcc.name, debit: 0, credit: details.insuranceAmount, description: `تأمينات مستقطعة من ${user.name}` });
                      }
                      
                      lines.push({ accountId: creditAcc.id!, accountName: creditAcc.name, debit: 0, credit: details.net, description: method === 'bank' ? 'تحويل بنكي' : 'صرف نقدي' });

                      await AccountingEngine.postEntry({
                          date: new Date(),
                          description: `استحقاق وصرف رواتب - ${user.name} (${selectedMonth})`,
                          reference: `PAY-${selectedMonth}-${user.id}`,
                          lines: lines,
                      });
                  }
              }
          });

          const newSet = new Set(processedUsers);
          newSet.add(user.id!);
          setProcessedUsers(newSet);
          
          if (!silent) {
              success('تم صرف الراتب بنجاح وتوثيقه بالقيد المزدوج اليومي.');
              setTimeout(() => {
                openConfirm(
                  'طباعة قسيمة الراتب',
                  `هل تريد طباعة قسيمة الراتب لـ ${user.name} الآن؟`,
                  () => {
                    printSlip(user, details, bonus, deduction, days, userNotes);
                  },
                  'نعم، طباعة',
                  'لا شكراً'
                );
              }, 400);
          }
          return true;
      } catch (e) {
          console.error(e);
          if (!silent) {
              toastError('حدث خطأ أثناء المعالجة المالية للراتب');
          }
          return false;
      } finally {
          setProcessingId(null);
      }
  };

  const processSalary = async (user: User, silent = false) => {
      const d = new Date().getTime();
      const isClosed = fiscalYears?.some(fy => {
          const start = new Date(fy.startDate).setHours(0,0,0,0);
          const end = new Date(fy.endDate).setHours(23,59,59,999);
          return d >= start && d <= end && fy.status === 'closed';
      });

      if (isClosed) {
          if (!silent) toastError('لا يمكن صرف رواتب في سنة مالية مغلقة.');
          return false;
      }

      const details = calculateSalaryDetails(user);
      const netSalary = details.net;

      if (netSalary <= 0) {
          if (!silent) toastError('صافي الراتب يجب أن يكون أكبر من الصفر.');
          return false;
      }

      if (silent) {
          return executeProcessSalary(user, true);
      }

      const method = user.paymentMethod || 'cash';
      openConfirm(
          'تأكيد صرف راتب',
          `تأكيد صرف راتب ${user.name}؟ الصافي: ${formatCurrency(netSalary)}، الضرائب: ${formatCurrency(details.taxAmount)}، التأمينات: ${formatCurrency(details.insuranceAmount)}، طريقة الدفع: ${method === 'bank' ? 'بنك' : 'نقدي'}`,
          () => {
              executeProcessSalary(user, false);
          }
      );
      return true;
  };

  const processAllSalaries = async () => {
      const unpaidUsers = filteredUsers.filter(u => !processedUsers.has(u.id!) && calculateNetSalary(u) > 0);
      
      if (unpaidUsers.length === 0) {
          toastError('لا يوجد رواتب مستحقة للصرف في هذه القائمة.');
          return;
      }

      const totalToPay = unpaidUsers.reduce((sum, u) => sum + calculateNetSalary(u), 0);

      openConfirm(
          'تأكيد صرف الرواتب الجماعي',
          `هل أنت متأكد من صرف الرواتب لـ ${unpaidUsers.length} من الموظفين؟ الإجمالي المستحق للصرف بقيد ميزانية الموظفين المعتمدة: ${formatCurrency(totalToPay)}`,
          async () => {
              setIsProcessingAll(true);
              let successCount = 0;

              for (const user of unpaidUsers) {
                  const s = await executeProcessSalary(user, true);
                  if (s) successCount++;
              }

              setIsProcessingAll(false);
              success(`تم صرف ${successCount} راتب بنجاح وترحيل القيود مزدوجة التوجيه لكل المعاملات فورياً.`);
          }
      );
  };

  const handleExportCSV = () => {
    if (!filteredUsers || filteredUsers.length === 0) return;
    
    const headers = ['الموظف', 'الراتب الأساسي', 'أيام العمل', 'المكافآت', 'الخصومات', 'الصافي', 'طريقة الدفع', 'الحالة', 'ملاحظات'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(user => {
        const baseSalary = user.baseSalary || 0;
        const bonus = bonuses[user.id!] || 0;
        const deduction = deductions[user.id!] || 0;
        const days = daysWorked[user.id!] !== undefined ? daysWorked[user.id!] : STANDARD_WORK_DAYS;
        const net = calculateNetSalary(user);
        const isProcessed = processedUsers.has(user.id!);
        const payMethod = user.paymentMethod === 'bank' ? 'بنك' : 'نقدي';
        const note = notes[user.id!] || '';

        return [
          `"${user.name}"`,
          baseSalary,
          days,
          bonus,
          deduction,
          net,
          `"${payMethod}"`,
          `"${isProcessed ? 'تم الصرف' : 'مستحق'}"`,
          `"${note.replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `مسير_الرواتب_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 min-h-screen font-['Tajawal'] rounded-2xl" dir="rtl">
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800">تقرير مسير الرواتب</h1>
        <p className="text-slate-500">عن شهر: {getMonthName(selectedMonth)}</p>
        <p className="text-slate-500 text-sm mt-1">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
      </div>

      <PayrollHeader 
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        setProcessedUsers={setProcessedUsers}
      />

      <PayrollStats 
        stats={stats}
        formatCurrency={formatCurrency}
      />

      <PayrollTable 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredUsers={filteredUsers}
        processedUsers={processedUsers}
        bonuses={bonuses}
        deductions={deductions}
        daysWorked={daysWorked}
        notes={notes}
        handleValueChange={handleValueChange}
        handleBaseSalaryChange={handleBaseSalaryChange}
        setNotes={setNotes}
        togglePaymentMethod={togglePaymentMethod}
        calculateNetSalary={calculateNetSalary}
        calculateSalaryDetails={calculateSalaryDetails}
        isProcessingAll={isProcessingAll}
        processAllSalaries={processAllSalaries}
        processSalary={processSalary}
        processingId={processingId}
        printSlip={printSlip}
        setHistoryUser={setHistoryUser}
        formatCurrency={formatCurrency}
        handleExportCSV={handleExportCSV}
      />

      <PayrollHistoryModal 
        historyUser={historyUser}
        setHistoryUser={setHistoryUser}
        expenses={expenses}
        formatCurrency={formatCurrency}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={() => {
            setConfirmState(prev => ({ ...prev, isOpen: false }));
            confirmState.onConfirm();
        }}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        confirmText={confirmState.confirmText || 'تأكيد'}
        cancelText={confirmState.cancelText || 'إلغاء'}
      />
    </div>
  );
};

export default Payroll;
