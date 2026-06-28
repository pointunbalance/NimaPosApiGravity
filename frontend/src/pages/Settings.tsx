import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { AppSettings, ReceiptSection } from '../types';
import { Save, Loader2, Check } from 'lucide-react';
import { t } from '../utils/i18n';
import SetupWizard from './SetupWizard';
import { DEFAULT_LAYOUT } from '../components/settings/settingsUtils';
import SettingsSidebar from '../components/settings/SettingsSidebar';
import GeneralSettings from '../components/settings/GeneralSettings';
import { LicenseSettings } from '../components/settings/LicenseSettings';
import PagesSettings from '../components/settings/PagesSettings';
import POSSettings from '../components/settings/POSSettings';
import PrintingSettings from '../components/settings/PrintingSettings';
import DatabaseSettings from '../components/settings/DatabaseSettings';
import SystemSettings from '../components/settings/SystemSettings';
import CustomerLoyaltySettings from '../components/settings/CustomerLoyaltySettings';
import ZatcaSettings from '../components/settings/ZatcaSettings';
import { SequenceSettings } from './settings/SequenceSettings';
import { BarcodeSettings } from './settings/BarcodeSettings';
import { PrintTemplatesSettings } from './settings/PrintTemplatesSettings';

const Settings: React.FC = () => {
  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
  const [formData, setFormData] = useState<AppSettings | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  
  // Layout State
  const [layout, setLayout] = useState<ReceiptSection[]>(DEFAULT_LAYOUT);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // System Tab States
  const [dbCounts, setDbCounts] = useState<Record<string, number>>({});
  const [storageUsage, setStorageUsage] = useState<string>('0 MB');
  
  // Setup Wizard State
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // Tabs State
  const [activeTab, setActiveTab] = useState<'license' | 'general' | 'pages' | 'branches' | 'printing' | 'print_templates' | 'sequence' | 'barcode' | 'db' | 'system' | 'pos' | 'customers_loyalty' | 'zatca'>('general');

  // Sync Data when loaded
  useEffect(() => {
    if (settings) {
      setFormData(settings);
      if (settings.receiptLayout) {
          setLayout(settings.receiptLayout);
      } else {
          setLayout(DEFAULT_LAYOUT);
      }
    }
  }, [settings]);

  // Load System Stats
  useEffect(() => {
      const loadStats = async () => {
          if (activeTab === 'system') {
              try {
                  const counts: Record<string, number> = {};
                  counts['products'] = await db.products.count();
                  counts['orders'] = await db.orders.count();
                  counts['customers'] = await db.customers.count();
                  setDbCounts(counts);

                  if (navigator.storage && navigator.storage.estimate) {
                      const estimate = await navigator.storage.estimate();
                      if (estimate.usage) {
                          setStorageUsage((estimate.usage / (1024 * 1024)).toFixed(2) + ' MB');
                      }
                  }
              } catch (e) {
                  console.error("Failed to load stats", e);
              }
          }
      };
      loadStats();
  }, [activeTab]);

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    if (formData) {
      setFormData({ ...formData, [key]: value });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (formData) {
      const dataToSave = { ...formData, receiptLayout: layout };
      if (settings?.id) {
        await db.settings.update(settings.id, dataToSave);
      } else {
        await db.settings.add(dataToSave as AppSettings);
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  if (!formData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (showSetupWizard) {
      return <SetupWizard onComplete={() => setShowSetupWizard(false)} />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('settings', formData.language)}</h2>
          <p className="text-slate-500 mt-1 font-medium">تخصيص النظام وإدارة البيانات والخيارات المتقدمة</p>
        </div>
        <button
          onClick={handleSubmit}
          className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white transition-all shadow-lg ${
            isSaved 
              ? 'bg-emerald-500 shadow-emerald-200 hover:bg-emerald-600' 
              : 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1'
          }`}
        >
          {isSaved ? <Check className="w-6 h-6" /> : <Save className="w-6 h-6" />}
          {isSaved ? t('saved', formData.language) : t('save', formData.language)}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Main Content Area */}
          <div className="flex-1">
              {activeTab === 'general' && (
                  <GeneralSettings 
                      formData={formData} 
                      setFormData={setFormData} 
                      handleSettingChange={handleSettingChange} 
                      lang={formData.language}
                  />
              )}

              {activeTab === 'license' && (
                  <LicenseSettings />
              )}

              {activeTab === 'pages' && (
                  <PagesSettings 
                      formData={formData} 
                      handleSettingChange={handleSettingChange} 
                      setShowSetupWizard={setShowSetupWizard} 
                  />
              )}

              {activeTab === 'branches' && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <div className="flex items-center gap-3 mb-6 border-b pb-4">
                          <h2 className="text-xl font-bold text-slate-800">إدارة وتعدد الفروع (Multi-Branch)</h2>
                      </div>
                      <p className="text-slate-500 mb-6 font-medium leading-relaxed">
                          تم تجهيز هيكل قاعدة البيانات ليدعم تعدد الفروع والمخازن.
                          يمكنك من خلال هذه الإعدادات إنشاء فروع جديدة، وتخصيص مستخدمين، وعملاء، وخيام/جرد لكل فرع بشكل منفصل.
                          كما تتيح شاشات التقارير الفلترة المجمعة والتحليلية لكل الفروع أو لفرع محدد.
                          <br /><br />
                          تتوفر شاشة <a href="#/branches" className="text-indigo-600 hover:underline">لوحة تحكم الفروع</a> لإدارة التفاصيل والتحويلات.
                      </p>
                      <button onClick={() => window.location.hash = '#/branches'} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition">
                         الانتقال إلى مدير الفروع
                      </button>
                  </div>
              )}

              {activeTab === 'pos' && (
                  <POSSettings 
                      formData={formData} 
                      handleSettingChange={handleSettingChange} 
                  />
              )}

              {activeTab === 'printing' && (
                  <PrintingSettings 
                      formData={formData} 
                      setFormData={setFormData}
                      handleSettingChange={handleSettingChange}
                      layout={layout}
                      setLayout={setLayout}
                      draggedItemIndex={draggedItemIndex}
                      setDraggedItemIndex={setDraggedItemIndex}
                  />
              )}

              {activeTab === 'print_templates' && (
                  <PrintTemplatesSettings />
              )}

              {activeTab === 'sequence' && (
                  <SequenceSettings 
                      formData={formData}
                      handleSettingChange={handleSettingChange}
                  />
              )}

              {activeTab === 'barcode' && (
                  <BarcodeSettings 
                      formData={formData}
                      handleSettingChange={handleSettingChange}
                  />
              )}

              {activeTab === 'db' && (
                  <DatabaseSettings 
                      formData={formData} 
                      setFormData={setFormData} 
                      handleSettingChange={handleSettingChange} 
                  />
              )}

              {activeTab === 'system' && (
                  <SystemSettings 
                      dbCounts={dbCounts} 
                      storageUsage={storageUsage} 
                  />
              )}

              {activeTab === 'customers_loyalty' && (
                  <CustomerLoyaltySettings 
                      formData={formData} 
                      handleSettingChange={handleSettingChange} 
                  />
              )}

              {activeTab === 'zatca' && (
                  <ZatcaSettings 
                      formData={formData} 
                      handleSettingChange={handleSettingChange} 
                  />
              )}
          </div>
      </div>
    </div>
  );
};

export default Settings;
