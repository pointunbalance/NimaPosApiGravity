import React from 'react';
import { TrendingUp, FileSpreadsheet, Search, Eye, RotateCcw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, BarChart, Bar, Cell } from 'recharts';
import { StoreSaleType } from './storeTypes';

interface StoreTabHistoryProps {
  chartData: any[];
  topProductsChartData: any[];
  historySearch: string;
  setHistorySearch: (val: string) => void;
  filteredInvoices: StoreSaleType[];
  onOpenDetails: (sale: StoreSaleType) => void;
  onVoidSale: (sale: StoreSaleType) => void;
  currency: string;
}

export const StoreTabHistory: React.FC<StoreTabHistoryProps> = ({
  chartData,
  topProductsChartData,
  historySearch,
  setHistorySearch,
  filteredInvoices,
  onOpenDetails,
  onVoidSale,
  currency
}) => {
  return (
    <div className="xl:col-span-12 space-y-6 text-right font-sans" dir="rtl">
      
      {/* 1. Visual aggregates plots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trajectory */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-black text-slate-800 text-xs flex items-center gap-1.5 flex-row-reverse text-right">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>تطور عوائد مبيعات المتجر اليومية (آخر 7 أيام نشطة)</span>
          </h3>
          
          {chartData.length === 0 ? (
            <div className="h-44 text-xs font-bold text-slate-400 flex flex-col items-center justify-center gap-2 bg-slate-50 rounded-xl">
              <span>لا توجد بيانات عوائد كافية لتوليد المنحنى البياني حالياً.</span>
            </div>
          ) : (
            <div className="h-44 font-mono select-none" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="storeSalesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dateLabel" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', textAlign: 'right' }} 
                    formatter={(val: any) => [`${val.toLocaleString()} ${currency}`, 'المبيعات']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#storeSalesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Demands */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-black text-slate-800 text-xs flex items-center gap-1.5 flex-row-reverse text-right">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>المنتجات الأكثر مبيعاً وطلباً بالصالة (بالقطعة)</span>
          </h3>
          
          {topProductsChartData.length === 0 ? (
            <div className="h-44 text-xs font-bold text-slate-400 flex flex-col items-center justify-center gap-2 bg-slate-50 rounded-xl">
              <span>لا توجد إحصائيات لمبيعات المنتجات في الفترة الحالية.</span>
            </div>
          ) : (
            <div className="h-44 font-mono select-none" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', textAlign: 'right' }}
                    formatter={(val: any) => [`${val} قطعة`, 'الكمية']}
                  />
                  <Bar dataKey="qty" radius={[6, 6, 0, 0]} barSize={16}>
                    {topProductsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* 2. Invoices ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
        
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 flex-row-reverse">
          <div className="flex items-center gap-2 flex-row-reverse">
            <span className="p-1.5 bg-slate-100 text-slate-600 rounded-lg shrink-0">
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </span>
            <h4 className="font-black text-slate-800 text-xs">سجل الفواتير والقيود المالية الصادرة</h4>
          </div>

          <div className="relative flex-1 max-w-sm w-full">
            <Search className="w-4 h-4 absolute right-3 h-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="البحث برقم السند أو اسم العميل..." 
              className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-right"
            />
          </div>
        </div>

        <div className="overflow-x-auto text-[11px] whitespace-nowrap">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-4 py-3 font-bold text-slate-700 text-right">رقم الفاتورة / القيد</th>
                <th className="px-4 py-3 font-bold text-slate-705 text-right">تاريخ المعاملة</th>
                <th className="px-4 py-3 font-bold text-slate-707 text-right">المشتري</th>
                <th className="px-4 py-3 font-bold text-slate-709 text-right">طريقة السداد</th>
                <th className="px-4 py-3 font-bold text-slate-705 text-right">المبلغ الإجمالي</th>
                <th className="px-4 py-3 font-bold text-slate-705 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-11 text-center font-bold text-slate-450">
                    لا توجد فواتير أو سندات بيع مقيدة لليومية الحالية تطابق الاستفسار.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/40 transition-colors font-semibold text-slate-700 text-xs">
                    <td className="px-4 py-3.5">
                      <span className="block font-black text-indigo-700">#{sale.id}</span>
                      <span className="text-[9px] text-slate-400 font-mono">Ref: {sale.journalRef}</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-500 text-right">
                      {new Date(sale.date).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-black text-slate-800 text-right">{sale.customerName}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black ${
                        sale.paymentMethod === 'cash' 
                          ? 'bg-emerald-50 text-emerald-805' 
                          : 'bg-indigo-50 text-indigo-805'
                      }`}>
                        {sale.paymentMethod === 'cash' ? '💵 نقدي' : '💳 بنكي'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-sans font-black text-slate-800 text-right">
                      {sale.totalAmount.toLocaleString()} {currency}
                    </td>
                    <td className="px-4 py-3.5 text-center flex items-center justify-center gap-1.5 pt-4">
                      
                      <button
                        type="button"
                        onClick={() => onOpenDetails(sale)}
                        className="p-1.5 text-indigo-650 hover:bg-indigo-50 border border-transparent rounded-lg cursor-pointer"
                        title="معاينة سند الصرف والفاتورة التفصيلية"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onVoidSale(sale)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 border border-transparent rounded-lg cursor-pointer"
                        title="عكس السند مالي (Void Invoice)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
export default StoreTabHistory;
