import React from 'react';
import { LayoutTemplate, FolderOpen, Trash2, Palette, ZoomOut, ZoomIn, Monitor, DollarSign, Tag, Save, Printer } from 'lucide-react';
import { SavedSticker } from '../../types';

type DesignType = 'modern' | 'minimal' | 'technical' | 'geometric';

interface StickerSidebarProps {
  savedStickers: SavedSticker[];
  loadSticker: (s: SavedSticker) => void;
  deleteSticker: (id: number) => void;
  designType: DesignType;
  setDesignType: (type: DesignType) => void;
  getDesignName: (t: string) => string;
  borderRadius: number;
  setBorderRadius: (val: number) => void;
  borderWidth: number;
  setBorderWidth: (val: number) => void;
  fontScale: number;
  setFontScale: (val: number) => void;
  data: any;
  setData: (data: any) => void;
  clearForm: () => void;
  stickerTitle: string;
  setStickerTitle: (val: string) => void;
  handleSaveSticker: () => void;
}

const StickerSidebar: React.FC<StickerSidebarProps> = ({
  savedStickers,
  loadSticker,
  deleteSticker,
  designType,
  setDesignType,
  getDesignName,
  borderRadius,
  setBorderRadius,
  borderWidth,
  setBorderWidth,
  fontScale,
  setFontScale,
  data,
  setData,
  clearForm,
  stickerTitle,
  setStickerTitle,
  handleSaveSticker,
}) => {
  return (
    <div className="w-[420px] bg-white border-l border-gray-200 flex flex-col z-20 shadow-xl overflow-y-auto no-print">
      <div className="p-5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-200">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">مصمم الملصقات</h1>
            <p className="text-xs text-gray-500">تخصيص وطباعة المواصفات</p>
          </div>
        </div>
      </div>

      {/* --- SAVED STICKERS LIST --- */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <FolderOpen className="w-3 h-3" />
          التصاميم المحفوظة
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {savedStickers?.map((s) => (
            <div
              key={s.id}
              className="flex items-center bg-gray-100 rounded-lg p-1.5 shrink-0 border border-gray-200 group"
            >
              <button
                onClick={() => loadSticker(s)}
                className="text-xs font-bold text-gray-700 px-2 hover:text-indigo-600 truncate max-w-[100px]"
              >
                {s.title}
              </button>
              <button
                onClick={() => deleteSticker(s.id!)}
                className="text-gray-400 hover:text-red-500 px-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {(!savedStickers || savedStickers.length === 0) && (
            <p className="text-xs text-gray-400 italic px-1">لا توجد تصاميم محفوظة</p>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* --- Design Type Selector --- */}
        <div>
          <label className="text-xs font-bold text-indigo-800 mb-2 block">
            نمط التصميم (Template)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['modern', 'minimal', 'technical', 'geometric'].map((t) => (
              <button
                key={t}
                onClick={() => setDesignType(t as any)}
                className={`py-2 px-3 rounded-lg text-[11px] font-bold border-2 transition-all ${
                  designType === t
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                {getDesignName(t)}
              </button>
            ))}
          </div>
        </div>

        {/* --- Dimensions & Shapes --- */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
          <div className="flex items-center gap-2 text-gray-700 font-bold text-xs mb-1">
            <Palette className="w-3.5 h-3.5" />
            خصائص الشكل
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">تدوير الزوايا</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={borderRadius}
                onChange={(e) => setBorderRadius(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">سماكة الإطار</label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={borderWidth}
                onChange={(e) => setBorderWidth(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-gray-500">حجم الخط (Scale)</label>
              <span className="text-[10px] font-mono bg-white px-1 rounded border">
                {Math.round(fontScale * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ZoomOut className="w-3 h-3 text-gray-400" />
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={fontScale}
                onChange={(e) => setFontScale(Number(e.target.value))}
                className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <ZoomIn className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        </div>

        {/* --- Data Inputs --- */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5 text-gray-400" />
              بيانات الجهاز
            </label>
            <button
              onClick={clearForm}
              className="text-[10px] text-red-500 hover:underline"
            >
              مسح الحقول
            </button>
          </div>

          <input
            type="text"
            value={data.model}
            onChange={(e) => setData({ ...data, model: e.target.value })}
            placeholder="Model Name"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:border-indigo-500 outline-none"
          />
          <input
            type="text"
            value={data.cpu}
            onChange={(e) => setData({ ...data, cpu: e.target.value })}
            placeholder="Processor"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
          />

          <input
            type="text"
            value={data.ram}
            onChange={(e) => setData({ ...data, ram: e.target.value })}
            placeholder="RAM"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={data.ssd}
              onChange={(e) => setData({ ...data, ssd: e.target.value })}
              placeholder="Storage SSD"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
            />
            <input
              type="text"
              value={data.hdd}
              onChange={(e) => setData({ ...data, hdd: e.target.value })}
              placeholder="Storage HDD (Optional)"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <input
            type="text"
            value={data.gpuIntegrated}
            onChange={(e) => setData({ ...data, gpuIntegrated: e.target.value })}
            placeholder="GPU 1"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
          />
          <input
            type="text"
            value={data.gpuDiscrete}
            onChange={(e) => setData({ ...data, gpuDiscrete: e.target.value })}
            placeholder="GPU 2"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={data.os}
              onChange={(e) => setData({ ...data, os: e.target.value })}
              placeholder="OS"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
            />
            <input
              type="text"
              value={data.battery}
              onChange={(e) => setData({ ...data, battery: e.target.value })}
              placeholder="Battery"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            <div className="relative">
              <input
                type="text"
                value={data.price}
                onChange={(e) => setData({ ...data, price: e.target.value })}
                placeholder="السعر"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:border-indigo-500 outline-none text-emerald-600"
              />
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            </div>
            <div className="relative">
              <input
                type="text"
                value={data.originalPrice}
                onChange={(e) => setData({ ...data, originalPrice: e.target.value })}
                placeholder="قبل الخصم (اختياري)"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none text-red-400 decoration-slice"
              />
              <Tag className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            </div>
          </div>
        </div>

        {/* --- Action Buttons --- */}
        <div className="pt-2 border-t border-gray-100 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="اسم للحفظ (اختياري)"
              value={stickerTitle}
              onChange={(e) => setStickerTitle(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
            />
            <button
              onClick={handleSaveSticker}
              className="bg-emerald-600 text-white px-3 rounded-lg hover:bg-emerald-700 transition-colors"
              title="حفظ في قاعدة البيانات"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => window.print()}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            طباعة الملصق
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickerSidebar;
