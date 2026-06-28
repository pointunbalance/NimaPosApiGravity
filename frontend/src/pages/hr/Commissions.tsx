import { AccountingEngine } from '../../services/AccountingEngine';
import React, { useState, useRef } from 'react';
import { Coins, Search, Plus, CheckCircle, Clock, User, Edit, Trash2, Save, X, Eye, Download, Printer, AlertTriangle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Commission } from '../../types';
import { format } from 'date-fns';
import { Toaster, toast } from 'react-hot-toast';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const Commissions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [commissionToDelete, setCommissionToDelete] = useState<number | null>(null);
  
  const [isDuplicateConfirmOpen, setIsDuplicateConfirmOpen] = useState(false);
  const [pendingCommissionData, setPendingCommissionData] = useState<any>(null);

  const [editingCommission, setEditingCommission] = useState<Partial<Commission> | null>(null);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);

  const [calcType, setCalcType] = useState<'manual' | 'percentage' | 'fixed'>('manual');
  const [repairValue, setRepairValue] = useState<number>(0);
  const [percentageRate, setPercentageRate] = useState<number>(10);
  const [deviceCount, setDeviceCount] = useState<number>(1);
  const [fixedFeePerDevice, setFixedFeePerDevice] = useState<number>(5000);

  const printRef = useRef<HTMLDivElement>(null);

  const currentUser = JSON.parse(localStorage.getItem('nima_user') || '{}');
  const users = useLiveQuery(() => db.users.toArray()) || [];
  
  const commissions = useLiveQuery(async () => {
    const allCommissions = await db.commissions.toArray();
    return allCommissions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  const visibleCommissions = currentUser.role === 'admin' 
    ? commissions 
    : commissions?.filter(c => c.employeeId === currentUser.id);

  const getUserName = (id: number) => {
    return users.find(u => u.id === id)?.name || 'غير معروف';
  };

  const filteredCommissions = visibleCommissions?.filter(commission => {
    const employeeName = getUserName(commission.employeeId);
    const matchesSearch = employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (commission.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || commission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const executeSave = async (data: any) => {
    try {
      const commissionData: any = {
        employeeId: data.employeeId,
        amount: Number(data.amount),
        date: data.date || new Date().toISOString(),
        status: data.status || 'pending',
        notes: data.notes || '',
        relatedOrderId: data.relatedOrderId
      };

      if (data.id) {
        await db.commissions.update(data.id, commissionData);
        toast.success('تم تعديل سجل العمولة بنجاح.');
      } else {
        await db.commissions.add(commissionData);
        toast.success('تم إضافة سجل العمولة بنجاح.');
      }

      setIsModalOpen(false);
      setEditingCommission(null);
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء حفظ العمولة');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommission?.employeeId || !editingCommission?.amount) return;

    // Duplicate Check
    const commissionMonth = new Date(editingCommission.date || new Date()).toISOString().slice(0, 7);
    const existing = commissions?.filter(c => 
      c.employeeId === editingCommission.employeeId && 
      c.id !== editingCommission.id &&
      new Date(c.date).toISOString().slice(0, 7) === commissionMonth
    );

    if (existing && existing.length > 0) {
      if (editingCommission.relatedOrderId) {
         const dupOrder = existing.find(c => c.relatedOrderId === editingCommission.relatedOrderId);
         if (dupOrder) {
           toast.error('تنبيه: تم صرف عمولة مسبقاً لهذا الموظف على نفس رقم الطلب.');
           return;
         }
      }
      if (editingCommission.notes) {
         const dupNote = existing.find(c => c.notes === editingCommission.notes);
         if (dupNote) {
            setPendingCommissionData(editingCommission);
            setIsDuplicateConfirmOpen(true);
            return;
         }
      }
    }

    await executeSave(editingCommission);
  };

  const confirmDelete = async () => {
    if (commissionToDelete) {
      try {
        await db.commissions.delete(commissionToDelete);
        toast.success('تم حذف سجل العمولة بنجاح.');
      } catch (err) {
        toast.error('فشل في حذف سجل العمولة.');
      } finally {
        setCommissionToDelete(null);
      }
    }
  };

  const handleMarkAsPaid = async (id: number) => {
    try {
      await db.transaction('rw', db.commissions, db.journalEntries, db.accounts, db.expenses, async () => {
        await db.commissions.update(id, { status: 'paid' });
        
        const commission = await db.commissions.get(id);
        const employee = users.find(u => u.id === commission?.employeeId);
        
        if (commission) {
           await db.expenses.add({
             title: `صرف عمولة - ${employee?.name || 'مجهول'}`,
             amount: commission.amount,
             category: 'salary', // or bonus
             date: new Date(),
             paymentMethod: 'cash',
             employeeId: commission.employeeId,
             notes: `عمولة: ${commission.notes || ''}`
           });

           const cashAcc = await db.accounts.where('code').equals('1010').first();
           const bonusAcc = await db.accounts.where('code').equals('5030').first(); // Using salaries account for simplicity
           
           if (cashAcc && bonusAcc) {
             await AccountingEngine.postEntry({
                date: new Date(),
                reference: `COM-${id}`,
                description: `صرف عمولة - ${employee?.name || commission.employeeId}`,
                lines: [
                   { accountId: bonusAcc.id!, accountName: bonusAcc.name, debit: commission.amount, credit: 0, description: 'عمولات وحوافز' },
                   { accountId: cashAcc.id!, accountName: cashAcc.name, debit: 0, credit: commission.amount, description: 'دفع من الصندوق' }
                ]
             });
           }
        }
      });
      toast.success('تم صرف العمولة بنجاح وإثبات القيود المحاسبية باليومية العامة.');
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء صرف العمولة');
    }
  };

  const openModal = (commission?: Commission) => {
    setCalcType('manual');
    setRepairValue(0);
    setPercentageRate(10);
    setDeviceCount(1);
    setFixedFeePerDevice(5000);
    if (commission) {
      setEditingCommission(commission);
    } else {
      setEditingCommission({
        employeeId: 0,
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    if (!filteredCommissions || filteredCommissions.length === 0) return;
    
    const headers = ['الموظف', 'التاريخ', 'المبلغ', 'البيان', 'رقم الطلب المرتبط', 'الحالة'];
    const csvContent = [
      headers.join(','),
      ...filteredCommissions.map(commission => {
        return [
          `"${getUserName(commission.employeeId)}"`,
          `"${format(new Date(commission.date), 'yyyy-MM-dd')}"`,
          commission.amount,
          `"${(commission.notes || '').replace(/"/g, '""')}"`,
          `"${commission.relatedOrderId || '-'}"`,
          `"${commission.status === 'paid' ? 'مدفوعة' : 'مستحقة'}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `العمولات_والحوافز_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!currentUser || !currentUser.id) return null;

  const totalAmount = filteredCommissions?.reduce((sum, c) => sum + c.amount, 0) || 0;
  const paidAmount = filteredCommissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) || 0;
  const pendingAmount = totalAmount - paidAmount;

  return (
    <div className="p-6 max-w-7xl mx-auto" ref={printRef}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">إدارة العمولات والحوافز</h1>
            <p className="text-slate-500 mt-1">حساب وإدارة عمولات المبيعات والوسطاء</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Download size={20} />
            تصدير
          </button>
          <button
            onClick={handlePrint}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Printer size={20} />
            طباعة
          </button>
          {currentUser.role === 'admin' && (
            <button 
              onClick={() => openModal()}
              className="bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة عمولة جديدة</span>
            </button>
          )}
        </div>
      </div>

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">تقرير العمولات والحوافز</h1>
        <p className="text-center text-slate-500">تاريخ الطباعة: {format(new Date(), 'yyyy-MM-dd')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="text-slate-500 text-sm font-medium mb-1">إجمالي العمولات</div>
          <div className="text-2xl font-bold text-slate-800">{totalAmount.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="text-emerald-500 text-sm font-medium mb-1">العمولات المدفوعة</div>
          <div className="text-2xl font-bold text-emerald-600">{paidAmount.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="text-amber-500 text-sm font-medium mb-1">العمولات المستحقة</div>
          <div className="text-2xl font-bold text-amber-600">{pendingAmount.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:border-none print:shadow-none">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 print:hidden">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث باسم الموظف أو البيان..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all text-slate-800"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">مستحقة</option>
            <option value="paid">مدفوعة</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-slate-600 font-semibold text-sm">الموظف</th>
                <th className="p-4 text-slate-600 font-semibold text-sm">التاريخ</th>
                <th className="p-4 text-slate-600 font-semibold text-sm">المبلغ</th>
                <th className="p-4 text-slate-600 font-semibold text-sm">البيان</th>
                <th className="p-4 text-slate-600 font-semibold text-sm">الحالة</th>
                <th className="p-4 text-slate-600 font-semibold text-sm print:hidden">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCommissions?.map((commission) => (
                <tr key={commission.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
                      {getUserName(commission.employeeId).charAt(0)}
                    </div>
                    {getUserName(commission.employeeId)}
                  </td>
                  <td className="p-4 text-slate-600">{format(new Date(commission.date), 'yyyy-MM-dd')}</td>
                  <td className="p-4 font-bold text-amber-600">{commission.amount.toFixed(2)}</td>
                  <td className="p-4 text-slate-600 max-w-xs truncate" title={commission.notes}>{commission.notes || '-'}</td>
                  <td className="p-4">
                    {commission.status === 'paid' ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm flex items-center gap-1 w-fit">
                        <CheckCircle className="w-4 h-4" /> مدفوعة
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm flex items-center gap-1 w-fit">
                        <Clock className="w-4 h-4" /> مستحقة
                      </span>
                    )}
                  </td>
                  <td className="p-4 print:hidden">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSelectedCommission(commission);
                          setIsViewModalOpen(true);
                        }}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {currentUser.role === 'admin' && (
                        <>
                          {commission.status === 'pending' && (
                            <button
                              onClick={() => handleMarkAsPaid(commission.id!)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="صرف العمولة"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => openModal(commission)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setCommissionToDelete(commission.id!)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!filteredCommissions || filteredCommissions.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    لا توجد عمولات مطابقة للبحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {isViewModalOpen && selectedCommission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Coins className="text-amber-600" />
                تفاصيل العمولة
              </h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">الموظف</h3>
                  <p className="font-bold text-slate-800">{getUserName(selectedCommission.employeeId)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">المبلغ</h3>
                  <p className="font-bold text-amber-600 text-lg">{selectedCommission.amount.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">التاريخ</h3>
                  <p className="text-slate-800">{format(new Date(selectedCommission.date), 'yyyy-MM-dd')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">رقم الطلب المرتبط</h3>
                  <p className="text-slate-800">{selectedCommission.relatedOrderId || '-'}</p>
                </div>
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-slate-500 mb-1">الحالة</h3>
                  <div className="mt-1">
                    {selectedCommission.status === 'paid' ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm flex items-center gap-1 w-fit">
                        <CheckCircle className="w-4 h-4" /> مدفوعة
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm flex items-center gap-1 w-fit">
                        <Clock className="w-4 h-4" /> مستحقة
                      </span>
                    )}
                  </div>
                </div>
                {selectedCommission.notes && (
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-slate-500 mb-1">البيان / الملاحظات</h3>
                    <div className="bg-slate-50 p-3 rounded-lg text-slate-800 whitespace-pre-wrap">
                      {selectedCommission.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl transition-colors font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && editingCommission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingCommission.id ? 'تعديل العمولة' : 'إضافة عمولة جديدة'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="commission-form" onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الموظف *</label>
                  <select
                    required
                    value={editingCommission.employeeId || ''}
                    onChange={e => setEditingCommission({...editingCommission, employeeId: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="">اختر الموظف...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <label className="block text-sm font-semibold text-slate-800">حاسبة عمولة الفني / الموظف</label>
                  <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setCalcType('manual');
                      }}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${calcType === 'manual' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      إدخال مباشر
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCalcType('percentage');
                        const amt = (repairValue * percentageRate) / 100;
                        setEditingCommission({...editingCommission, amount: Number(amt.toFixed(2))});
                      }}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${calcType === 'percentage' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      نسبة مئوية (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCalcType('fixed');
                        const amt = deviceCount * fixedFeePerDevice;
                        setEditingCommission({...editingCommission, amount: amt});
                      }}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${calcType === 'fixed' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      مبلغ مقطوع للجهاز
                    </button>
                  </div>

                  {calcType === 'percentage' && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">قيمة تكلفة الإصلاح (د.ع)</label>
                        <input
                          type="number"
                          min="0"
                          value={repairValue || ''}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setRepairValue(val);
                            const amt = (val * percentageRate) / 100;
                            setEditingCommission({...editingCommission, amount: Number(amt.toFixed(2))});
                          }}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none"
                          placeholder="مثال: 50000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">نسبة عمولة الفني (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={percentageRate || ''}
                          onChange={e => {
                            const rate = Number(e.target.value);
                            setPercentageRate(rate);
                            const amt = (repairValue * rate) / 100;
                            setEditingCommission({...editingCommission, amount: Number(amt.toFixed(2))});
                          }}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none"
                          placeholder="مثال: 10"
                        />
                      </div>
                    </div>
                  )}

                  {calcType === 'fixed' && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">عدد الأجهزة المصلحة</label>
                        <input
                          type="number"
                          min="1"
                          value={deviceCount || ''}
                          onChange={e => {
                            const count = Number(e.target.value);
                            setDeviceCount(count);
                            const amt = count * fixedFeePerDevice;
                            setEditingCommission({...editingCommission, amount: amt});
                          }}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none"
                          placeholder="مثال: 1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">المبلغ المقطوع للجهاز (د.ع)</label>
                        <input
                          type="number"
                          min="0"
                          value={fixedFeePerDevice || ''}
                          onChange={e => {
                            const fee = Number(e.target.value);
                            setFixedFeePerDevice(fee);
                            const amt = deviceCount * fee;
                            setEditingCommission({...editingCommission, amount: amt});
                          }}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none"
                          placeholder="مثال: 5000"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">المبلغ *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={editingCommission.amount || ''}
                      onChange={e => setEditingCommission({...editingCommission, amount: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">التاريخ *</label>
                    <input
                      type="date"
                      required
                      value={editingCommission.date ? format(new Date(editingCommission.date), 'yyyy-MM-dd') : ''}
                      onChange={e => setEditingCommission({...editingCommission, date: new Date(e.target.value).toISOString()})}
                      className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الحالة</label>
                  <select
                    value={editingCommission.status || 'pending'}
                    onChange={e => setEditingCommission({...editingCommission, status: e.target.value as any})}
                    className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="pending">مستحقة</option>
                    <option value="paid">مدفوعة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">رقم الطلب المرتبط (اختياري)</label>
                  <input
                    type="number"
                    value={editingCommission.relatedOrderId || ''}
                    onChange={e => setEditingCommission({...editingCommission, relatedOrderId: e.target.value ? Number(e.target.value) : undefined})}
                    className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="رقم الطلب إن وجد"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">البيان / الملاحظات</label>
                  <textarea
                    rows={2}
                    value={editingCommission.notes || ''}
                    onChange={e => setEditingCommission({...editingCommission, notes: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                    placeholder="سبب العمولة أو أي ملاحظات أخرى..."
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-medium"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="commission-form"
                className="px-6 py-2.5 bg-amber-500 text-white hover:bg-amber-600 rounded-xl transition-colors font-medium flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {commissionToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">تأكيد الحذف</h2>
              <p className="text-slate-600 mb-6">
                هل أنت متأكد من حذف سجل العمولة هذا؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setCommissionToDelete(null)}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors font-medium"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium"
                >
                  نعم، احذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDuplicateConfirmOpen}
        title="تنبيه: تكرار سجل عمولة"
        message="توجد عمولة مسجلة بالفعل لهذا الموظف بنفس التفاصيل (البيان) في نفس الشهر الحالي. هل تريد بالتأكيد المتابعة وحفظ السجل المكرر؟"
        onConfirm={async () => {
          setIsDuplicateConfirmOpen(false);
          if (pendingCommissionData) {
            await executeSave(pendingCommissionData);
            setPendingCommissionData(null);
          }
        }}
        onCancel={() => {
          setIsDuplicateConfirmOpen(false);
          setPendingCommissionData(null);
        }}
        confirmText="نعم، احفظ على أي حال"
        cancelText="تراجع وتعديل"
      />

      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};

export default Commissions;
