import React from 'react';
import { X, Wrench, ShieldAlert } from 'lucide-react';
import { EquipmentType } from './equipmentTypes';

interface EquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit: boolean;
  formData: Partial<EquipmentType>;
  setFormData: (data: any) => void;
  onSave: (e: React.FormEvent) => void;
  trainers: any[];
  currency: string;
}

export const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  isOpen,
  onClose,
  isEdit,
  formData,
  setFormData,
  onSave,
  trainers,
  currency
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm font-sans text-right" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-row-reverse text-right">
          <button 
            type="button"
            onClick={onClose}
            className="p-1 px-3 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full transition-colors text-xs font-bold cursor-pointer"
          >
            إغلاق ×
          </button>
          
          <div className="flex items-center gap-2 flex-row-reverse text-right">
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Wrench className="w-5 h-5" />
            </span>
            <h2 className="text-base font-black text-slate-805">
              {isEdit ? 'تعديل وثيقة الأصل الرياضي' : 'قيد وتسجيل أصل رياضي جديد'}
            </h2>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={onSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Row 1: Name and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-bold text-slate-700">اسم الجهاز / الأصل الرياضي *</label>
              <input 
                type="text" 
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="مثال: جهاز جهاز جري تردميل كهربائي"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-505 focus:outline-none text-right"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-bold text-slate-700">الفئة وتصنيف المنشأ *</label>
              <input 
                type="text" 
                value={formData.type || ''}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                placeholder="مثال: أجهزة الكارديو، أوزان وحوامل، لياقة بدنية"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-505 focus:outline-none text-right"
              />
            </div>
          </div>

          {/* Row 2: Status, Serial number, and Supervisor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-bold text-slate-700">حالة التشغيل الحالية *</label>
              <select
                value={formData.status || 'يعمل'}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="يعمل">🟢 يعمل بشكل ممتاز</option>
                <option value="بحاجة لصيانة">🟡 بحاجة لصيانة/فحص</option>
                <option value="تحت الصيانة">⚙️ قيد الصيانة والإصلاح</option>
                <option value="معطل">🔴 معطل / خارج الخدمة</option>
              </select>
            </div>

            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-bold text-slate-700">رقم السيريال S/N (أو الباركود)</label>
              <input 
                type="text" 
                value={formData.serialNumber || ''}
                onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                placeholder="S/N: 20439402834"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-left"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-bold text-slate-700">الكابتن المشرف على العهدة</label>
              <select
                value={formData.supervisorId || ''}
                onChange={(e) => setFormData({...formData, supervisorId: e.target.value})}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-705 focus:outline-none"
              >
                <option value="">-- غير محدد --</option>
                {trainers.map(tr => (
                  <option key={tr.id} value={tr.id}>{tr.name}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Row 3: Financial purchase state cost & Supplier info */}
          <div className="bg-indigo-50/20 p-4 rounded-xl border border-indigo-100/40 space-y-3.5">
            <span className="text-[11px] font-black text-indigo-700 block">تفاصيل التوكيل والمورد وتكلفة التملك</span>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1 text-right font-sans">
                <label className="block text-[10px] font-bold text-slate-600">سعر الشراء والأصل ({currency})</label>
                <input 
                  type="number" 
                  value={formData.purchasePrice === 0 ? '' : formData.purchasePrice}
                  onChange={(e) => setFormData({...formData, purchasePrice: e.target.value === '' ? '' : Number(e.target.value)})}
                  placeholder="مثال: 45000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 font-mono text-right"
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="block text-[10px] font-bold text-slate-600">تاريخ شراء وتملك هذا الأصل</label>
                <input 
                  type="date" 
                  value={formData.purchaseDate || ''}
                  onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-805"
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="block text-[10px] font-bold text-slate-600">تاريخ الصيانة السنوية التالية *</label>
                <input 
                  type="date" 
                  value={formData.nextMaintenance || ''}
                  onChange={(e) => setFormData({...formData, nextMaintenance: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-805"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1 text-right">
                <label className="block text-[10px] font-bold text-slate-600">اسم المورد أو توكيل الصيانة للتواصل</label>
                <input 
                  type="text" 
                  value={formData.supplierName || ''}
                  onChange={(e) => setFormData({...formData, supplierName: e.target.value})}
                  placeholder="شركة التجهيزات الرياضية الحديثة..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-805"
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="block text-[10px] font-bold text-slate-600">هاتف المورد للتواصل مع التكليفات</label>
                <input 
                  type="text" 
                  value={formData.supplierPhone || ''}
                  onChange={(e) => setFormData({...formData, supplierPhone: e.target.value})}
                  placeholder="مثال: 0100439402"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none text-left"
                />
              </div>
            </div>
          </div>

          {/* Notes description metadata */}
          <div className="space-y-1.5 text-right">
            <label className="block text-xs font-bold text-slate-700">ملاحظات وخصائص إضافية (أوزان، محركات، غيار)</label>
            <textarea 
              value={formData.notes || ''}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              placeholder="اكتب التفاصيل والمميزات الخاصة بالأصل بشكل كامل هنا..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none"
            />
          </div>

          {/* Action buttons triggers */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 bg-slate-50 p-4 -mx-6 -mb-6 flex-row-reverse text-right">
            <button 
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-xs shadow-md cursor-pointer"
            >
              حفظ وتوثيق الأصل الرياضي
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold bg-white hover:bg-slate-100 transition-all text-xs cursor-pointer"
            >
              إلغاء الأمر
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
