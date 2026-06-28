import React from 'react';
import { TrendingUp, DollarSign, FileSpreadsheet } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface EquipmentTabFinanceProps {
  chartDataByClass: Array<{ name: string; cost: number }>;
  allLedgerLogs: any[];
  currency: string;
}

export const EquipmentTabFinance: React.FC<EquipmentTabFinanceProps> = ({
  chartDataByClass,
  allLedgerLogs,
  currency
}) => {
  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* Financial Spending Analytics chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 border-b pb-3 flex-row-reverse">
          <TrendingUp className="w-4.5 h-4.5 text-indigo-600" />
          <span>تحليل حجم إنفاق الصيانة الفنية حسب فئة الجهاز ({currency})</span>
        </h3>
        
        {chartDataByClass.length === 0 ? (
          <div className="py-12 bg-slate-50/50 rounded-xl text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-2">
            <DollarSign className="w-10 h-10 text-slate-300" />
            <span>لا تتوفر رسومات بيانية مسجلة حتى الآن. عُد لاحقاً بعد تسجيل قيود صيانة مدفوعة.</span>
          </div>
        ) : (
          <div className="h-60 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartDataByClass}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(value) => [`${value} ${currency}`, 'تكلفة الصيانة']}
                  labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#1e293b' }}
                />
                <Bar dataKey="cost" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                  {chartDataByClass.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f46e5' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* General ledger logs list connected directly to db.journalEntries summary */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3 flex-row-reverse">
          <h3 className="font-black text-slate-800 text-xs flex items-center gap-1.5 flex-row-reverse">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <span>دفتر قيود وسندات صرف الصيانة (Ledger Accounts Archive)</span>
          </h3>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-lg font-bold">
            معزز بالقيود التلقائية لليومية العامة
          </span>
        </div>

        <div className="overflow-x-auto text-[11px]">
          <table className="w-full text-right whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-200 flex-row-reverse">
                <th className="px-4 py-3 font-bold text-slate-700 text-right">التاريخ</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-right">الأصل الرياضي التابع</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-right">الصيانة / الوصف التوضيحي</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-right">طريقة الدفع</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-right">الحساب المدين المقابل</th>
                <th className="px-4 py-3 font-black text-rose-600 text-right">التكلفة والرسوم</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-center">كود السند الموحد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allLedgerLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400 font-bold">
                    لا توجد فواتير صيانة مقيدة في الفترة الحالية بالدفاتر.
                  </td>
                </tr>
              ) : (
                allLedgerLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/45 transition-colors font-semibold text-slate-700 text-right">
                    <td className="px-4 py-3.5 font-mono text-slate-500">{log.date}</td>
                    <td className="px-4 py-3.5 font-extrabold text-slate-800">{log.equipmentName}</td>
                    <td className="px-4 py-3.5">{log.description}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold">
                        {log.paymentMethod === 'cash' ? '💵 نقداً' : log.paymentMethod === 'bank' ? '🏦 بنكي / فيزا' : '⏳ آجل على الحساب'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-slate-400">حـ/ مصاريف الصيانة العادية</span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-rose-600 font-mono text-right">{log.cost.toLocaleString()} {currency}</td>
                    <td className="px-4 py-3.5 text-center font-mono text-slate-400 text-[10px]">
                      {log.journalRef ? (
                        <span className="bg-indigo-50/50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md font-extrabold">
                          {log.journalRef}
                        </span>
                      ) : (
                        <span className="text-slate-350 italic">قالب وقائي بلا كلفة</span>
                      )}
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
