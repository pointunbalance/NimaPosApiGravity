import React from 'react';
import { X, Layers } from 'lucide-react';

export const LevelModal = ({
  isLevelModalOpen, setIsLevelModalOpen, handleSaveLevel, levelFormData, setLevelFormData, isEdit
}: any) => {
  if (!isLevelModalOpen) return null;
  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">
                {isEdit ? 'تعديل المستوى التعليمي' : 'مستوى تعليمي جديد'}
              </h2>
              <button 
                type="button"
                onClick={() => setIsLevelModalOpen(false)} 
                className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveLevel} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">اسم المستوى <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={levelFormData.name}
                  onChange={(e) => setLevelFormData({...levelFormData, name: e.target.value})}
                  required
                  placeholder="مثال: KG 1, التمهيدي, الرضع.."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">السن من (سنوات)</label>
                  <input 
                    type="number" step="0.5"
                    value={levelFormData.ageFrom}
                    onChange={(e) => setLevelFormData({...levelFormData, ageFrom: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">السن إلى (سنوات)</label>
                  <input 
                    type="number" step="0.5"
                    value={levelFormData.ageTo}
                    onChange={(e) => setLevelFormData({...levelFormData, ageTo: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">الترتيب الدراسي (للترفيع)</label>
                <input 
                  type="number" 
                  value={levelFormData.sortOrder}
                  onChange={(e) => setLevelFormData({...levelFormData, sortOrder: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                />
                <p className="text-xs text-slate-500 mt-1">يستخدم لترقية الأطفال للعام القادم (1، 2، 3..)</p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input 
                   type="checkbox" 
                   id="isActiveLvl"
                   checked={levelFormData.isActive}
                   onChange={(e) => setLevelFormData({...levelFormData, isActive: e.target.checked})}
                   className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="isActiveLvl" className="font-bold text-slate-700">مستوى مفعل وحالي</label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsLevelModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                  إلغاء
                </button>
                <button type="submit" className="px-6 py-2.5 font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors">
                  حفظ المستوى
                </button>
              </div>
            </form>
          </div>
        </div>
  );
};
