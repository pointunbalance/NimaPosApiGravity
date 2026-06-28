import React from 'react';
import { Search, Tag, Trash2, Edit, CheckCircle2, XCircle, Clock, AlertCircle, Copy } from 'lucide-react';
import { Promotion } from '../../types';

interface PromotionsListProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'all' | 'active' | 'scheduled' | 'expired';
  setStatusFilter: (status: 'all' | 'active' | 'scheduled' | 'expired') => void;
  filteredPromotions: Promotion[];
  currency: string;
  onToggleStatus: (promo: Promotion) => void;
  onEdit: (promo: Promotion) => void;
  onDelete: (id: number) => void;
}

const PromotionsList: React.FC<PromotionsListProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  filteredPromotions,
  currency,
  onToggleStatus,
  onEdit,
  onDelete,
}) => {
  const getStatusBadge = (promo: Promotion) => {
    const now = new Date();
    const startDate = new Date(promo.startDate);
    const endDate = promo.endDate ? new Date(promo.endDate) : null;

    if (!promo.isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
          <XCircle className="w-3.5 h-3.5" /> متوقف
        </span>
      );
    }
    if (startDate > now) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
          <Clock className="w-3.5 h-3.5" /> مجدول
        </span>
      );
    }
    if (endDate && endDate < now) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
          <AlertCircle className="w-3.5 h-3.5" /> منتهي
        </span>
      );
    }
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
          <AlertCircle className="w-3.5 h-3.5" /> نفد الحد
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5" /> نشط
      </span>
    );
  };

  const getTargetDetails = (promo: Promotion) => {
    if (promo.target === 'order') return 'إجمالي الطلب';
    
    const count = promo.targetIds?.length || 0;
    if (promo.target === 'product') return `${count} منتجات محددة`;
    if (promo.target === 'category') return `${count} أقسام محددة`;
    if (promo.target === 'customer_tier') return `${count} مستويات عملاء`;
    
    return 'غير محدد';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث عن عرض بالاسم أو الكود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          {(['all', 'active', 'scheduled', 'expired'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                statusFilter === status
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {status === 'all' && 'الكل'}
              {status === 'active' && 'نشط'}
              {status === 'scheduled' && 'مجدول'}
              {status === 'expired' && 'منتهي'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
              <th className="p-4 font-bold">تفاصيل العرض</th>
              <th className="p-4 font-bold">النوع والقيمة</th>
              <th className="p-4 font-bold">الاستهداف</th>
              <th className="p-4 font-bold">الصلاحية</th>
              <th className="p-4 font-bold">الاستخدام</th>
              <th className="p-4 font-bold">الحالة</th>
              <th className="p-4 font-bold text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPromotions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center">
                  <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 mb-1">لا توجد عروض ترويجية</h3>
                  <p className="text-slate-500">قم بإنشاء عرضك الأول لجذب المزيد من العملاء.</p>
                </td>
              </tr>
            ) : (
              filteredPromotions.map((promo) => (
                <tr key={promo.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{promo.name}</div>
                    {promo.code && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded text-xs font-mono bg-slate-100 text-slate-600 border border-slate-200">
                        {promo.code}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-brand-600">
                      {promo.type === 'percentage' && `${promo.value}% خصم`}
                      {promo.type === 'fixed_amount' && `${promo.value} ${currency} خصم`}
                      {promo.type === 'bogo' &&
                        `اشتر ${promo.buyQuantity} احصل على ${promo.getQuantity}`}
                    </div>
                    {promo.minOrderValue ? (
                      <div className="text-xs text-slate-500 mt-1">
                        حد أدنى: {promo.minOrderValue} {currency}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-4 text-slate-600 text-sm">
                    {getTargetDetails(promo)}
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-700">
                      من: {new Date(promo.startDate).toLocaleDateString('ar-EG')}
                    </div>
                    {promo.endDate && (
                      <div className="text-sm text-slate-500 mt-1">
                        إلى: {new Date(promo.endDate).toLocaleDateString('ar-EG')}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-bold text-slate-700">{promo.usedCount} مرة</div>
                    {promo.usageLimit && (
                      <div className="text-xs text-slate-500 mt-1">
                        من أصل {promo.usageLimit}
                      </div>
                    )}
                  </td>
                  <td className="p-4">{getStatusBadge(promo)}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          const duplicatePromo = { ...promo, id: undefined, name: `${promo.name} (نسخة)`, usedCount: 0 };
                          onEdit(duplicatePromo);
                        }}
                        className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="تكرار العرض"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(promo)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          promo.isActive
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                        title={promo.isActive ? 'إيقاف العرض' : 'تفعيل العرض'}
                      >
                        {promo.isActive ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => onEdit(promo)}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(promo.id!)}
                        className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PromotionsList;
