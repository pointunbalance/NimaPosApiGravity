import React from 'react';
import { X, Receipt } from 'lucide-react';

interface SchoolPaymentModalProps {
  paymentModalOpen: boolean;
  setPaymentModalOpen: (val: boolean) => void;
  handleSavePayment: (e: React.FormEvent) => void;
  paymentFormData: any;
  setPaymentFormData: (data: any) => void;
  students: any[];
  subscriptions: any[];
  getFeeTypeName: (id: number) => string;
}

export const SchoolPaymentModal: React.FC<SchoolPaymentModalProps> = ({
  paymentModalOpen, setPaymentModalOpen, handleSavePayment, paymentFormData, setPaymentFormData, students, subscriptions, getFeeTypeName
}) => {
  if (!paymentModalOpen) return null;

  return (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-xl font-black text-slate-800">إصدار سند قبض اشتراك / رسوم طالب</h3>
                  <button onClick={() => setPaymentModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full"><X className="w-5 h-5"/></button>
               </div>
               <form onSubmit={handleSavePayment} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">الطالب <span className="text-rose-500">*</span></label>
                        <select required value={paymentFormData.studentId} onChange={e => {
                               setPaymentFormData({...paymentFormData, studentId: Number(e.target.value), subscriptionId: 0, amount: 0});
                            }} 
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none"
                        >
                           <option value={0} disabled>-- اختر الطالب --</option>
                           {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                     </div>

                     {paymentFormData.studentId > 0 && (
                        <div className="col-span-2">
                           <label className="block text-sm font-bold text-slate-700 mb-2">الاشتراك / الفاتورة المستحقة</label>
                           <select value={paymentFormData.subscriptionId} onChange={e => {
                                  const subId = Number(e.target.value);
                                  const sub = subscriptions.find(s => s.id === subId);
                                  setPaymentFormData({...paymentFormData, subscriptionId: subId, amount: sub ? sub.remainingAmount : 0});
                               }} 
                               className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none"
                           >
                              <option value={0}>دفعة عامة (بدون ربط باشترك محدد)</option>
                              {subscriptions.filter(s => s.studentId === paymentFormData.studentId && s.remainingAmount > 0).map(s => (
                                 <option key={s.id} value={s.id}>{getFeeTypeName(s.feeTypeId)} (المتبقي: {s.remainingAmount} ج.م)</option>
                              ))}
                           </select>
                        </div>
                     )}

                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">المبلغ المحصل <span className="text-rose-500">*</span></label>
                        <input required type="number" min="1" value={paymentFormData.amount} onChange={e => setPaymentFormData({...paymentFormData, amount: Number(e.target.value)})} className="w-full bg-emerald-50 border border-emerald-200 p-3 rounded-xl outline-none font-black text-lg text-emerald-700 text-left" dir="ltr"/>
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">طريقة الدفع</label>
                        <select value={paymentFormData.paymentMethod} onChange={e => setPaymentFormData({...paymentFormData, paymentMethod: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none">
                           <option value="cash">نقدي (كاشير)</option>
                           <option value="bank_transfer">تحويل بنكي</option>
                           <option value="visa">فيزا / الدفع الإلكتروني</option>
                           <option value="vodafone_cash">فودافون كاش / محافظ</option>
                        </select>
                     </div>
                  </div>
                  <div className="pt-6 flex justify-end">
                     <button type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 flex-1 flex items-center justify-center gap-2">
                        <Receipt className="w-5 h-5"/> تأكيد التحصيل وإصدار السند
                     </button>
                  </div>
               </form>
            </div>
         </div>
  );
};
