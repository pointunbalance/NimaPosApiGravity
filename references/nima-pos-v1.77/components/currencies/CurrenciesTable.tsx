import React from 'react';
import { Star, RefreshCw, Edit, Trash2, DollarSign } from 'lucide-react';
import { Currency } from '../../types';

interface CurrenciesTableProps {
  filteredCurrencies: Currency[];
  onEdit: (currency: Currency) => void;
  onDelete: (id: number) => void;
  onSetBaseCurrency: (id: number) => void;
  onQuickUpdateRate: (id: number, currentRate: number) => void;
}

const CurrenciesTable: React.FC<CurrenciesTableProps> = ({
  filteredCurrencies,
  onEdit,
  onDelete,
  onSetBaseCurrency,
  onQuickUpdateRate
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-bold text-slate-600 whitespace-nowrap">العملة</th>
              <th className="p-4 font-bold text-slate-600 whitespace-nowrap">سعر الصرف</th>
              <th className="p-4 font-bold text-slate-600 whitespace-nowrap">النوع</th>
              <th className="p-4 font-bold text-slate-600 whitespace-nowrap">آخر تحديث</th>
              <th className="p-4 font-bold text-slate-600 text-center whitespace-nowrap print:hidden">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCurrencies?.map((currency) => (
              <tr key={currency.id} className={`hover:bg-slate-50 transition-colors ${currency.isBaseCurrency ? 'bg-emerald-50/30' : ''}`}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${currency.isBaseCurrency ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                      {currency.code.substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        {currency.code}
                        {currency.isBaseCurrency && (
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        )}
                      </div>
                      <div className="text-sm text-slate-500">{currency.name}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-emerald-600">{currency.exchangeRate}</span>
                    {!currency.isBaseCurrency && (
                      <button
                        onClick={() => currency.id && onQuickUpdateRate(currency.id, currency.exchangeRate)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors print:hidden"
                        title="تحديث سريع للسعر"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  {currency.isBaseCurrency ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">
                      <Star className="w-4 h-4 fill-emerald-700" />
                      العملة الأساسية
                    </span>
                  ) : (
                    <span className="inline-flex px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold">
                      عملة أجنبية
                    </span>
                  )}
                </td>
                <td className="p-4 text-slate-500 text-sm font-medium">
                  {currency.lastUpdated ? new Date(currency.lastUpdated).toLocaleString('ar-EG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'}
                </td>
                <td className="p-4 print:hidden">
                  <div className="flex justify-center gap-2">
                    {!currency.isBaseCurrency && (
                      <button
                        onClick={() => currency.id && onSetBaseCurrency(currency.id)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="تعيين كعملة أساسية"
                      >
                        <Star className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(currency)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => currency.id && onDelete(currency.id)}
                      className={`p-2 rounded-lg transition-colors ${currency.isBaseCurrency ? 'text-slate-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                      title={currency.isBaseCurrency ? "لا يمكن حذف العملة الأساسية" : "حذف"}
                      disabled={currency.isBaseCurrency}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCurrencies?.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <DollarSign className="w-16 h-16 mb-4 text-slate-300" />
                    <p className="text-lg font-bold text-slate-600 mb-1">لا توجد عملات</p>
                    <p className="text-sm">لم يتم العثور على أي عملات مطابقة لبحثك.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CurrenciesTable;
