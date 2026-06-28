import React from 'react';
import { DollarSign } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';

interface PaymentsTabProps {
  selectedChildId: number;
  paymentForm: any;
  setPaymentForm: React.Dispatch<React.SetStateAction<any>>;
  handleAddPayment: (e: React.FormEvent) => void;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ selectedChildId, paymentForm, setPaymentForm, handleAddPayment }) => {
  const paymentsLogs = useLiveQuery(() => db.studentPayments.where('studentId').equals(selectedChildId || 0).toArray()) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <DollarSign className="w-6 h-6 text-emerald-600" />
          <h3 className="text-xl font-black text-slate-800">المدفوعات والمتحصلات</h3>
       </div>

       <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
          <h4 className="font-black text-emerald-900 mb-4">سداد دفعة جديدة</h4>
          <form onSubmit={handleAddPayment} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
             <input required type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} placeholder="المبلغ" className="bg-white border border-emerald-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" />
             <select value={paymentForm.type} onChange={e => setPaymentForm({...paymentForm, type: e.target.value})} className="bg-white border border-emerald-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none font-bold">
                <option value="قسط">قسط دراسي</option>
                <option value="باص">اشتراك باص</option>
                <option value="رسوم إضافية">رسوم إضافية</option>
             </select>
             <select value={paymentForm.paymentMethod || 'نقدي'} onChange={e => setPaymentForm({...paymentForm, paymentMethod: e.target.value})} className="bg-white border border-emerald-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none font-bold">
                <option value="نقدي">نقدي (كاش)</option>
                <option value="محفظة">محفظة إلكترونية</option>
                <option value="تحويل بنكي">تحويل بنكي</option>
             </select>
             <input required type="date" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} className="bg-white border border-emerald-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" />
             <button type="submit" className="bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-sm" onClick={() => setPaymentForm((prev: any) => ({...prev, status: 'paid'}))}>تأكيد الدفع</button>
          </form>
       </div>

       <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-right text-sm">
             <thead className="bg-slate-50 border-b border-slate-200">
               <tr>
                  <th className="p-4 font-bold text-slate-600">التاريخ</th>
                  <th className="p-4 font-bold text-slate-600">البند</th>
                  <th className="p-4 font-bold text-slate-600">وسيلة الدفع</th>
                  <th className="p-4 font-bold text-slate-600">المبلغ</th>
                  <th className="p-4 font-bold text-slate-600">الحالة</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {paymentsLogs.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">لا توجد مدفوعات مسجلة</td></tr>
               ) : (
                  paymentsLogs.map((p: any) => (
                     <tr key={p.id} className="hover:bg-slate-50">
                       <td className="p-4 font-bold text-slate-800">{p.date}</td>
                       <td className="p-4 text-slate-700 font-bold">{p.type}</td>
                       <td className="p-4 text-slate-600 font-bold">{p.paymentMethod || 'نقدي'}</td>
                       <td className="p-4 font-mono font-bold text-emerald-600">{p.amount} ج.م</td>
                       <td className="p-4">
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">مسدد</span>
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
