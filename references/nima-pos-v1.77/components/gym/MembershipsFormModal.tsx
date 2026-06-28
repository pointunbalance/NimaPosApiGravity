import React from 'react';
import { 
  X, 
  User, 
  Phone, 
  DollarSign, 
  CreditCard, 
  Calendar 
} from 'lucide-react';
import { GymPlanType, MembershipType } from './membershipsTypes';

interface MembershipsFormModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isEdit: boolean;
  formData: Partial<MembershipType>;
  setFormData: (data: any) => void;
  plansList: GymPlanType[];
  currency: string;
  onPresetChange: (name: string) => void;
  onStartDateChange: (start: string) => void;
  onSave: (e: React.FormEvent) => void;
}

export const MembershipsFormModal: React.FC<MembershipsFormModalProps> = ({
  isModalOpen,
  setIsModalOpen,
  isEdit,
  formData,
  setFormData,
  plansList,
  currency,
  onPresetChange,
  onStartDateChange,
  onSave
}) => {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-sans text-right" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-row-reverse">
          <button 
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="p-2 text-slate-400 hover:text-rose-50 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 flex-row-reverse">
            <span className="p-1 px-2.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-extrabold">
              {isEdit ? 'تعديل وثيقة' : 'تأسيس باقة جديد'}
            </span>
            <h2 className="text-lg font-black text-slate-800">
              {isEdit ? 'تعديل تفاصيل باقة الاشتراك الحالية' : 'تسجيل باقة رياضية جديدة لعضو'}
            </h2>
          </div>
        </div>

        <form onSubmit={onSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المشترك بالكامل *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={formData.memberId || ''}
                  onChange={(e) => setFormData({...formData, memberId: e.target.value})}
                  required
                  placeholder="الكابتن بوهدان بافليوك"
                  className="w-full pr-9 pl-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-slate-800 text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الجوال الذكي *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="مثال: 0122345678"
                  className="w-full pr-9 pl-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none font-mono text-left"
                />
              </div>
            </div>
          </div>

          {/* Selection Column: Plans presets */}
          <div className="bg-indigo-50/30 p-4.5 rounded-2xl border border-indigo-100/40">
            <span className="text-xs font-black text-indigo-700 block mb-2.5">اختيار باقة مجهزة مسبقاً (لتسهيل حساب التواريخ والقيم):</span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {plansList.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPresetChange(p.name)}
                  className={`text-right p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    formData.plan === p.name 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-bold' 
                      : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                  }`}
                >
                  <div className="truncate font-bold mb-1">{p.name}</div>
                  <div className={`font-mono font-bold ${formData.plan === p.name ? 'text-indigo-100' : 'text-indigo-600'}`}>
                    {p.price} {currency} / {p.durationDays} يوم
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFormData((prev: any) => ({ ...prev, plan: 'باقة مخصصة يدوياً' }))}
                className={`text-right p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  plansList.every(p => p.name !== formData.plan) 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-bold' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                }`}
              >
                <div className="truncate font-bold mb-1 font-black text-indigo-650">✍️ تخصيص حر</div>
                <div className="text-[10px] opacity-75">إدخال قيم وأيام مخصصة</div>
              </button>
            </div>
          </div>

          {/* Plan parameters layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الباقة المطبقة</label>
              <input 
                type="text" 
                value={formData.plan || ''}
                onChange={(e) => setFormData({...formData, plan: e.target.value})}
                required
                placeholder="اسم الباقة"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">القيمة المالية والرسوم المحصلة ({currency})</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="number" 
                  value={formData.price ?? ''}
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                  required
                  min={0}
                  className="w-full pr-9 pl-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none font-mono text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">وسيلة السداد</label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <select
                  value={formData.paymentMethod || 'نقدي'}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  className="w-full pr-9 pl-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none bg-white text-sm text-right"
                >
                  <option value="نقدي">💵 دفع نقدي بالدرج (كاش)</option>
                  <option value="شبكة">💳 شبكة مدى / فيزا</option>
                  <option value="تحويل">🏦 تحويل بنكي للمؤسسة</option>
                </select>
              </div>
            </div>

          </div>

          {/* Date constraints */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ بدء تفعيل الباقة</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="date" 
                  value={formData.startDate || ''}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  required
                  className="w-full pr-9 pl-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-xs font-mono text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ الانتهاء التلقائي</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="date" 
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  required
                  className="w-full pr-9 pl-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-xs font-mono text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الحالة الحالية</label>
              <select
                value={formData.status || 'فعال'}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:outline-none text-xs font-bold bg-white text-right"
              >
                <option value="فعال">🟢 فعال ونشط</option>
                <option value="منتهي">🔴 منتهي ومعطل</option>
                <option value="معلق">🟡 معلق مؤقتاً</option>
              </select>
            </div>

          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات واحتياجات المشترك</label>
            <textarea 
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="مشاكل بالركبة، أهداف اللياقة اللطوبة، أو تفاصيل المبيعات..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-sm text-right"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 flex-row-reverse">
            <button 
              type="submit"
              className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-extrabold text-sm shadow-md shadow-indigo-100 cursor-pointer"
            >
              {isEdit ? 'تعديل وحفظ' : 'تأسيس وحفظ'}
            </button>
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold text-sm cursor-pointer"
            >
              إلغاء الأمر
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};
