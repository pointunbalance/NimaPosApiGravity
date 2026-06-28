import React from 'react';

interface ShiftLogTabProps {
  shiftPayments: any[];
  shiftGeneralOps: any[];
  getStudentName: (id: number) => string;
}

export const ShiftLogTab: React.FC<ShiftLogTabProps> = ({
  shiftPayments,
  shiftGeneralOps,
  getStudentName,
}) => {
  const logItems = React.useMemo(() => {
    const items: {
      date: string;
      ref: string;
      desc: string;
      type: string;
      amount: number;
      isPositive: boolean;
    }[] = [];

    shiftPayments.forEach((p) => {
      items.push({
        date: p.paymentDate,
        ref: p.receiptNumber,
        desc: `سداد اشتراك طالب (${getStudentName(p.studentId)})`,
        type: 'إيراد اشتراكات',
        amount: p.amount,
        isPositive: true,
      });
    });

    shiftGeneralOps.forEach((op) => {
      items.push({
        date: op.date,
        ref: op.referenceNumber || '',
        desc: op.description,
        type: op.type === 'inflow' ? 'إيراد عام' : 'مصروف',
        amount: op.amount,
        isPositive: op.type === 'inflow',
      });
    });

    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [shiftPayments, shiftGeneralOps, getStudentName]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300" dir="rtl">
      <h2 className="text-xl font-bold text-slate-800 mb-6">سجل حركات الخزنة (اليومية المجمعة)</h2>
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-3 text-slate-600 font-bold text-right">الوقت</th>
              <th className="p-3 text-slate-600 font-bold text-right">المرجع</th>
              <th className="p-3 text-slate-600 font-bold text-right">البيان</th>
              <th className="p-3 text-slate-600 font-bold text-right">نوع الحركة</th>
              <th className="p-3 text-slate-600 font-bold text-right">المبلغ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {logItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500 font-bold">
                  اليومية فارغة
                </td>
              </tr>
            ) : (
              logItems.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono text-slate-500">
                    {new Date(item.date).toLocaleTimeString('ar-EG')}
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-500">{item.ref}</td>
                  <td className="p-3 font-bold text-slate-800 truncate max-w-xs">{item.desc}</td>
                  <td className="p-3 font-medium text-slate-600">{item.type}</td>
                  <td
                    className={`p-3 font-black ${
                      item.isPositive ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {item.isPositive ? '+' : '-'}
                    {item.amount} ج.م
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
export default ShiftLogTab;
