import React from 'react';
import { Search, Filter, FileText, Image as ImageIcon, Copy, Edit, Trash2, Printer } from 'lucide-react';
import { Expense } from '../../../types';

interface SchoolExpensesListProps {
  filteredExpenses: Expense[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  getCategoryLabel: (category: string) => string;
  getCategoryPercentage: (category: string) => number;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  handleDuplicate: (expense: Expense) => void;
  openModal: (expense: Expense) => void;
  deleteExpense: (id: number) => void;
  setViewImage: (image: string) => void;
  handleApprove?: (expense: Expense) => void;
  handleReject?: (expense: Expense) => void;
}

const SchoolExpensesList: React.FC<SchoolExpensesListProps> = ({
  filteredExpenses, searchTerm, setSearchTerm, filterCategory, setFilterCategory,
  getCategoryLabel, getCategoryPercentage, formatCurrency, formatDate,
  handleDuplicate, openModal, deleteExpense, setViewImage,
  handleApprove, handleReject
}) => {
  const handlePrintVoucher = (expense: Expense) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>سند صرف - ${expense.title}</title>
            <style>
              body { font-family: 'Tajawal', sans-serif; padding: 40px; color: #333; }
              .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px dashed #eee; padding-bottom: 10px; }
              .label { font-weight: bold; color: #666; width: 150px; }
              .value { flex: 1; font-size: 18px; }
              .footer { margin-top: 60px; display: flex; justify-content: space-between; }
              .signature { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 10px; }
              @media print {
                body { padding: 0; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">سند صرف (Expense Voucher)</div>
              <div>رقم السند: #${expense.id || '---'}</div>
              <div>التاريخ: ${formatDate(expense.date)}</div>
            </div>
            
            <div class="row">
              <div class="label">البيان:</div>
              <div class="value">${expense.title}</div>
            </div>
            <div class="row">
              <div class="label">المبلغ:</div>
              <div class="value" style="font-weight: bold; font-size: 20px;">${formatCurrency(expense.amount)}</div>
            </div>
            ${expense.taxAmount ? `
            <div class="row">
              <div class="label">الضريبة:</div>
              <div class="value">${formatCurrency(expense.taxAmount)}</div>
            </div>
            ` : ''}
            <div class="row">
              <div class="label">التصنيف:</div>
              <div class="value">${getCategoryLabel(expense.category)}</div>
            </div>
            <div class="row">
              <div class="label">طريقة الدفع:</div>
              <div class="value">${expense.paymentMethod === 'card' ? 'بطاقة' : expense.paymentMethod === 'bank' ? 'تحويل بنكي' : 'نقدي'}</div>
            </div>
            ${expense.vendor ? `
            <div class="row">
              <div class="label">المورد / المستفيد:</div>
              <div class="value">${expense.vendor}</div>
            </div>
            ` : ''}
            ${expense.referenceNumber ? `
            <div class="row">
              <div class="label">رقم المرجع:</div>
              <div class="value">${expense.referenceNumber}</div>
            </div>
            ` : ''}
            ${expense.notes ? `
            <div class="row">
              <div class="label">ملاحظات:</div>
              <div class="value">${expense.notes}</div>
            </div>
            ` : ''}

            <div class="footer">
              <div class="signature">توقيع المستلم</div>
              <div class="signature">توقيع المحاسب</div>
              <div class="signature">المدير المالي</div>
            </div>
            <script>
              window.onload = () => window.print();
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
        <div className="relative w-full sm:w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="بحث في المصروفات..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="text-slate-400 w-5 h-5" />
          <select 
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700"
          >
            <option value="all">جميع التصنيفات</option>
            <option value="rent">إيجار</option>
            <option value="salary">رواتب</option>
            <option value="utilities">فواتير</option>
            <option value="purchase">مشتريات</option>
            <option value="marketing">تسويق وإعلانات</option>
            <option value="maintenance">صيانة وإصلاح</option>
            <option value="supplies">مستلزمات مكتبية</option>
            <option value="government">رسوم حكومية</option>
            <option value="transportation">نقل ومواصلات</option>
            <option value="other">نثريات</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredExpenses.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
            <FileText className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-xl font-bold">لا توجد مصروفات</p>
            <p className="text-sm mt-2">قم بإضافة مصروف جديد أو جرب تغيير الفلاتر</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map(expense => (
              <div key={expense.id} className="group bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md transition-all hover:border-indigo-100">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{expense.title}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-700">
                          {getCategoryLabel(expense.category)}
                        </span>
                        <span>{formatDate(expense.date)}</span>
                        <span className="flex items-center gap-1">
                          {expense.paymentMethod === 'card' ? 'بطاقة' : expense.paymentMethod === 'bank' ? 'تحويل بنكي' : 'نقدي'}
                        </span>
                        {expense.vendor && (
                          <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                            المورد: {expense.vendor}
                          </span>
                        )}
                        {expense.referenceNumber && (
                          <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">
                            مرجع: {expense.referenceNumber}
                          </span>
                        )}
                        {expense.status && (
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            expense.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            expense.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {expense.status === 'pending' ? 'قيد الانتظار' :
                             expense.status === 'approved' ? 'معتمد' : 'مرفوض'}
                          </span>
                        )}
                      </div>
                      {expense.notes && (
                        <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {expense.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-left flex flex-col items-end">
                    <span className="font-extrabold text-xl text-slate-800">{formatCurrency(expense.amount)}</span>
                    {expense.taxAmount ? (
                      <span className="text-xs text-slate-500 mt-1">شامل ضريبة: {formatCurrency(expense.taxAmount)}</span>
                    ) : null}
                    <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {expense.status === 'pending' && handleApprove && handleReject && (
                        <>
                          <button 
                            onClick={() => handleApprove(expense)}
                            className="p-1 px-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors text-xs font-bold"
                          >
                            موافقة
                          </button>
                          <button 
                            onClick={() => handleReject(expense)}
                            className="p-1 px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-xs font-bold"
                          >
                            رفض
                          </button>
                        </>
                      )}
                      {expense.attachment && (
                        <button 
                          onClick={() => setViewImage(expense.attachment!)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="عرض الإيصال"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handlePrintVoucher(expense)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="طباعة سند صرف"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDuplicate(expense)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="تكرار"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openModal(expense)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteExpense(expense.id!)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolExpensesList;
