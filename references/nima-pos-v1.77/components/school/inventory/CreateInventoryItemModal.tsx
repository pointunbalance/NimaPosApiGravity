import React from 'react';
import { X, ArrowDownToLine, AlertCircle, DollarSign } from 'lucide-react';
import { CATEGORIES } from './useSchoolInventory';

interface CreateInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  handleCreate: (e: React.FormEvent) => void;
}

export const CreateInventoryItemModal: React.FC<CreateInventoryItemModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  handleCreate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
          <h2 className="text-xl font-black text-slate-800">إضافة صنف جديد للمخزون</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleCreate} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم الصنف</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-medium outline-none"
                placeholder="مثال: قميص أولادي مقاس S"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">القسم / التصنيف</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الكمية الحالية</label>
              <div className="relative">
                <ArrowDownToLine className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                <input
                  required
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  className="w-full pr-9 pl-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono outline-none text-right"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الحد الأدنى للتنبيه</label>
              <div className="relative">
                <AlertCircle className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                <input
                  required
                  type="number"
                  min="0"
                  value={form.minQuantity}
                  onChange={(e) => setForm({ ...form, minQuantity: Number(e.target.value) })}
                  className="w-full pr-9 pl-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono outline-none text-right"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الشراء</label>
              <input
                required
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono text-sm outline-none text-right"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-full">
              <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-emerald-500" /> بيانات التسعير والمورد
              </h4>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">سعر الشراء (التكلفة)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono outline-none text-right"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">سعر البيع (إن وُجد)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono outline-none text-right"
                placeholder="للأصناف التي تباع للأطفال"
              />
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم المورد أو المحل</label>
              <input
                type="text"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-medium outline-none"
                placeholder="من أين تم الشراء؟"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-colors shadow-sm shadow-sky-200"
            >
              تسجيل الصنف في المخزن
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
