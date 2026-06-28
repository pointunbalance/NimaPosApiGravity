import React from 'react';
import { Users, Heart, Award, ToggleLeft } from 'lucide-react';
import { AppSettings, LoyaltySettings } from '../../types';
import { SectionTitle, ToggleSwitch } from './settingsUtils';

interface CustomerLoyaltySettingsProps {
  formData: AppSettings;
  handleSettingChange: (key: keyof AppSettings, value: any) => void;
}

const CustomerLoyaltySettings: React.FC<CustomerLoyaltySettingsProps> = ({ formData, handleSettingChange }) => {
    
  const updateCustomerSetting = (key: keyof NonNullable<AppSettings['customerSettings']>, value: any) => {
      const current = formData.customerSettings || {};
      handleSettingChange('customerSettings', { ...current, [key]: value });
  };

  const updateLoyaltySetting = (key: keyof LoyaltySettings, value: any) => {
      const current = formData.loyaltySettings || {
          enabled: false,
          pointsPerCurrency: 10,
          currencyPerPoint: 0.01,
          minPointsToRedeem: 100,
          welcomeBonus: 0,
          enableTiers: false,
          tiers: []
      };
      handleSettingChange('loyaltySettings', { ...current, [key]: value });
  };

  const customerSettings = formData.customerSettings || {};
  const loyaltySettings = formData.loyaltySettings || {} as LoyaltySettings;

  return (
    <div className="space-y-6 max-w-4xl pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionTitle 
        title="إعدادات العملاء وبرامج الولاء" 
        icon={Users} 
        desc="تخصيص البيانات المطلوبة من العملاء ونظام جمع النقاط والمكافآت." 
      />

      {/* Customer Data Settings */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Users className="w-6 h-6 text-indigo-600" />
              خصائص شاشة العميل
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                  <div>
                      <p className="font-bold text-slate-800 text-sm">عرض رصيد الولاء للعميل</p>
                      <p className="text-xs text-slate-500 mt-1">إظهار نقاط العميل في واجهة الكاشير</p>
                  </div>
                  <ToggleSwitch checked={customerSettings.showLoyaltyPoints !== false} onChange={() => updateCustomerSetting('showLoyaltyPoints', !(customerSettings.showLoyaltyPoints !== false))} />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                  <div>
                      <p className="font-bold text-slate-800 text-sm">عرض رصيد الحساب المفتوح</p>
                      <p className="text-xs text-slate-500 mt-1">تفعيل كشوفات الذمم المالية والمبيعات الآجلة للعملاء</p>
                  </div>
                  <ToggleSwitch checked={customerSettings.showCreditBalance !== false} onChange={() => updateCustomerSetting('showCreditBalance', !(customerSettings.showCreditBalance !== false))} />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                  <div>
                      <p className="font-bold text-slate-800 text-sm">تفعيل نظام المقاسات والتفصيل</p>
                      <p className="text-xs text-slate-500 mt-1">للخياطين، المشاغل، محلات الستائر</p>
                  </div>
                  <ToggleSwitch checked={customerSettings.enableMeasurements || false} onChange={() => updateCustomerSetting('enableMeasurements', !customerSettings.enableMeasurements)} />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                  <div>
                      <p className="font-bold text-slate-800 text-sm">بيانات الأعمال (B2B)</p>
                      <p className="text-xs text-slate-500 mt-1">جمع الرقم الضريبي واسم الشركة لإصدار فواتير ضريبية للأعمال</p>
                  </div>
                  <ToggleSwitch checked={customerSettings.collectB2BData !== false} onChange={() => updateCustomerSetting('collectB2BData', !(customerSettings.collectB2BData !== false))} />
              </div>
          </div>
      </div>

      {/* Loyalty Program Settings */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center bg-violet-50 p-5 rounded-2xl border border-violet-100">
             <div>
                 <h3 className="font-black text-violet-900 text-lg flex items-center gap-2">
                     <Heart className="w-5 h-5 text-violet-600" fill="currentColor" />
                     نظام الولاء والمكافآت
                 </h3>
                 <p className="text-sm text-violet-700 font-medium">حول عملائك إلى عملاء دائمين من خلال نظام النقاط والمكافآت</p>
             </div>
             <ToggleSwitch checked={loyaltySettings.enabled || false} onChange={() => updateLoyaltySetting('enabled', !loyaltySettings.enabled)} />
          </div>

          <div className={`space-y-6 transition-all duration-300 ${!loyaltySettings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <div>
                       <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">الإنفاق مقابل نقطة (النقاط المكتسبة)</label>
                       <div className="relative">
                            <input 
                                type="number" 
                                value={loyaltySettings.pointsPerCurrency || 1}
                                onChange={e => updateLoyaltySetting('pointsPerCurrency', parseFloat(e.target.value) || 1)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800"
                            />
                            <div className="absolute inset-y-0 left-0 pl-16 flex items-center pointer-events-none text-xs text-slate-500 font-bold">
                                {formData.currency || 'ر.س'} = 1 نقطة
                            </div>
                       </div>
                       <p className="text-[10px] text-slate-400 mt-2 font-medium">كم ينفق العميل للحصول على نقطة واحدة.</p>
                   </div>
                   
                   <div>
                       <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">قيمة النقطة للاستبدال</label>
                       <div className="relative">
                            <input 
                                type="number" 
                                step="0.01"
                                value={loyaltySettings.currencyPerPoint || 0.01}
                                onChange={e => updateLoyaltySetting('currencyPerPoint', parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800"
                            />
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-xs text-slate-500 font-bold">
                                {formData.currency || 'ر.س'}
                            </div>
                       </div>
                       <p className="text-[10px] text-slate-400 mt-2 font-medium">كم تساوي النقطة الواحدة عند الخصم.</p>
                   </div>

                   <div>
                       <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">الحد الأدنى للنقاط للاستبدال</label>
                       <input 
                            type="number" 
                            value={loyaltySettings.minPointsToRedeem || 0}
                            onChange={e => updateLoyaltySetting('minPointsToRedeem', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800"
                       />
                       <p className="text-[10px] text-slate-400 mt-2 font-medium">لا يمكن للعميل الخصم حتى يجمع هذا العدد من النقاط.</p>
                   </div>
                   
                   <div>
                       <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">المكافأة الترحيبية (نقاط تسجل عميل جديد)</label>
                       <input 
                            type="number" 
                            value={loyaltySettings.welcomeBonus || 0}
                            onChange={e => updateLoyaltySetting('welcomeBonus', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800"
                       />
                   </div>
               </div>
          </div>
      </div>
    </div>
  );
};

export default CustomerLoyaltySettings;
