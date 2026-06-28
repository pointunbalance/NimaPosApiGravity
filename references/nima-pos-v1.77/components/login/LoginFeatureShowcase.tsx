import React from 'react';
import { Receipt, BarChart3, Package, Zap, ExternalLink, Phone, Facebook, Database } from 'lucide-react';

interface LoginFeatureShowcaseProps {
  modeInfo: {
    label: string;
    sub: string;
    color: string;
    icon: React.ComponentType<any>;
  };
}

export const LoginFeatureShowcase: React.FC<LoginFeatureShowcaseProps> = ({ modeInfo }) => {
  const ModeIcon = modeInfo.icon;

  return (
    <div className="hidden lg:flex flex-col justify-between w-[585px] xl:w-[615px] h-[calc(100vh-160px)] max-h-[820px] min-h-[600px] lg:min-h-[660px] p-8 rounded-[32px] bg-white border border-slate-100/80 shadow-[0_20px_50px_rgba(15,23,42,0.06)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none shrink-0 relative transition-all duration-300 text-slate-800" dir="rtl">
      {/* Decorative background grids */}
      <div className="absolute inset-0 opacity-[0.015] bg-[radial-gradient(#4f46e5_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none rounded-[32px]"></div>
      
      <div className="space-y-5 relative z-10">
        {/* Premium Brand Badge */}
        <div className="inline-flex items-center gap-2 border border-rose-100 px-4 py-1.5 rounded-full bg-rose-50 text-rose-500 shadow-sm">
          <ModeIcon className="w-3.5 h-3.5 shrink-0 animate-pulse text-rose-500" />
          <span className="text-[10px] font-black uppercase tracking-wider font-sans">ENTERPRISE EDITION - نسخة المؤسسات</span>
        </div>

        {/* App description text */}
        <div className="space-y-2">
          <h2 className="text-2xl lg:text-[28px] font-[1000] text-slate-900 leading-snug font-sans tracking-tight">بوابة الأنظمة ومزايا التطبيق المتقدمة</h2>
          <p className="text-slate-500 text-xs md:text-[13.5px] leading-relaxed font-bold">
            نظام متكامل لتجميع وحوسبة أنشطة المؤسسة اللامركزية. صُمم بمرونة فائقة كمنصة سطح مكتب وتطبيق مستقل يعمل بكفاءة 100% دون الحاجة إلى الاتصال بالخوادم السحابية.
          </p>
        </div>

        {/* App Features List */}
        <div className="flex flex-col gap-4">
          {/* Feature 1 */}
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_rgba(15,23,42,0.02)] hover:border-indigo-150 hover:bg-slate-50/50 transition-all duration-300">
            <div className="space-y-1 text-right flex-1">
              <h4 className="text-[15px] font-[1000] text-slate-900 tracking-wide font-sans">إدارة ذكية ونقاط بيع متكاملة</h4>
              <p className="text-[13px] text-slate-500 font-bold leading-relaxed">
                معالجة فورية للمبيعات، الفروع، والمخازن بمرونة فائقة.
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-rose-50/85 flex items-center justify-center shrink-0 border border-rose-100">
              <Receipt className="w-5.5 h-5.5 text-rose-500" />
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_rgba(15,23,42,0.02)] hover:border-indigo-150 hover:bg-slate-50/50 transition-all duration-300">
            <div className="space-y-1 text-right flex-1">
              <h4 className="text-[15px] font-[1000] text-slate-900 tracking-wide font-sans">أتمتة محاسبية متكاملة</h4>
              <p className="text-[13px] text-slate-500 font-bold leading-relaxed">
                تسجيل تلقائي للقيود وتحديث فوري للمركز المالي والتقارير بدقة متناهية.
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-pink-50/85 flex items-center justify-center shrink-0 border border-pink-100">
              <BarChart3 className="w-5.5 h-5.5 text-pink-500" />
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_rgba(15,23,42,0.02)] hover:border-indigo-150 hover:bg-slate-50/50 transition-all duration-300">
            <div className="space-y-1 text-right flex-1">
              <h4 className="text-[15px] font-[1000] text-slate-900 tracking-wide font-sans">تشغيل أوفلاين بالكامل 100%</h4>
              <p className="text-[13px] text-slate-500 font-bold leading-relaxed">
                تخزين محلي فائق السرعة والأمان عبر قاعدة بيانات محصنة تضمن عدم الضياع.
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-sky-50/85 flex items-center justify-center shrink-0 border border-sky-100">
              <Zap className="w-5.5 h-5.5 text-sky-500" />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Developer Portfolio (بياناتي) & Tech Contacts */}
      <div className="mt-8 pt-6 border-t border-slate-100 relative z-10 flex flex-col gap-3.5 pb-2">
        {/* Developer Profile - Completely visible, larger, beautiful & high contrast */}
        <div className="flex items-center gap-4 bg-slate-50/80 border border-slate-100 p-4 rounded-[18px] text-right font-sans">
          <div className="w-12 h-12 rounded-full bg-[#0bc9e4] flex items-center justify-center font-black text-white text-sm border-2 border-white shadow-sm relative shrink-0">
            MM
            <span className="absolute bottom-0.5 left-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#0bc9e4] font-extrabold tracking-wider leading-none mb-1.5 uppercase font-sans">المهندس المطور المعتمد</p>
            <h4 className="text-sm md:text-base font-black text-slate-800 truncate leading-none">م/ مينا ميخائيل - المطور المعتمد</h4>
            <p className="text-[11.5px] text-slate-500 font-bold leading-snug mt-1.5">NimaTech Enterprise Server</p>
          </div>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-3 gap-2.5">
          <a 
            href="mailto:starsky.stareagle@gmail.com" 
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-all duration-200 group text-center cursor-pointer shadow-sm"
            title="starsky.stareagle@gmail.com"
          >
            <div className="p-2.5 rounded-lg bg-pink-50 text-pink-500 border border-pink-100 shrink-0 transition-colors">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div className="leading-none text-center">
              <span className="text-[11px] font-extrabold text-slate-400 block mb-1">البريد</span>
              <span className="text-[12.5px] font-black text-slate-700 block font-sans select-all leading-none">starsky</span>
            </div>
          </a>

          <a 
            href="tel:01200883327" 
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-all duration-200 group text-center cursor-pointer shadow-sm"
            title="01200883327"
          >
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-500 border border-emerald-100 shrink-0 transition-colors">
              <Phone className="w-5 h-5" />
            </div>
            <div className="leading-none text-center">
              <span className="text-[11px] font-extrabold text-slate-400 block mb-1">الهاتف</span>
              <span className="text-[12.5px] font-black text-slate-700 block font-sans leading-none">01200883327</span>
            </div>
          </a>

          <a 
            href="https://www.facebook.com/profile.php?id=61585982617699" 
            target="_blank"
            rel="noopener noreferrer" 
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-all duration-200 group text-center cursor-pointer shadow-sm"
            title="صفحة المطور على فيسبوك"
          >
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 shrink-0 transition-colors">
              <Facebook className="w-5 h-5" />
            </div>
            <div className="leading-none text-center">
              <span className="text-[11px] font-extrabold text-slate-400 block mb-1">فيسبوك</span>
              <span className="text-[12.5px] font-black text-slate-700 block font-sans leading-none">مينا ميخائيل</span>
            </div>
          </a>
        </div>

        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1 mt-0.5 font-sans">
          <span className="flex items-center gap-1.5 text-slate-500 font-sans"><Database className="w-4 h-4 text-slate-400" />قاعدة البيانات محلياً</span>
          <span className="font-sans text-emerald-500">آمن ومكتمل %100</span>
        </div>
      </div>
    </div>
  );
};
