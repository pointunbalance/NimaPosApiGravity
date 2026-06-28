import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { User } from '../../types';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PurchaseRequestsTabProps {
  user: User;
}

export const PurchaseRequestsTab: React.FC<PurchaseRequestsTabProps> = ({ user }) => {
  const navigate = useNavigate();

  const myPurchaseRequests = useLiveQuery(() => {
    if (!user?.id) return [];
    return db.purchaseRequests.where('requestedBy').equals(user.id).reverse().toArray();
  }, [user?.id]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold flex items-center justify-center gap-1 w-fit"><CheckCircle className="w-3 h-3"/> معتمد</span>;
      case 'rejected': return <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-md text-xs font-bold flex items-center justify-center gap-1 w-fit"><XCircle className="w-3 h-3"/> مرفوض</span>;
      case 'fulfilled': return <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-bold flex items-center justify-center gap-1 w-fit"><CheckCircle className="w-3 h-3"/> تم التنفيذ</span>;
      default: return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold w-fit">قيد المراجعة</span>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">طلبات الشراء الخاصة بي</h2>
          <p className="text-sm text-gray-500">متابعة حالة طلبات الشراء التي قمت بتقديمها</p>
        </div>
        <button
          onClick={() => navigate('/purchase-requests')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          طلب شراء جديد
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">رقم الطلب</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">التاريخ</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">القسم</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">عدد الأصناف</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {myPurchaseRequests?.map(req => (
              <tr key={req.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-indigo-600">{req.requestNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{new Date(req.date).toLocaleDateString('ar-EG')}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{req.department || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 font-bold">{req.items.length}</td>
                <td className="px-4 py-3">{getStatusBadge(req.status)}</td>
              </tr>
            ))}
            {myPurchaseRequests?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">لا توجد طلبات شراء سابقة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
