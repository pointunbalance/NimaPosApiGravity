import React from 'react';
import { CreditCard, Trash2 } from 'lucide-react';
import { db } from '../../../db';
import { logActivity } from '../../../utils/logger';
import { useLiveQuery } from 'dexie-react-hooks';

interface SubscriptionsTabProps {
  selectedChildId: number;
  subForm: any;
  setSubForm: React.Dispatch<React.SetStateAction<any>>;
  handleAddSubscription: (e: React.FormEvent) => void;
}

export const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({ selectedChildId, subForm, setSubForm, handleAddSubscription }) => {
  const subscriptions = useLiveQuery(() => db.studentSubscriptions.where('studentId').equals(selectedChildId || 0).toArray()) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
             <CreditCard className="w-6 h-6 text-brand-600" />
             <h3 className="text-xl font-black text-slate-800">اشتراكات الطالب</h3>
          </div>
       </div>
       
       <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <h4 className="font-black text-slate-800 mb-4">إضافة اشتراك جديد (رسوم، باص، وجبات)</h4>
          <form onSubmit={handleAddSubscription} className="flex flex-col gap-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <input required type="text" value={subForm.name} onChange={e => setSubForm({...subForm, name: e.target.value})} placeholder="نوع الاشتراك (مثال: رسوم شهر مارس)" className="col-span-1 lg:col-span-2 bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold" />
                 <input required type="number" value={subForm.price} onChange={e => setSubForm({...subForm, price: e.target.value})} placeholder="القيمة الإجمالية" className="bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold" />
                 <input required type="date" value={subForm.endDate} onChange={e => setSubForm({...subForm, endDate: e.target.value})} className="bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold" title="تاريخ الانتهاء أو أول استحقاق" />
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-2">
                 <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">طريقة السداد</label>
                     <select value={subForm.paymentMethodType || 'cash'} onChange={e => setSubForm({...subForm, paymentMethodType: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold">
                         <option value="cash">سداد كامل (كاش)</option>
                         <option value="installment">تقسيط (دفعات)</option>
                         <option value="deferred">دفع آجل (لاحقاً)</option>
                     </select>
                 </div>
                 
                 {subForm.paymentMethodType === 'installment' && (
                     <>
                         <div>
                             <label className="block text-sm font-bold text-slate-700 mb-2">الدفعة المقدمة (إن وجدت)</label>
                             <input type="number" value={subForm.downPayment || ''} onChange={e => setSubForm({...subForm, downPayment: e.target.value})} placeholder="0" className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold" />
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-slate-700 mb-2">عدد أقساط المتبقي المستحقة</label>
                             <input required type="number" min="1" max="60" value={subForm.installmentMonths || 2} onChange={e => setSubForm({...subForm, installmentMonths: e.target.value})} placeholder="عدد الأشهر" className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none font-bold" />
                         </div>
                     </>
                 )}
             </div>

             <button type="submit" className="w-full md:w-auto self-end bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-sm px-8 py-3 transition-colors text-lg">
                 إضافة الاشتراك للنظام
             </button>
          </form>
       </div>

       <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-right text-sm">
             <thead className="bg-slate-50 border-b border-slate-200">
               <tr>
                  <th className="p-4 font-bold text-slate-600">الاشتراك / الرسوم</th>
                  <th className="p-4 font-bold text-slate-600">القيمة</th>
                  <th className="p-4 font-bold text-slate-600">تاريخ الاستحقاق</th>
                  <th className="p-4 font-bold text-slate-600 text-center">الإجراءات</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {subscriptions.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500">لا توجد اشتراكات</td></tr>
               ) : (
                  subscriptions.map((s: any) => (
                     <tr key={s.id} className="hover:bg-slate-50">
                       <td className="p-4 font-bold text-slate-800">{s.name}</td>
                       <td className="p-4 font-mono font-bold text-slate-700">{s.price} ج.م</td>
                       <td className="p-4 text-slate-600">{s.endDate}</td>
                       <td className="p-4 text-center">
                          <button onClick={async () => {
                              await db.studentSubscriptions.delete(s.id);
                              await logActivity('studentSubscriptions', 'حذف اشتراك', `تم حذف اشتراك`, undefined, selectedChildId!);
                          }} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
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
