
import React from 'react';
import { 
  Code, Phone, Facebook, CheckCircle2, ShieldCheck, 
  Database, WifiOff, Zap, LayoutDashboard, Globe, ExternalLink, 
  Smartphone, Printer, Box, Server, Cpu, Layers, Activity, RefreshCw
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const About: React.FC = () => {
  const { success } = useToast();
  const features = [
    {
      icon: WifiOff,
      title: "نظام Offline-First",
      desc: "يعمل بكفاءة تامة بدون اتصال بالإنترنت، مع مزامنة محلية فورية للبيانات.",
      color: "text-rose-600 bg-rose-50"
    },
    {
      icon: Zap,
      title: "أداء فائق السرعة",
      desc: "واجهة خفيفة وسريعة الاستجابة مصممة للتعامل مع ضغط العمل العالي دون تأخير.",
      color: "text-amber-600 bg-amber-50"
    },
    {
      icon: Database,
      title: "قاعدة بيانات محلية",
      desc: "تخزين البيانات بأمان على جهازك باستخدام تقنية IndexedDB المتطورة والموثوقة.",
      color: "text-blue-600 bg-blue-50"
    },
    {
      icon: ShieldCheck,
      title: "حماية وصلاحيات",
      desc: "نظام أدوار متعدد (مدير، كاشير، مخزن) مع سجل نشاط مفصل لجميع العمليات.",
      color: "text-emerald-600 bg-emerald-50"
    },
    {
      icon: Printer,
      title: "دعم الطابعات",
      desc: "توافق كامل مع طابعات الإيصالات الحرارية والباركود (58mm/80mm) بمرونة عالية.",
      color: "text-indigo-600 bg-indigo-50"
    },
    {
      icon: LayoutDashboard,
      title: "تقارير ذكية",
      desc: "لوحات تحكم تفاعلية لتحليل المبيعات، الأرباح، والمخزون لاتخاذ قرارات دقيقة.",
      color: "text-violet-600 bg-violet-50"
    }
  ];

  const techStack = [
    { name: 'React 18', icon: Globe },
    { name: 'TypeScript', icon: Code },
    { name: 'Dexie.js', icon: Database },
    { name: 'Tailwind CSS', icon: Layers },
    { name: 'Vite', icon: Zap },
    { name: 'PWA Ready', icon: Smartphone },
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-50/50 font-['Tajawal']">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white pt-12 pb-24 px-8 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="max-w-5xl mx-auto relative z-10 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold mb-6 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Nima POS Enterprise Edition
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
                  نظام إدارة <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-300">مبيعات متكامل</span>
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  حل تقني متطور يجمع بين قوة أداء سطح المكتب ومرونة تقنيات الويب الحديثة. صُمم خصيصاً للشركات التي تبحث عن الاستقرار، السرعة، والتحكم الكامل في البيانات.
              </p>
          </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-16 pb-12 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Developer & Contact */}
              <div className="lg:col-span-1 space-y-6">
                  {/* Dev Profile Card */}
                  <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                      <div className="h-28 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
                          <div className="absolute -bottom-10 right-1/2 translate-x-1/2 p-1.5 bg-white rounded-full">
                              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-2xl font-bold text-slate-600 border-4 border-slate-50">
                                  Y
                              </div>
                          </div>
                      </div>
                      <div className="pt-12 pb-8 px-6 text-center">
                          <h2 className="text-xl font-bold text-slate-800">Yaroslav Bohdan</h2>
                          <p className="text-sm font-medium text-indigo-600 mt-1">Full Stack Developer</p>
                          <p className="text-xs text-slate-400 mt-2">Specialized in High-Performance Web Apps</p>
                          
                          <div className="mt-6 space-y-3">
                              <a 
                                  href="tel:012080633227" 
                                  className="flex items-center justify-center gap-3 w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 hover:-translate-y-0.5"
                              >
                                  <Phone className="w-4 h-4" />
                                  <span>012080633227</span>
                              </a>
                              <a 
                                  href="https://www.facebook.com/profile.php?id=61585982617699" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-3 w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5"
                              >
                                  <Facebook className="w-4 h-4" />
                                  <span>تواصل فيسبوك</span>
                              </a>
                          </div>
                      </div>
                  </div>

                  {/* System Status Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                              <Activity className="w-5 h-5 text-emerald-500" />
                              حالة النظام
                          </div>
                      </h3>
                      <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500">الإصدار الحالي</span>
                              <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">v2.7.0</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500">آخر تحديث</span>
                              <span className="font-bold text-slate-700">{new Date().toLocaleDateString('en-US', {month:'short', year:'numeric'})}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500">الترخيص</span>
                              <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">Enterprise</span>
                          </div>
                      </div>
                      
                      <div className="mt-5 pt-5 border-t border-slate-100">
                          <button 
                              onClick={() => {
                                  success('لا توجد تحديثات جديدة متوفرة. أنت تستخدم أحدث إصدار نظام (v2.7.0).');
                              }}
                              className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                          >
                              <RefreshCw className="w-4 h-4" />
                              التحقق من التحديثات
                          </button>
                      </div>
                  </div>
              </div>

              {/* Right Column: Features & Details */}
              <div className="lg:col-span-2 space-y-8">
                  
                  {/* Features Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {features.map((item, idx) => (
                          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color} group-hover:scale-110 transition-transform`}>
                                  <item.icon className="w-6 h-6" />
                              </div>
                              <h3 className="font-bold text-lg text-slate-800 mb-2">{item.title}</h3>
                              <p className="text-sm text-slate-500 leading-relaxed">
                                  {item.desc}
                              </p>
                          </div>
                      ))}
                  </div>

                  {/* Tech Stack */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                          <div>
                              <h3 className="text-xl font-bold text-slate-800 mb-2">مبني بأحدث التقنيات</h3>
                              <p className="text-slate-500 text-sm">يستخدم النظام مجموعة من أقوى مكتبات الويب لضمان السرعة والأمان.</p>
                          </div>
                          <div className="flex flex-wrap justify-center gap-3">
                              {techStack.map((tech, idx) => (
                                  <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-default">
                                      <tech.icon className="w-4 h-4 text-slate-400" />
                                      {tech.name}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

              </div>
          </div>
      </div>
    </div>
  );
};

export default About;
