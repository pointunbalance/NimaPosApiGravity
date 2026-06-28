import React from 'react';
import { Search, Filter, Edit, Trash2 } from 'lucide-react';
import { Subscription, Customer } from '../../types';

interface SubscriptionsListProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredSubscriptions: Subscription[];
  customers: Customer[] | undefined;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: number) => void;
  getStatusText: (status: string) => string;
}

const SubscriptionsList: React.FC<SubscriptionsListProps> = ({
  searchTerm,
  setSearchTerm,
  filteredSubscriptions,
  customers,
  onEdit,
  onDelete,
  getStatusText,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="البحث عن عميل أو خطة..."
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium transition-colors">
          <Filter className="w-4 h-4" />
          تصفية
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-sm font-semibold text-slate-600">العميل</th>
              <th className="p-4 text-sm font-semibold text-slate-600">الخطة</th>
              <th className="p-4 text-sm font-semibold text-slate-600">المبلغ</th>
              <th className="p-4 text-sm font-semibold text-slate-600">دورة الفوترة</th>
              <th className="p-4 text-sm font-semibold text-slate-600">تاريخ التجديد القادم</th>
              <th className="p-4 text-sm font-semibold text-slate-600">الحالة</th>
              <th className="p-4 text-sm font-semibold text-slate-600 text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredSubscriptions.map((sub) => {
              const customer = customers?.find((c) => c.id === sub.customerId);
              return (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm text-slate-900 font-medium">
                    {customer?.name || 'غير محدد'}
                  </td>
                  <td className="p-4 text-sm text-slate-500">{sub.planName}</td>
                  <td className="p-4 text-sm text-slate-900 font-medium">
                    {sub.amount.toFixed(2)} ر.س
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {sub.billingCycle === 'monthly' ? 'شهري' : 'سنوي'}
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {new Date(sub.nextBillingDate).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        sub.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : sub.status === 'past_due'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}
                    >
                      {getStatusText(sub.status)}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-left">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(sub)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => sub.id && onDelete(sub.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredSubscriptions.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  لا توجد اشتراكات مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscriptionsList;
