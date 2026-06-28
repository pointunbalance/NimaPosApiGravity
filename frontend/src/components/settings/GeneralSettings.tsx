import React from 'react';
import { Store, Image as ImageIcon, Upload, Wrench, Globe, Percent, Briefcase } from 'lucide-react';
import { AppSettings } from '../../types';
import { t, Language } from '../../utils/i18n';
import { SectionTitle, ToggleSwitch } from './settingsUtils';
import { compressImage } from '../../utils/imageCompression';

interface GeneralSettingsProps {
  formData: AppSettings;
  setFormData: (data: AppSettings) => void;
  handleSettingChange: (key: keyof AppSettings, value: any) => void;
  lang: Language;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ formData, setFormData, handleSettingChange, lang }) => {
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        compressImage(file).then(result => {
            setFormData({ ...formData, logo: result });
            handleSettingChange('logo', result);
        });
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
        {/* Store Identity Card */}
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200">
            <SectionTitle icon={Store} title="هوية المتجر" desc="الشعار والبيانات الأساسية التي تظهر في الواجهة والتقارير" />
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="shrink-0 flex flex-col items-center gap-3 w-full md:w-auto">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 relative overflow-hidden group transition-colors hover:border-indigo-400 hover:bg-indigo-50/30">
                        {formData.logo ? (
                            <img src={formData.logo} className="w-full h-full object-contain p-4" alt="Logo" />
                        ) : (
                            <ImageIcon className="w-10 h-10 md:w-12 md:h-12 text-slate-300" />
                        )}
                        <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                            <Upload className="w-6 h-6 md:w-8 md:h-8 mb-2" />
                            <span className="text-xs font-bold text-center">رفع شعار جديد</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                    </div>
                </div>
                
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{t('storeName', lang)}</label>
                        <input type="text" value={formData.storeName || ''} onChange={e => handleSettingChange('storeName', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800" placeholder="مثال: سوبر ماركت النور" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{t('phone', lang)}</label>
                        <input type="text" value={formData.phone || ''} onChange={e => handleSettingChange('phone', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700" placeholder="05xxxxxxxx" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">الرقم الضريبي</label>
                        <input type="text" value={formData.taxNumber || ''} onChange={e => handleSettingChange('taxNumber', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700" placeholder="اختياري" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{t('address', lang)}</label>
                        <input type="text" value={formData.address || ''} onChange={e => handleSettingChange('address', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700" placeholder="المدينة، الحي، الشارع" />
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Region & Localization */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <SectionTitle icon={Globe} title="المنطقة واللغة" desc="تحديد العملة ولغة واجهة الاستخدام" />
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">رمز العملة (العملة الافتراضية)</label>
                        <input 
                            type="text" 
                            value={formData.currency || ''} 
                            onChange={e => handleSettingChange('currency', e.target.value)} 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800" 
                            placeholder="مثال: ر.س، درهم، دينار" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">لغة النظام (Language)</label>
                        <select 
                            value={formData.language || 'ar'} 
                            onChange={e => handleSettingChange('language', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                        >
                            <option value="ar">العربية (Arabic)</option>
                            <option value="en">الإنجليزية (English)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tax Settings */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <SectionTitle icon={Percent} title="إعدادات الضرائب والتأمينات" desc="تكوين نسبة ضريبة القيمة المضافة والضرائب الأخرى" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">نسبة ضريبة المبيعات (%)</label>
                            <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg">{(formData.taxRate || 0)}%</span>
                        </div>
                        <div className="relative">
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="0.1"
                                value={formData.taxRate || 0} 
                                onChange={e => handleSettingChange('taxRate', parseFloat(e.target.value) || 0)} 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800" 
                                placeholder="15" 
                            />
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-slate-400 font-bold">%</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 font-medium">سيتم تطبيق هذه النسبة على المبيعات بشكل الافتراضي.</p>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">نسبة ضريبة الدخل (الرواتب)</label>
                            <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg">{(formData.payrollTaxRate || 0)}%</span>
                        </div>
                        <div className="relative">
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="0.1"
                                value={formData.payrollTaxRate || 0} 
                                onChange={e => handleSettingChange('payrollTaxRate', parseFloat(e.target.value) || 0)} 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-800" 
                                placeholder="0" 
                            />
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-slate-400 font-bold">%</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 font-medium">النسبة المقتطعة من رواتب الموظفين كضريبة دخل.</p>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">نسبة التأمينات الاجتماعية</label>
                            <span className="text-xs font-bold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg">{(formData.socialInsuranceRate || 0)}%</span>
                        </div>
                        <div className="relative">
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="0.1"
                                value={formData.socialInsuranceRate || 0} 
                                onChange={e => handleSettingChange('socialInsuranceRate', parseFloat(e.target.value) || 0)} 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold text-slate-800" 
                                placeholder="0" 
                            />
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-slate-400 font-bold">%</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 font-medium">النسبة المقتطعة للتأمينات من الراتب.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Business & System Options */}
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200">
            <SectionTitle icon={Wrench} title="خصائص النظام" desc="تفعيل وتعطيل الميزات المتقدمة" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">طبيعة العمل (Business Type)</label>
                    <div className="relative">
                        <select 
                            value={formData.businessType || 'retail'} 
                            onChange={e => handleSettingChange('businessType', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 appearance-none"
                        >
                            <option value="retail">تجزئة (سوبر ماركت، بقالة، مكتبة)</option>
                            <option value="restaurant">مطعم / كافيه</option>
                            <option value="services">خدمات (صيانة، مغسلة، صالون)</option>
                            <option value="fashion">أزياء وملابس</option>
                            <option value="electronics">إلكترونيات وجوالات</option>
                            <option value="realestate">عقارات وإدارة أملاك</option>
                            <option value="corporate">شركات ومقاولات</option>
                        </select>
                        <Briefcase className="w-5 h-5 absolute top-1/2 -translate-y-1/2 left-3 text-slate-400" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">رأس المال التأسيسي</label>
                    <input 
                        type="number" onFocus={(e) => e.target.select()} 
                        value={formData.initialCapital || 0}
                        onChange={e => handleSettingChange('initialCapital', Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800"
                        placeholder="0.00"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">نمط التطبيق</label>
                    <select 
                        value={formData.appMode || 'standard'}
                        onChange={e => handleSettingChange('appMode', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800"
                    >
                        <option value="starter">مبتدئ (Starter)</option>
                        <option value="standard">قياسي (Standard)</option>
                        <option value="service">خدمي (Service)</option>
                        <option value="enterprise">مؤسسة (Enterprise)</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div>
                        <p className="font-bold text-slate-800 text-sm">تفعيل الأصوات</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-relaxed">مؤثرات صوتية للإشعارات والعمليات</p>
                    </div>
                    <ToggleSwitch checked={formData.enableSounds || false} onChange={() => handleSettingChange('enableSounds', !formData.enableSounds)} />
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div>
                        <p className="font-bold text-slate-800 text-sm">طلب PIN عند الاسترجاع</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-relaxed">حماية عمليات استرجاع الأموال برمز المدير</p>
                    </div>
                    <ToggleSwitch checked={formData.requirePinForRefund || false} onChange={() => handleSettingChange('requirePinForRefund', !formData.requirePinForRefund)} />
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div>
                        <p className="font-bold text-slate-800 text-sm">تفعيل نظام المحاسبة</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-relaxed">دليل الحسابات وقيود اليومية والميزانية</p>
                    </div>
                    <ToggleSwitch checked={formData.enableAccounting || false} onChange={() => handleSettingChange('enableAccounting', !formData.enableAccounting)} />
                </div>
            </div>
        </div>
    </div>
  );
};

export default GeneralSettings;

