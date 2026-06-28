import React from 'react';
import { Tag, DollarSign, Cpu, CircuitBoard, HardDrive, Terminal, Layers, Gamepad2, Battery } from 'lucide-react';

type DesignType = 'modern' | 'minimal' | 'technical' | 'geometric';

interface SpecBoxProps {
  icon: any;
  label: string;
  value: string;
  subValue?: string;
  highlight?: boolean;
  fullWidth?: boolean;
  designType: DesignType;
  borderRadius: number;
  borderWidth: number;
}

export const SpecBox: React.FC<SpecBoxProps> = ({ icon: Icon, label, value, subValue, highlight = false, fullWidth = false, designType, borderRadius, borderWidth }) => {
  if (!value) return null;

  // Modern (Grid with Borders)
  if (designType === 'modern') {
      return (
        <div 
            className={`flex flex-col justify-center items-center text-center relative overflow-hidden border-black/80 ${fullWidth ? 'col-span-2' : 'col-span-1'} ${highlight ? 'bg-black text-white' : 'bg-white text-black'}`}
            style={{ 
                borderWidth: `${borderWidth}em`, 
                borderRadius: `${borderRadius}em`, 
                padding: '0.5em',
            }}
        >
            <div className="flex items-center gap-[0.3em] mb-[0.1em] opacity-70">
                <Icon style={{ width: '0.8em', height: '0.8em' }} />
                <span className="font-bold uppercase tracking-wider" style={{ fontSize: '0.65em' }}>{label}</span>
            </div>
            <div className="flex flex-col justify-center items-center w-full flex-1">
                <span className="font-black leading-none w-full break-words" style={{ fontSize: '1.2em' }} dir="ltr">{value}</span>
                {subValue && <span className="opacity-80 mt-[0.1em]" style={{ fontSize: '0.6em' }} dir="ltr">{subValue}</span>}
            </div>
        </div>
      );
  }

  // Minimal (Clean, Lines)
  if (designType === 'minimal') {
      return (
        <div className={`flex flex-col justify-center items-start text-right px-[0.5em] py-[0.3em] ${fullWidth ? 'col-span-2' : 'col-span-1'} border-b border-gray-200 h-full`}>
            <div className="flex items-center gap-[0.4em] text-gray-500 mb-[0.1em] shrink-0">
                <Icon style={{ width: '0.7em', height: '0.7em' }} />
                <span className="text-[0.6em] uppercase tracking-widest">{label}</span>
            </div>
            <span className="font-bold text-black leading-tight w-full whitespace-normal break-words flex-1" style={{ fontSize: '1em' }} dir="ltr">
                {value} 
                {subValue && <span className="text-gray-500 text-[0.8em] ml-1"> + {subValue}</span>}
            </span>
        </div>
      );
  }

  // Technical (Dark Headers)
  if (designType === 'technical') {
      return (
        <div className={`flex flex-col border border-black overflow-hidden ${fullWidth ? 'col-span-2' : 'col-span-1'}`} style={{ borderRadius: `${borderRadius * 0.5}em` }}>
            <div className="bg-black text-white px-[0.4em] py-[0.1em] flex items-center gap-[0.3em]">
                <Icon style={{ width: '0.6em', height: '0.6em' }} />
                <span className="font-bold uppercase" style={{ fontSize: '0.5em' }}>{label}</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-[0.3em] bg-white text-black text-center">
                <span className="font-bold leading-none" style={{ fontSize: '0.9em' }} dir="ltr">{value}</span>
                {subValue && <span className="text-[0.7em] mt-[0.1em]" dir="ltr">{subValue}</span>}
            </div>
        </div>
      );
  }

  // Geometric (Shapes)
  if (designType === 'geometric') {
      return (
        <div className={`relative flex items-center gap-[0.5em] ${fullWidth ? 'col-span-2' : 'col-span-1'} bg-gray-100 p-[0.4em]`} style={{ borderRadius: `${borderRadius}em` }}>
            <div className={`w-[2em] h-[2em] flex items-center justify-center rounded-full shrink-0 ${highlight ? 'bg-black text-white' : 'bg-white text-black shadow-sm'}`}>
                <Icon style={{ width: '1em', height: '1em' }} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[0.5em] uppercase font-bold opacity-50">{label}</span>
                <span className="font-black leading-tight whitespace-normal break-words" style={{ fontSize: '0.9em' }} dir="ltr">{value}</span>
                {subValue && <span className="opacity-70 whitespace-normal break-words mt-[0.1em]" style={{ fontSize: '0.6em' }} dir="ltr">+ {subValue}</span>}
            </div>
        </div>
      );
  }

  return null;
};

interface PriceDisplayProps {
  price: string;
  originalPrice?: string;
  designType: DesignType;
  borderRadius: number;
  borderWidth: number;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ price, originalPrice, designType, borderRadius, borderWidth }) => {
  if (!price) return null;
  
  const hasDiscount = originalPrice && originalPrice.trim() !== '' && originalPrice !== price;

  // Modern
  if (designType === 'modern') {
      return (
        <div 
            className={`flex flex-col justify-center items-center text-center relative overflow-hidden border-black/80 col-span-2 bg-black text-white`}
            style={{ 
                borderWidth: `${borderWidth}em`, 
                borderRadius: `${borderRadius}em`, 
                padding: '0.5em',
            }}
        >
            <div className="flex items-center gap-[0.3em] mb-[0.1em] opacity-70">
                <Tag style={{ width: '0.8em', height: '0.8em' }} />
                <span className="font-bold uppercase tracking-wider" style={{ fontSize: '0.65em' }}>السعر</span>
            </div>
            <div className="flex flex-row items-baseline justify-center gap-[0.5em] w-full flex-1">
                {hasDiscount && (
                    <span className="opacity-60 line-through decoration-red-500 decoration-2" style={{ fontSize: '0.9em' }} dir="ltr">{originalPrice}</span>
                )}
                <span className="font-black leading-none" style={{ fontSize: '1.5em' }} dir="ltr">{price}</span>
            </div>
        </div>
      );
  }

  // Minimal
  if (designType === 'minimal') {
      return (
        <div className={`flex flex-col justify-center items-start text-right px-[0.5em] py-[0.3em] col-span-2 border-b border-gray-200 h-full`}>
            <div className="flex items-center gap-[0.4em] text-gray-500 mb-[0.1em] shrink-0">
                <DollarSign style={{ width: '0.7em', height: '0.7em' }} />
                <span className="text-[0.6em] uppercase tracking-widest">السعر</span>
            </div>
            <div className="flex items-center gap-2 w-full">
                <span className="font-black text-black leading-tight" style={{ fontSize: '1.2em' }} dir="ltr">{price}</span>
                {hasDiscount && (
                    <span className="text-gray-400 line-through text-[0.8em]" dir="ltr">{originalPrice}</span>
                )}
            </div>
        </div>
      );
  }

  // Technical
  if (designType === 'technical') {
      return (
        <div className={`flex flex-col border border-black overflow-hidden col-span-2`} style={{ borderRadius: `${borderRadius * 0.5}em` }}>
            <div className="bg-black text-white px-[0.4em] py-[0.1em] flex items-center gap-[0.3em]">
                <Tag style={{ width: '0.6em', height: '0.6em' }} />
                <span className="font-bold uppercase" style={{ fontSize: '0.5em' }}>PRICE</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-[0.3em] bg-white text-black text-center">
                {hasDiscount && (
                    <span className="text-[0.7em] text-gray-500 line-through mb-[0.1em]" dir="ltr">{originalPrice}</span>
                )}
                <span className="font-bold leading-none" style={{ fontSize: '1.1em' }} dir="ltr">{price}</span>
            </div>
        </div>
      );
  }

  // Geometric
  if (designType === 'geometric') {
      return (
        <div className={`relative flex items-center gap-[0.5em] col-span-2 bg-gray-900 text-white p-[0.4em]`} style={{ borderRadius: `${borderRadius}em` }}>
            <div className={`w-[2em] h-[2em] flex items-center justify-center rounded-full shrink-0 bg-white text-black`}>
                <DollarSign style={{ width: '1em', height: '1em' }} />
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[0.5em] uppercase font-bold opacity-70">السعر النهائي</span>
                <div className="flex items-baseline gap-2">
                    <span className="font-black leading-none truncate" style={{ fontSize: '1.2em' }} dir="ltr">{price}</span>
                    {hasDiscount && (
                        <span className="opacity-60 line-through text-[0.7em]" dir="ltr">{originalPrice}</span>
                    )}
                </div>
            </div>
        </div>
      );
  }

  return null;
}
