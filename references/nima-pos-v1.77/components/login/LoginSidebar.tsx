import React from 'react';
import { Store, HelpCircle, Activity, Database, Cpu, Wifi, Code, ExternalLink, LayoutDashboard, Receipt, Package, BarChart3, Settings as SettingsIcon, Users as UsersIcon } from 'lucide-react';

interface LoginSidebarProps {
  settings: any;
  playSound: (type: 'click' | 'success' | 'error' | 'delete' | 'typing') => void;
  setLockedFeedback: (msg: string | null) => void;
}

export const LoginSidebar: React.FC<LoginSidebarProps> = ({ settings, playSound, setLockedFeedback }) => {
  const getSidebarIconStyle = (id: string, isActive: boolean) => {
    switch (id) {
      case 'dashboard':
        return { bg: isActive ? 'bg-indigo-500/20' : 'bg-indigo-500/10 text-indigo-300', icon: 'text-indigo-205' };
      case 'sales':
        return { bg: isActive ? 'bg-emerald-500/20' : 'bg-emerald-500/10 text-emerald-300', icon: 'text-emerald-205' };
      case 'inventory':
        return { bg: isActive ? 'bg-amber-500/20' : 'bg-amber-500/10 text-amber-300', icon: 'text-amber-205' };
      case 'reports':
        return { bg: isActive ? 'bg-purple-500/20' : 'bg-purple-500/10 text-purple-300', icon: 'text-purple-205' };
      case 'settings':
        return { bg: isActive ? 'bg-cyan-500/20' : 'bg-cyan-500/10 text-cyan-300', icon: 'text-cyan-205' };
      case 'clients':
        return { bg: isActive ? 'bg-rose-500/20' : 'bg-rose-500/10 text-rose-300', icon: 'text-rose-250' };
      default:
        return { bg: isActive ? 'bg-slate-550' : 'bg-slate-500/10 text-slate-305', icon: 'text-slate-205' };
    }
  };

  const sidebarNavItems = [
    { id: 'dashboard', label: 'لوحة القيادة', sub: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', label: 'المبيعات والأقساط', sub: 'Sales & Invoices', icon: Receipt },
    { id: 'inventory', label: 'إدارة المخازن والمنتجات', sub: 'Inventory Management', icon: Package },
    { id: 'reports', label: 'التقارير المالية والتحليلات', sub: 'Financial Reports', icon: BarChart3 },
    { id: 'settings', label: 'إعدادات النظام والأجهزة', sub: 'System Settings', icon: SettingsIcon },
    { id: 'clients', label: 'إدارة العملاء والولاء', sub: 'Client Management', icon: UsersIcon },
  ];

  return (
    <aside className="hidden w-64 md:w-72 bg-white border-l border-slate-150/80 text-slate-700 flex-col justify-between p-6 shadow-2xl z-20 relative shrink-0 select-none">
      <div>
        <div className="flex items-center gap-3.5 mb-8">
          {settings?.logo ? (
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center overflow-hidden p-1.5 border border-slate-200 shadow-inner">
              <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md border border-white/20">
              <Store className="w-5 h-5 text-white animate-pulse" />
            </div>
          )}
          <div>
            <h1 className="font-black text-sm tracking-wide text-slate-800 leading-none font-sans">{settings?.storeName || 'NimaTech OS'}</h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[9px] text-emerald-600 uppercase tracking-widest font-extrabold leading-none">Enterprise Server</p>
            </div>
          </div>
        </div>

        <nav className="space-y-3">
          {sidebarNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = item.id === 'dashboard';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  playSound('click');
                  setLockedFeedback(`الوصول مقيد. يرجى إدخال رمز المرور السري المكون من 8 أرقام أولاً لفك قفل قسم "${item.label}".`);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-200 cursor-pointer text-right group ${
                  isActive 
                  ? 'bg-gradient-to-l from-indigo-650 to-blue-600 text-white font-extrabold shadow-md border border-indigo-500/20' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200 ${
                  isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200/50'
                }`}>
                  <IconComponent className="w-5 h-5 shrink-0" />
                </div>
                <div className="leading-none">
                  <p className="text-xs font-black">{item.label}</p>
                  <p className={`text-[9px] mt-1.5 font-sans ${isActive ? 'text-indigo-100' : 'text-slate-400 font-medium'}`}>{item.sub}</p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="mt-8 pt-6 border-t border-slate-100 space-y-3 font-mono">
          <div className="flex items-center justify-between text-[11px] font-medium leading-none">
            <span className="flex items-center gap-2 text-slate-500"><Database className="w-3.5 h-3.5 text-indigo-500 shrink-0" />قاعدة البيانات</span>
            <span className="text-indigo-600 font-black bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px]">Local IndexedDB</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-medium leading-none">
            <span className="flex items-center gap-2 text-slate-500"><Cpu className="w-3.5 h-3.5 text-indigo-500 shrink-0" />مؤشر المعالجة</span>
            <span className="text-emerald-600 font-black bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px]">0.8% - Container</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-medium leading-none">
            <span className="flex items-center gap-2 text-slate-500"><Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />زمن الاستجابة</span>
            <span className="text-emerald-600 font-black bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px]">0.03 ms</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-medium leading-none">
            <span className="flex items-center gap-2 text-slate-500"><Wifi className="w-3.5 h-3.5 text-indigo-500 shrink-0" />اتصال الشبكة</span>
            <span className="text-blue-600 font-black bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-[10px]">Secured Tunnel</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-100">
        <button 
          onClick={() => {
            playSound('click');
            setLockedFeedback('جاري تهيئة الاتصال المباشر بمركز المساعدة والدعم الفني...');
          }}
          className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl px-4 py-3 transition-all cursor-pointer group shadow-sm"
        >
          <span className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-500 group-hover:scale-115 transition-transform" />
            مركز الدعم والمساعدة
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </button>

        <div className="flex flex-col gap-1 items-center justify-center text-center">
          <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
            <Code className="w-3.5 h-3.5 text-indigo-500" /> م/ ياروسلاف بوهدان - المهندس المطور
          </p>
          <p className="text-[8px] text-slate-400 font-medium tracking-wide">Standard Certified Cloud Application</p>
        </div>
      </div>
    </aside>
  );
};
