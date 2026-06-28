import React from 'react';
import { X } from 'lucide-react';

interface ParentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit: boolean;
  formData: any;
  setFormData: (data: any) => void;
  handleSave: (e: React.FormEvent) => void;
}

export const ParentFormModal: React.FC<ParentFormModalProps> = ({
  isOpen, onClose, isEdit, formData, setFormData, handleSave
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-black text-slate-800">
            {isEdit ? 'تعديل بيانات ولي الأمر' : 'إضافة ولي أمر جديد'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-5 h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-1 border-b md:border-b-0 pb-4 md:pb-0">
                <label className="block text-sm font-bold text-slate-700 mb-2">اسم ولي الأمر الرباعي <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="مثال: رومان كوزا بوهدان"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">صلة القرابة</label>
                <select 
                  value={formData.relation}
                  onChange={(e) => setFormData({...formData, relation: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all"
                >
                   <option value="أب">أب</option>
                   <option value="أم">أم</option>
                   <option value="جد / جدة">جد / جدة</option>
                   <option value="عم / خال">عم / خال</option>
                   <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div className="col-span-2 pt-2"><h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">بيانات التواصل</h3></div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف الأساسي <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.primaryPhone}
                  onChange={(e) => setFormData({...formData, primaryPhone: e.target.value})}
                  required
                  dir="ltr"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all text-right"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">رقم واتساب المحمول</label>
                <input 
                  type="text" 
                  value={formData.whatsappPhone}
                  onChange={(e) => setFormData({...formData, whatsappPhone: e.target.value})}
                  dir="ltr"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">رقم واتساب بديل (اختياري)</label>
                <input 
                  type="text" 
                  value={formData.whatsappPhone2}
                  onChange={(e) => setFormData({...formData, whatsappPhone2: e.target.value})}
                  dir="ltr"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">رقم احتياطي للمكالمات</label>
                <input 
                  type="text" 
                  value={formData.secondaryPhone}
                  onChange={(e) => setFormData({...formData, secondaryPhone: e.target.value})}
                  dir="ltr"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">حالة التواصل</label>
                <select 
                  value={formData.communicationStatus}
                  onChange={(e) => setFormData({...formData, communicationStatus: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all"
                >
                   <option value="active">فعال ويرد سريعاً</option>
                   <option value="no-reply">لا يرد غالباً / يتأخر</option>
                   <option value="invalid-number">رقم غير صحيح أو مغلق دائماً</option>
                </select>
              </div>

              <div className="col-span-2 pt-2"><h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">بيانات شخصية إضافية</h3></div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">بطاقة الرقم القومي</label>
                <input 
                  type="text" 
                  value={formData.nationalId}
                  onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all font-mono text-left block" 
                  dir="ltr"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">الوظيفة ومكان العمل</label>
                <input 
                  type="text" 
                  value={formData.job}
                  onChange={(e) => setFormData({...formData, job: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">العنوان السكني</label>
                <textarea 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="col-span-2 pt-2"><h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">صلاحيات وأدوار ولي الأمر</h3></div>

              <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={formData.isPrimary} onChange={(e) => setFormData({...formData, isPrimary: e.target.checked})} className="w-5 h-5 text-brand-600 rounded" />
                  <span className="font-bold text-slate-700 text-sm">ولي الأمر الأساسي</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={formData.isFinancialResponsible} onChange={(e) => setFormData({...formData, isFinancialResponsible: e.target.checked})} className="w-5 h-5 text-brand-600 rounded" />
                  <span className="font-bold text-slate-700 text-sm">مسؤول الدفع المالي</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={formData.isPickupResponsible} onChange={(e) => setFormData({...formData, isPickupResponsible: e.target.checked})} className="w-5 h-5 text-brand-600 rounded" />
                  <span className="font-bold text-slate-700 text-sm">مسؤول الاستلام</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={formData.isAllowedToPickup} onChange={(e) => setFormData({...formData, isAllowedToPickup: e.target.checked})} className="w-5 h-5 text-brand-600 rounded" />
                  <span className="font-bold text-slate-700 text-sm">مسموح له بالاستلام</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={formData.isAllowedToSeeFinancials} onChange={(e) => setFormData({...formData, isAllowedToSeeFinancials: e.target.checked})} className="w-5 h-5 text-brand-600 rounded" />
                  <span className="font-bold text-slate-700 text-sm">رؤية الحسابات</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={formData.isAllowedToReceiveNotifications} onChange={(e) => setFormData({...formData, isAllowedToReceiveNotifications: e.target.checked})} className="w-5 h-5 text-brand-600 rounded" />
                  <span className="font-bold text-slate-700 text-sm">استقبال الإشعارات</span>
                </label>
              </div>

              <div className="col-span-2 pt-2"><h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">ملاحظات الإدارة</h3></div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات إضافية (خاصة)</label>
                 <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                    placeholder="أي ملاحظات عامة حول الأب/الأم..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all resize-none"
                 />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات الإدارة عن ولي الأمر</label>
                 <textarea 
                    value={formData.adminNotes}
                    onChange={(e) => setFormData({...formData, adminNotes: e.target.value})}
                    rows={3}
                    placeholder="تقييم الإدارة للتواصل، السداد، مستوى الاستجابة..."
                    className="w-full px-4 py-2.5 bg-rose-50/50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all resize-none font-medium text-slate-800"
                 />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 pb-4">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button 
                type="submit"
                className="px-6 py-2.5 bg-brand-600 font-bold text-white rounded-xl hover:bg-brand-700 transition-colors"
              >
                حفظ البيانات
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};
