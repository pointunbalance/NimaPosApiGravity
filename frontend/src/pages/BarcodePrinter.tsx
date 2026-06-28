import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Product } from '../types';
import JsBarcode from 'jsbarcode';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';

import BarcodePrinterSidebar from '../components/barcode-printer/BarcodePrinterSidebar';
import BarcodePrinterToolbar from '../components/barcode-printer/BarcodePrinterToolbar';
import BarcodePrinterPreview from '../components/barcode-printer/BarcodePrinterPreview';
import { BarcodeSettings } from './settings/BarcodeSettings';
import { AppSettings } from '../types';

interface PrintItem {
    product: Product;
    quantity: number;
}

interface LabelConfig {
    name?: string; // Preset name
    width: number; // mm
    height: number; // mm
    horizontalGap: number; // mm
    verticalGap: number; // mm
    fontSize: number; // pt
    showName: boolean;
    showPrice: boolean;
    showCode: boolean;
    showStoreName: boolean;
    customText: string;
    format: 'CODE128' | 'CODE39' | 'EAN13' | 'UPC' | 'ITF14' | 'MSI';
    paperType: 'thermal' | 'a4';
    labelsPerRow: number; // For A4
}

const BarcodePrinter: React.FC = () => {
  const { success, error: showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [queue, setQueue] = useState<PrintItem[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'queue' | 'settings'>('products');
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; templateName: string } | null>(null);
  
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const products = useLiveQuery(() => db.products.toArray(), []);
  
  const handleSettingChange = async (key: keyof AppSettings, value: any) => {
    if (settings) {
      await db.settings.update(settings.id!, { [key]: value });
    } else {
      await db.settings.add({ [key]: value } as any);
    }
  };
  
  // Configuration
  const [config, setConfig] = useState<LabelConfig>({
      width: 40,
      height: 25,
      horizontalGap: 2,
      verticalGap: 2,
      fontSize: 10,
      showName: true,
      showPrice: true,
      showCode: true,
      showStoreName: true,
      customText: '',
      format: 'CODE128',
      paperType: 'thermal',
      labelsPerRow: 1
  });

  // Templates State
  const [savedTemplates, setSavedTemplates] = useState<LabelConfig[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  // Load Templates
  useEffect(() => {
      const stored = localStorage.getItem('barcode_templates');
      if (stored) {
          try {
              setSavedTemplates(JSON.parse(stored));
          } catch (e) { console.error(e); }
      }
  }, []);

  // --- Logic ---

  const filteredProducts = useMemo(() => {
      if (!products) return [];
      return products.filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (p.barcode && p.barcode.includes(searchTerm))
      );
  }, [products, searchTerm]);

  const queueTotal = useMemo(() => queue.reduce((acc, item) => acc + item.quantity, 0), [queue]);

  // Barcode Generation Effect
  useEffect(() => {
      if (previewRef.current) {
          // Use a timeout to ensure DOM is ready during rapid state changes
          const timer = setTimeout(() => {
              const svgs = previewRef.current?.querySelectorAll('svg[data-barcode]');
              svgs?.forEach((svg) => {
                  const code = svg.getAttribute('data-barcode');
                  const valid = svg.getAttribute('data-valid') === 'true';
                  
                  if (code && valid) {
                      try {
                          JsBarcode(svg, code, {
                              format: config.format as any,
                              width: 2, // Logic width
                              height: 50,
                              displayValue: false, // We render text manually
                              margin: 0,
                              background: 'transparent'
                          });
                          (svg as HTMLElement).style.display = 'block';
                      } catch (e) {
                          console.warn("Barcode gen error", code, e);
                          (svg as HTMLElement).style.display = 'none'; // Hide invalid
                      }
                  } else {
                      (svg as HTMLElement).style.display = 'none';
                  }
              });
          }, 50);
          return () => clearTimeout(timer);
      }
  }, [queue, config, activeTab]);

  // --- Handlers ---

  const addToQueue = (product: Product, qty: number = 1) => {
      setQueue(prev => {
          const existing = prev.find(i => i.product.id === product.id);
          if (existing) {
              return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
          }
          return [...prev, { product, quantity: qty }];
      });
  };

  const setQuantity = (productId: number, qty: number) => {
      if (qty <= 0) {
          removeFromQueue(productId);
          return;
      }
      setQueue(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  };

  const removeFromQueue = (productId: number) => {
      setQueue(prev => prev.filter(i => i.product.id !== productId));
  };

  const fillFromStock = () => {
      if (!products) return;
      // Add all products with stock > 0
      const items = products.filter(p => p.stock > 0).map(p => ({ product: p, quantity: p.stock }));
      setQueue(items);
      setActiveTab('queue');
  };

  const applyPreset = (type: string) => {
      // Check hardcoded presets first
      switch(type) {
          case 'thermal_50x25':
              setConfig(prev => ({ ...prev, width: 50, height: 25, paperType: 'thermal', labelsPerRow: 1 }));
              return;
          case 'thermal_40x30':
              setConfig(prev => ({ ...prev, width: 40, height: 30, paperType: 'thermal', labelsPerRow: 1 }));
              return;
          case 'a4_3cols':
              setConfig(prev => ({ ...prev, width: 64, height: 34, paperType: 'a4', labelsPerRow: 3, horizontalGap: 5, verticalGap: 5 }));
              return;
          case 'a4_4cols':
              setConfig(prev => ({ ...prev, width: 48, height: 25, paperType: 'a4', labelsPerRow: 4, horizontalGap: 3, verticalGap: 3 }));
              return;
      }

      // Check saved templates
      const template = savedTemplates.find(t => t.name === type);
      if (template) {
          setConfig({ ...template });
      }
  };

  const saveTemplate = () => {
      if (!newTemplateName) return;
      const newTmpl = { ...config, name: newTemplateName };
      const updated = [...savedTemplates, newTmpl];
      setSavedTemplates(updated);
      localStorage.setItem('barcode_templates', JSON.stringify(updated));
      setIsSavingTemplate(false);
      setNewTemplateName('');
      success('تم حفظ قالب الباركود بنجاح');
  };

  const confirmDeleteTemplate = (name: string) => {
      setConfirmConfig({ isOpen: true, templateName: name });
  };

  const handleDeleteTemplate = () => {
      if (!confirmConfig) return;
      const name = confirmConfig.templateName;
      const updated = savedTemplates.filter(t => t.name !== name);
      setSavedTemplates(updated);
      localStorage.setItem('barcode_templates', JSON.stringify(updated));
      success('تم حذف القالب بنجاح');
      setConfirmConfig(null);
  };

  const handlePrint = () => {
      window.print();
  };

  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US').format(amount);
  };

  // Validation Helper
  const isValidBarcode = (code: string | undefined, format: string) => {
      if (!code) return false;
      if (format === 'EAN13' && (!/^\d+$/.test(code) || code.length !== 13)) return false;
      if (format === 'UPC' && (!/^\d+$/.test(code) || code.length !== 12)) return false;
      if (format === 'CODE39' && !/^[0-9A-Z\-\.\ \$\/\+\%]+$/.test(code)) return false;
      return true;
  };

  return (
    <div className="flex h-full bg-[#f3f4f6] overflow-hidden font-['Tajawal']" dir="rtl">
        
        {/* PRINT STYLES */}
        <style>{`
            @media print {
                @page { 
                    size: ${config.paperType === 'thermal' ? `${config.width}mm ${config.height}mm` : 'A4'}; 
                    margin: 0;
                }
                body * { visibility: hidden; }
                #print-container, #print-container * { visibility: visible; }
                #print-container {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    background: white;
                    padding: ${config.paperType === 'thermal' ? '0' : '2mm'}; /* Safe margin for A4 */
                    box-shadow: none !important;
                }
                .label-item {
                    border: none !important; /* Remove guide borders when printing */
                    box-shadow: none !important;
                    page-break-inside: avoid;
                    margin: 0 !important;
                }
                /* Hide validation warnings on print */
                .print-hidden { display: none !important; }
            }
        `}</style>

        <BarcodePrinterSidebar 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            queueTotal={queueTotal}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            fillFromStock={fillFromStock}
            filteredProducts={filteredProducts}
            queue={queue}
            addToQueue={addToQueue}
            setQuantity={setQuantity}
            removeFromQueue={removeFromQueue}
            setQueue={setQueue}
            formatCurrency={formatCurrency}
            isValidBarcode={isValidBarcode}
            config={config}
            setConfig={setConfig}
            isSavingTemplate={isSavingTemplate}
            setIsSavingTemplate={setIsSavingTemplate}
            newTemplateName={newTemplateName}
            setNewTemplateName={setNewTemplateName}
            saveTemplate={saveTemplate}
        />

        {/* MAIN PANEL: CONFIG & PREVIEW */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#f3f4f6]">
            {activeTab === 'settings' ? (
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                    <div className="max-w-4xl mx-auto">
                        {settings ? (
                            <BarcodeSettings 
                                formData={settings} 
                                handleSettingChange={handleSettingChange} 
                            />
                        ) : (
                            <div className="text-center p-8 text-slate-500">جاري التحميل...</div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <BarcodePrinterToolbar 
                        config={config}
                        setConfig={setConfig}
                        savedTemplates={savedTemplates}
                        applyPreset={applyPreset}
                        deleteTemplate={confirmDeleteTemplate}
                        queueTotal={queueTotal}
                        handlePrint={handlePrint}
                        queueLength={queue.length}
                    />

                    <BarcodePrinterPreview 
                        ref={previewRef}
                        config={config}
                        queue={queue}
                        isValidBarcode={isValidBarcode}
                        formatCurrency={formatCurrency}
                        storeName={settings?.storeName}
                        currency={settings?.currency}
                    />
                </>
            )}
        </div>

        {confirmConfig && (
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title="حذف قالب الملصق"
                message={`هل أنت متأكد من حذف القالب "${confirmConfig.templateName}"؟ لا يمكن استرجاع أبعاد الملصق أو التنسيقات بعد الحذف.`}
                onConfirm={handleDeleteTemplate}
                onCancel={() => setConfirmConfig(null)}
                confirmText="تأكيد الحذف"
                cancelText="إلغاء"
            />
        )}
    </div>
  );
};

export default BarcodePrinter;
