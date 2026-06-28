import React, { useState, useEffect } from 'react';
import { X, Save, Settings } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

interface CustomerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerSettingsModal: React.FC<CustomerSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const settings = useLiveQuery(() => db.settings.get(1));
  const isClothingBusiness = settings?.businessType === 'clothing';
  const isRetailOrWholesale = ['retail', 'wholesale'].includes(settings?.businessType || '');

  const [customerSettings, setCustomerSettings] = useState({
    showLoyaltyPoints: true,
    showCreditBalance: true,
    collectB2BData: isRetailOrWholesale,
    enableMeasurements: isClothingBusiness,
    activeMeasurementFields: [] as string[],
  });

  const MEASUREMENT_FIELDS = [
    { id: 'length', label: 'الطول الكلي' },
    { id: 'shoulder', label: 'الكتف' },
    { id: 'sleeveLength', label: 'طول الكم' },
    { id: 'sleeveWidth', label: 'وسع الكم' },
    { id: 'cuff', label: 'الكبك / المعصم' },
    { id: 'neck', label: 'الرقبة' },
    { id: 'chest', label: 'الصدر' },
    { id: 'waist', label: 'الوسط/الخصر' },
    { id: 'hips', label: 'الحوض' },
    { id: 'bottomWidth', label: 'وسع أسفل' },
    { id: 'pantsLength', label: 'طول البنطلون' },
    { id: 'pantsWaist', label: 'خصر البنطلون' },
    { id: 'thigh', label: 'الفخذ' },
    { id: 'knee', label: 'الركبة' },
    { id: 'legOpening', label: 'وسع الرجل' },
  ];

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings?.customerSettings) {
      setCustomerSettings({
        showLoyaltyPoints: settings.customerSettings.showLoyaltyPoints ?? true,
        showCreditBalance: settings.customerSettings.showCreditBalance ?? true,
        collectB2BData: settings.customerSettings.collectB2BData ?? isRetailOrWholesale,
        enableMeasurements: settings.customerSettings.enableMeasurements ?? isClothingBusiness,
        activeMeasurementFields: settings.customerSettings.activeMeasurementFields ?? MEASUREMENT_FIELDS.map(f => f.id),
      });
    } else {
       setCustomerSettings(prev => ({
           ...prev,
           activeMeasurementFields: MEASUREMENT_FIELDS.map(f => f.id)
       }));
    }
  }, [settings, isClothingBusiness, isRetailOrWholesale]);

  if (!isOpen || !settings) return null;

  const toggleMeasurementField = (fieldId: string) => {
    setCustomerSettings(prev => {
        const current = prev.activeMeasurementFields || [];
        if (current.includes(fieldId)) {
            return { ...prev, activeMeasurementFields: current.filter(id => id !== fieldId) };
        } else {
            return { ...prev, activeMeasurementFields: [...current, fieldId] };
        }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await db.settings.update(1, {
        customerSettings,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save customer settings', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm shadow-2xl">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">إعدادات شاشة العملاء</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm hover:shadow transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* General Settings */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-4 px-2">الإعدادات العامة</h4>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                <div>
                  <div className="font-bold text-slate-800 text-sm">نظام الولاء والنقاط</div>
                  <div className="text-xs text-slate-500 mt-1">تفعيل برنامج مكافآت ونقاط العملاء</div>
                </div>
                <div className="relative inline-block w-12 h-6 rounded-full bg-slate-200">
                   <input 
                     type="checkbox" 
                     className="peer sr-only"
                     checked={customerSettings.showLoyaltyPoints}
                     onChange={(e) => setCustomerSettings(prev => ({ ...prev, showLoyaltyPoints: e.target.checked }))}
                   />
                   <div className="absolute inset-0 rounded-full transition-colors peer-checked:bg-indigo-500"></div>
                   <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                </div>
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                <div>
                  <div className="font-bold text-slate-800 text-sm">حسابات الذمم المدينة</div>
                  <div className="text-xs text-slate-500 mt-1">إظهار إدارة الديون والحد الائتماني للعميل</div>
                </div>
                <div className="relative inline-block w-12 h-6 rounded-full bg-slate-200">
                   <input 
                     type="checkbox" 
                     className="peer sr-only"
                     checked={customerSettings.showCreditBalance}
                     onChange={(e) => setCustomerSettings(prev => ({ ...prev, showCreditBalance: e.target.checked }))}
                   />
                   <div className="absolute inset-0 rounded-full transition-colors peer-checked:bg-indigo-500"></div>
                   <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Business Specific Settings */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-4 px-2">إعدادات B2B والتوزيع</h4>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                <div>
                  <div className="font-bold text-slate-800 text-sm">بيانات الشركات (B2B)</div>
                  <div className="text-xs text-slate-500 mt-1">إضافة حقول اسم الشركة والرقم الضريبي</div>
                </div>
                <div className="relative inline-block w-12 h-6 rounded-full bg-slate-200">
                   <input 
                     type="checkbox" 
                     className="peer sr-only"
                     checked={customerSettings.collectB2BData}
                     onChange={(e) => setCustomerSettings(prev => ({ ...prev, collectB2BData: e.target.checked }))}
                   />
                   <div className="absolute inset-0 rounded-full transition-colors peer-checked:bg-indigo-500"></div>
                   <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-4 px-2">إعدادات التفصيل والملابس</h4>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                <div>
                  <div className="font-bold text-slate-800 text-sm">مقاسات العملاء</div>
                  <div className="text-xs text-slate-500 mt-1">إظهار حقول المقاسات والتفصيل لعملائك</div>
                </div>
                <div className="relative inline-block w-12 h-6 rounded-full bg-slate-200">
                   <input 
                     type="checkbox" 
                     className="peer sr-only"
                     checked={customerSettings.enableMeasurements}
                     onChange={(e) => setCustomerSettings(prev => ({ ...prev, enableMeasurements: e.target.checked }))}
                   />
                   <div className="absolute inset-0 rounded-full transition-colors peer-checked:bg-indigo-500"></div>
                   <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                </div>
              </label>
              
              {customerSettings.enableMeasurements && (
                     <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                         <div className="text-xs font-bold text-indigo-800 mb-3 block">الحقول النشطة</div>
                         <div className="grid grid-cols-2 gap-2">
                             {MEASUREMENT_FIELDS.map(field => (
                                 <label key={field.id} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-indigo-200 transition-colors">
                                     <input 
                                         type="checkbox"
                                         checked={customerSettings.activeMeasurementFields?.includes(field.id) ?? false}
                                         onChange={() => toggleMeasurementField(field.id)}
                                         className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                     />
                                     <span className="text-xs font-medium text-slate-700">{field.label}</span>
                                 </label>
                             ))}
                         </div>
                     </div>
                  )}
                </div>
              </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white flex gap-3 flex-shrink-0">
           <button
             type="button"
             onClick={onClose}
             className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
           >
             إلغاء
           </button>
           <button
             type="button"
             onClick={handleSave}
             disabled={isSaving}
             className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
           >
             <Save className="w-4 h-4" />
             {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
           </button>
        </div>
      </div>
    </div>
  );
};
