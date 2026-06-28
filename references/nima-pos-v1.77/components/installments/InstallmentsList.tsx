import React from 'react';
import { Search, CreditCard, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import { InstallmentPlan, InstallmentPayment, Customer } from '../../types';

interface InstallmentsListProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredPlans: InstallmentPlan[];
  customers: Customer[];
  payments: InstallmentPayment[];
  expandedPlanId: number | null;
  setExpandedPlanId: (id: number | null) => void;
  currency: string;
  onPayInstallment: (payment: InstallmentPayment, plan: InstallmentPlan) => void;
}

const InstallmentsList: React.FC<InstallmentsListProps> = ({
  searchQuery,
  setSearchQuery,
  filteredPlans,
  customers,
  payments,
  expandedPlanId,
  setExpandedPlanId,
  currency,
  onPayInstallment,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700"><Clock className="w-3.5 h-3.5" /> نشط</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> مكتمل</span>;
      case 'defaulted':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"><AlertCircle className="w-3.5 h-3.5" /> متعثر</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700"><Clock className="w-3.5 h-3.5" /> مستحق</span>;
      case 'paid':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> مدفوع</span>;
      case 'overdue':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"><AlertCircle className="w-3.5 h-3.5" /> متأخر</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="relative w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث باسم العميل أو رقم الخطة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
              <th className="p-4 font-bold">رقم الخطة</th>
              <th className="p-4 font-bold">العميل</th>
              <th className="p-4 font-bold">إجمالي التمويل</th>
              <th className="p-4 font-bold">المتبقي</th>
              <th className="p-4 font-bold">تاريخ البدء</th>
              <th className="p-4 font-bold">الحالة</th>
              <th className="p-4 font-bold text-center">التفاصيل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPlans.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center">
                  <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 mb-1">لا توجد خطط أقساط</h3>
                  <p className="text-slate-500">قم بإنشاء خطة أقساط جديدة للعملاء.</p>
                </td>
              </tr>
            ) : (
              filteredPlans.map(plan => {
                const customer = customers.find(c => c.id === plan.customerId);
                const isExpanded = expandedPlanId === plan.id;
                const planPayments = payments.filter(p => p.planId === plan.id).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
                
                // Check for overdue payments
                const now = new Date();
                const hasOverdue = planPayments.some(p => p.status === 'pending' && new Date(p.dueDate) < now);

                return (
                  <React.Fragment key={plan.id}>
                    <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}>
                      <td className="p-4 font-mono text-slate-600">#{plan.id}</td>
                      <td className="p-4 font-bold text-slate-800">{customer?.name || 'عميل غير معروف'}</td>
                      <td className="p-4 text-slate-700">
                        {plan.totalAmount.toFixed(2)} {currency}
                        {plan.totalInterestAmount > 0 && (
                          <div className="text-xs text-slate-400 mt-1">شامل الفوائد</div>
                        )}
                      </td>
                      <td className="p-4 font-bold text-brand-600">{plan.remainingAmount.toFixed(2)} {currency}</td>
                      <td className="p-4 text-slate-600">{new Date(plan.startDate).toLocaleDateString('ar-EG')}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(plan.status)}
                          {hasOverdue && plan.status === 'active' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">يوجد متأخرات</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => setExpandedPlanId(isExpanded ? null : plan.id!)}
                          className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-0 bg-slate-50/80 border-b border-slate-200">
                          <div className="p-6 animate-in slide-in-from-top-2 duration-200">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                              <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap justify-between items-center gap-4">
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                  <FileText className="w-5 h-5 text-brand-500" />
                                  جدول الدفعات
                                </h4>
                                <div className="flex gap-4 text-sm text-slate-600">
                                  <span>الدفعة المقدمة: <strong className="text-slate-800">{plan.downPayment.toFixed(2)} {currency}</strong></span>
                                  <span>نوع الفائدة: <strong className="text-slate-800">{plan.interestType === 'none' ? 'بدون فوائد' : plan.interestType === 'fixed' ? 'ثابتة' : 'متناقصة'}</strong></span>
                                  {plan.lateFeeEnabled && (
                                    <span className="text-amber-600 flex items-center gap-1">
                                      <AlertTriangle className="w-4 h-4" /> غرامات تأخير مفعلة
                                    </span>
                                  )}
                                </div>
                              </div>
                              <table className="w-full text-right text-sm">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                                    <th className="p-3 font-bold">رقم القسط</th>
                                    <th className="p-3 font-bold">تاريخ الاستحقاق</th>
                                    <th className="p-3 font-bold">أصل المبلغ</th>
                                    <th className="p-3 font-bold">الفائدة</th>
                                    <th className="p-3 font-bold">إجمالي القسط</th>
                                    <th className="p-3 font-bold">الحالة</th>
                                    <th className="p-3 font-bold">تاريخ الدفع</th>
                                    <th className="p-3 font-bold text-center">إجراء</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {planPayments.map((payment, index) => {
                                    const isOverdue = payment.status === 'pending' && new Date(payment.dueDate) < now;
                                    return (
                                      <tr key={payment.id} className={isOverdue ? 'bg-red-50/30' : ''}>
                                        <td className="p-3 text-slate-600">{index + 1}</td>
                                        <td className="p-3 font-medium text-slate-800">{new Date(payment.dueDate).toLocaleDateString('ar-EG')}</td>
                                        <td className="p-3 text-slate-600">{payment.principalPart?.toFixed(2) || '0.00'}</td>
                                        <td className="p-3 text-slate-600">{payment.interestPart?.toFixed(2) || '0.00'}</td>
                                        <td className="p-3 font-bold text-slate-800">
                                          {payment.amount.toFixed(2)} {currency}
                                          {payment.lateFeeApplied ? (
                                            <span className="block text-xs text-red-600 mt-0.5">
                                              + غرامة: {payment.lateFeeApplied.toFixed(2)}
                                            </span>
                                          ) : null}
                                        </td>
                                        <td className="p-3">
                                          {getStatusBadge(isOverdue ? 'overdue' : payment.status)}
                                        </td>
                                        <td className="p-3 text-slate-600">
                                          {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('ar-EG') : '-'}
                                        </td>
                                        <td className="p-3 text-center">
                                          {payment.status === 'pending' && (
                                            <button
                                              onClick={() => onPayInstallment(payment, plan)}
                                              className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                                            >
                                              تسديد
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InstallmentsList;
