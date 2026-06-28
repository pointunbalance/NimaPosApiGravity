import React from 'react';
import { X, BookOpen } from 'lucide-react';

export const ClassModal = ({
  isClassModalOpen, setIsClassModalOpen, handleSaveClass, classFormData, setClassFormData, levels, isEdit
}: any) => {
  if (!isClassModalOpen) return null;
  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">
                {isEdit ? 'تعديل بيانات الفصل' : 'فصل دراسي جديد'}
              </h2>
              <button 
                type="button"
                onClick={() => setIsClassModalOpen(false)} 
                className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveClass} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">اسم الفصل <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    value={classFormData.name}
                    onChange={(e) => setClassFormData({...classFormData, name: e.target.value})}
                    required
                    placeholder="مثال: فصل الأسود، Apples.."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">المستوى التابع له <span className="text-rose-500">*</span></label>
                  <select 
                    value={classFormData.levelId}
                    onChange={(e) => setClassFormData({...classFormData, levelId: e.target.value})}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  >
                    {levels.map(l => (
                       <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">السعة القصوى للأطفال</label>
                  <input 
                    type="number" 
                    value={classFormData.capacity}
                    onChange={(e) => setClassFormData({...classFormData, capacity: e.target.value})}
                    required min="1"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">المعلمة المسؤولة</label>
                  <input 
                    type="text" 
                    value={classFormData.teacherName}
                    onChange={(e) => setClassFormData({...classFormData, teacherName: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">المساعدة (Nanny / Assistant)</label>
                  <input 
                    type="text" 
                    value={classFormData.assistantName}
                    onChange={(e) => setClassFormData({...classFormData, assistantName: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">حالة الفصل</label>
                  <select 
                    value={classFormData.status}
                    onChange={(e) => setClassFormData({...classFormData, status: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  >
                    <option value="متاح">متاح وجاري التسجيل</option>
                    <option value="ممتلئ">ممتلئ</option>
                    <option value="مغلق">مغلق مؤقتاً</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsClassModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                  إلغاء
                </button>
                <button type="submit" className="px-6 py-2.5 font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors">
                  حفظ الفصل
                </button>
              </div>
            </form>
          </div>
        </div>
  );
};
