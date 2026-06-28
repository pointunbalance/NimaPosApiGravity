import React from 'react';
import { X, Briefcase, DollarSign, Layers, CreditCard } from 'lucide-react';

interface StoreFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit: boolean;
  formData: {
    name: string;
    price: string;
    stock: string;
    barcode: string;
    category: string;
  };
  setFormData: (val: any) => void;
  onSave: (e: React.FormEvent) => void;
}

export const StoreFormModal: React.FC<StoreFormModalProps> = ({
  isOpen,
  onClose,
  isEdit,
  formData,
  setFormData,
  onSave
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 text-right font-sans" dir="rtl">
      
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center flex-row-reverse text-right">
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div>
            <h3 className="font-black text-sm tracking-tight">{isEdit ? 'تعديل تفاصيل الصنف بالمتجر' : 'تسجيل وإدراج صنف مكمل/مشروب جديد لمقصف الصالة'}</h3>
            <p className="text-[10px] text-slate-400 mt-1">تحديد الهوية والأسعار ومستوى التوريد الأولي</p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={onSave} className="p-6 space-y-4 text-right">
          
          <div className="space-y-1 text-right">
            <label className="block text-xs font-bold text-slate-700">اسم المنتج الرياضي بالكامل *</label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="مثال: واي بروتين جولد ستاندرد 2 كجم عبوة شوكولاتة..."
                className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1 text-right">
              <label className="block text-xs font-bold text-slate-700">سعر البيع الافتراضي للمتدربين *</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="number" 
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  placeholder="0.00"
                  min="0"
                  step="any"
                  className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-mono font-bold text-slate-800 text-right"
                />
              </div>
            </div>

            <div className="space-y-1 text-right">
              <label className="block text-xs font-bold text-slate-700">سقف الكمية المتوفرة حالياً *</label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="number" 
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                  placeholder="0"
                  min="0"
                  className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-mono font-bold text-slate-800 text-right"
                />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1 text-right">
              <label className="block text-xs font-bold text-slate-705">رمز باركود السلعة / SKU</label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="رقم الباركود للقارئ السريع..."
                  className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-mono font-bold text-slate-800 text-right"
                />
              </div>
            </div>

            <div className="space-y-1 text-right">
              <label className="block text-xs font-bold text-slate-707">الفئة والتصنيف المقيد</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-850 focus:outline-none focus:bg-white text-right"
              >
                <option value="بروتينات ومكملات">بروتينات ومكملات بودر</option>
                <option value="مشروبات ومياه">مشروبات ومياه باردة</option>
                <option value="أدوات رياضية">أدوات إكسسوارات قفازات</option>
                <option value="سناكس صحية">سناكس صحية وبارز</option>
                <option value="أخرى">أخرى تصنيفات متفرقة</option>
              </select>
            </div>

          </div>

          {/* Action buttons */}
          <div className="border-t pt-4 flex gap-3 text-xs flex-row-reverse">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-650 bg-indigo-600 text-white font-black rounded-lg cursor-pointer transition-colors hover:bg-indigo-700"
            >
              حفظ وربط ⚡
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
            >
              تراجع
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
export default StoreFormModal;
