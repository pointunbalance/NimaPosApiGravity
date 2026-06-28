import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { AppSettings, MaintenanceSettings } from '../../types';

interface MaintenanceSettingsModalProps {
  onClose: () => void;
}

const defaultMaintenanceSettings: MaintenanceSettings = {
  deviceTypes: ['موبايل', 'لابتوب', 'تابلت', 'ساعة ذكية'],
  deviceBrands: ['Apple', 'Samsung', 'Huawei', 'Xiaomi', 'Oppo', 'HP', 'Dell', 'Lenovo'],
  deviceModels: [],
  maintenanceTypes: ['تغيير شاشة', 'تغيير بطارية', 'سوفت وير', 'صيانة بوردة', 'تنظيف', 'أخرى']
};

const MaintenanceSettingsModal: React.FC<MaintenanceSettingsModalProps> = ({ onClose }) => {
  const settings = useLiveQuery(() => db.settings.toArray());
  const currentSettings = settings?.[0];

  const [localSettings, setLocalSettings] = useState<MaintenanceSettings>(defaultMaintenanceSettings);
  const [newItemInputs, setNewItemInputs] = useState({
    deviceTypes: '',
    deviceBrands: '',
    deviceModels: '',
    maintenanceTypes: ''
  });

  useEffect(() => {
    if (currentSettings?.maintenanceSettings) {
      setLocalSettings({
        ...defaultMaintenanceSettings,
        ...currentSettings.maintenanceSettings
      });
    }
  }, [currentSettings]);

  const handleAddItem = (key: keyof MaintenanceSettings) => {
    const value = newItemInputs[key].trim();
    if (value && !localSettings[key].includes(value)) {
      setLocalSettings(prev => ({
        ...prev,
        [key]: [...prev[key], value]
      }));
      setNewItemInputs(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleRemoveItem = (key: keyof MaintenanceSettings, index: number) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (currentSettings?.id) {
      await db.settings.update(currentSettings.id, {
        maintenanceSettings: localSettings
      });
    } else {
      // Fallback if settings don't exist yet
      await db.settings.add({
        storeName: 'متجر جديد',
        language: 'ar',
        currency: 'EGP',
        businessType: 'retail',
        address: '',
        phone: '',
        taxRate: 0,
        maintenanceSettings: localSettings
      });
    }
    onClose();
  };

  const renderSection = (title: string, key: keyof MaintenanceSettings, placeholder: string) => (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
      <h3 className="font-bold text-slate-700 mb-3">{title}</h3>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newItemInputs[key]}
          onChange={(e) => setNewItemInputs(prev => ({ ...prev, [key]: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem(key)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
        />
        <button
          onClick={() => handleAddItem(key)}
          className="p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {localSettings[key].map((item, index) => (
          <div key={index} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 text-sm">
            <span>{item}</span>
            <button
              onClick={() => handleRemoveItem(key, index)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {localSettings[key].length === 0 && (
          <span className="text-sm text-slate-400">لا توجد عناصر مضافة</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">إعدادات خيارات الصيانة</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <p className="text-slate-500 text-sm mb-4">
            قم بإدارة القوائم المنسدلة التي تظهر عند إضافة أو تعديل طلب صيانة جديد.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderSection('أنواع الأجهزة', 'deviceTypes', 'أضف نوع جهاز (مثل: لابتوب)')}
            {renderSection('الشركات المصنعة', 'deviceBrands', 'أضف شركة (مثل: Apple)')}
            {renderSection('الموديلات', 'deviceModels', 'أضف موديل (مثل: iPhone 13)')}
            {renderSection('أنواع الصيانة', 'maintenanceTypes', 'أضف نوع صيانة (مثل: تغيير شاشة)')}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 font-medium flex items-center gap-2 transition-colors"
          >
            <Save className="w-5 h-5" />
            حفظ الإعدادات
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceSettingsModal;
