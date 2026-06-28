import React from 'react';
import { Customer, B2BInvoice } from '../../types';
import { Printer } from 'lucide-react';

interface B2BCustomerStatementModalProps {
  customer: Customer;
  invoices: B2BInvoice[];
  onClose: () => void;
}

const B2BCustomerStatementModal: React.FC<B2BCustomerStatementModalProps> = ({
  customer,
  invoices,
  onClose
}) => {
  const customerInvoices = invoices
    .filter(inv => inv.customerId === customer.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>كشف حساب - ${customer.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 30px; }
              .summary { margin-top: 30px; padding-top: 20px; border-top: 2px solid #333; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>كشف حساب عميل</h2>
              <p>العميل: ${customer.name}</p>
              <p>التاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>التاريخ</th>
                  <th>تاريخ الاستحقاق</th>
                  <th>الإجمالي</th>
                  <th>المدفوع</th>
                  <th>المتبقي</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                ${customerInvoices.map(inv => `
                  <tr>
                    <td>INV-${inv.id?.toString().padStart(4, '0')}</td>
                    <td>${new Date(inv.createdAt).toLocaleDateString('ar-SA')}</td>
                    <td>${new Date(inv.dueDate).toLocaleDateString('ar-SA')}</td>
                    <td>${inv.totalAmount.toLocaleString()}</td>
                    <td>${inv.paidAmount.toLocaleString()}</td>
                    <td>${(inv.totalAmount - inv.paidAmount).toLocaleString()}</td>
                    <td>${inv.status === 'paid' ? 'مدفوعة' : inv.status === 'partial' ? 'جزئي' : 'غير مدفوعة'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="summary">
              <p><strong>إجمالي المشتريات:</strong> ${customer.totalSpent?.toLocaleString() || '0'}</p>
              <p><strong>الرصيد المستحق (المتبقي):</strong> ${customer.balance?.toLocaleString() || '0'}</p>
            </div>
            <script>
              window.onload = () => { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">كشف حساب: {customer.name}</h2>
            <p className="text-sm text-slate-500 mt-1">رقم العميل: C-{customer.id?.toString().padStart(4, '0')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors"
            >
              <Printer size={18} />
              طباعة الكشف
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">إجمالي المشتريات</p>
              <p className="text-2xl font-bold text-slate-800">{customer.totalSpent?.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-rose-50 p-4 rounded-xl">
              <p className="text-sm text-rose-600 mb-1">الرصيد المستحق</p>
              <p className="text-2xl font-bold text-rose-700">{customer.balance?.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl">
              <p className="text-sm text-emerald-600 mb-1">الحد الائتماني</p>
              <p className="text-2xl font-bold text-emerald-700">{customer.creditLimit?.toLocaleString() || '0'}</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">رقم الفاتورة</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">التاريخ</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">الإجمالي</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">المدفوع</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">المتبقي</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {customerInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-indigo-600">INV-{inv.id?.toString().padStart(4, '0')}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{new Date(inv.createdAt).toLocaleDateString('ar-SA')}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{inv.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-emerald-600">{inv.paidAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-rose-600">{(inv.totalAmount - inv.paidAmount).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        inv.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'partial' ? 'جزئي' : 'غير مدفوعة'}
                      </span>
                    </td>
                  </tr>
                ))}
                {customerInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      لا توجد فواتير لهذا العميل
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default B2BCustomerStatementModal;
