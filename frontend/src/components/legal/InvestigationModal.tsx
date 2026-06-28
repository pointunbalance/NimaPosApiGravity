import React from 'react';
import { X, Save, FileText, CheckCircle } from 'lucide-react';

interface InvestigationModalProps {
  isOpen: boolean;
  editingItem: any | null;
  setEditingItem: (item: any | null) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export const InvestigationModal: React.FC<InvestigationModalProps> = ({
  isOpen,
  editingItem,
  setEditingItem,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 flex-row-reverse text-right">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm transition">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            {editingItem?.id ? 'تعديل السجل وتحديث الحالة' : 'تسجيل شكوى / واقعة جديدة'}
          </h3>
        </div>
        
        <form onSubmit={onSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-right">
          {/* Section 1: details */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-indigo-600 border-b pb-2">1. التفاصيل الأولية للواقعة</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 text-right">
                <label className="block text-sm font-bold text-slate-700 mb-2">عنوان الشكوى / الواقعة *</label>
                <input required type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                  placeholder="مثال: تأخير متكرر، إتلاف عهدة، شكوى زميل..."
                  value={editingItem?.title || ''} onChange={(e) => setEditingItem({...editingItem, title: e.target.value})} />
              </div>
              <div className="text-right">
                <label className="block text-sm font-bold text-slate-700 mb-2">الموظف المعني / المشتكى عليه *</label>
                <input required type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                  placeholder="اسم الموظف"
                  value={editingItem?.employeeName || ''} onChange={(e) => setEditingItem({...editingItem, employeeName: e.target.value})} />
              </div>
              <div className="text-right">
                <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الواقعة *</label>
                <input required type="date" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                  value={editingItem?.incidentDate || ''} onChange={(e) => setEditingItem({...editingItem, incidentDate: e.target.value})} />
              </div>
              <div className="col-span-2 text-right">
                <label className="block text-sm font-bold text-slate-700 mb-2">وصف الواقعة والتفاصيل</label>
                <textarea rows={3} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                  placeholder="يرجى كتابة كافة التفاصيل والأحداث بالتسلسل..."
                  value={editingItem?.description || ''} onChange={(e) => setEditingItem({...editingItem, description: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="font-bold text-sm text-indigo-600 border-b pb-2">2. إجراءات ومسار التحقيق</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-right">
                <label className="block text-sm font-bold text-slate-700 mb-2">اسم المحقق المكلّف</label>
                <input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                  placeholder="محامي الشركة، مدير الموارد البشرية..."
                  value={editingItem?.investigatorName || ''} onChange={(e) => setEditingItem({...editingItem, investigatorName: e.target.value})} />
              </div>
              <div className="text-right">
                <label className="block text-sm font-bold text-slate-700 mb-2">حالة التحقيق الحالية</label>
                <select className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-right"
                  value={editingItem?.status || 'pending'} onChange={(e) => setEditingItem({...editingItem, status: e.target.value})}>
                  <option value="pending">قيد الانتظار / لم يبدأ</option>
                  <option value="in_progress">جاري التحقيق والمراجعة</option>
                  <option value="recommendation">في مرحلة التوصية والاعتماد</option>
                  <option value="escalated">تم التصعيد للجهات المختصة</option>
                  <option value="closed">مغلق / تم البت وإصدار القرار</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          {editingItem?.status === 'closed' && (
            <div className="space-y-4 pt-4 border-t border-slate-100 bg-green-50/50 p-4 rounded-xl border border-green-100 text-right">
              <h4 className="font-bold text-sm text-green-700 flex items-center justify-end gap-2 text-right">
                <CheckCircle className="w-4 h-4"/> 3. نتائج التحقيق والقرار
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 text-right">
                  <label className="block text-sm font-bold text-slate-700 mb-2">الإجراء الوظيفي المتخذ</label>
                  <select className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-right"
                    value={editingItem?.actionTaken || 'none'} onChange={(e) => setEditingItem({...editingItem, actionTaken: e.target.value})}>
                    <option value="none">حفظ أوراق الشكوى / براءة ذمة</option>
                    <option value="warning">إنذار خطي / لفت نظر</option>
                    <option value="deduction">خصم من الراتب / حرمان من الحوافز</option>
                    <option value="demotion">تخفيض الدرجة الوظيفية</option>
                    <option value="termination">فصل من العمل / إنهاء خدمات</option>
                  </select>
                </div>
                <div className="col-span-2 text-right">
                  <label className="block text-sm font-bold text-slate-700 mb-2">تفاصيل القرار ومنطوقه</label>
                  <textarea rows={3} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-right"
                    placeholder="اكتب منطوق القرار النهائي والإجراءات المرتبطة..."
                    value={editingItem?.resolution || ''} onChange={(e) => setEditingItem({...editingItem, resolution: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t mt-6 flex-row-reverse text-right">
            <button type="submit" className="px-6 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold shadow-[0_4px_12px_rgba(79,70,229,0.3)] transition flex items-center gap-2">
              <Save className="w-5 h-5"/> 
              {editingItem?.id ? 'تحديث البيانات' : 'حفظ التحقيق'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition">إلغاء وإغلاق</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default InvestigationModal;
