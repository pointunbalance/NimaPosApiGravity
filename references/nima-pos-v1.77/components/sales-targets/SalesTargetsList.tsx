import React from 'react';
import { Users, Edit, Trash2 } from 'lucide-react';
import { SalesTarget, User } from '../../types';

interface SalesTargetsListProps {
  targets: SalesTarget[];
  users: User[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onEdit: (target: SalesTarget) => void;
  onDelete: (id: number) => void;
  formatCurrency: (amount: number) => string;
}

const SalesTargetsList: React.FC<SalesTargetsListProps> = ({
  targets,
  users,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  onEdit,
  onDelete,
  formatCurrency
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
            <Users size={20} />
          </div>
          أداء فريق المبيعات
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="بحث باسم المندوب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium"
          >
            <option value="percentage-desc">الأعلى نسبة إنجاز</option>
            <option value="percentage-asc">الأقل نسبة إنجاز</option>
            <option value="target-desc">الأعلى هدفاً</option>
            <option value="achieved-desc">الأعلى تحقيقاً</option>
          </select>
        </div>
      </div>
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th className="p-4 text-slate-500 font-bold text-sm">المندوب</th>
              <th className="p-4 text-slate-500 font-bold text-sm">الهدف</th>
              <th className="p-4 text-slate-500 font-bold text-sm">المحقق</th>
              <th className="p-4 text-slate-500 font-bold text-sm">نسبة العمولة</th>
              <th className="p-4 text-slate-500 font-bold text-sm">العمولة المستحقة</th>
              <th className="p-4 text-slate-500 font-bold text-sm">النسبة</th>
              <th className="p-4 text-slate-500 font-bold text-sm">الحالة</th>
              <th className="p-4 text-slate-500 font-bold text-sm">ملاحظات</th>
              <th className="p-4 text-slate-500 font-bold text-sm text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {targets.map((target) => {
              const user = users?.find(u => u.id === target.employeeId);
              const perc = target.targetAmount > 0 ? (target.achievedAmount / target.targetAmount) * 100 : 0;
              const commission = (target.achievedAmount * (target.commissionRate || 0)) / 100;
              let statusColor = 'bg-slate-100 text-slate-700';
              let statusText = 'غير محدد';
              if (perc >= 100) { statusColor = 'bg-emerald-100 text-emerald-700'; statusText = 'ممتاز'; }
              else if (perc >= 70) { statusColor = 'bg-blue-100 text-blue-700'; statusText = 'جيد'; }
              else if (perc > 0) { statusColor = 'bg-amber-100 text-amber-700'; statusText = 'متأخر'; }

              return (
                <tr key={target.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-inner overflow-hidden">
                        {(user as any)?.avatar ? (
                            <img src={(user as any).avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            user?.name?.charAt(0) || '؟'
                        )}
                      </div>
                      <span className="font-bold text-slate-800">{user?.name || 'غير معروف'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-800 font-bold">{formatCurrency(target.targetAmount)}</td>
                  <td className="p-4 text-slate-800 font-bold text-lg">{formatCurrency(target.achievedAmount)}</td>
                  <td className="p-4 text-slate-500 font-medium bg-slate-50/30 group-hover:bg-transparent transition-colors">{target.commissionRate}%</td>
                  <td className="p-4 text-emerald-600 font-black">{formatCurrency(commission)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700 w-10">{perc.toFixed(0)}%</span>
                      <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden flex">
                        <div className={`h-full rounded-full transition-all duration-500 ${perc >= 100 ? 'bg-emerald-500' : perc >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, perc)}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${statusColor}`}>
                      {statusText}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 text-sm max-w-[150px] truncate" title={target.notes}>
                    {target.notes || '-'}
                  </td>
                  <td className="p-4 text-left">
                    <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(target)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="تعديل">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => target.id && onDelete(target.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {targets.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">
                  لا توجد أهداف مبيعات لهذه الفترة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesTargetsList;
