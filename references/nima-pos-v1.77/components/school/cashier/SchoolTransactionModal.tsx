import React from 'react';
import { X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface SchoolTransactionModalProps {
  transactionModalOpen: boolean;
  setTransactionModalOpen: (val: boolean) => void;
  handleSaveTransaction: (e: React.FormEvent) => void;
  transactionFormData: any;
  setTransactionFormData: (data: any) => void;
}

export const SchoolTransactionModal: React.FC<SchoolTransactionModalProps> = ({
  transactionModalOpen, setTransactionModalOpen, handleSaveTransaction, transactionFormData, setTransactionFormData
}) => {
  if (!transactionModalOpen) return null;

  return (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-xl font-black text-slate-800">إيصال مصروف / إيراد عام</h3>
                  <button onClick={() => setTransactionModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full"><X className="w-5 h-5"/></button>
               </div>
               <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2 flex gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
                         <label className="flex-1 cursor-pointer">
                            <input type="radio" className="peer sr-only" name="txnType" value="outflow" checked={transactionFormData.type === 'outflow'} onChange={e => setTransactionFormData({...transactionFormData, type: 'outflow'})} />
                            <div className="py-2 text-center rounded-lg font-bold text-slate-500 peer-checked:bg-rose-500 peer-checked:text-white transition-colors">صرف (دفع مصروفات)</div>
                         </label>
                         <label className="flex-1 cursor-pointer">
                            <input type="radio" className="peer sr-only" name="txnType" value="inflow" checked={transactionFormData.type === 'inflow'} onChange={e => setTransactionFormData({...transactionFormData, type: 'inflow'})} />
                            <div className="py-2 text-center rounded-lg font-bold text-slate-500 peer-checked:bg-emerald-500 peer-checked:text-white transition-colors">قبض (إيراد إضافي)</div>
                         </label>
                     </div>

                     <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">البيان / الوصف <span className="text-rose-500">*</span></label>
                        <input required type="text" value={transactionFormData.description} onChange={e => setTransactionFormData({...transactionFormData, description: e.target.value})} placeholder={transactionFormData.type === 'outflow' ? 'مثال: شراء أدوات مكتبية، دفع فواتير، الخ..' : 'مثال: إيراد رحلات، بيع زي، الخ..'} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">المبلغ <span className="text-rose-500">*</span></label>
                        <input required type="number" min="1" value={transactionFormData.amount} onChange={e => setTransactionFormData({...transactionFormData, amount: Number(e.target.value)})} className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none font-black text-lg text-left" dir="ltr"/>
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">وسيلة العمل</label>
                        <select value={transactionFormData.paymentMethod} onChange={e => setTransactionFormData({...transactionFormData, paymentMethod: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none">
                           <option value="cash">نقدي (كاشير)</option>
                           <option value="bank_transfer">تحويل من البنك</option>
                           <option value="card">فيزا أو بطاقة</option>
                        </select>
                     </div>
                  </div>
                  <div className="pt-6 flex justify-end">
                     <button type="submit" className={`text-white px-6 py-3 rounded-xl font-bold flex-1 flex items-center justify-center gap-2 ${transactionFormData.type === 'outflow' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                        حفظ العملية وإصدار الإيصال
                     </button>
                  </div>
               </form>
            </div>
         </div>
  );
};
