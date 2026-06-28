import React, { useState } from 'react';
import { XCircle, Banknote, Save } from 'lucide-react';
import { FinancialVoucher } from '../../types';

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (voucher: Partial<FinancialVoucher>) => Promise<void>;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({ isOpen, onClose, onSave }) => {
  const [voucherForm, setVoucherForm] = useState<Partial<FinancialVoucher>>({
    type: 'payment',
    paymentMethod: 'cash',
    date: new Date()
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(voucherForm);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" dir="rtl">
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col border border-indigo-100/50">
        <div className="p-6 border-b border-indigo-50 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-800">إنشاء سند مالي جديد</h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl transition-all"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">نوع السند *</label>
              <div className="flex bg-slate-50 rounded-2xl p-1 border border-indigo-100/50">
                <button 
                  type="button" 
                  onClick={() => setVoucherForm({...voucherForm, type: 'receipt'})} 
                  className={`flex-1 py-2 font-black rounded-xl text-xs transition-all outline-none cursor-pointer ${voucherForm.type === 'receipt' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  قبض (توريد للخزينة)
                </button>
                <button 
                  type="button" 
                  onClick={() => setVoucherForm({...voucherForm, type: 'payment'})} 
                  className={`flex-1 py-2 font-black rounded-xl text-xs transition-all outline-none cursor-pointer ${voucherForm.type === 'payment' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  صرف (خروج من الخزينة)
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">القيمة (المبلغ) *</label>
              <div className="relative">
                <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="number" 
                  required 
                  min="1" 
                  step="0.01" 
                  value={voucherForm.amount || ''} 
                  onChange={e => setVoucherForm({...voucherForm, amount: parseFloat(e.target.value)})} 
                  className={`w-full pr-10 pl-4 py-2.5 bg-slate-50 border rounded-2xl outline-none font-black text-lg focus:ring-2 focus:ring-opacity-20 transition-all ${voucherForm.type === 'receipt' ? 'border-indigo-200 focus:border-indigo-500 text-indigo-700 focus:ring-indigo-500' : 'border-rose-200 focus:border-rose-500 text-rose-700 focus:ring-rose-500'}`} 
                  placeholder="0.00" 
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-black text-slate-700 mb-2">البيان / السبب *</label>
            <input 
              type="text" 
              required 
              value={voucherForm.description || ''} 
              onChange={e => setVoucherForm({...voucherForm, description: e.target.value})} 
              className="w-full bg-slate-50 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-bold transition-all text-slate-800" 
              placeholder="مثال: سداد دفعة مقدمة صيانة باص رقم 123" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">{voucherForm.type === 'receipt' ? 'اسم المسدد' : 'اسم المستلم'} (اختياري)</label>
              <input 
                type="text" 
                value={voucherForm.partyName || ''} 
                onChange={e => setVoucherForm({...voucherForm, partyName: e.target.value})} 
                className="w-full bg-slate-50 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-bold transition-all text-slate-800" 
                placeholder="اسم الشخص أو الجهة" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">طريقة الدفع</label>
              <select 
                value={voucherForm.paymentMethod || 'cash'} 
                onChange={e => setVoucherForm({...voucherForm, paymentMethod: e.target.value as any})} 
                className="w-full bg-slate-50 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-bold transition-all text-slate-700 cursor-pointer"
              >
                <option value="cash">كاش (نقداً)</option>
                <option value="card">بطاقة ائتمان / فيزا</option>
                <option value="bank">تحويل بنكي</option>
                <option value="cheque">شيك</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">رقم مرجعي / رقم الشيك (إن وجد)</label>
              <input 
                type="text" 
                value={voucherForm.referenceNumber || ''} 
                onChange={e => setVoucherForm({...voucherForm, referenceNumber: e.target.value})} 
                className="w-full bg-slate-50 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-mono tracking-wider transition-all text-slate-800" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">بند المصرف / التصنيف (اختياري)</label>
              <input 
                type="text" 
                list="category-list" 
                value={voucherForm.category || ''} 
                onChange={e => setVoucherForm({...voucherForm, category: e.target.value})} 
                className="w-full bg-slate-50 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-bold transition-all text-slate-800" 
                placeholder="مثال: إيجار المحل..." 
              />
              <datalist id="category-list">
                <option value="إيجار المحل" />
                <option value="كهرباء" />
                <option value="إنترنت" />
                <option value="رواتب الموظفين" />
                <option value="شحن خطوط" />
                <option value="مصروفات ضيافة" />
                <option value="تسديد شركة نقل" />
              </datalist>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-indigo-50 bg-slate-50/50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-xl font-black text-slate-600 hover:bg-slate-200 transition-all text-sm cursor-pointer"
          >
            إلغاء
          </button>
          <button 
            type="submit" 
            className="px-6 py-2.5 bg-gradient-to-br from-emerald-500 to-teal-650 hover:from-emerald-600 hover:to-teal-750 text-white rounded-xl font-black shadow-md shadow-emerald-500/10 flex items-center gap-2 text-sm transition-all cursor-pointer"
          >
            <Save size={18} className="stroke-[2.5]" />
            حفظ السند واعتماده
          </button>
        </div>
      </form>
    </div>
  );
};

export default VoucherModal;
