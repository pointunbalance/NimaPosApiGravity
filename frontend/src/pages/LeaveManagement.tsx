import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { LeaveRequest } from '../types';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Clock, Search, Download, Printer, Eye, X, AlertTriangle, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useToast } from '../context/ToastContext';

export const LeaveManagement: React.FC = () => {
  const { showToast } = useToast();
  const leaves = useLiveQuery(async () => {
    const allLeaves = await db.leaveRequests.toArray();
    return allLeaves.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, []);
  const users = useLiveQuery(() => db.users.toArray(), []);
  const currentUser = JSON.parse(localStorage.getItem('nima_user') || '{}');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [leaveToDelete, setLeaveToDelete] = useState<number | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LeaveRequest['status']>('all');

  const printRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Partial<LeaveRequest>>({
    type: 'annual',
    startDate: new Date(),
    endDate: new Date(),
    reason: '',
    status: 'pending'
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.id) return;
    
    if (editingLeave && editingLeave.id) {
      await db.leaveRequests.update(editingLeave.id, {
        ...formData,
      });
    } else {
      await db.leaveRequests.add({
        ...formData as LeaveRequest,
        userId: formData.userId || currentUser.id,
        createdAt: new Date()
      });
    }
    
    setIsModalOpen(false);
    setEditingLeave(null);
    setFormData({
      type: 'annual',
      startDate: new Date(),
      endDate: new Date(),
      reason: '',
      status: 'pending'
    });
  };

  const confirmDelete = async () => {
    if (leaveToDelete) {
      await db.leaveRequests.delete(leaveToDelete);
      setLeaveToDelete(null);
    }
  };

  const handleStatusChange = async (id: number, status: 'approved' | 'rejected') => {
    if (!currentUser || !currentUser.id) return;
    
    try {
      if (status === 'approved') {
        const leave = await db.leaveRequests.get(id);
        if (leave && leave.type === 'annual') {
          const days = differenceInDays(new Date(leave.endDate), new Date(leave.startDate)) + 1;
          const targetUser = await db.users.get(leave.userId);
          
          if (targetUser) {
            const currentBalance = targetUser.annualLeaveBalance || 0;
            if (currentBalance < days) {
              showToast(`لا يوجد رصيد إجازات كافٍ للموظف (المطلوب: ${days}، المتاح: ${currentBalance})`, 'error');
              return;
            }
            
            await db.users.update(targetUser.id!, {
              annualLeaveBalance: currentBalance - days,
              usedLeaves: (targetUser.usedLeaves || 0) + days
            });
          }
        }
      }

      await db.leaveRequests.update(id, {
        status,
        approvedBy: currentUser.id
      });
      showToast(`تم ${status === 'approved' ? 'اعتماد' : 'رفض'} الطلب بنجاح`, 'success');
    } catch (error) {
      console.error('Error updating leave status:', error);
      showToast('حدث خطأ أثناء التحديث', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1 w-fit"><CheckCircle size={12}/> معتمد</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1 w-fit"><XCircle size={12}/> مرفوض</span>;
      default: return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1 w-fit"><Clock size={12}/> قيد الانتظار</span>;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'معتمد';
      case 'rejected': return 'مرفوض';
      default: return 'قيد الانتظار';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'annual': return 'سنوية';
      case 'sick': return 'مرضية';
      case 'unpaid': return 'بدون راتب';
      default: return 'أخرى';
    }
  };

  if (!currentUser || !currentUser.id) return null;

  const baseVisibleLeaves = currentUser.role === 'admin' 
    ? leaves 
    : leaves?.filter(l => l.userId === currentUser.id);

  const filteredLeaves = baseVisibleLeaves?.filter(leave => {
    const userName = users?.find(u => u.id === leave.userId)?.name || '';
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (leave.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    if (!filteredLeaves || filteredLeaves.length === 0) return;
    
    const headers = ['الموظف', 'نوع الإجازة', 'من تاريخ', 'إلى تاريخ', 'الحالة', 'السبب'];
    const csvContent = [
      headers.join(','),
      ...filteredLeaves.map(leave => {
        const userName = users?.find(u => u.id === leave.userId)?.name || 'غير معروف';
        return [
          `"${userName}"`,
          `"${getTypeLabel(leave.type)}"`,
          `"${format(new Date(leave.startDate), 'yyyy-MM-dd')}"`,
          `"${format(new Date(leave.endDate), 'yyyy-MM-dd')}"`,
          `"${getStatusLabel(leave.status)}"`,
          `"${(leave.reason || '').replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `الإجازات_والمغادرات_${format(new Date(), 'yyyy-MM-dd')}.csv`);
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
            <Calendar className="text-indigo-600" />
            إدارة الإجازات والمغادرات
          </h1>
          <p className="text-gray-500 mt-1">تقديم ومتابعة طلبات الإجازة</p>
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
              setEditingLeave(null);
              setFormData({ userId: currentUser.id, type: 'annual', startDate: new Date(), endDate: new Date(), status: 'pending', reason: '' });
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            <span>طلب إجازة جديد</span>
          </button>
        </div>
      </div>

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">تقرير الإجازات والمغادرات</h1>
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
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">الموظف</th>
                <th className="p-4 text-sm font-semibold text-gray-600">نوع الإجازة</th>
                <th className="p-4 text-sm font-semibold text-gray-600">من تاريخ</th>
                <th className="p-4 text-sm font-semibold text-gray-600">إلى تاريخ</th>
                <th className="p-4 text-sm font-semibold text-gray-600">السبب</th>
                <th className="p-4 text-sm font-semibold text-gray-600">الحالة</th>
                <th className="p-4 text-sm font-semibold text-gray-600 print:hidden">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLeaves?.map(leave => (
                <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-900 font-medium">
                    {users?.find(u => u.id === leave.userId)?.name || 'غير معروف'}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {getTypeLabel(leave.type)}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {format(new Date(leave.startDate), 'yyyy-MM-dd')}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {format(new Date(leave.endDate), 'yyyy-MM-dd')}
                  </td>
                  <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                    {leave.reason}
                  </td>
                  <td className="p-4">
                    {getStatusBadge(leave.status)}
                  </td>
                  <td className="p-4 print:hidden">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSelectedLeave(leave);
                          setIsViewModalOpen(true);
                        }}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="عرض التفاصيل"
                      >
                        <Eye size={16} />
                      </button>
                      
                      {currentUser.role === 'admin' && leave.status === 'pending' && (
                        <>
                          <button onClick={() => handleStatusChange(leave.id!, 'approved')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="اعتماد">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => handleStatusChange(leave.id!, 'rejected')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="رفض">
                            <XCircle size={16} />
                          </button>
                        </>
                      )}

                      {(currentUser.role === 'admin' || currentUser.id === leave.userId) && leave.status === 'pending' && (
                        <button 
                          onClick={() => {
                            setEditingLeave(leave);
                            setFormData(leave);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}

                      {(currentUser.role === 'admin' || (currentUser.id === leave.userId && leave.status === 'pending')) && (
                        <button 
                          onClick={() => setLeaveToDelete(leave.id!)} 
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
              {(!filteredLeaves || filteredLeaves.length === 0) && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    لا توجد طلبات إجازة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {isViewModalOpen && selectedLeave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="text-indigo-600" />
                تفاصيل طلب الإجازة
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
                    {users?.find(u => u.id === selectedLeave.userId)?.name || 'غير معروف'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">نوع الإجازة</h3>
                  <p className="font-bold text-indigo-600 text-lg">
                    {getTypeLabel(selectedLeave.type)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">من تاريخ</h3>
                  <p className="text-slate-800">{format(new Date(selectedLeave.startDate), 'yyyy-MM-dd')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">إلى تاريخ</h3>
                  <p className="text-slate-800">{format(new Date(selectedLeave.endDate), 'yyyy-MM-dd')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">تاريخ تقديم الطلب</h3>
                  <p className="text-slate-800">{format(new Date(selectedLeave.createdAt), 'yyyy-MM-dd HH:mm')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">الحالة</h3>
                  <div className="mt-1">{getStatusBadge(selectedLeave.status)}</div>
                </div>
                {selectedLeave.approvedBy && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">تمت المعالجة بواسطة</h3>
                    <p className="text-slate-800">
                      {users?.find(u => u.id === selectedLeave.approvedBy)?.name || 'غير معروف'}
                    </p>
                  </div>
                )}
              </div>

              {selectedLeave.reason && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">السبب / الملاحظات</h3>
                  <div className="bg-slate-50 p-4 rounded-lg text-slate-800 whitespace-pre-wrap">
                    {selectedLeave.reason}
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

      {/* New/Edit Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLeave ? 'تعديل طلب إجازة' : 'طلب إجازة جديد'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع الإجازة</label>
                <select
                  required
                  value={formData.type || 'annual'}
                  onChange={e => setFormData({...formData, type: e.target.value as LeaveRequest['type']})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="annual">سنوية</option>
                  <option value="sick">مرضية</option>
                  <option value="unpaid">بدون راتب</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate ? format(new Date(formData.startDate), 'yyyy-MM-dd') : ''}
                    onChange={e => setFormData({...formData, startDate: new Date(e.target.value)})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate ? format(new Date(formData.endDate), 'yyyy-MM-dd') : ''}
                    onChange={e => setFormData({...formData, endDate: new Date(e.target.value)})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
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
                  {editingLeave ? 'حفظ التعديلات' : 'تقديم الطلب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {leaveToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">تأكيد الحذف</h2>
              <p className="text-slate-600 mb-6">
                هل أنت متأكد من حذف طلب الإجازة هذا؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setLeaveToDelete(null)}
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
