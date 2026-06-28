import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { History, TrendingUp, TrendingDown, Clock, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function ProductPriceHistoryLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, increment, decrement

  const historyLogs = useLiveQuery(() => db.productPriceHistory.orderBy('changeDate').reverse().toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];

  const enrichedLogs = useMemo(() => {
      return historyLogs.map(log => {
          const product = products.find(p => p.id === log.productId);
          return {
              ...log,
              productName: product?.name || 'منتج محذوف',
              productCategory: product?.category || '-',
              costDifference: log.newCost - log.oldCost,
              priceDifference: log.newPrice - log.oldPrice
          };
      }).filter(log => {
          const matchesSearch = log.productName.toLowerCase().includes(searchTerm.toLowerCase());
          if (!matchesSearch) return false;
          
          if (filterType === 'increment' && log.newCost <= log.oldCost) return false;
          if (filterType === 'decrement' && log.newCost >= log.oldCost) return false;
          
          return true;
      });
  }, [historyLogs, products, searchTerm, filterType]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="text-indigo-600" />
            سجل حركة الأسعار والتكاليف (Price History)
          </h1>
          <p className="text-slate-500 text-sm mt-1">تتبع التغييرات التاريخية في تكلفة المنتجات وسعر بيعها لضمان حساب أرباح الفواتير بدقة.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن اسم المنتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filterType === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilterType('increment')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1 ${filterType === 'increment' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
            >
              <TrendingUp size={16} /> تضخم وزيادة تكلفة
            </button>
            <button
              onClick={() => setFilterType('decrement')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1 ${filterType === 'decrement' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
            >
              <TrendingDown size={16} /> انخفاض التكلفة
            </button>
          </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                    <th className="px-6 py-4 font-bold">التاريخ والتوقيت</th>
                    <th className="px-6 py-4 font-bold">المنتج</th>
                    <th className="px-6 py-4 font-bold text-center">التكلفة السابقة</th>
                    <th className="px-6 py-4 font-bold text-center">التكلفة الجديدة (مُعدل)</th>
                    <th className="px-6 py-4 font-bold text-center">السعر السابق</th>
                    <th className="px-6 py-4 font-bold text-center">السعر الجديد (مُعدل)</th>
                    <th className="px-6 py-4 font-bold">مُنفذ العملية</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {enrichedLogs.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                            <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            لا توجد سجلات لتغيير الأسعار في النظام حالياً.
                        </td>
                    </tr>
                ) : (
                    enrichedLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Clock size={14} />
                                    <span>{format(new Date(log.changeDate), 'yyyy-MM-dd HH:mm', { locale: ar })}</span>
                                </div>
                            </td>
                            <td className="px-6 py-3">
                                <span className="font-bold text-slate-800 block">{log.productName}</span>
                                <span className="text-xs text-slate-500">{log.productCategory}</span>
                            </td>
                            <td className="px-6 py-3 text-center">
                                <span className="line-through text-slate-400">{log.oldCost.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-3 text-center">
                                <span className={`font-bold flex items-center justify-center gap-1 ${
                                    log.costDifference > 0 ? 'text-red-500' : log.costDifference < 0 ? 'text-emerald-500' : 'text-slate-700'
                                }`}>
                                    {log.costDifference > 0 && <TrendingUp size={14} />}
                                    {log.costDifference < 0 && <TrendingDown size={14} />}
                                    {log.newCost.toLocaleString()}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-center">
                                <span className="line-through text-slate-400">{log.oldPrice.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-3 text-center font-bold text-indigo-600">
                                {log.newPrice.toLocaleString()}
                            </td>
                            <td className="px-6 py-3 text-slate-600">
                                {log.changedBy || 'النظام'}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}
