import React from 'react';
import { X, Save } from 'lucide-react';

interface ComplianceModalProps {
  isOpen: boolean;
  editingItem: any | null;
  setEditingItem: (item: any | null) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({
  isOpen,
  editingItem,
  setEditingItem,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl text-right">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 flex-row-reverse text-right">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm transition">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold text-slate-800">
            {editingItem?.id ? 'تحديث موقف الامتثال التشريعي' : 'إضافة متطلب تشريعي / لائحي جديد'}
          </h3>
        </div>
        
        <form onSubmit={onSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-right">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 text-right">
              <label className="block text-sm font-bold text-slate-700 mb-2">معرّف القانون أو اللائحة الأساسي *</label>
              <input required type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                placeholder="مثال: نظام حماية البيانات الشخصية - PDPL..."
                value={editingItem?.title || ''} onChange={(e) => setEditingItem({...editingItem, title: e.target.value})} />
            </div>
            <div className="text-right">
              <label className="block text-sm font-bold text-slate-700 mb-2">فئة التنظيم</label>
              <select className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-right"
                value={editingItem?.type || 'labor_law'} onChange={(e) => setEditingItem({...editingItem, type: e.target.value})}>
                <option value="labor_law">متطلبات قانون العمل</option>
                <option value="tax">الضرائب والجمارك</option>
                <option value="data_protection">حماية البيانات والخصوصية</option>
                <option value="safety">الصحة والسلامة المهنية</option>
                <option value="corporate">حوكمة الشركات واللوائح الداخلية</option>
                <option value="other">اشتراطات أخرى</option>
              </select>
            </div>
            <div className="text-right">
              <label className="block text-sm font-bold text-slate-700 mb-2">حالة الامتثال الكلية للمتطلب</label>
              <select className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 text-right"
                value={editingItem?.status || 'compliant'} onChange={(e) => setEditingItem({...editingItem, status: e.target.value})}>
                <option value="compliant">ملتزم بالكامل ✅</option>
                <option value="under_review">تحت المراجعة الجارية 🔄</option>
                <option value="non_compliant">غير ملتزم - فجوات وتصحيح ⚠️</option>
              </select>
            </div>
            
            <div className="col-span-2 text-right">
              <label className="block text-sm font-bold text-slate-700 mb-2">المسؤول عن تقييم/متابعة الامتثال</label>
              <input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                placeholder="اسم الموظف أو الإدارة المسؤولة..."
                value={editingItem?.responsibleOfficer || ''} onChange={(e) => setEditingItem({...editingItem, responsibleOfficer: e.target.value})} />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-right">
              <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ أخر مراجعة شاملة</label>
              <input type="date" className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                value={editingItem?.lastReviewedDate ? new Date(editingItem.lastReviewedDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditingItem({...editingItem, lastReviewedDate: e.target.value})} />
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-right">
              <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ إعادة التقييم المستهدف</label>
              <input type="date" className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                value={editingItem?.nextReviewDate ? new Date(editingItem.nextReviewDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditingItem({...editingItem, nextReviewDate: e.target.value})} />
            </div>

            <div className="col-span-2 text-right">
              <label className="block text-sm font-bold text-slate-700 mb-2">موقف الأنظمة ومتطلبات العمل (Gap Analysis)</label>
              <textarea rows={4} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                placeholder="سجّل أي فجوات، ملاحظات تدقيق، أو خطة عمل لضمان الامتثال المستمر..."
                value={editingItem?.description || ''} onChange={(e) => setEditingItem({...editingItem, description: e.target.value})} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6 flex-row-reverse text-right">
            <button type="submit" className="px-6 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold shadow-md transition flex items-center gap-2">
              <Save className="w-5 h-5"/> حفظ التقييم والتحديث
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition">إلغاء وإغلاق</button>
          </div>
        </form>
      </div>
    </div>
  );
};
