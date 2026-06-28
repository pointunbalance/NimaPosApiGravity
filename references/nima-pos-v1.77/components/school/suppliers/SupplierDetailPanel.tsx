import React from 'react';
import { Phone, MapPin, FileText, Receipt, CreditCard, Store } from 'lucide-react';
import { format } from 'date-fns';

interface SupplierDetailPanelProps {
  selectedSupplier: any;
  activeTab: 'info' | 'invoices' | 'payments';
  setActiveTab: (tab: 'info' | 'invoices' | 'payments') => void;
  getSupplierInvoices: (id: number) => any[];
  getSupplierPayments: (id: number) => any[];
  paymentForm: {
    amount: number;
    date: string;
    notes: string;
  };
  setPaymentForm: (form: any) => void;
  handleAddPayment: (e: React.FormEvent) => void;
}

export const SupplierDetailPanel: React.FC<SupplierDetailPanelProps> = ({
  selectedSupplier,
  activeTab,
  setActiveTab,
  getSupplierInvoices,
  getSupplierPayments,
  paymentForm,
  setPaymentForm,
  handleAddPayment,
}) => {
  if (!selectedSupplier) {
    return (
      <div className="bg-slate-50 rounded-3xl border border-slate-200 border-dashed h-[calc(100vh-140px)] flex flex-col items-center justify-center text-slate-400">
        <Store className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-slate-600">اختر مورداً من القائمة</h2>
        <p className="mt-2 font-medium text-sm">لعرض التفاصيل والحسابات الخاصة به والمخالصة</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm h-[calc(100vh-140px)] flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">{selectedSupplier.name}</h2>
          <div className="flex gap-4 text-sm font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-slate-400" /> {selectedSupplier.phone || '-'}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" /> {selectedSupplier.address || '-'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-500 mb-1">الرصيد المستحق (دائن)</p>
          <p className={`text-2xl font-black ${(selectedSupplier.balance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {selectedSupplier.balance || 0} <span className="text-sm font-bold">ج.م</span>
          </p>
        </div>
      </div>

      <div className="px-6 pt-4 border-b border-slate-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-4 font-bold text-sm transition-colors relative cursor-pointer ${
              activeTab === 'info' ? 'text-emerald-600 animate-pulse' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            بيانات وملاحظات
            {activeTab === 'info' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-4 font-bold text-sm transition-colors relative cursor-pointer ${
              activeTab === 'invoices' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            الفواتير والمسحوبات
            {activeTab === 'invoices' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-4 font-bold text-sm transition-colors relative cursor-pointer ${
              activeTab === 'payments' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            سجل المدفوعات
            {activeTab === 'payments' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full"></span>
            )}
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50">
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" /> ملاحظات وتفاصيل إضافية
              </h3>
              <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                {selectedSupplier.notes || 'لا توجد ملاحظات مسجلة لهذا المورد.'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-4">
            {getSupplierInvoices(selectedSupplier.id).map((invoice) => (
              <div
                key={invoice.id}
                className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{invoice.title}</h4>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      التاريخ: {format(new Date(invoice.date), 'yyyy-MM-dd')} • {invoice.category}
                    </p>
                  </div>
                </div>
                <div className="text-lg font-black text-slate-800">
                  {invoice.amount} <span className="text-xs text-slate-500">ج.م</span>
                </div>
              </div>
            ))}
            {getSupplierInvoices(selectedSupplier.id).length === 0 && (
              <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm">لا توجد مسحوبات أو فواتير مسجلة</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-4">تسجيل دفعة جديدة</h3>
              <form onSubmit={handleAddPayment} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">المبلغ المدفوع</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={paymentForm.amount || ''}
                    onChange={() => {}} 
                    onInput={(e: any) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">التاريخ</label>
                  <input
                    required
                    type="date"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات (اختياري)</label>
                  <input
                    type="text"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    placeholder="رقم شيك، حوالة..."
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                  >
                    تسجيل الدفعة
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 text-sm px-1">سجل المدفوعات السابقة</h3>
              {getSupplierPayments(selectedSupplier.id).map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">دفعة نقدية / سداد</h4>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        {format(new Date(payment.date), 'yyyy-MM-dd')} • {payment.receiptNumber}{' '}
                        {payment.description && `• ${payment.description}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-black text-emerald-600">
                      {payment.amount} <span className="text-xs text-emerald-600/70">ج.م</span>
                    </div>
                  </div>
                </div>
              ))}
              {getSupplierPayments(selectedSupplier.id).length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <p className="font-medium text-sm">لم يتم تسجيل دفعات بعد</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierDetailPanel;
