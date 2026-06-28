import React from 'react';
import { X, Info, ShoppingCart } from 'lucide-react';

interface SellInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: any;
  sellForm: any;
  setSellForm: React.Dispatch<React.SetStateAction<any>>;
  handleSell: (e: React.FormEvent) => void;
  students: any[];
  classes: any[];
}

export const SellInventoryItemModal: React.FC<SellInventoryItemModalProps> = ({
  isOpen,
  onClose,
  selectedItem,
  sellForm,
  setSellForm,
  handleSell,
  students,
  classes,
}) => {
  if (!isOpen || !selectedItem) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-sky-50 rounded-t-3xl">
          <div>
            <h2 className="text-xl font-black text-slate-800">صرف صنف لطفل</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">{selectedItem.name || selectedItem.itemName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSell} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">الطفل المشترى</label>
            <select
              required
              value={sellForm.studentId}
              onChange={(e) => setSellForm({ ...sellForm, studentId: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold outline-none"
            >
              <option value="">-- اختر الطفل --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {classes.find((c) => c.id === s.classroomId)?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الكمية المنصرفة</label>
              <input
                required
                type="number"
                min="1"
                max={selectedItem.quantity}
                value={sellForm.quantity}
                onChange={(e) => setSellForm({ ...sellForm, quantity: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono outline-none text-right"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الإجمالي (ج.م)</label>
              <input
                disabled
                type="text"
                value={sellForm.quantity * (selectedItem.sellingPrice || 0)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-black outline-none text-right"
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-amber-800 leading-relaxed">
              بمجرد الحفظ، سيتم خصم الكمية من المخزون وإضافة قيمة الصنف كإيرادات في الخزنة تلقائياً.
            </p>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-colors shadow-sm shadow-sky-200 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" /> تأكيد الصرف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
