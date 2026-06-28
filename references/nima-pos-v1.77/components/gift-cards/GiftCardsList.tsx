import React from 'react';
import { Search, Edit, Trash2 } from 'lucide-react';
import { GiftCard } from '../../types';

interface GiftCardsListProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredCards: GiftCard[];
  onEdit: (card: GiftCard) => void;
  onDelete: (id: number) => void;
}

const GiftCardsList: React.FC<GiftCardsListProps> = ({
  searchTerm,
  setSearchTerm,
  filteredCards,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="البحث برقم البطاقة..."
              className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3 text-sm font-semibold text-slate-600">رقم البطاقة</th>
                <th className="p-3 text-sm font-semibold text-slate-600">الرصيد الحالي</th>
                <th className="p-3 text-sm font-semibold text-slate-600">الرصيد الأساسي</th>
                <th className="p-3 text-sm font-semibold text-slate-600">الحالة</th>
                <th className="p-3 text-sm font-semibold text-slate-600">تاريخ الانتهاء</th>
                <th className="p-3 text-sm font-semibold text-slate-600 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCards.map((card) => (
                <tr key={card.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 text-sm font-mono text-slate-700">{card.code}</td>
                  <td className="p-3 text-sm font-medium text-slate-900">
                    {card.currentBalance.toFixed(2)} ر.س
                  </td>
                  <td className="p-3 text-sm text-slate-500">
                    {card.initialBalance.toFixed(2)} ر.س
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        card.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : card.status === 'used'
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {card.status === 'active'
                        ? 'نشط'
                        : card.status === 'used'
                        ? 'مستخدم'
                        : 'منتهي الصلاحية'}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-slate-500">
                    {new Date(card.expiryDate).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="p-3 text-sm text-left">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(card)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => card.id && onDelete(card.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCards.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    لا توجد بطاقات هدايا مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GiftCardsList;
