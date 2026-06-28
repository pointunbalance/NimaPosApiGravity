import React from 'react';
import { X, Calendar, ArrowRightLeft, Sliders, Play } from 'lucide-react';

interface AccessLogsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit: boolean;
  formData: {
    memberId: string;
    timestamp: string;
    type: 'دخول' | 'خروج';
    method: string;
  };
  setFormData: (data: any) => void;
  onSave: (e: React.FormEvent) => void;
  simulationMemberList: any[];
}

export const AccessLogsFormModal: React.FC<AccessLogsFormModalProps> = ({
  isOpen,
  onClose,
  isEdit,
  formData,
  setFormData,
  onSave,
  simulationMemberList
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 text-right font-sans" dir="rtl">
      
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center flex-row-reverse text-right">
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div>
            <h3 className="font-black text-sm tracking-tight">
              {isEdit ? 'تعديل سند حركة عبور استثنائية' : 'قيد وتسجيل حضور/مغادرة استثنائي يدوي'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">المصادقة وتخزين السجلات بقاعدة البيانات</p>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSave} className="p-6 space-y-4 text-right">
          
          {/* Member ID Field */}
          <div className="space-y-1.5 text-right">
            <label className="block text-xs font-bold text-slate-700">المشترك / اللاعب المعني *</label>
            <select
              value={formData.memberId}
              onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white text-right"
            >
              <option value="">-- اختر عضوية اللاعب --</option>
              {simulationMemberList.map(m => (
                <option key={m.id} value={m.memberId}>{m.memberId}</option>
              ))}
            </select>
          </div>

          {/* Action Type switcher */}
          <div className="space-y-1.5 text-right">
            <label className="block text-xs font-bold text-slate-700">نوع وهدف الحركة *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'دخول' })}
                className={`py-2 px-3 text-xs font-black rounded-lg border flex items-center justify-center gap-1.5 transition-all text-right cursor-pointer ${
                  formData.type === 'دخول' 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                <span>دخول محقق</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'خروج' })}
                className={`py-2 px-3 text-xs font-black rounded-lg border flex items-center justify-center gap-1.5 transition-all text-right cursor-pointer ${
                  formData.type === 'خروج' 
                    ? 'bg-amber-50 border-amber-500 text-amber-800' 
                    : 'bg-white border-slate-200 text-slate-505'
                }`}
              >
                <span>مغادرة وخروج</span>
              </button>
            </div>
          </div>

          {/* Timestamp field */}
          <div className="space-y-1.5 text-right">
            <label className="block text-xs font-bold text-slate-700">التاريخ ووقت تسجيل الحركة *</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={formData.timestamp}
                onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
                required
                placeholder="YYYY-MM-DD HH:MM:SS"
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-205 rounded-xl text-xs font-mono font-bold text-slate-800 text-right"
              />
            </div>
            <p className="text-[9px] text-slate-400 font-bold leading-normal">يرجى كتابة الوقت بالنمط المذكور لتسهيل تتبع الفهرس.</p>
          </div>

          {/* Verification source field */}
          <div className="space-y-1.5 text-right">
            <label className="block text-xs font-bold text-slate-700">ملاحظات وسبب استثنائية السند *</label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white text-right"
            >
              <option value="تجاوز يدوي من المكلف">تجاوز يدوي من المكلف (إذن خطي)</option>
              <option value="بطاقة بديلة تالفة">بطاقة بديلة تالفة</option>
              <option value="بطاقة مفقودة بموجب طلب">بطاقة مفقودة بموجب طلب</option>
              <option value="تأكيد حضور عاطفي يدوي">تعديل فني من الإشراف</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="border-t pt-4 flex gap-3 text-xs flex-row-reverse">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg cursor-pointer transition-colors"
            >
              تسجيل وحفظ ⚡
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
            >
              إلغاء التعديل
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
