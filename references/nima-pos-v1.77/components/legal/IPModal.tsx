import React from 'react';
import { X, Save } from 'lucide-react';

interface IPModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any;
  setEditingItem: (item: any) => void;
  onSave: (e: React.FormEvent) => void;
}

export const IPModal: React.FC<IPModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  setEditingItem,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">
            {editingItem?.id ? 'تعديل وتحديث الوثيقة' : 'تسجيل وثيقة أو ترخيص جديد'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم الوثيقة / العلامة *</label>
              <input
                required
                type="text"
                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="مثال: علامة تجارية للشركة، رخصة عمل المقر الرئيسي..."
                value={editingItem?.title || ''}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">نوع الوثيقة</label>
              <select
                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                value={editingItem?.type || 'trademark'}
                onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
              >
                <option value="trademark">علامة تجارية</option>
                <option value="patent">براءة اختراع</option>
                <option value="copyright">حقوق النشر</option>
                <option value="commercial_register">سجل تجاري / ترخيص عمل</option>
                <option value="municipal_license">رخصة تشغيل / بلدية</option>
                <option value="domain_name">نطاق إنترنت (Domain)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">النطاق أو جهة الإصدار</label>
              <input
                type="text"
                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="وزارة التجارة، الهيئة العامة..."
                value={editingItem?.issuingAuthority || ''}
                onChange={(e) => setEditingItem({ ...editingItem, issuingAuthority: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">رقم التسجيل / الرخصة أو الإسناد</label>
              <input
                type="text"
                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                value={editingItem?.registrationNumber || ''}
                onChange={(e) => setEditingItem({ ...editingItem, registrationNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">تجاوز الحالة التلقائية (اختياري)</label>
              <select
                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-amber-700"
                value={editingItem?.status || 'active'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
              >
                <option value="active">تلقائي (حسب التاريخ)</option>
                <option value="pending_renewal">جاري إجراءات التجديد (معلّق)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">تفاصيل "جاري التجديد" تمنع إظهاره كمنتهي.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الإصدار</label>
              <input
                type="date"
                className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                value={
                  editingItem?.registrationDate
                    ? new Date(editingItem.registrationDate).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => setEditingItem({ ...editingItem, registrationDate: e.target.value })}
              />
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الانتهاء</label>
              <input
                type="date"
                className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-rose-700 font-bold"
                value={
                  editingItem?.expiryDate ? new Date(editingItem.expiryDate).toISOString().split('T')[0] : ''
                }
                onChange={(e) => setEditingItem({ ...editingItem, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold shadow-md transition flex items-center gap-2"
            >
              <Save className="w-5 h-5" /> حفظ البيانات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
