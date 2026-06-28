import React from 'react';
import { Clock, ShoppingBag, ChevronLeft, Award } from 'lucide-react';

interface DashboardActionPanelsProps {
  latestAccessStream: any[];
  warningStoreItems: any[];
  storeItemsCount: number;
  classes: any[];
  trainersCount: number;
  currency: string;
}

export const DashboardActionPanels: React.FC<DashboardActionPanelsProps> = ({
  latestAccessStream,
  warningStoreItems,
  storeItemsCount,
  classes,
  trainersCount,
  currency
}) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-right font-sans" dir="rtl">
      
      {/* Column 1: Live Access Stream */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex justify-between items-center flex-row-reverse text-right">
            <span className="text-[10px] bg-slate-100/80 text-slate-600 px-2 py-0.5 rounded-lg font-bold font-mono">حالة حية</span>
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm flex-row-reverse">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>آخر عمليات الدخول والخروج بالصالة</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">تتبع فوري للأعضاء عبر البوابات الذكية</p>
            </div>
          </div>

          <div className="space-y-3">
            {latestAccessStream.map((log: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-slate-50 hover:bg-slate-50/50 transition-colors flex-row-reverse">
                <div className="text-[10px] text-slate-400 font-mono">
                  {log.timestamp}
                </div>
                <div className="flex items-center gap-3 flex-row-reverse text-right">
                  <div className={`p-1.5 rounded-lg font-extrabold text-[9px] ${
                    log.type?.includes('Out') || log.type === 'خروج' 
                      ? 'bg-amber-50 text-amber-700' 
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {log.type === 'دخول' || log.type?.includes('In') ? 'دخول' : 'خروج'}
                  </div>
                  <div className="text-right">
                    <h5 className="font-bold text-xs text-slate-700">{log.memberId}</h5>
                    <p className="text-[9px] text-slate-450 text-slate-400 mt-0.5">بواسطة البواب الرقمي الذاتي</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-50 text-center text-[10px] text-slate-400 font-medium">
          مربوط ببوابة قارئ الباركود ومخرجات بوق البوق والبرمجة بالصورة
        </div>
      </div>

      {/* Column 2: Cafeteria & Store Warning */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex justify-between items-center flex-row-reverse text-right">
            <span className="text-[10px] bg-red-50 text-red-655 text-red-600 px-2.5 py-0.5 rounded-lg font-bold">رصيد محدود</span>
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm flex-row-reverse">
                <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" />
                <span>إيرادات ومستلزمات المتجر الرياضي</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">المرطبات والمكملات الغذائية بالمستودع</p>
            </div>
          </div>

          <div className="space-y-3">
            {warningStoreItems.map((item: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 flex items-center justify-between flex-row-reverse">
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    item.stock <= 3 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-600'
                  }`}>
                    متبقي: {item.stock} وحدات
                  </span>
                </div>
                <div className="text-right">
                  <h5 className="font-bold text-xs text-slate-705">{item.name}</h5>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">القيمة: {item.price} {currency}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-50">
          <div className="flex items-center justify-between text-[11px] text-slate-500 flex-row-reverse text-right">
            <span>إجمالي أصناف المتجر الدايركت: {storeItemsCount} صنف</span>
            <span className="text-indigo-650 font-bold flex items-center gap-0.5 hover:underline cursor-pointer">
              <span>كل المنتجات بالمخازن</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Column 3: Scheduled Classes and Trainers */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-1 flex-row-reverse text-right">
            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg font-black">حصص اليوم</span>
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm flex-row-reverse">
                <Award className="w-4 h-4 text-indigo-700 shrink-0" />
                <span>صفوف التدريب وجداول المشتركين</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">الحصص والمدربين المعتمدين النشطين</p>
            </div>
          </div>

          <div className="space-y-3">
            {classes.length > 0 ? (
              classes.slice(0, 3).map((cls: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-slate-50 hover:border-slate-100 transition-colors flex-row-reverse">
                  <span className="text-[10px] font-mono bg-indigo-50/50 text-indigo-700 px-2.5 py-0.5 rounded-md font-bold">
                    سعة {cls.capacity} فرد
                  </span>
                  <div className="text-right">
                    <h5 className="font-bold text-xs text-slate-700">{cls.name}</h5>
                    <p className="text-[10px] text-slate-550 text-slate-400 mt-0.5">الجدول: {cls.schedule || 'غير محدد'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 hover:border-indigo-110 transition-colors flex-row-reverse">
                  <span className="text-[10px] font-mono bg-indigo-50/50 text-indigo-700 px-2.5 py-0.5 rounded-md font-bold">عالية الكثافة</span>
                  <div className="text-right">
                    <h5 className="font-bold text-xs text-slate-700">كارديو وتخسيس متقدم</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">السبت والاثنين والأربعاء (05:00 م)</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 hover:border-indigo-110 transition-colors flex-row-reverse">
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md font-bold">بناء عضلي</span>
                  <div className="text-right">
                    <h5 className="font-bold text-xs text-slate-700">تمارين رفع الأثقال والمقاومة (Crossfit)</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">يومياً عدا الجمعة (08:00 مساءً)</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 hover:border-indigo-110 transition-colors flex-row-reverse">
                  <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-md font-bold">سيدات ومعالجة</span>
                  <div className="text-right">
                    <h5 className="font-bold text-xs text-slate-700">اليوغا والاسترخاء الفكري (سبا مدمج)</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">الثلاثاء والخميس (10:00 صباحاً)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-500 flex-row-reverse text-right">
          <span>إجمالي كادر التدريب المعتمد: {trainersCount} مدرب</span>
          <span className="text-emerald-600 font-bold">حالة الكادر نشط</span>
        </div>
      </div>

    </div>
  );
};
export default DashboardActionPanels;
