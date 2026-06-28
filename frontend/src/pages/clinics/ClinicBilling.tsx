import React, { useState, useMemo } from 'react';
import { Plus, Search, Check, FileText, Activity, CreditCard, DollarSign, RefreshCw, X, Trash2, ShieldCheck, Printer, AlertTriangle, AlertCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { InsuranceService } from '../../services/InsuranceService';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { AccountingEngine } from '../../services/AccountingEngine';

export const ClinicBilling = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'invoices' | 'shift_closing'>('invoices');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBranchId, setCurrentBranchId] = useState<number>(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    customerId: '',
    service: '',
    amount: '0',
    discount: '0',
    taxRate: '15',
    paymentMethod: 'cash',
    insuranceCompanyId: '',
    date: new Date().toISOString().split('T')[0],
  });

  const recordsAll = useLiveQuery(() => db.clinicInvoices.toArray()) || [];
  const records = currentBranchId === 0 ? recordsAll : recordsAll.filter(r => r.branchId === currentBranchId || !r.branchId);

  const patients = useLiveQuery(() => db.customers.toArray()) || [];
  const insuranceCompanies = useLiveQuery(() => db.clinicInsuranceCompanies.toArray()) || [];
  const services = useLiveQuery(() => db.clinicServicesList.toArray()) || [];
  const branches = useLiveQuery(() => db.clinicBranches.toArray()) || [];
  const pricingRules = useLiveQuery(() => db.pricingRules?.toArray() || []) || [];

  const getDynamicPrice = (basePrice: number, serviceName: string, customerId: string, companyId: string) => {
      let finalPrice = basePrice;
      const now = new Date();
      const currentHour = now.getHours();

      for (const rule of pricingRules) {
          if (rule.isActive !== false) {
              // Priority 1: Specific Service Rule
              if (rule.name.includes(serviceName) && rule.minCost > 0) {
                  finalPrice = rule.minCost;
              }
              // Priority 2: Happy Hour across all services
              else if (rule.name.toLowerCase().includes('happy') && currentHour >= 18 && currentHour <= 22) { // 6PM - 10PM for example
                  if (rule.minCost > 0 && finalPrice > rule.minCost) {
                      finalPrice = rule.minCost; // Or use percentage
                  }
              }
              // Potential priority 3: VIP Customer etc...
          }
      }
      return finalPrice;
  };

  const filteredRecords = useMemo(() => {
    return records.filter((item: any) => {
      const pName = patients.find(p => p.id === item.customerId)?.name || '';
      return pName.toLowerCase().includes(search.toLowerCase()) || 
             (item.service || '').toLowerCase().includes(search.toLowerCase()) ||
             (item.paymentMethod || '').toLowerCase().includes(search.toLowerCase());
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, patients, search]);

  const handleOpenModal = () => {
    setFormData({
      customerId: '',
      service: '',
      amount: '0',
      discount: '0',
      taxRate: '15',
      paymentMethod: 'cash',
      insuranceCompanyId: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const calculateShares = (amount: number, discountAmt: number, tRate: number, compId: string) => {
    let base = amount - discountAmt;
    if (base < 0) base = 0;
    
    let rate = 0;
    if (compId) {
      const comp = insuranceCompanies.find(c => c.id === Number(compId));
      if (comp && comp.discountRate) rate = Number(comp.discountRate);
    }
    
    const iShareBase = (base * rate) / 100;
    const pShareBase = base - iShareBase;

    const taxValue = (pShareBase * tRate) / 100;
    const pTotal = pShareBase + taxValue;

    return { 
        patientShare: Number(pTotal.toFixed(2)), 
        insuranceShare: Number(iShareBase.toFixed(2)),
        taxValue: Number(taxValue.toFixed(2)),
        discountValue: discountAmt
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) return alert('اختر المريض');
    
    // We get actual service object from DB to run rules
    const svc = await db.clinicServicesList.where('serviceName').equals(formData.service).first() 
                || await db.clinicServicesList.where('name').equals(formData.service).first();

    const amt = Number(formData.amount);
    const disc = Number(formData.discount);
    const tr = Number(formData.taxRate);

    let patientShare = amt;
    let insuranceShare = 0;
    let taxValue = 0;
    let discountValue = disc;
    let coverageReason = '';

    if (formData.insuranceCompanyId && svc) {
        const coverage = await InsuranceService.validateServiceCoverage(
             Number(formData.insuranceCompanyId),
             svc.id,
             amt - disc,
             Number(formData.customerId)
        );
        patientShare = coverage.patientShare;
        insuranceShare = coverage.insuranceShare;
        coverageReason = coverage.reason;
        
        if (!coverage.isCovered) {
             alert(`تحذير: هذه الخدمة غير مغطاة تأمينياً. \nالسبب: ${coverage.reason}\nسيتكفل المريض بكامل المبلغ.`);
        } else if (coverage.reason) {
             alert(`معلومة تأمينية: ${coverage.reason}`);
        }
    } else {
        const shares = calculateShares(amt, disc, tr, formData.insuranceCompanyId);
        patientShare = shares.patientShare;
        insuranceShare = shares.insuranceShare;
        taxValue = shares.taxValue;
        discountValue = shares.discountValue;
    }

    try {
      // Atomic Transaction
      await db.transaction('rw', [db.clinicInvoices, db.customers, db.clinicServicesList, db.clinicInventoryItems, db.clinicInsuranceClaims, db.auditLogs, db.loyaltyTransactions, db.journalEntries, db.accounts], async () => {
          const invoiceId = await db.clinicInvoices.add({
            customerId: Number(formData.customerId),
            branchId: currentBranchId === 0 ? 1 : currentBranchId,
            service: formData.service,
            amount: amt,
            discount: discountValue,
            taxRate: tr,
            taxValue,
            paymentMethod: formData.paymentMethod,
            insuranceCompanyId: formData.insuranceCompanyId ? Number(formData.insuranceCompanyId) : null,
            patientShare,
            insuranceShare,
            coverageReason, // Save what the rule engine said
            date: formData.date,
            shiftClosed: false,
            status: formData.paymentMethod === 'credit' ? 'آجل' : 'مدفوع'
          });

          // Dues Tracking logic
          if (formData.paymentMethod === 'credit') {
              const customer = await db.customers.get(Number(formData.customerId));
              if (customer) {
                  const currentDues = customer.dues || 0;
                  await db.customers.update(customer.id!, {
                      dues: currentDues + patientShare
                  });
              }
          }

          // CRM & Loyalty Points Logic (1 point per 10 EGP paid by patient)
          if (patientShare > 0) {
              const pointsEarned = Math.floor(patientShare / 10);
              if (pointsEarned > 0) {
                  const customer = await db.customers.get(Number(formData.customerId));
                  if (customer) {
                      const currentPoints = customer.loyaltyPoints || 0;
                      await db.customers.update(customer.id!, {
                          loyaltyPoints: currentPoints + pointsEarned
                      });
                      
                      // Check if loyaltyTransactions exist in schema (via conditional)
                      if (db.loyaltyTransactions) {
                          await db.loyaltyTransactions.add({
                              customerId: Number(formData.customerId),
                              date: new Date(),
                              points: pointsEarned,
                              type: 'earn'
                          });
                      }
                  }
              }
          }

          // Claims Management
          if (insuranceShare > 0 && formData.insuranceCompanyId) {
              await db.clinicInsuranceClaims.add({
                  companyId: Number(formData.insuranceCompanyId),
                  customerId: Number(formData.customerId),
                  invoiceId: invoiceId,
                  status: 'pending', // pending submission -> waiting collection
                  date: new Date().toISOString(),
                  claimedAmount: insuranceShare
              });
              await db.auditLogs.add({
                  userId: 1, 
                  action: 'CREATE_CLAIM', 
                  module: 'ClinicBilling', 
                  timestamp: new Date().toISOString(), 
                  details: `مطالبة جديدة لشركة ${formData.insuranceCompanyId} بقيمة ${insuranceShare}`
              });
          }

          // Auto-Deduct Inventory Logic
          if (svc && svc.consumedItems && svc.consumedItems.length > 0) {
              for (const c of svc.consumedItems) {
                  const invItem = await db.clinicInventoryItems.get(c.itemId);
                  if (invItem) {
                      let qtyToDeduct = c.quantity;
                      let updatedBatches = invItem.batches ? [...invItem.batches] : [];
                      
                      // Priority to FIFO for batches
                      if (updatedBatches.length > 0) {
                          updatedBatches.sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
                          for (let i = 0; i < updatedBatches.length; i++) {
                              if (qtyToDeduct <= 0) break;
                              const b = updatedBatches[i];
                              if (b.quantity >= qtyToDeduct) {
                                  b.quantity -= qtyToDeduct;
                                  qtyToDeduct = 0;
                              } else {
                                  qtyToDeduct -= b.quantity;
                                  b.quantity = 0;
                              }
                          }
                          // Remove empty batches
                          updatedBatches = updatedBatches.filter(b => b.quantity > 0);
                      }
                      
                      const newTotal = updatedBatches.length > 0 
                                      ? updatedBatches.reduce((a, b) => a + b.quantity, 0)
                                      : Math.max(0, Number(invItem.stockAmount) - c.quantity);

                      const newExpiry = updatedBatches.length > 0 
                                      ? updatedBatches[0].expiryDate 
                                      : invItem.expiryDate;

                      await db.clinicInventoryItems.update(c.itemId, {
                          stockAmount: newTotal,
                          batches: updatedBatches,
                          expiryDate: newExpiry
                      });
                  }
              }
          }

          // Global Accounting Integration (Journal Entry)
          try {
              let debitAccountCode = '1010'; // Default Cash
              if (formData.paymentMethod === 'card') debitAccountCode = '1020'; // Bank
              else if (formData.paymentMethod === 'credit') debitAccountCode = '1030'; // Accounts Receivable

              const debitAccount = await db.accounts.where('code').equals(debitAccountCode).first();
              const arAccount = await db.accounts.where('code').equals('1030').first();
              const revenueAccount = await db.accounts.where('code').equals('4010').first();
              const taxAccount = await db.accounts.where('code').equals('2020').first();
              const discountAccount = await db.accounts.where('code').equals('5050').first();

              if (debitAccount && revenueAccount) {
                  const journalLines = [];

                  // Debit patientShare to payment method account
                  if (patientShare > 0) {
                      journalLines.push({
                          accountId: debitAccount.id!,
                          accountName: debitAccount.name,
                          debit: Number(patientShare.toFixed(2)),
                          credit: 0,
                          description: `حصة المريض - فاتورة عيادة رقم #${invoiceId}`
                      });
                  }

                  // Debit insuranceShare to Accounts Receivable (if active claim)
                  if (insuranceShare > 0 && arAccount) {
                      journalLines.push({
                          accountId: arAccount.id!,
                          accountName: arAccount.name,
                          debit: Number(insuranceShare.toFixed(2)),
                          credit: 0,
                          description: `حصة شركة التأمين - فاتورة عيادة رقم #${invoiceId}`
                      });
                  }

                  // Debit discountValue to sales discount account
                  if (discountValue > 0 && discountAccount) {
                      journalLines.push({
                          accountId: discountAccount.id!,
                          accountName: discountAccount.name,
                          debit: Number(discountValue.toFixed(2)),
                          credit: 0,
                          description: `خصم مسموح به - فاتورة عيادة رقم #${invoiceId}`
                      });
                  }

                  // Credit amount to Revenue Account
                  journalLines.push({
                      accountId: revenueAccount.id!,
                      accountName: revenueAccount.name,
                      debit: 0,
                      credit: Number(amt.toFixed(2)),
                      description: `إيرادات خدمات طبية - فاتورة عيادة رقم #${invoiceId}`
                  });

                  // Credit taxValue to Tax Account
                  if (taxValue > 0 && taxAccount) {
                      journalLines.push({
                          accountId: taxAccount.id!,
                          accountName: taxAccount.name,
                          debit: 0,
                          credit: Number(taxValue.toFixed(2)),
                          description: `ضريبة مستحقة - فاتورة عيادة رقم #${invoiceId}`
                      });
                  }

                  await AccountingEngine.postEntry({
                      date: new Date(formData.date),
                      reference: `CLINIC-${invoiceId}`,
                      description: `قيد تلقائي مالي لفاتورة العيادة رقم #${invoiceId} للخدمة ${formData.service}`,
                      lines: journalLines,
                      ignoreClosedPeriod: true
                  });
              }
          } catch (acctErr) {
              console.error("Accounting Integration Error (Clinic Billing):", acctErr);
          }
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ. تأكد من إتمام العملية بالكامل.');
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
        const itemToDelete = await db.clinicInvoices.get(deleteId);
        if (itemToDelete) {
           await db.clinicInvoices.delete(deleteId);
           await db.auditLogs.add({
               userId: 1,
               action: 'DELETE',
               module: 'ClinicBilling',
               timestamp: new Date().toISOString(),
               details: `تم حذف فاتورة بقيمة ${itemToDelete.amount} للعميل ${itemToDelete.customerId} ونقلها لسلة المهملات`
           });
        }
        setDeleteId(null);
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch(method) {
      case 'cash': return <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold border border-emerald-100">كاش</span>;
      case 'card': return <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">بطاقة بنكية</span>;
      case 'credit': return <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-bold border border-orange-100">آجل</span>;
      default: return <span>-</span>;
    }
  };

  // Shift closing logic
  const appointments = useLiveQuery(() => db.appointments.toArray(), []) || [];
  const openShiftRecords = records.filter((r: any) => !r.shiftClosed);
  const [shiftClosingNotes, setShiftClosingNotes] = useState('');
  const [handoverEmployee, setHandoverEmployee] = useState('');
  
  // Smart Till Matching Logic (RCM)
  const todayStr = new Date().toISOString().split('T')[0];
  const completedAppointmentsToday = appointments.filter(a => a.date === todayStr && a.status === 'completed');
  
  // Find "gaps" (appointments completed but not invoiced today)
  const invoicesToday = records.filter(r => r.date?.startsWith(todayStr));
  
  const gapAppointments = completedAppointmentsToday.filter(app => {
     // Does this customer have an invoice today?
     const hasInvoice = invoicesToday.some(inv => inv.customerId === app.customerId);
     return !hasInvoice;
  });

  const shiftStats = useMemo(() => {
    let cash = 0, card = 0, credit = 0, insurance = 0;
    openShiftRecords.forEach((r: any) => {
      const pShare = r.patientShare || 0;
      if (r.paymentMethod === 'cash') cash += pShare;
      if (r.paymentMethod === 'card') card += pShare;
      if (r.paymentMethod === 'credit') credit += pShare;
      insurance += (r.insuranceShare || 0);
    });
    return { cash, card, credit, insurance, totalPatient: cash + card, total: cash + card + credit + insurance };
  }, [openShiftRecords]);

  const [isShiftClosingConfirmOpen, setIsShiftClosingConfirmOpen] = useState(false);

  const handleCloseShift = async () => {
    if (openShiftRecords.length === 0) {
        error('لا يوجد فواتير مفتوحة لتقفيلها.');
        return;
    }
    if (gapAppointments.length > 0 && !shiftClosingNotes.trim()) {
       error('يوجد حالات تم كشفها ولم يصدر لها فاتورة. يجب إدخال تبرير قبل التقفيل (RCM Security).');
       return;
    }
    if (!handoverEmployee.trim()) {
        error('يجب تحديد اسم الموظف المستلم للعهدة النقدية قبل تقفيل الوردية.');
        return;
    }
    
    setIsShiftClosingConfirmOpen(true);
  };
  
  const confirmCloseShift = async () => {
    setIsShiftClosingConfirmOpen(false);
    try {
      for (const r of openShiftRecords) {
        if (r.id) await db.clinicInvoices.update(r.id, { 
            shiftClosed: true, 
            closingNotes: shiftClosingNotes,
            shiftHandoverTo: handoverEmployee
        });
      }
      // Log the shift handover
      await db.auditLogs.add({
         userId: 1, // Current User ID
         action: 'SHIFT_HANDOVER',
         module: 'ClinicBilling',
         timestamp: new Date().toISOString(),
         details: `تم تقفيل الوردية وتسليم العهدة النقدية للموظف: ${handoverEmployee}.`
      });

      setShiftClosingNotes('');
      setHandoverEmployee('');
      success('تم تقفيل الوردية وتسليم العهدة بنجاح.');
    } catch (err) {
      error('حدث خطأ أثناء التقفيل.');
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-slate-50">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      
      <div className="p-6 pb-0 flex justify-between items-end border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-2">
            <DollarSign className="w-7 h-7 text-brand-600" />
            النظام المالي والفواتير
          </h1>
          <div className="flex gap-4 items-center">
               <button 
                  onClick={() => setActiveTab('invoices')}
                  className={`pb-3 font-bold text-sm px-2 border-b-2 transition-colors ${activeTab === 'invoices' ? 'border-brand-500 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
               >سجل الفواتير</button>
               <button 
                  onClick={() => setActiveTab('shift_closing')}
                  className={`pb-3 font-bold text-sm px-2 border-b-2 transition-colors ${activeTab === 'shift_closing' ? 'border-brand-500 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
               >تقفيل الوردية</button>

               <select
                    value={currentBranchId}
                    onChange={e => setCurrentBranchId(Number(e.target.value))}
                    className="text-sm font-bold text-brand-700 bg-brand-50 min-w-[150px] border-none rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand-500 ml-4 mb-2"
                >
                    <option value={0}>جميع الفروع</option>
                    {branches.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
               </select>
          </div>
        </div>
        {activeTab === 'invoices' && (
          <button 
            onClick={handleOpenModal}
            className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-700 shadow-lg shadow-brand-500/20 mb-3"
          >
            <Plus className="w-5 h-5" />
            فاتورة جديدة
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 relative">
          {activeTab === 'invoices' && (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                   <div className="relative flex-1 max-w-md">
                     <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                       type="text" 
                       value={search}
                       onChange={(e) => setSearch(e.target.value)}
                       placeholder="بحث باسم المريض أو الخدمة..." 
                       className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-sm"
                     />
                   </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                       <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-bold">
                          <tr>
                             <th className="px-6 py-4">التاريخ</th>
                             <th className="px-6 py-4">المريض</th>
                             <th className="px-6 py-4">الخدمة</th>
                             <th className="px-6 py-4">الدفع</th>
                             <th className="px-6 py-4">الإجمالي</th>
                             <th className="px-6 py-4">حصة المريض</th>
                             <th className="px-6 py-4">التأمين</th>
                             <th className="px-6 py-4 text-center">الإجراءات</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 text-sm font-medium">
                          {filteredRecords.length === 0 ? (
                             <tr><td colSpan={8} className="p-8 text-center text-slate-500">لا يوجد فواتير.</td></tr>
                          ) : filteredRecords.map((item: any) => {
                             const pName = patients.find(p => p.id === item.customerId)?.name || 'مجهول';
                             const incName = insuranceCompanies.find(c => c.id === item.insuranceCompanyId)?.name;
                             return (
                                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                   <td className="px-6 py-4 text-slate-500 text-xs">{item.date}</td>
                                   <td className="px-6 py-4 text-slate-800 font-bold">{pName}</td>
                                   <td className="px-6 py-4 text-brand-700">{item.service}</td>
                                   <td className="px-6 py-4">{getPaymentMethodBadge(item.paymentMethod)}</td>
                                   <td className="px-6 py-4 font-black">{item.amount} ج.م</td>
                                   <td className="px-6 py-4 font-bold text-emerald-600">{item.patientShare} ج.م</td>
                                   <td className="px-6 py-4">
                                      {item.insuranceShare > 0 ? (
                                         <div>
                                             <div className="font-bold text-blue-600">{item.insuranceShare} ج.م</div>
                                             <div className="text-[10px] text-slate-400 mt-0.5">{incName}</div>
                                         </div>
                                      ) : '-'}
                                   </td>
                                   <td className="px-6 py-4 text-center border-l-0">
                                      <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-block">
                                         <Trash2 className="w-4 h-4" />
                                      </button>
                                   </td>
                                </tr>
                             )
                          })}
                       </tbody>
                    </table>
                </div>
             </div>
          )}

          {activeTab === 'shift_closing' && (
             <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-gradient-to-br from-brand-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-brand-500/20">
                   <div className="flex justify-between items-center mb-6">
                      <div>
                         <h2 className="text-2xl font-black flex items-center gap-2 mb-2">
                             <Activity className="w-6 h-6 opacity-80" />
                             تقفيل الوردية الحالية
                         </h2>
                         <p className="text-brand-100 font-medium text-sm">مراجعة المبالغ المحصلة ومطابقتها مع الدرج قبل التسليم.</p>
                      </div>
                      <button 
                         onClick={handleCloseShift}
                         disabled={openShiftRecords.length === 0}
                         className="bg-white text-brand-700 hover:bg-brand-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                         <ShieldCheck className="w-5 h-5" />
                         تقفيل وإغلاق الوردية
                      </button>
                   </div>
                   
                   <div className="bg-white/10 rounded-2xl p-4 border border-white/20 flex flex-col md:flex-row items-center gap-4">
                       <label className="font-bold text-white shrink-0 min-w-[150px]">استلام العهدة بواسطة:</label>
                       <input 
                           type="text" 
                           placeholder="اسم الموظف المستلم للعهدة النقدية"
                           value={handoverEmployee}
                           onChange={(e) => setHandoverEmployee(e.target.value)}
                           className="flex-1 bg-white border-0 rounded-xl px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                       />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                      <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl mb-3"><DollarSign className="w-6 h-6" /></div>
                      <div className="text-slate-500 text-sm font-bold mb-1">إجمالي الكاش (الدرج)</div>
                      <div className="text-3xl font-black text-slate-800">{shiftStats.cash.toFixed(2)}</div>
                   </div>
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                      <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl mb-3"><CreditCard className="w-6 h-6" /></div>
                      <div className="text-slate-500 text-sm font-bold mb-1">فيزا / بطاقات</div>
                      <div className="text-3xl font-black text-slate-800">{shiftStats.card.toFixed(2)}</div>
                   </div>
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                      <div className="bg-orange-50 text-orange-600 p-3 rounded-2xl mb-3"><FileText className="w-6 h-6" /></div>
                      <div className="text-slate-500 text-sm font-bold mb-1">آجل / لم يسدد</div>
                      <div className="text-3xl font-black text-slate-800">{shiftStats.credit.toFixed(2)}</div>
                   </div>
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                      <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl mb-3"><ShieldCheck className="w-6 h-6" /></div>
                      <div className="text-slate-500 text-sm font-bold mb-1">مطالبات التأمين</div>
                      <div className="text-3xl font-black text-slate-800">{shiftStats.insurance.toFixed(2)}</div>
                   </div>
                </div>

                {gapAppointments.length > 0 && (
                   <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 mt-6 shadow-sm">
                      <h3 className="text-rose-800 font-black flex items-center gap-2 mb-2">
                         <AlertTriangle className="w-5 h-5" />
                         تحذير رقابي (RCM Gap)
                      </h3>
                      <p className="text-sm text-rose-700 font-bold mb-4">
                         يوجد <span className="text-lg mx-1">{gapAppointments.length}</span> حالات تم كشفها اليوم لدخول الطبيب ولم يصدر لها فاتورة. لن تتمكن من تقفيل الوردية قبل إدخال تبرير:
                      </p>
                      <textarea
                         value={shiftClosingNotes}
                         onChange={e => setShiftClosingNotes(e.target.value)}
                         placeholder="أدخل سبب عدم إصدار الفواتير لهذه الحالات (مثال: زيارة استشارة مجانية، أو خطأ بالنظام سيتم تداركه)..."
                         className="w-full bg-white border border-rose-200 rounded-xl p-3 text-sm focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                         rows={2}
                      ></textarea>
                   </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                   <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h3 className="font-bold text-slate-700">العمليات غير المعتمدة ({openShiftRecords.length})</h3>
                      <button className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 font-bold">
                         <Printer className="w-4 h-4" /> طباعة الملخص
                      </button>
                   </div>
                   <div className="p-4">
                      {openShiftRecords.length === 0 ? (
                         <div className="text-center py-8 text-slate-500 font-medium text-sm">تم تقفيل جميع الورديات. الدرج نظيف.</div>
                      ) : (
                         <div className="space-y-2">
                            {openShiftRecords.map((r: any) => {
                               const pName = patients.find(p => p.id === r.customerId)?.name || 'مجهول';
                               return (
                                  <div key={r.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-colors">
                                     <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                                           {r.id}
                                        </div>
                                        <div>
                                           <div className="font-bold text-slate-800 text-sm">{pName} - {r.service}</div>
                                           <div className="text-xs text-slate-400 mt-0.5">{r.date}</div>
                                        </div>
                                     </div>
                                     <div className="text-left">
                                        <div className="font-black text-slate-800">{r.patientShare} ج.م</div>
                                        <div className="mt-1 flex justify-end">{getPaymentMethodBadge(r.paymentMethod)}</div>
                                     </div>
                                  </div>
                               )
                            })}
                         </div>
                      )}
                   </div>
                </div>
             </div>
          )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-500" />
                تحصيل فاتورة جديدة
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">المريض *</label>
                   <select 
                     value={formData.customerId}
                     onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                     required
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium text-slate-800"
                   >
                     <option value="">-- اختر المريض --</option>
                     {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                     ))}
                   </select>
                   {(() => {
                       const selectedPatient = patients.find(p => p.id === Number(formData.customerId));
                       if (selectedPatient && selectedPatient.dues && selectedPatient.dues > 0) {
                           return (
                               <div className="mt-3 bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2">
                                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                                  <span className="text-sm font-bold text-rose-700">تنبيه: المريض لديه مديونية سابقة بقيمة {selectedPatient.dues.toLocaleString()} ج.م</span>
                               </div>
                           );
                       }
                       return null;
                   })()}
                 </div>
                 <div className="col-span-2">
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">الخدمة الطبية / البيان *</label>
                   <select 
                     value={formData.service}
                     onChange={(e) => {
                       const s = e.target.value;
                       const svc = services.find(x => x.name === s);
                       if (svc) {
                          const dynPrice = getDynamicPrice(svc.price, s, formData.customerId, formData.insuranceCompanyId);
                          setFormData({...formData, service: s, amount: String(dynPrice)});
                       } else {
                          setFormData({...formData, service: s});
                       }
                     }}
                     required
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium text-slate-800"
                   >
                     <option value="">اختر الخدمة الطبية...</option>
                     {services.map(s => (
                       <option key={s.id} value={s.name}>{s.name} - {s.price} ج.م</option>
                     ))}
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">التاريخ</label>
                   <input 
                     type="date" 
                     value={formData.date}
                     onChange={(e) => setFormData({...formData, date: e.target.value})}
                     required
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">قيمة الخدمة الإجمالية (ج.م) *</label>
                   <input 
                     type="number" 
                     value={formData.amount}
                     onChange={(e) => setFormData({...formData, amount: e.target.value})}
                     required
                     min="0"
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-black text-brand-700 text-lg"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">الخصم (ج.م)</label>
                   <input 
                     type="number" 
                     value={formData.discount}
                     onChange={(e) => setFormData({...formData, discount: e.target.value})}
                     min="0"
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium text-lg text-slate-800"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">الضريبة (%)</label>
                   <input 
                     type="number" 
                     value={formData.taxRate}
                     onChange={(e) => setFormData({...formData, taxRate: e.target.value})}
                     min="0"
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium text-lg text-slate-800"
                   />
                 </div>

                 <div className="col-span-2 mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                        التأمين الطبي (اختياري)
                    </label>
                    <select 
                       value={formData.insuranceCompanyId}
                       onChange={(e) => setFormData({...formData, insuranceCompanyId: e.target.value})}
                       className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium text-sm"
                    >
                       <option value="">لا يوجد تأمين طبي (المريض يتحمل 100%)</option>
                       {insuranceCompanies.map(c => (
                          <option key={c.id} value={c.id}>{c.name} - تتحمل {c.discountRate}%</option>
                       ))}
                    </select>
                 </div>

                 <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">طريقة الدفع *</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'cash', label: 'كاش' },
                          { id: 'card', label: 'فيزا / بطاقة' },
                          { id: 'credit', label: 'آجل' }
                        ].map(m => (
                          <div 
                             key={m.id}
                             onClick={() => setFormData({...formData, paymentMethod: m.id})}
                             className={`cursor-pointer text-center py-3 rounded-xl border-2 font-bold text-sm transition-all ${formData.paymentMethod === m.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                             {m.label}
                          </div>
                        ))}
                    </div>
                 </div>
              </div>

              <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 flex justify-between items-center">
                 <div>
                    <div className="text-xs font-bold text-brand-600/70 mb-0.5">المطلوب سداده الآن من المريض (شامل الضريبة)</div>
                    <div className="font-black text-2xl text-brand-700">
                       {calculateShares(Number(formData.amount) || 0, Number(formData.discount) || 0, Number(formData.taxRate) || 0, formData.insuranceCompanyId).patientShare} ج.م
                    </div>
                    {Number(formData.taxRate) > 0 && (
                        <div className="text-xs text-brand-600 font-bold mt-1">يحتوي على ضريبة: {calculateShares(Number(formData.amount) || 0, Number(formData.discount) || 0, Number(formData.taxRate) || 0, formData.insuranceCompanyId).taxValue} ج.م</div>
                    )}
                 </div>
                 {formData.insuranceCompanyId && (
                     <div className="text-right">
                        <div className="text-xs font-bold text-slate-500 mb-0.5">تتحمله شركة التأمين</div>
                        <div className="font-bold text-slate-700">
                           {calculateShares(Number(formData.amount) || 0, Number(formData.discount) || 0, Number(formData.taxRate) || 0, formData.insuranceCompanyId).insuranceShare} ج.م
                        </div>
                     </div>
                 )}
              </div>
              
              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  className="w-full px-6 py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20 text-lg"
                >
                  حفظ وتسجيل الفاتورة
                </button>
              </div>
            </form>
          </div>
        </div>
       )}

       <ConfirmModal
          isOpen={deleteId !== null}
          title="تأكيد حذف الفاتورة"
          message="هل أنت متأكد من حذف هذه الفاتورة؟ سيتم تسجيل هذه العملية في سجل التدقيق والمراجعات مع الاحتفاظ بنسخة من البيانات (Audit Trail)."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
          confirmText="حذف الفاتورة"
       />

       <ConfirmModal
          isOpen={isShiftClosingConfirmOpen}
          title="تأكيد تقفيل الوردية"
          message="هل أنت متأكد من المبالغ؟ سيتم اعتماد المبالغ وإغلاق الوردية."
          onConfirm={confirmCloseShift}
          onCancel={() => setIsShiftClosingConfirmOpen(false)}
          confirmText="تقفيل الوردية"
       />
    </div>
  );
};
