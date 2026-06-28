import React from 'react';
import { 
  Plus, 
  Layers, 
  Edit2, 
  Trash2, 
  Award 
} from 'lucide-react';
import { GymPlanType } from './membershipsTypes';

interface MembershipsTabPlansProps {
  plansList: GymPlanType[];
  currency: string;
  onOpenPlanModal: (editPresetMode: boolean, item?: GymPlanType) => void;
  onAskDeletePlan: (id: string) => void;
}

export const MembershipsTabPlans: React.FC<MembershipsTabPlansProps> = ({
  plansList,
  currency,
  onOpenPlanModal,
  onAskDeletePlan
}) => {
  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      <div id="plans-config" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-row-reverse">
          <button
            onClick={() => onOpenPlanModal(false)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow cursor-pointer active:scale-95 transition-all text-right"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حجم/باقة مخصصة</span>
          </button>

          <div>
            <h3 className="text-lg font-black text-slate-800">تكوين عروض الصالة وباقات التدريب</h3>
            <p className="text-xs text-slate-400 mt-1">
              من هنا يمكنك إضافة باقاتك المخصصة وتعيين أيام الصلاحية والرسوم لتظهر على الفور كخيارات سريعة ومقاسات مجهزة داخل شاشة التسجيل.
            </p>
          </div>
        </div>

        {/* Configured Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
          {plansList.map((plan) => (
            <div 
              key={plan.id}
              className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/60 hover:border-indigo-200 hover:bg-indigo-50/10 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
            >
              <span className="absolute left-3 top-3 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-md">
                {plan.category || 'عام'}
              </span>
              
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 flex-row-reverse">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>{plan.name}</span>
                </h4>
                
                <div className="flex items-center gap-2 mt-2 font-mono text-xs text-slate-500 flex-row-reverse">
                  <span>فترة الصلاحية والمدة:</span>
                  <strong className="text-slate-800 font-bold">{plan.durationDays} يوم</strong>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs text-slate-500 flex-row-reverse">
                  <span>الرسوم الافتراضية المقررة:</span>
                  <strong className="text-indigo-600 font-black">{plan.price} {currency}</strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200/50 pt-3">
                <button
                  onClick={() => onOpenPlanModal(true, plan)}
                  className="p-1.5 px-3 hover:bg-white border hover:border-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>تعديل السعر/الأيام</span>
                </button>
                
                <button
                  onClick={() => onAskDeletePlan(plan.id)}
                  className="p-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer"
                  title="حذف الباقة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Guidelines info card */}
      <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100 flex items-start gap-3 flex-row-reverse">
        <Award className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 space-y-1">
          <p className="font-black">💡 تلميحة مفيدة للتشغيل:</p>
          <p className="leading-relaxed opacity-90">
            عند تحديد أي حجم أو باقة مخصصة في هذه اللوحة، ستظهر كزر ذكي سريع الاستخدام داخل قائمة تسجيل الأعضاء الجدد، مما يغنيك عن التعديل المتكرر لتواريخ الانتهاء يدوياً ويوحد حسابات التدفق النقدي وقيمة الصفقات المالية.
          </p>
        </div>
      </div>

    </div>
  );
};
