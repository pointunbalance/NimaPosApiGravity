import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { AppSettings } from '../../types';
import { SectionTitle, ToggleSwitch } from './settingsUtils';

interface POSSettingsProps {
  formData: AppSettings;
  handleSettingChange: (key: keyof AppSettings, value: any) => void;
}

const POSSettings: React.FC<POSSettingsProps> = ({ formData, handleSettingChange }) => {
  const togglePOSPermission = (permissionKey: keyof NonNullable<AppSettings['posSettings']>) => {
    const currentSettings = formData.posSettings || {};
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
      // By default all POS features are enabled (true) if undefined.
      if (!formData.posSettings) return true;
      if (formData.posSettings[key] === undefined) return true;
      return formData.posSettings[key] as boolean;
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionTitle title="إعدادات شاشة الكاشير (POS)" icon={ShoppingCart} desc="التحكم في الأزرار والوظائف التي تظهر على شاشة نقطة البيع للموظفين." />

      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8">
          
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">1</div>
                إدارة أزرار الشريط العلوي والتذاكر
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                 <div>
                   <p className="font-bold text-slate-800 text-sm">البحث وجهاز الباركود</p>
                   <p className="text-xs text-slate-500 mt-1">إظهار شريط البحث وإمكانية استخدام ماسح الباركود</p>
                 </div>
                 <ToggleSwitch checked={isEnabled('showBarcodeScanner')} onChange={() => togglePOSPermission('showBarcodeScanner')} />
               </div>
               
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                 <div>
                   <p className="font-bold text-slate-800 text-sm">تعليق وحفظ الفواتير</p>
                   <p className="text-xs text-slate-500 mt-1">زر "تعليق/انتظار الفاتورة" وتذكر المعاملات المعلقة</p>
                 </div>
                 <ToggleSwitch checked={isEnabled('showHoldBill')} onChange={() => togglePOSPermission('showHoldBill')} />
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                 <div>
                   <p className="font-bold text-slate-800 text-sm">مرتجعات المبيعات</p>
                   <p className="text-xs text-slate-500 mt-1">إتاحة زر إجراء مرتجع المبيعات من شاشة الكاشير</p>
                 </div>
                 <ToggleSwitch checked={isEnabled('showReturns')} onChange={() => togglePOSPermission('showReturns')} />
               </div>
               
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                 <div>
                   <p className="font-bold text-slate-800 text-sm">فتح درج الكاشير</p>
                   <p className="text-xs text-slate-500 mt-1">إظهار زر طابعة "فتح الدرج يدوياً"</p>
                 </div>
                 <ToggleSwitch checked={isEnabled('showCashDrawer')} onChange={() => togglePOSPermission('showCashDrawer')} />
               </div>
            </div>
          </div>

          <div className="h-px w-full bg-slate-100"></div>

          <div>
             <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">2</div>
                خصائص السداد والتسعير
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-colors">
                 <div>
                   <p className="font-bold text-slate-800 text-sm">الدفع المقسم (حفظ مرن)</p>
                   <p className="text-xs text-slate-500 mt-1">القدرة على دفع جزء كاش وجزء بالبطاقة</p>
                 </div>
                 <ToggleSwitch checked={isEnabled('showSplitPayment')} onChange={() => togglePOSPermission('showSplitPayment')} />
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-colors">
                 <div>
                   <p className="font-bold text-slate-800 text-sm">طباعة الفواتير السابقة</p>
                   <p className="text-xs text-slate-500 mt-1">زر يتيح استعراض وطباعة آخر فاتورة تم سدادها</p>
                 </div>
                 <ToggleSwitch checked={isEnabled('showPrintBill')} onChange={() => togglePOSPermission('showPrintBill')} />
               </div>
               
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-colors">
                 <div>
                   <p className="font-bold text-slate-800 text-sm">الخصم السريع</p>
                   <p className="text-xs text-slate-500 mt-1">تفعيل زر الخصم المباشر (نسبة أو قيمة) من إجمالي الفاتورة</p>
                 </div>
                 <ToggleSwitch checked={isEnabled('showQuickDiscount')} onChange={() => togglePOSPermission('showQuickDiscount')} />
               </div>
               
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-colors">
                 <div>
                   <p className="font-bold text-slate-800 text-sm">تغيير قوائم الأسعار</p>
                   <p className="text-xs text-slate-500 mt-1">تحديد قائمة التسعير (جملة/مفرق/مندوب) داخل الفاتورة</p>
                 </div>
                 <ToggleSwitch checked={isEnabled('showPriceListSwitcher')} onChange={() => togglePOSPermission('showPriceListSwitcher')} />
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-colors">
                 <div>
                   <p className="font-bold text-slate-800 text-sm">تعديل سعر الصنف يدوياً</p>
                   <p className="text-xs text-slate-500 mt-1">صلاحية تغيير سعر المادة أو الخصم عليها مباشرة من السلة</p>
                 </div>
                 <ToggleSwitch checked={isEnabled('showCustomPrice')} onChange={() => togglePOSPermission('showCustomPrice')} />
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-colors">
                 <div>
                   <p className="font-bold text-slate-800 text-sm">تطبيق سعر العميل التلقائي</p>
                   <p className="text-xs text-slate-500 mt-1">تذكر وتطبيق آخر سعر بيع للمادة اختاره العميل نفسه تلقائياً</p>
                 </div>
                 <ToggleSwitch checked={isEnabled('rememberCustomerPrices')} onChange={() => togglePOSPermission('rememberCustomerPrices')} />
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-colors">
                 <div>
                   <p className="font-bold text-slate-800 text-sm">تحديد المندوب / البائع (Salesperson)</p>
                   <p className="text-xs text-slate-500 mt-1">صلاحية واظهار ايقونة تحديد البائع لكل فاتورة</p>
                 </div>
                 <ToggleSwitch checked={isEnabled('showSalespersonSelect')} onChange={() => togglePOSPermission('showSalespersonSelect')} />
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-colors">
                 <div>
                   <p className="font-bold text-slate-800 text-sm">قراءة الميزان الإلكتروني</p>
                   <p className="text-xs text-slate-500 mt-1">إظهار زر جلب الوزن من الميزان المتصل بالكمبيوتر عبر USB/Serial</p>
                 </div>
                 <ToggleSwitch checked={isEnabled('showWeightScale')} onChange={() => togglePOSPermission('showWeightScale')} />
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-colors">
                 <div>
                   <p className="font-bold text-slate-800 text-sm">رسوم خدمة الصالة (Dine-in %)</p>
                   <p className="text-xs text-slate-500 mt-1">النسبة المئوية التي تضاف تلقائياً عند طلب محلي (صالة)</p>
                 </div>
                 <input 
                    type="number" 
                    value={formData.posSettings?.dineInServiceChargeRate || 0}
                    onChange={(e) => {
                         const currentSettings = formData.posSettings || {};
                         const updatedSettings = {
                             ...(currentSettings as any),
                             dineInServiceChargeRate: Number(e.target.value)
                         };
                         handleSettingChange('posSettings', updatedSettings);
                    }}
                    className="w-20 px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-center font-bold"
                 />
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-colors">
                 <div>
                   <p className="font-bold text-slate-800 text-sm">إرسال الطلب للمطبخ</p>
                   <p className="text-xs text-slate-500 mt-1">عرض زر (KDS) في الشاشة الرئيسية لإرسال الطلبات مباشرة للمطبخ</p>
                 </div>
                 <ToggleSwitch checked={isEnabled('showSendToKitchen')} onChange={() => togglePOSPermission('showSendToKitchen')} />
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-colors">
                 <div>
                   <p className="font-bold text-slate-800 text-sm">السماح بالبيع بالسالب</p>
                   <p className="text-xs text-slate-500 mt-1">السماح بإضافة منتج للسلة حتى لو كان رصيد المخزن غير كافي</p>
                 </div>
                 <ToggleSwitch checked={isEnabled('allowNegativeStock')} onChange={() => togglePOSPermission('allowNegativeStock')} />
               </div>
            </div>
          </div>

           <div>
             <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">3</div>
                واجهة المستخدم
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors">
                 <div className="mb-3">
                   <p className="font-bold text-slate-800 text-sm">حالة القائمة الجانبية الإفتراضية</p>
                   <p className="text-xs text-slate-500 mt-1">تحديد كيف تظهر القائمة الجانبية (الأقسام) عند فتح شاشة المبيعات</p>
                 </div>
                 <select 
                    title="حالة القائمة الجانبية الإفتراضية"
                    value={formData.posSidebarState || 'visible'}
                    onChange={(e) => handleSettingChange('posSidebarState', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 outline-none transition-all text-sm font-bold text-slate-700"
                 >
                    <option value="visible">إظهار كامل الشريط</option>
                    <option value="collapsed">تصغير (أيقونات فقط)</option>
                    <option value="hidden">إخفاء تماماً</option>
                 </select>
               </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default POSSettings;
