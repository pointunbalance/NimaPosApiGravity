import React from 'react';
import { Ruler } from 'lucide-react';

interface StickerToolbarProps {
  handlePresetChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  pageWidth: number;
  setPageWidth: (val: number) => void;
  pageHeight: number;
  setPageHeight: (val: number) => void;
  pageUnit: 'cm' | 'mm' | 'in';
  setPageUnit: (val: 'cm' | 'mm' | 'in') => void;
}

const StickerToolbar: React.FC<StickerToolbarProps> = ({
  handlePresetChange,
  pageWidth,
  setPageWidth,
  pageHeight,
  setPageHeight,
  pageUnit,
  setPageUnit,
}) => {
  return (
    <div className="mb-6 flex items-center gap-4 bg-white px-4 py-2 rounded-full shadow-sm no-print">
      <div className="flex items-center gap-2">
        <Ruler className="w-4 h-4 text-gray-400" />
        <select
          onChange={handlePresetChange}
          className="text-sm bg-transparent font-bold outline-none cursor-pointer"
        >
          <option value="0">10x7.5 cm (Laptop)</option>
          <option value="1">5x3 cm (Small)</option>
          <option value="2">10x15 cm (Shipping)</option>
          <option value="3">A4</option>
        </select>
      </div>
      <div className="w-[1px] h-4 bg-gray-200"></div>
      <div className="flex gap-2 text-sm font-mono text-gray-600">
        <span>
          W:{' '}
          <input
            type="number"
            onFocus={(e) => e.target.select()}
            value={pageWidth}
            onChange={(e) => setPageWidth(Number(e.target.value))}
            className="w-12 bg-gray-100 rounded px-1 text-center"
          />
        </span>
        <span>
          H:{' '}
          <input
            type="number"
            onFocus={(e) => e.target.select()}
            value={pageHeight}
            onChange={(e) => setPageHeight(Number(e.target.value))}
            className="w-12 bg-gray-100 rounded px-1 text-center"
          />
        </span>
        <select
          value={pageUnit}
          onChange={(e) => setPageUnit(e.target.value as any)}
          className="bg-transparent font-bold"
        >
          <option value="cm">cm</option>
          <option value="mm">mm</option>
        </select>
      </div>
    </div>
  );
};

export default StickerToolbar;
