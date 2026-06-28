import React from 'react';
import { LayoutTemplate, ChevronDown, Trash2, Printer } from 'lucide-react';

interface LabelConfig {
  name?: string;
  width: number;
  height: number;
  horizontalGap: number;
  verticalGap: number;
  fontSize: number;
  showName: boolean;
  showPrice: boolean;
  showCode: boolean;
  showStoreName: boolean;
  customText: string;
  format: 'CODE128' | 'CODE39' | 'EAN13' | 'UPC' | 'ITF14' | 'MSI';
  paperType: 'thermal' | 'a4';
  labelsPerRow: number;
}

interface BarcodePrinterToolbarProps {
  config: LabelConfig;
  setConfig: React.Dispatch<React.SetStateAction<LabelConfig>>;
  savedTemplates: LabelConfig[];
  applyPreset: (type: string) => void;
  deleteTemplate: (name: string) => void;
  queueTotal: number;
  handlePrint: () => void;
  queueLength: number;
}

const BarcodePrinterToolbar: React.FC<BarcodePrinterToolbarProps> = ({
  config,
  setConfig,
  savedTemplates,
  applyPreset,
  deleteTemplate,
  queueTotal,
  handlePrint,
  queueLength,
}) => {
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-indigo-600" />
          <span className="font-bold text-gray-700">القالب:</span>
          <div className="relative group">
            <select
              className="bg-gray-100 border-none text-sm font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:bg-gray-200 transition-colors appearance-none pr-8"
              onChange={(e) => applyPreset(e.target.value)}
              value={config.name || ''}
            >
              <option value="">اختر قالب...</option>
              <optgroup label="افتراضي">
                <option value="thermal_50x25">حراري 50x25 مم</option>
                <option value="thermal_40x30">حراري 40x30 مم</option>
                <option value="a4_3cols">ورق A4 (3 أعمدة)</option>
                <option value="a4_4cols">ورق A4 (4 أعمدة)</option>
              </optgroup>
              {savedTemplates.length > 0 && (
                <optgroup label="قوالبي المحفوظة">
                  {savedTemplates.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Delete saved template button */}
          {savedTemplates.some((t) => t.name === config.name) && (
            <button
              onClick={() => deleteTemplate(config.name!)}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="حذف القالب الحالي"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="h-6 w-[1px] bg-gray-200"></div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.showName}
              onChange={(e) => setConfig({ ...config, showName: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm">الاسم</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.showPrice}
              onChange={(e) => setConfig({ ...config, showPrice: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm">السعر</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.showCode}
              onChange={(e) => setConfig({ ...config, showCode: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm">الكود</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden xl:block">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            إجمالي الملصقات
          </p>
          <p className="text-sm font-bold text-gray-800">{queueTotal}</p>
        </div>
        <button
          onClick={handlePrint}
          disabled={queueLength === 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة</span>
        </button>
      </div>
    </div>
  );
};

export default BarcodePrinterToolbar;
