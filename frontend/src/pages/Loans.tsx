import { AccountingEngine } from '../services/AccountingEngine';
import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Loan } from '../types';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Clock, DollarSign, Search, Download, Printer, Eye, X, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export const Loans: React.FC = () => {
  const loans = useLiveQuery(async () => {
    const allLoans = await db.loans.toArray();
    return allLoans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, []);
  const users = useLiveQuery(() => db.users.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
  const currentUser = JSON.parse(localStorage.getItem('nima_user') || '{}');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<number | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Loan['status']>('all');

  const printRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Partial<Loan>>({
    amount: 0,
    installmentMonths: 1,
    monthlyDeduction: 0,
    startDate: new Date(),
    reason: '',
    status: 'pending'
  });

  const currencyCode = settings?.currencyCode || 'EGP';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.id) return;
    
    // Validation
    const employeeId = formData.userId || currentUser.id;
    const employee = users?.find(u => u.id === employeeId);
    if (employee && employee.baseSalary) {
      const maxMonthlyDeduction = employee.baseSalary * 0.5;
      if (formData.monthlyDeduction && formData.monthlyDeduction > maxMonthlyDeduction) {
        alert(`لا يمكن أن يتجاوز الخصم الشهري 50% من الراتب الأساسي للموظف. الحد الأقصى: ${maxMonthlyDeduction.toFixed(2)}`);
        return;
      }
    }

    if (editingLoan && editingLoan.id) {
      await db.loans.update(editingLoan.id, {
        ...formData,
      });
    } else {
      await db.loans.add({
        ...formData as Loan,
        userId: formData.userId || currentUser.id,
        createdAt: new Date()
      });
    }
    
    setIsModalOpen(false);
    setEditingLoan(null);
    setFormData({
      amount: 0,
      installmentMonths: 1,
      monthlyDeduction: 0,
      startDate: new Date(),
      reason: '',
      status: 'pending'
    });
  };

  const confirmDelete = async () => {
    if (loanToDelete) {
      await db.loans.delete(loanToDelete);
      setLoanToDelete(null);
    }
  };

  const handleStatusChange = async (id: number, status: 'approved' | 'rejected' | 'paid') => {
    if (!currentUser || !currentUser.id) return;
    
    try {
        await db.transaction('rw', db.loans, db.journalEntries, db.accounts, async () => {
            await db.loans.update(id, {
              status,
              approvedBy: currentUser.id,
              ...(status === 'paid' && { paidAmount: (await db.loans.get(id))?.amount })
            });
            
            if (status === 'approved') {
                const loan = await db.loans.get(id);
                if (loan) {
                    const employee = users?.find(e => e.id === loan.userId);
                    // Accounting Interaction
                    const cashAccount = await db.accounts.where('code').equals('1010').first(); // الصندوق
                    const employeeReceivableAccount = await db.accounts.where('code').equals('1030').first(); // عهد موظفين / سلف
                    
                    if (cashAccount && employeeReceivableAccount) {
                        await AccountingEngine.postEntry({
                            date: new Date(),
                            reference: `LOAN-${id}`,
                            description: `صرف سلفة للموظف ${employee?.name || loan.userId}`,
                            lines: [
                                { accountId: employeeReceivableAccount.id!, accountName: employeeReceivableAccount.name, debit: loan.amount, credit: 0, description: `سلفة ${employee?.name || loan.userId}` },
                                { accountId: cashAccount.id!, accountName: cashAccount.name, debit: 0, credit: loan.amount, description: `دفع من الصندوق` }
                            ],
                            });
                    }
                }
            }
        });
    } catch (err) {
        console.error("Failed to approve loan and post entry", err);
        alert("حدث خطأ أثناء اعتماد السلفة");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1 w-fit"><CheckCircle size={12}/> معتمد</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1 w-fit"><XCircle size={12}/> مرفوض</span>;
      case 'paid': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1 w-fit"><DollarSign size={12}/> مسدد</span>;
      default: return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1 w-fit"><Clock size={12}/> قيد الانتظار</span>;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'معتمد';
      case 'rejected': return 'مرفوض';
      case 'paid': return 'مسدد';
      default: return 'قيد الانتظار';
    }
  };

  if (!currentUser || !currentUser.id) return null;

  const baseVisibleLoans = currentUser.role === 'admin' 
    ? loans 
    : loans?.filter(l => l.userId === currentUser.id);

  const filteredLoans = baseVisibleLoans?.filter(loan => {
    const userName = users?.find(u => u.id === loan.userId)?.name || '';
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (loan.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    if (!filteredLoans || filteredLoans.length === 0) return;
    
    const headers = ['الموظف', 'المبلغ', 'عدد الأشهر', 'الخصم الشهري', 'تاريخ البدء', 'الحالة', 'السبب'];
    const csvContent = [
      headers.join(','),
      ...filteredLoans.map(loan => {
        const userName = users?.find(u => u.id === loan.userId)?.name || 'غير معروف';
        return [
          `"${userName}"`,
          `"${loan.amount} ${currencyCode}"`,
          `"${loan.installmentMonths}"`,
          `"${loan.monthlyDeduction.toFixed(2)} ${currencyCode}"`,
          `"${format(new Date(loan.startDate), 'yyyy-MM-dd')}"`,
          `"${getStatusLabel(loan.status)}"`,
          `"${(loan.reason || '').replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `السلف_والقروض_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" ref={printRef}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="text-indigo-600" />
            إدارة السلف والقروض
          </h1>
          <p className="text-gray-500 mt-1">تقديم ومتابعة طلبات السلف المالية</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download size={20} />
            تصدير
          </button>
          <button
            onClick={handlePrint}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Printer size={20} />
            طباعة
          </button>
          <button
            onClick={() => {
              setEditingLoan(null);
              setFormData({ userId: currentUser.id, amount: 0, installmentMonths: 1, monthlyDeduction: 0, startDate: new Date(), status: 'pending', reason: '' });
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            <span>طلب سلفة جديد</span>
          </button>
        </div>
      </div>

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">تقرير السلف والقروض</h1>
        <p className="text-center text-slate-500">تاريخ الطباعة: {format(new Date(), 'yyyy-MM-dd')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:border-none print:shadow-none">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between print:hidden">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="بحث باسم الموظف أو السبب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="approved">معتمد</option>
              <option value="rejected">مرفوض</option>
              <option value="paid">مسدد</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">الموظف</th>
                <th className="p-4 text-sm font-semibold text-gray-600">المبلغ</th>
                <th className="p-4 text-sm font-semibold text-gray-600">عدد الأشهر</th>
                <th className="p-4 text-sm font-semibold text-gray-600">الخصم الشهري</th>
                <th className="p-4 text-sm font-semibold text-gray-600">تاريخ البدء</th>
                <th className="p-4 text-sm font-semibold text-gray-600">الحالة</th>
                <th className="p-4 text-sm font-semibold text-gray-600 print:hidden">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLoans?.map(loan => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-900 font-medium">
                    {users?.find(u => u.id === loan.userId)?.name || 'غير معروف'}
                  </td>
                  <td className="p-4 text-sm font-bold text-indigo-600">
                    {loan.amount.toLocaleString()} {currencyCode}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {loan.installmentMonths}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {loan.monthlyDeduction.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencyCode}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {format(new Date(loan.startDate), 'yyyy-MM-dd')}
                  </td>
                  <td className="p-4">
                    {getStatusBadge(loan.status)}
                  </td>
                  <td className="p-4 print:hidden">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSelectedLoan(loan);
                          setIsViewModalOpen(true);
                        }}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="عرض التفاصيل"
                      >
                        <Eye size={16} />
                      </button>
                      
                      {currentUser.role === 'admin' && loan.status === 'pending' && (
                        <>
                          <button onClick={() => handleStatusChange(loan.id!, 'approved')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="اعتماد">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => handleStatusChange(loan.id!, 'rejected')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="رفض">
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      
                      {currentUser.role === 'admin' && loan.status === 'approved' && (
                        <button onClick={() => handleStatusChange(loan.id!, 'paid')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="تحديد كمسدد بالكامل">
                          <DollarSign size={16} />
                        </button>
                      )}

                      {(currentUser.role === 'admin' || currentUser.id === loan.userId) && loan.status === 'pending' && (
                        <button 
                          onClick={() => {
                            setEditingLoan(loan);
                            setFormData(loan);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}

                      {(currentUser.role === 'admin' || (currentUser.id === loan.userId && loan.status === 'pending')) && (
                        <button 
                          onClick={() => setLoanToDelete(loan.id!)} 
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!filteredLoans || filteredLoans.length === 0) && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    لا توجد طلبات سلف
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {isViewModalOpen && selectedLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="text-indigo-600" />
                تفاصيل طلب السلفة
              </h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">الموظف</h3>
                  <p className="font-bold text-slate-800 text-lg">
                    {users?.find(u => u.id === selectedLoan.userId)?.name || 'غير معروف'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">المبلغ المطلوب</h3>
                  <p className="font-bold text-indigo-600 text-lg">
                    {selectedLoan.amount.toLocaleString()} {currencyCode}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">عدد أشهر السداد</h3>
                  <p className="text-slate-800">{selectedLoan.installmentMonths} أشهر</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">الخصم الشهري</h3>
                  <p className="text-slate-800">{selectedLoan.monthlyDeduction.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencyCode}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">تاريخ تقديم الطلب</h3>
                  <p className="text-slate-800">{format(new Date(selectedLoan.createdAt), 'yyyy-MM-dd HH:mm')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">تاريخ بدء الخصم</h3>
                  <p className="text-slate-800">{format(new Date(selectedLoan.startDate), 'yyyy-MM-dd')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">الحالة</h3>
                  <div className="mt-1">{getStatusBadge(selectedLoan.status)}</div>
                </div>
                {selectedLoan.approvedBy && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">تمت المعالجة بواسطة</h3>
                    <p className="text-slate-800">
                      {users?.find(u => u.id === selectedLoan.approvedBy)?.name || 'غير معروف'}
                    </p>
                  </div>
                )}
              </div>

              {selectedLoan.reason && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">السبب / الملاحظات</h3>
                  <div className="bg-slate-50 p-4 rounded-lg text-slate-800 whitespace-pre-wrap">
                    {selectedLoan.reason}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New/Edit Loan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLoan ? 'تعديل طلب سلفة' : 'طلب سلفة جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 ">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {currentUser.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الموظف</label>
                  <select
                    required
                    value={formData.userId || ''}
                    onChange={e => setFormData({...formData, userId: parseInt(e.target.value)})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">اختر الموظف...</option>
                    {users?.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المطلوب ({currencyCode})</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.amount || ''}
                  onChange={e => {
                    const amount = parseFloat(e.target.value) || 0;
                    const months = formData.installmentMonths || 1;
                    setFormData({...formData, amount, monthlyDeduction: amount / months});
                  }}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">عدد أشهر السداد</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="60"
                    value={formData.installmentMonths || ''}
                    onChange={e => {
                      const months = parseInt(e.target.value) || 1;
                      const amount = formData.amount || 0;
                      setFormData({...formData, installmentMonths: months, monthlyDeduction: amount / months});
                    }}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الخصم الشهري</label>
                  <input
                    type="number"
                    readOnly
                    value={formData.monthlyDeduction?.toFixed(2) || 0}
                    className="w-full p-2 border rounded-lg bg-gray-50 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ بدء الخصم</label>
                <input
                  type="date"
                  required
                  value={formData.startDate ? format(new Date(formData.startDate), 'yyyy-MM-dd') : ''}
                  onChange={e => setFormData({...formData, startDate: new Date(e.target.value)})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السبب / ملاحظات</label>
                <textarea
                  rows={3}
                  value={formData.reason || ''}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingLoan ? 'حفظ التعديلات' : 'تقديم الطلب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {loanToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">تأكيد الحذف</h2>
              <p className="text-slate-600 mb-6">
                هل أنت متأكد من حذف طلب السلفة هذا؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setLoanToDelete(null)}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  نعم، احذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};