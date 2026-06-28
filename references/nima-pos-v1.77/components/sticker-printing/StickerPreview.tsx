import React from 'react';
import { Store, Cpu, CircuitBoard, HardDrive, Terminal, Layers, Gamepad2, Battery } from 'lucide-react';
import { SpecBox, PriceDisplay } from './StickerComponents';

type DesignType = 'modern' | 'minimal' | 'technical' | 'geometric';

interface StickerPreviewProps {
  pageWidth: number;
  pageHeight: number;
  pageUnit: 'cm' | 'mm' | 'in';
  dynamicBaseSize: number;
  designType: DesignType;
  borderRadius: number;
  borderWidth: number;
  settings: any;
  data: any;
}

const StickerPreview: React.FC<StickerPreviewProps> = ({
  pageWidth,
  pageHeight,
  pageUnit,
  dynamicBaseSize,
  designType,
  borderRadius,
  borderWidth,
  settings,
  data,
}) => {
  return (
    <div 
        id="sticker-preview"
        className="bg-white shadow-2xl relative overflow-hidden box-border font-['Tajawal']"
        style={{ 
            width: `${pageWidth}${pageUnit}`, 
            height: `${pageHeight}${pageUnit}`,
            padding: '3%', 
            direction: 'rtl',
            display: 'flex',
            flexDirection: 'column', 
            fontSize: `${dynamicBaseSize}px`,
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff'
        }}
    >
        {/* HEADER */}
        <div className={`flex justify-between items-center shrink-0 mb-[1.5%] ${designType === 'minimal' ? '' : 'border-b border-black pb-[1%]'}`} style={{ borderBottomWidth: designType === 'minimal' ? 0 : `${borderWidth}em` }}>
            <div className="flex items-center gap-[0.5em] w-full">
                {settings?.logo ? (
                    <img src={settings.logo} alt="Logo" className="object-contain max-w-[20%]" style={{ height: '3em' }} />
                ) : (
                    <Store className="text-black shrink-0" style={{width: '1.5em', height: '1.5em'}} />
                )}
                <div className="flex-1 min-w-0">
                    <h2 className="font-black leading-none uppercase tracking-tighter truncate" style={{ fontSize: '1.4em' }}>{settings?.storeName || 'Nima Store'}</h2>
                    {settings?.phone && <p className="font-bold font-mono mt-[0.2em] truncate opacity-70" style={{ fontSize: '0.8em', direction: 'ltr', textAlign: 'right' }}>{settings.phone}</p>}
                </div>
            </div>
        </div>

        {/* MODEL NAME */}
        <div 
            className={`shrink-0 mb-[2%] flex items-center justify-center p-[2%] ${designType === 'minimal' ? 'text-left' : 'bg-black text-white text-center'}`} 
            style={{ borderRadius: `${borderRadius}em` }}
        >
            <span className="font-black uppercase tracking-wide truncate leading-none" style={{ fontSize: '1.6em' }}>{data.model || 'MODEL NAME'}</span>
        </div>

        {/* SPECS GRID */}
        <div 
            className={`grid ${designType === 'minimal' ? 'grid-cols-2 gap-x-[1em] gap-y-[0.5em]' : 'grid-cols-2 gap-[2%]'} flex-1 min-h-0`} 
            style={{ gridAutoRows: '1fr' }} 
        >
            <SpecBox icon={Cpu} label="المعالج" value={data.cpu} designType={designType} borderRadius={borderRadius} borderWidth={borderWidth} />
            <SpecBox icon={CircuitBoard} label="الرام" value={data.ram} designType={designType} borderRadius={borderRadius} borderWidth={borderWidth} />
            
            <SpecBox icon={HardDrive} label="التخزين" value={data.ssd} subValue={data.hdd ? `${data.hdd}` : ''} designType={designType} borderRadius={borderRadius} borderWidth={borderWidth} />
            <SpecBox icon={Terminal} label="النظام" value={data.os} designType={designType} borderRadius={borderRadius} borderWidth={borderWidth} />
            
            {data.gpuIntegrated && (
                <SpecBox icon={Layers} label="كرت شاشة 1" value={data.gpuIntegrated} fullWidth={!data.gpuDiscrete} designType={designType} borderRadius={borderRadius} borderWidth={borderWidth} />
            )}
            
            {data.gpuDiscrete && (
                <SpecBox icon={Gamepad2} label="كرت شاشة 2" value={data.gpuDiscrete} designType={designType} borderRadius={borderRadius} borderWidth={borderWidth} />
            )}

            {(!data.gpuDiscrete || (data.gpuDiscrete && data.gpuIntegrated)) && (
                 <SpecBox icon={Battery} label="البطارية" value={data.battery} fullWidth={data.gpuDiscrete && data.gpuIntegrated} designType={designType} borderRadius={borderRadius} borderWidth={borderWidth} />
            )}

            <PriceDisplay price={data.price} originalPrice={data.originalPrice} designType={designType} borderRadius={borderRadius} borderWidth={borderWidth} />
        </div>

        {/* FOOTER */}
        <div className={`flex justify-between items-end shrink-0 mt-[1.5%] ${designType === 'minimal' ? '' : 'border-t border-black pt-[1%]'}`} style={{ borderTopWidth: designType === 'minimal' ? 0 : `${borderWidth}em` }}>
            <p className="font-mono opacity-50" style={{ fontSize: '0.6em' }}>ID: {Math.floor(Math.random() * 10000)}</p>
            <p className="font-bold uppercase tracking-wide opacity-70" style={{ fontSize: '0.6em' }}>تم الفحص والجودة</p>
        </div>
    </div>
  );
};

export default StickerPreview;
