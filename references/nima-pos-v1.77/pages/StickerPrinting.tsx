import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { SavedSticker } from '../types';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';

import StickerSidebar from '../components/sticker-printing/StickerSidebar';
import StickerToolbar from '../components/sticker-printing/StickerToolbar';
import StickerPreview from '../components/sticker-printing/StickerPreview';

type DesignType = 'modern' | 'minimal' | 'technical' | 'geometric';

const StickerPrinting: React.FC = () => {
  const { success, error: showError } = useToast();
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const savedStickers = useLiveQuery(() => db.savedStickers.toArray().then(arr => arr.sort((a,b) => b.updatedAt.getTime() - a.updatedAt.getTime())), []);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; stickerId: number } | null>(null);
  
  // --- Configuration State ---
  const [pageWidth, setPageWidth] = useState<number>(10);
  const [pageHeight, setPageHeight] = useState<number>(15);
  const [pageUnit, setPageUnit] = useState<'cm' | 'mm' | 'in'>('cm');
  const [fontScale, setFontScale] = useState<number>(1);
  const [designType, setDesignType] = useState<DesignType>('modern');
  const [borderRadius, setBorderRadius] = useState<number>(0.5); // em
  const [borderWidth, setBorderWidth] = useState<number>(0.15); // em

  // --- Data State ---
  const [stickerTitle, setStickerTitle] = useState('');
  const [data, setData] = useState({
      model: 'Dell Latitude 7490',
      cpu: 'Intel Core i7-8650U vPro',
      ram: '16GB DDR4 2400MHz',
      ssd: '512GB NVMe M.2',
      hdd: '',
      gpuIntegrated: 'Intel UHD Graphics 620',
      gpuDiscrete: 'NVIDIA GeForce MX130 2GB',
      os: 'Windows 11 Pro Original',
      battery: 'Excellent Health',
      price: '8500',
      originalPrice: '9500' // Optional: Price before discount
  });

  // --- Handlers ---

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const idx = Number(e.target.value);
      const paperPresets = [
        { name: 'ملصق لابتوب (10x7.5 cm)', w: 10, h: 7.5, u: 'cm' },
        { name: 'ملصق صغير (5x3 cm)', w: 5, h: 3, u: 'cm' },
        { name: 'ملصق شحن (10x15 cm)', w: 10, h: 15, u: 'cm' },
        { name: 'ورقة A4 (21x29.7 cm)', w: 21, h: 29.7, u: 'cm' },
        { name: 'ورقة A5 (14.8x21 cm)', w: 14.8, h: 21, u: 'cm' },
      ];
      if (idx >= 0) {
          const p = paperPresets[idx];
          setPageWidth(p.w);
          setPageHeight(p.h);
          setPageUnit(p.u as any);
          setFontScale(1);
      }
  };

  const handleSaveSticker = async () => {
      const title = stickerTitle || data.model || 'Untitled Sticker';
      try {
          const payload: SavedSticker = {
              title,
              data: { ...data },
              config: {
                  width: pageWidth,
                  height: pageHeight,
                  unit: pageUnit,
                  fontScale,
                  designType,
                  borderRadius,
                  borderWidth
              },
              updatedAt: new Date()
          };
          
          await db.savedStickers.add(payload);
          setStickerTitle('');
          success('تم حفظ ملصق المواصفات بنجاح');
      } catch (e) {
          console.error(e);
          showError('حدث خطأ أثناء حفظ التصميم');
      }
  };

  const loadSticker = (s: SavedSticker) => {
      setData(s.data);
      setPageWidth(s.config.width);
      setPageHeight(s.config.height);
      setPageUnit(s.config.unit as any);
      setFontScale(s.config.fontScale);
      setDesignType(s.config.designType);
      setBorderRadius(s.config.borderRadius || 0.5);
      setBorderWidth(s.config.borderWidth || 0.15);
      setStickerTitle(s.title);
      success('تم تحميل القالب بنجاح');
  };

  const confirmDeleteSticker = (id: number) => {
      setConfirmConfig({ isOpen: true, stickerId: id });
  };

  const handleDeleteSticker = async () => {
      if (!confirmConfig) return;
      try {
          await db.savedStickers.delete(confirmConfig.stickerId);
          success('تم حذف الملصق بنجاح');
      } catch (err) {
          console.error(err);
          showError('فشل حذف التصميم');
      }
      setConfirmConfig(null);
  };

  const clearForm = () => {
    setData({
        model: '', cpu: '', ram: '', ssd: '', hdd: '', 
        gpuIntegrated: '', gpuDiscrete: '', os: '', battery: '',
        price: '', originalPrice: ''
    });
    setStickerTitle('');
  };

  const dynamicBaseSize = useMemo(() => {
      let w = pageWidth;
      let h = pageHeight;
      if (pageUnit === 'mm') { w /= 10; h /= 10; }
      if (pageUnit === 'in') { w *= 2.54; h *= 2.54; }
      const wPx = w * 37.8;
      const hPx = h * 37.8;
      const minDim = Math.min(wPx, hPx);
      let base = minDim / 22; 
      return Math.max(base * fontScale, 8); 
  }, [pageWidth, pageHeight, pageUnit, fontScale]);

  const getDesignName = (t: string) => {
      switch(t) {
          case 'modern': return 'حديث (Modern)';
          case 'minimal': return 'بسيط (Minimal)';
          case 'technical': return 'تقني (Technical)';
          case 'geometric': return 'هندسي (Geometric)';
          default: return t;
      }
  };

  return (
    <div className="flex h-full bg-[#f3f4f6] overflow-hidden font-['Tajawal']" dir="rtl">
        
        {/* Dynamic Print Style */}
        <style>{`
            @media print {
                @page { 
                    size: ${pageWidth}${pageUnit} ${pageHeight}${pageUnit}; 
                    margin: 0; 
                }
                body * { visibility: hidden; }
                #sticker-preview, #sticker-preview * { visibility: visible; }
                #sticker-preview { 
                    position: absolute; 
                    left: 0;
                    top: 0;
                    width: ${pageWidth}${pageUnit} !important; 
                    height: ${pageHeight}${pageUnit} !important; 
                    border: none !important;
                    background: white;
                    display: flex;
                    flex-direction: column;
                    padding: 0;
                    margin: 0;
                    box-sizing: border-box;
                    page-break-inside: avoid;
                    overflow: hidden;
                }
                .no-print { display: none !important; }
            }
        `}</style>

        <StickerSidebar 
            savedStickers={savedStickers || []}
            loadSticker={loadSticker}
            deleteSticker={confirmDeleteSticker}
            designType={designType}
            setDesignType={setDesignType}
            getDesignName={getDesignName}
            borderRadius={borderRadius}
            setBorderRadius={setBorderRadius}
            borderWidth={borderWidth}
            setBorderWidth={setBorderWidth}
            fontScale={fontScale}
            setFontScale={setFontScale}
            data={data}
            setData={setData}
            clearForm={clearForm}
            stickerTitle={stickerTitle}
            setStickerTitle={setStickerTitle}
            handleSaveSticker={handleSaveSticker}
        />

        {/* RIGHT: PREVIEW AREA */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-200 relative overflow-auto p-8">
            <StickerToolbar 
                handlePresetChange={handlePresetChange}
                pageWidth={pageWidth}
                setPageWidth={setPageWidth}
                pageHeight={pageHeight}
                setPageHeight={setPageHeight}
                pageUnit={pageUnit}
                setPageUnit={setPageUnit}
            />

            <StickerPreview 
                pageWidth={pageWidth}
                pageHeight={pageHeight}
                pageUnit={pageUnit}
                dynamicBaseSize={dynamicBaseSize}
                designType={designType}
                borderRadius={borderRadius}
                borderWidth={borderWidth}
                settings={settings}
                data={data}
            />
        </div>

        {confirmConfig && (
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title="حذف تصميم الملصق"
                message="هل أنت متأكد من حذف قالب تصميم ملصق اللابتوب/المواصفات هذا نهائياً؟ لا يمكن الاسترجاع بعد الحذف."
                onConfirm={handleDeleteSticker}
                onCancel={() => setConfirmConfig(null)}
                confirmText="تأكيد الحذف"
                cancelText="إلغاء"
            />
        )}
    </div>
  );
};

export default StickerPrinting;
