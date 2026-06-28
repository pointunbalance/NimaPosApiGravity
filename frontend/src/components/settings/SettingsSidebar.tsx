import React from 'react';
import { Store, Layers, Printer, Database, Wrench, ShoppingCart, Users, ShieldCheck, Barcode, Key } from 'lucide-react';

interface SettingsSidebarProps {
  activeTab: 'general' | 'pages' | 'branches' | 'printing' | 'print_templates' | 'sequence' | 'barcode' | 'db' | 'system' | 'pos' | 'customers_loyalty' | 'zatca' | 'license';
  setActiveTab: (tab: 'general' | 'pages' | 'branches' | 'printing' | 'print_templates' | 'sequence' | 'barcode' | 'db' | 'system' | 'pos' | 'customers_loyalty' | 'zatca' | 'license') => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'general', label: 'إعدادات عامة', icon: Store, desc: 'الهوية، النشاط، العملة' },
    { id: 'license', label: 'الترخيص والاشتراكات', icon: Key, desc: 'تفاصيل الباقة، التفعيل' },
    { id: 'branches', label: 'إدارة وتعدد الفروع', icon: Database, desc: 'تكوين الفروع والمخازن' },
    { id: 'pages', label: 'إدارة الصفحات', icon: Layers, desc: 'إظهار وإخفاء الصفحات' },
    { id: 'pos', label: 'إعدادات نقطة البيع', icon: ShoppingCart, desc: 'التحكم بوظائف شاشة الكاشير' },
    { id: 'printing', label: 'الفواتير والطباعة', icon: Printer, desc: 'تصميم الفاتورة، الطابعات' },
    { id: 'print_templates', label: 'القوالب الجاهزة', icon: Printer, desc: 'استمارات، عقود، شهادات' },
    { id: 'sequence', label: 'أرقام وحروف الفواتير', icon: Layers, desc: 'تسلسل أرقام المستندات' },
    { id: 'barcode', label: 'إعدادات الباركود', icon: Barcode, desc: 'تخصيص تسلسل وشكل الباركود' },
    { id: 'customers_loyalty', label: 'العملاء والولاء', icon: Users, desc: 'بيانات العملاء، نقاط الولاء' },
    { id: 'zatca', label: 'الفوترة الإلكترونية (ZATCA)', icon: ShieldCheck, desc: 'الربط مع هيئة الزكاة بالسعودية' },
    { id: 'db', label: 'إدارة البيانات', icon: Database, desc: 'SQLite, MySQL, النسخ الاحتياطي' },
    { id: 'system', label: 'النظام والصيانة', icon: Wrench, desc: 'تشخيص، إعادة ضبط' },
  ];

  return (
    <div className="w-72 bg-white border-l border-slate-200 flex flex-col py-6 shrink-0 z-10">
      <div className="space-y-1 px-3">
        {tabs.map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group relative overflow-hidden ${
                activeTab === item.id 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {activeTab === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full"></div>
            )}
            <item.icon className={`w-5 h-5 shrink-0 transition-colors ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
            <div className="text-right">
                <span className="font-bold block text-sm">{item.label}</span>
                <span className="text-[10px] opacity-70 font-medium">{item.desc}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SettingsSidebar;
