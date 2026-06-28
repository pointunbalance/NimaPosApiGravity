import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { User, LeaveRequest } from '../../types';
import { Plus, X, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface LeavesTabProps {
  user: User;
}

export const LeavesTab: React.FC<LeavesTabProps> = ({ user }) => {
  const { showToast } = useToast();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveRequest['type']>('annual');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const myLeaves = useLiveQuery(() => {
    if (!user?.id) return [];
    return db.leaveRequests.where('userId').equals(user.id).reverse().toArray();
  }, [user?.id]);

  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate) return;

    try {
      await db.leaveRequests.add({
        userId: user.id!,
        userName: user.name,
        type: leaveType,
        startDate: new Date(leaveStartDate),
        endDate: new Date(leaveEndDate),
        reason: leaveReason,
        status: 'pending',
        createdAt: new Date()
      } as any);
      showToast('تم تقديم طلب الإجازة بنجاح', 'success');
      setShowLeaveModal(false);
      setLeaveStartDate('');
      setLeaveEndDate('');
      setLeaveReason('');
    } catch (err: any) {
      showToast('حدث خطأ أثناء تقديم الطلب', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold flex items-center justify-center gap-1 w-fit"><CheckCircle className="w-3 h-3"/> معتمد</span>;
      case 'rejected': return <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-md text-xs font-bold flex items-center justify-center gap-1 w-fit"><XCircle className="w-3 h-3"/> مرفوض</span>;
      default: return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold w-fit">قيد المراجعة</span>;
    }
  };

  const getLeaveTypeName = (type: string) => {
    const types: Record<string, string> = {
      annual: 'سنوية', sick: 'مرضية', unpaid: 'بدون أجر', maternity: 'أمومة', other: 'أخرى'
    };
    return types[type] || type;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-800">طلباتي السابقة</h2>
        <button
          onClick={() => setShowLeaveModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          طلب جديد
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">تاريخ الطلب</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">النوع</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">من تاريخ</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">إلى تاريخ</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">السبب</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {myLeaves?.map(leave => (
              <tr key={leave.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">{new Date(leave.createdAt).toLocaleDateString('ar-EG')}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{getLeaveTypeName(leave.type)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{new Date(leave.startDate).toLocaleDateString('ar-EG')}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{new Date(leave.endDate).toLocaleDateString('ar-EG')}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{leave.reason || '-'}</td>
                <td className="px-4 py-3">{getStatusBadge(leave.status)}</td>
              </tr>
            ))}
            {myLeaves?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">لا توجد طلبات سابقة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xl font-bold border-b-2 border-indigo-600 pb-1 pr-2">طلب إجازة جديد</h3>
              <button onClick={() => setShowLeaveModal(false)} className="text-gray-400 hover:text-rose-500 transition-colors bg-white rounded-full p-1 shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={submitLeave} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">نوع الإجازة</label>
                  <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as any)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 p-2">
                    <option value="annual">سنوية</option>
                    <option value="sick">مرضية</option>
                    <option value="unpaid">بدون أجر</option>
                    <option value="maternity">وضع/أمومة</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">تاريخ البداية</label>
                    <input type="date" required value={leaveStartDate} onChange={e => setLeaveStartDate(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">تاريخ النهاية</label>
                    <input type="date" required value={leaveEndDate} onChange={e => setLeaveEndDate(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 p-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">السبب / ملاحظات</label>
                  <textarea rows={3} value={leaveReason} onChange={e => setLeaveReason(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 p-2"></textarea>
                </div>
                <div className="pt-4 border-t border-gray-100 flex gap-3">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition">تقديم الطلب</button>
                  <button type="button" onClick={() => setShowLeaveModal(false)} className="px-6 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
