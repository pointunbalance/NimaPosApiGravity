import React from 'react';
import { Briefcase, Settings as SettingsIcon, Globe, Percent, Wrench, Layers, EyeOff, Eye } from 'lucide-react';
import { AppSettings } from '../../types';
import { SectionTitle, ToggleSwitch, AVAILABLE_PAGES } from './settingsUtils';

interface PagesSettingsProps {
  formData: AppSettings;
  handleSettingChange: (key: keyof AppSettings, value: any) => void;
  setShowSetupWizard: (show: boolean) => void;
}

const PagesSettings: React.FC<PagesSettingsProps> = ({ formData, handleSettingChange, setShowSetupWizard }) => {

  const togglePageVisibility = (path: string) => {
      const currentHidden = formData.hiddenPages || [];
      const newHidden = currentHidden.includes(path) 
          ? currentHidden.filter(p => p !== path)
          : [...currentHidden, path];
      handleSettingChange('hiddenPages', newHidden);
  };

  const togglePageSectionVisibility = (section: string, isVisible: boolean) => {
      const sectionPages = AVAILABLE_PAGES.filter(p => p.section === section).map(p => p.path);
      let newHidden = [...(formData.hiddenPages || [])];
      
      if (isVisible) {
          // Remove section pages from hiddenPages (make them visible)
          newHidden = newHidden.filter(p => !sectionPages.includes(p));
      } else {
          // Add section pages to hiddenPages (make them hidden)
          sectionPages.forEach(p => {
              if (!newHidden.includes(p)) {
                  newHidden.push(p);
              }
          });
      }
      handleSettingChange('hiddenPages', newHidden);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
        {/* Setup Wizard Card */}
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200">
            <SectionTitle icon={Briefcase} title="إعدادات النظام والواجهة" desc="التحكم في الميزات وإعداد النظام" />
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-indigo-900">معالج إعداد النظام</h4>
                    <p className="text-sm text-indigo-700 mt-1">قم بتشغيل معالج الإعداد لضبط إعدادات المتجر، الصفحات، والطابعة بخطوات بسيطة.</p>
                </div>
                <button 
                    onClick={() => setShowSetupWizard(true)}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                >
                    <SettingsIcon className="w-4 h-4" />
                    تشغيل المعالج
                </button>
            </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200">
            <SectionTitle icon={Layers} title="إدارة الصفحات" desc="التحكم في إظهار وإخفاء صفحات النظام من القائمة الجانبية" />
            
            <div className="space-y-8 mt-6">
                {Array.from(new Set(AVAILABLE_PAGES.map(p => p.section))).map(section => {
                    const sectionPages = AVAILABLE_PAGES.filter(p => p.section === section);
                    const hiddenCount = sectionPages.filter(p => formData.hiddenPages?.includes(p.path)).length;
                    const isAllVisible = hiddenCount === 0;

                    return (
                        <div key={section} className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="text-lg font-bold text-slate-800">{section}</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-500 font-medium">
                                        {isAllVisible ? 'إخفاء الكل' : 'إظهار الكل'}
                                    </span>
                                    <ToggleSwitch 
                                        checked={isAllVisible} 
                                        onChange={() => togglePageSectionVisibility(section, !isAllVisible)} 
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sectionPages.map((page, index) => {
                                    const isHidden = formData.hiddenPages?.includes(page.path) || false;
                                    return (
                                        <div key={`${page.path}-${index}`} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isHidden ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-indigo-100 shadow-sm'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isHidden ? 'bg-slate-200 text-slate-500' : 'bg-indigo-50 text-indigo-600'}`}>
                                                    {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className={`font-bold text-sm ${isHidden ? 'text-slate-500' : 'text-slate-800'}`}>{page.label}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono mt-1">{page.path}</p>
                                                </div>
                                            </div>
                                            <ToggleSwitch checked={!isHidden} onChange={() => togglePageVisibility(page.path)} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};

export default PagesSettings;
