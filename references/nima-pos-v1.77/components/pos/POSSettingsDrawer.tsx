import React, { useState } from 'react';
import { X, Plus, Minus, Monitor, MousePointerClick, CreditCard, GripHorizontal, Presentation, ExternalLink } from 'lucide-react';
import { AppSettings } from '../../types';
import { db } from '../../db';
import { ToggleSwitch } from '../settings/settingsUtils';
import { motion } from 'framer-motion';

interface POSSettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings | undefined;
    overallScale: number;
    setOverallScale: (val: number) => void;
    gridScale: number;
    setGridScale: (val: number) => void;
    cartScale: number;
    setCartScale: (val: number) => void;
}

export const POSSettingsDrawer: React.FC<POSSettingsDrawerProps> = ({
    isOpen, onClose, settings,
    overallScale, setOverallScale,
    gridScale, setGridScale,
    cartScale, setCartScale
}) => {
    const [activeTab, setActiveTab] = useState<'display' | 'buttons' | 'payment' | 'cds'>('display');

    if (!isOpen) return null;

    const handleSettingChange = async (key: keyof AppSettings, value: any) => {
        const existing = await db.settings.toCollection().first();
        if (existing && existing.id) {
            await db.settings.update(existing.id, { [key]: value });
        } else {
            await db.settings.add({ businessType: 'retail', [key]: value } as any);
        }
    };

    const handleCdsSettingChange = async (key: string, value: any) => {
        const updatedSettings = {
            ...(settings?.cdsSettings || {}),
            [key]: value
        };
        handleSettingChange('cdsSettings', updatedSettings);
    };

    const togglePOSPermission = (permissionKey: keyof NonNullable<AppSettings['posSettings']>) => {
        const currentSettings = settings?.posSettings || {};
        const updatedSettings = {
            ...(currentSettings as any)
        };
        if (updatedSettings[permissionKey] === undefined) {
            updatedSettings[permissionKey] = false;
        } else {
            updatedSettings[permissionKey] = !updatedSettings[permissionKey];
        }
        
        handleSettingChange('posSettings', updatedSettings);
    };

    const isEnabled = (key: keyof NonNullable<AppSettings['posSettings']>) => {
        if (!settings?.posSettings) return key !== 'wholesaleShowPrices';
        if (settings.posSettings[key] === undefined) return key !== 'wholesaleShowPrices';
        return settings.posSettings[key] as boolean;
    };

    const tabs = [
        { id: 'display', label: 'العرض', icon: Monitor },
        { id: 'buttons', label: 'الأزرار', icon: MousePointerClick },
        { id: 'payment', label: 'السداد', icon: CreditCard },
        { id: 'cds', label: 'شاشة العميل', icon: Presentation },
    ];

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none p-4 w-full h-full">
            <motion.div 
                drag
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/85 backdrop-blur-xl rounded-3xl w-full max-w-[420px] max-h-[85vh] flex flex-col shadow-2xl ring-1 ring-slate-200/50 relative pointer-events-auto overflow-hidden"
            >
                <div className="bg-transparent px-6 py-4 flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing border-b border-slate-200/50">
                    <div className="flex flex-col gap-1">
                       <h2 className="text-xl font-black text-slate-800">إعدادات الكاشير</h2>
                       <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                           <GripHorizontal className="w-3 h-3" />
                           اسحب للتحريك
                       </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors text-slate-500 hover:text-slate-800 bg-white/30 backdrop-blur-sm z-10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4 shrink-0">
                    <div className="flex gap-2">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 flex-1 justify-center px-2 py-3 rounded-xl text-sm font-bold transition-all ${
                                        isActive 
                                        ? 'bg-brand-500/10 text-brand-700 shadow-sm ring-1 ring-brand-500/20'
                                        : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-900'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                    {activeTab === 'display' && (
                        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-slate-200/50 flex flex-col gap-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-2 h-full bg-brand-500/80"></div>
                                <h3 className="font-bold text-slate-800 text-sm mb-1">تخصيص الواجهة (لهذا الجهاز فقط)</h3>
                                
                                <div className="flex flex-col gap-3">
                                    <label className="text-xs font-semibold text-slate-500">حجم الشاشة بالكامل</label>
                                    <div className="flex bg-slate-50 rounded-xl p-1 gap-1 items-center px-2 border border-slate-200">
                                        <button 
                                            onClick={() => setOverallScale(Math.max(0.5, overallScale - 0.05))} 
                                            className="p-2 rounded-lg hover:bg-white text-slate-500 hover:text-brand-600 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-slate-200"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="flex-1 text-center font-bold text-slate-700 text-sm">
                                            {Math.round(overallScale * 100)}%
                                        </span>
                                        <button 
                                            onClick={() => setOverallScale(Math.min(1.5, overallScale + 0.05))} 
                                            className="p-2 rounded-lg hover:bg-white text-slate-500 hover:text-brand-600 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-slate-200"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <label className="text-xs font-semibold text-slate-500">حجم شبكة المنتجات (المنتصف)</label>
                                    <div className="flex bg-slate-50 rounded-xl p-1 gap-1 items-center px-2 border border-slate-200">
                                        <button 
                                            onClick={() => setGridScale(Math.max(0.5, gridScale - 0.05))} 
                                            className="p-2 rounded-lg hover:bg-white text-slate-500 hover:text-brand-600 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-slate-200"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="flex-1 text-center font-bold text-slate-700 text-sm">
                                            {Math.round(gridScale * 100)}%
                                        </span>
                                        <button 
                                            onClick={() => setGridScale(Math.min(1.5, gridScale + 0.05))} 
                                            className="p-2 rounded-lg hover:bg-white text-slate-500 hover:text-brand-600 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-slate-200"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <label className="text-xs font-semibold text-slate-500">حجم سلة المشتريات (اليمين)</label>
                                    <div className="flex bg-slate-50 rounded-xl p-1 gap-1 items-center px-2 border border-slate-200">
                                        <button 
                                            onClick={() => setCartScale(Math.max(0.5, cartScale - 0.05))} 
                                            className="p-2 rounded-lg hover:bg-white text-slate-500 hover:text-brand-600 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-slate-200"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="flex-1 text-center font-bold text-slate-700 text-sm">
                                            {Math.round(cartScale * 100)}%
                                        </span>
                                        <button 
                                            onClick={() => setCartScale(Math.min(1.5, cartScale + 0.05))} 
                                            className="p-2 rounded-lg hover:bg-white text-slate-500 hover:text-brand-600 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-slate-200"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 relative overflow-hidden">
                               <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
                               <h3 className="font-bold text-slate-800 text-sm mb-1">تخصيص الواجهة (نظام)</h3>
                               <div className="flex flex-col gap-2">
                                   <label className="text-xs font-semibold text-slate-500">حالة القائمة الجانبية (الأقسام)</label>
                                   <select 
                                      value={settings?.posSidebarState || 'visible'}
                                      onChange={(e) => handleSettingChange('posSidebarState', e.target.value)}
                                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-sm"
                                   >
                                      <option value="visible">إظهار كامل الشريط</option>
                                      <option value="collapsed">تصغير (أيقونات فقط)</option>
                                      <option value="hidden">إخفاء تماماً</option>
                                   </select>
                               </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'buttons' && (
                        <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <ToggleItem 
                                label="البحث وجهاز الباركود" 
                                checked={isEnabled('showBarcodeScanner')} 
                                onChange={() => togglePOSPermission('showBarcodeScanner')} 
                            />
                            <ToggleItem 
                                label="تعليق وحفظ الفواتير" 
                                checked={isEnabled('showHoldBill')} 
                                onChange={() => togglePOSPermission('showHoldBill')} 
                            />
                            <ToggleItem 
                                label="مرتجعات المبيعات" 
                                checked={isEnabled('showReturns')} 
                                onChange={() => togglePOSPermission('showReturns')} 
                            />
                            <ToggleItem 
                                label="فتح درج الكاشير" 
                                checked={isEnabled('showCashDrawer')} 
                                onChange={() => togglePOSPermission('showCashDrawer')} 
                            />
                            <ToggleItem 
                                label="طباعة الفواتير السابقة" 
                                checked={isEnabled('showPrintBill')} 
                                onChange={() => togglePOSPermission('showPrintBill')} 
                            />
                            <ToggleItem 
                                label="إرسال الطلب للمطبخ (KDS)" 
                                checked={isEnabled('showSendToKitchen')} 
                                onChange={() => togglePOSPermission('showSendToKitchen')} 
                            />
                            <ToggleItem 
                                label="قراءة الميزان الإلكتروني" 
                                checked={isEnabled('showWeightScale')} 
                                onChange={() => togglePOSPermission('showWeightScale')} 
                            />
                        </div>
                    )}

                    {activeTab === 'payment' && (
                        <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <ToggleItem 
                                label="طباعة الفاتورة تلقائياً" 
                                checked={!!settings?.autoPrint} 
                                onChange={() => handleSettingChange('autoPrint', !settings?.autoPrint)} 
                            />
                            <ToggleItem 
                                label="الدفع المقسم (حفظ مرن)" 
                                checked={isEnabled('showSplitPayment')} 
                                onChange={() => togglePOSPermission('showSplitPayment')} 
                            />
                            <ToggleItem 
                                label="الخصم السريع" 
                                checked={isEnabled('showQuickDiscount')} 
                                onChange={() => togglePOSPermission('showQuickDiscount')} 
                            />
                            <ToggleItem 
                                label="تغيير قوائم الأسعار" 
                                checked={isEnabled('showPriceListSwitcher')} 
                                onChange={() => togglePOSPermission('showPriceListSwitcher')} 
                            />
                            <ToggleItem 
                                label="تعديل سعر الصنف يدوياً" 
                                checked={isEnabled('showCustomPrice')} 
                                onChange={() => togglePOSPermission('showCustomPrice')} 
                            />
                            <ToggleItem 
                                label="تطبيق سعر العميل التلقائي" 
                                checked={isEnabled('rememberCustomerPrices')} 
                                onChange={() => togglePOSPermission('rememberCustomerPrices')} 
                            />
                            <ToggleItem 
                                label="تحديد المندوب / البائع" 
                                checked={isEnabled('showSalespersonSelect')} 
                                onChange={() => togglePOSPermission('showSalespersonSelect')} 
                            />
                            <ToggleItem 
                                label="إظهار أسعار الجملة" 
                                checked={isEnabled('wholesaleShowPrices')} 
                                onChange={() => togglePOSPermission('wholesaleShowPrices')} 
                            />
                            <ToggleItem 
                                label="تذكر أسعار العملاء" 
                                checked={isEnabled('rememberCustomerPrices')} 
                                onChange={() => togglePOSPermission('rememberCustomerPrices')} 
                            />
                            <ToggleItem 
                                label="السماح بالبيع بالسالب" 
                                checked={isEnabled('allowNegativeStock')} 
                                onChange={() => togglePOSPermission('allowNegativeStock')} 
                            />
                            
                            <div className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/50 shadow-sm mt-2">
                              <div>
                                <p className="font-bold text-slate-800 text-sm">رسوم خدمة الصالة (%)</p>
                              </div>
                              <input 
                                 type="number" 
                                 value={settings?.posSettings?.dineInServiceChargeRate || 0}
                                 onChange={(e) => {
                                      const currentSettings = settings?.posSettings || {};
                                      const updatedSettings = {
                                          ...(currentSettings as any),
                                          dineInServiceChargeRate: Number(e.target.value)
                                      };
                                      handleSettingChange('posSettings', updatedSettings);
                                 }}
                                 className="w-20 px-3 py-2 bg-slate-100/50 border border-slate-200/50 rounded-xl outline-none text-center font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500/50"
                              />
                            </div>
                        </div>
                    )}

                    {activeTab === 'cds' && (
                        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-slate-200/50 flex flex-col gap-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-2 h-full bg-brand-500/80"></div>
                                <h3 className="font-bold text-slate-800 text-sm mb-1">إعدادات شاشة العميل (CDS)</h3>
                                
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block">رسالة الترحيب</label>
                                        <input
                                            type="text"
                                            value={settings?.cdsSettings?.welcomeTitle || ''}
                                            onChange={(e) => handleCdsSettingChange('welcomeTitle', e.target.value)}
                                            placeholder="مثال: شكراً لتسوقكم معنا"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block">الوصف الترويجي</label>
                                        <textarea
                                            value={settings?.cdsSettings?.welcomeMessage || ''}
                                            onChange={(e) => handleCdsSettingChange('welcomeMessage', e.target.value)}
                                            placeholder="اكتب رسالة ترويجية للعملاء هنا..."
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/50 custom-scrollbar resize-none"
                                            rows={3}
                                        />
                                    </div>

                                    <button 
                                        onClick={() => window.open('/cds', '_blank', 'width=1000,height=700')}
                                        className="mt-2 w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        فتح شاشة العميل
                                    </button>
                                    <p className="text-[10px] text-slate-400 text-center">يمكنك سحب النافذة للشاشة الثانوية وتكبيرها</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const ToggleItem = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
    <div className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/50 shadow-sm hover:bg-white/80 transition-colors cursor-pointer" onClick={onChange}>
        <span className="font-bold text-slate-800 text-sm">{label}</span>
        <div onClick={(e) => e.stopPropagation()}>
            <ToggleSwitch checked={checked} onChange={onChange} />
        </div>
    </div>
);
