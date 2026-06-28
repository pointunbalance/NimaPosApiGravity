import React from 'react';
import { X, Save } from 'lucide-react';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  editingItem: any;
  setEditingItem: (item: any) => void;
  clients: any[];
  cases: any[];
}

export const BillingModal: React.FC<BillingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  setEditingItem,
  clients,
  cases,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm text-right" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 flex-row-reverse text-right">
          <h3 className="text-lg font-bold text-slate-800">
            {editingItem?.id ? 'تعديل السجل المالي' : 'إضافة دفعة أو مصروف جديد'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={onSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 text-right">
              <label className="block text-sm font-bold text-slate-700 mb-2">جهة الموكل</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                value={editingItem?.clientId || ''} 
                onChange={(e) => setEditingItem({...editingItem, clientId: e.target.value})}
              >
                <option value="">-- اختر الموكل --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 text-right">
              <label className="block text-sm font-bold text-slate-700 mb-2">القضية / الملف</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                value={editingItem?.caseId || ''} 
                onChange={(e) => setEditingItem({...editingItem, caseId: e.target.value})}
              >
                <option value="">-- غير مرتبط (عام) --</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 text-right">
              <label className="block text-sm font-bold text-slate-700 mb-2">وصف المعاملة المالية *</label>
              <input 
                required 
                type="text" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                placeholder="مثال: الدفعة الثانية من الأتعاب، رسوم خبير..."
                value={editingItem?.title || ''} 
                onChange={(e) => setEditingItem({...editingItem, title: e.target.value})} 
              />
            </div>
            <div className="text-right">
              <label className="block text-sm font-bold text-slate-700 mb-2">النوع / التبويب</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                value={editingItem?.type || 'installment'} 
                onChange={(e) => setEditingItem({...editingItem, type: e.target.value})}
              >
                <option value="retainer">مقدم أتعاب</option>
                <option value="installment">دفعة أتعاب دورية</option>
                <option value="final">مؤخر أتعاب (بعد الحكم)</option>
                <option value="expense">مصروفات مدفوعة (رسوم، خبراء)</option>
              </select>
            </div>
            <div className="text-right">
              <label className="block text-sm font-bold text-emerald-700 mb-2">المبلغ الكلي *</label>
              <input 
                required 
                type="number" 
                step="0.01" 
                className="w-full p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl outline-none font-black dir-ltr text-right"
                value={editingItem?.amount || ''} 
                onChange={(e) => setEditingItem({...editingItem, amount: e.target.value})} 
              />
            </div>
            <div className="col-span-2 flex gap-4 pt-2 text-right">
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">الاستحقاق</label>
                <input 
                  type="date" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-right"
                  value={editingItem?.dueDate ? new Date(editingItem.dueDate).toISOString().split('T')[0] : ''} 
                  onChange={(e) => setEditingItem({...editingItem, dueDate: e.target.value})} 
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">الحالة السداد</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-right"
                  value={editingItem?.status || 'pending'} 
                  onChange={(e) => setEditingItem({...editingItem, status: e.target.value})}
                >
                  <option value="pending">مُعلقة / مستحقة</option>
                  <option value="paid">✅ تم التحصيل</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6 flex-row-reverse">
            <button 
              type="submit" 
              className="px-6 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold shadow-md transition flex items-center gap-2 flex-row-reverse"
            >
              <Save className="w-5 h-5"/> 
              حفظ الفاتورة
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default BillingModal;
