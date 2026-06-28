import React from 'react';
import { ShieldCheck, Server, Key, KeyRound, AlertTriangle } from 'lucide-react';
import { AppSettings } from '../../types';
import { SectionTitle, ToggleSwitch } from './settingsUtils';

interface ZatcaSettingsProps {
  formData: AppSettings;
  handleSettingChange: (key: keyof AppSettings, value: any) => void;
}

const ZatcaSettings: React.FC<ZatcaSettingsProps> = ({ formData, handleSettingChange }) => {
    
  const updateZatca = (key: keyof NonNullable<AppSettings['zatca']>, value: any) => {
      const current = formData.zatca || {
          enabled: false,
          environment: 'sandbox'
      };
      handleSettingChange('zatca', { ...current, [key]: value });
  };

  const zatca = formData.zatca || { enabled: false, environment: 'sandbox' };

  return (
    <div className="space-y-6 max-w-4xl pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionTitle 
        title="أعدادات الفوترة الإلكترونية المرحلة الثانية (ZATCA)" 
        icon={ShieldCheck} 
        desc="الربط الآلي مع هيئة الزكاة والضريبة والجمارك (المملكة العربية السعودية)" 
      />

      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
          <div className="flex justify-between items-center p-5 bg-emerald-50 rounded-2xl border border-emerald-100 mb-8">
             <div>
                 <div className="flex items-center gap-2 mb-1">
                     <ShieldCheck className="w-5 h-5 text-emerald-600" />
                     <p className="font-bold text-emerald-900 text-lg">تفعيل الربط المباشر مع ZATCA</p>
                 </div>
                 <p className="text-sm text-emerald-700 font-medium">سيتم توقيع الفواتير إلكترونياً وتوليد مفاتيح التشفير وإرسالها للهيئة فور اعتماد الفاتورة.</p>
             </div>
             <ToggleSwitch checked={zatca.enabled || false} onChange={() => updateZatca('enabled', !zatca.enabled)} />
          </div>

          <div className={`space-y-6 transition-all duration-300 ${!zatca.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">بيئة العمل (Environment)</label>
                    <div className="relative">
                        <select 
                            value={zatca.environment || 'sandbox'}
                            onChange={e => updateZatca('environment', e.target.value)}
                            className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 appearance-none"
                        >
                            <option value="sandbox">منصة التطوير الأساسية (Sandbox) - للمطورين</option>
                            <option value="simulation">منصة المحاكاة المستقلة (Simulation) - فحص فواتير التاجر</option>
                            <option value="production">منصة الإنتاج والمشاركة الفعلية (Production) - رسمية</option>
                        </select>
                        <Server className="w-5 h-5 absolute top-1/2 -translate-y-1/2 left-3 text-slate-400" />
                    </div>
                    {zatca.environment === 'production' && (
                        <div className="flex items-start gap-2 mt-3 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-bold">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            بيئة الإنتاج تعني إرسال الفواتير الفعلي. يرجى التأكد من اجتيازك للاختبارات في منصة المحاكاة.
                        </div>
                    )}
                </div>

                <div className="md:col-span-2">
                     <label className="block text-sm font-bold text-slate-700 mb-2">معرف التشفير للمكلف (CSID)</label>
                     <div className="relative">
                         <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                         <input 
                            type="text" 
                            value={zatca.csid || ''}
                            onChange={e => updateZatca('csid', e.target.value)}
                            className="w-full pr-10 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-mono text-sm"
                            placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI..."
                         />
                     </div>
                </div>

                <div className="md:col-span-2">
                     <label className="block text-sm font-bold text-slate-700 mb-2">المفتاح السري (API Secret)</label>
                     <div className="relative">
                         <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                         <input 
                            type="password" 
                            value={zatca.apiSecret || ''}
                            onChange={e => updateZatca('apiSecret', e.target.value)}
                            className="w-full pr-10 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-mono text-sm"
                            placeholder="***********************"
                         />
                     </div>
                </div>

                <div className="md:col-span-2">
                     <label className="block text-sm font-bold text-slate-700 mb-2">المفتاح الخاص (Private Key) - بصيغة PEM</label>
                     <textarea 
                        rows={4}
                        value={zatca.privateKey || ''}
                        onChange={e => updateZatca('privateKey', e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-mono text-xs text-slate-600 resize-none direction-ltr text-left"
                        placeholder="-----BEGIN EC PRIVATE KEY-----
...
-----END EC PRIVATE KEY-----"
                     />
                </div>
              </div>

              <div className="flex border-t border-slate-100 pt-6 mt-6 justify-end">
                   <button 
                       type="button"
                       disabled={!zatca.csid}
                       className="px-6 py-2.5 bg-indigo-50 text-indigo-700 disabled:opacity-50 font-bold rounded-xl hover:bg-indigo-100 transition-colors"
                   >
                       فحص الاتصال بمنصة ZATCA
                   </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ZatcaSettings;
