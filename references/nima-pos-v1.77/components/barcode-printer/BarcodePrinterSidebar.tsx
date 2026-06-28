import React from 'react';
import { Search, Package, Plus, Minus, X, ScanLine, Trash2, AlertTriangle, Settings, CheckSquare } from 'lucide-react';
import { Product } from '../../types';

interface PrintItem {
  product: Product;
  quantity: number;
}

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

interface BarcodePrinterSidebarProps {
  activeTab: 'products' | 'queue' | 'settings';
  setActiveTab: (tab: 'products' | 'queue' | 'settings') => void;
  queueTotal: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fillFromStock: () => void;
  filteredProducts: Product[];
  queue: PrintItem[];
  addToQueue: (product: Product, qty?: number) => void;
  setQuantity: (productId: number, qty: number) => void;
  removeFromQueue: (productId: number) => void;
  setQueue: React.Dispatch<React.SetStateAction<PrintItem[]>>;
  formatCurrency: (amount: number) => string;
  isValidBarcode: (code: string | undefined, format: string) => boolean;
  config: LabelConfig;
  setConfig: React.Dispatch<React.SetStateAction<LabelConfig>>;
  isSavingTemplate: boolean;
  setIsSavingTemplate: (val: boolean) => void;
  newTemplateName: string;
  setNewTemplateName: (val: string) => void;
  saveTemplate: () => void;
}

const BarcodePrinterSidebar: React.FC<BarcodePrinterSidebarProps> = ({
  activeTab,
  setActiveTab,
  queueTotal,
  searchTerm,
  setSearchTerm,
  fillFromStock,
  filteredProducts,
  queue,
  addToQueue,
  setQuantity,
  removeFromQueue,
  setQueue,
  formatCurrency,
  isValidBarcode,
  config,
  setConfig,
  isSavingTemplate,
  setIsSavingTemplate,
  newTemplateName,
  setNewTemplateName,
  saveTemplate,
}) => {
  return (
    <div className="w-[400px] bg-white border-l border-gray-200 flex flex-col z-30 shadow-xl">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${
            activeTab === 'products'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-gray-500 hover:bg-gray-50'
          }`}
        >
          المنتجات
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${
            activeTab === 'queue'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-gray-500 hover:bg-gray-50'
          }`}
        >
          القائمة ({queueTotal})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'settings'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          إعدادات
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'settings' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500">
            <Settings className="w-16 h-16 opacity-20 mb-4" />
            <p className="font-bold text-lg text-gray-600">إعدادات الباركود</p>
            <p className="text-sm mt-2">يمكنك تعديل إعدادات التوليد والطباعة من الواجهة الرئيسية.</p>
          </div>
        ) : activeTab === 'products' ? (
          <>
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="بحث عن منتج..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <button
                onClick={fillFromStock}
                className="w-full py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" />
                ملء تلقائي من المخزون
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredProducts.map((p) => {
                const inQueue = queue.find((i) => i.product.id === p.id);
                return (
                  <div
                    key={p.id}
                    className="flex justify-between items-center p-3 bg-white hover:bg-gray-50 border border-gray-100 rounded-xl transition-all group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{p.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span>{formatCurrency(p.price)}</span>
                        <span className="bg-gray-100 px-1.5 rounded">مخزون: {p.stock}</span>
                      </div>
                    </div>
                    {inQueue ? (
                      <div className="flex items-center bg-indigo-50 rounded-lg border border-indigo-100">
                        <button
                          onClick={() => setQuantity(p.id!, inQueue.quantity + 1)}
                          className="p-1.5 hover:bg-white rounded m-0.5 text-indigo-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-indigo-800">
                          {inQueue.quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(p.id!, inQueue.quantity - 1)}
                          className="p-1.5 hover:bg-white rounded m-0.5 text-indigo-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToQueue(p)}
                        className="p-2 bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {queue.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm relative group"
                >
                  <button
                    onClick={() => removeFromQueue(item.product.id!)}
                    className="absolute top-2 left-2 text-gray-300 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-sm font-bold text-gray-800 pr-6 mb-2 truncate">
                    {item.product.name}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      {item.product.barcode}
                      {!isValidBarcode(item.product.barcode, config.format) && (
                        <span className="text-red-500" title="تنسيق غير صالح للصيغة المختارة">
                          <AlertTriangle className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setQuantity(item.product.id!, item.quantity - 1)}
                        className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        onFocus={(e) => e.target.select()}
                        value={item.quantity}
                        onChange={(e) => setQuantity(item.product.id!, Number(e.target.value))}
                        className="w-10 text-center text-sm font-bold bg-transparent outline-none"
                      />
                      <button
                        onClick={() => setQuantity(item.product.id!, item.quantity + 1)}
                        className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {queue.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <ScanLine className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>القائمة فارغة</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setQueue([])}
                className="w-full py-2.5 text-red-600 bg-red-50 border border-red-100 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                إفراغ القائمة
              </button>
            </div>
          </>
        )}
      </div>

      {/* Advanced Settings Area */}
      {activeTab !== 'settings' && (
      <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4 max-h-[350px] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <Settings className="w-3 h-3" />
            تخصيص متقدم
          </div>

          {/* Template Actions */}
          {!isSavingTemplate ? (
            <button
              onClick={() => setIsSavingTemplate(true)}
              className="text-xs text-indigo-600 hover:underline font-bold"
            >
              حفظ كقالب
            </button>
          ) : (
            <div className="flex gap-2 w-full max-w-[200px]">
              <input
                className="flex-1 px-2 py-1 text-xs border rounded outline-none"
                placeholder="اسم القالب"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
              <button
                onClick={saveTemplate}
                className="bg-indigo-600 text-white px-2 rounded text-xs"
              >
                <CheckSquare className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsSavingTemplate(false)}
                className="bg-gray-200 text-gray-600 px-2 rounded text-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* Format Selector */}
          <div>
            <label className="text-[10px] text-gray-500 font-bold block mb-1">
              صيغة الباركود (Format)
            </label>
            <select
              value={config.format}
              onChange={(e) => setConfig({ ...config, format: e.target.value as any })}
              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none cursor-pointer"
            >
              <option value="CODE128">Code 128 (عام - يدعم الحروف)</option>
              <option value="EAN13">EAN-13 (منتجات تجزئة - 13 رقم)</option>
              <option value="UPC">UPC (منتجات أمريكية - 12 رقم)</option>
              <option value="CODE39">Code 39 (صناعي)</option>
              <option value="ITF14">ITF-14 (كرتون)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 font-bold block mb-1">العرض (mm)</label>
              <input
                type="number"
                onFocus={(e) => e.target.select()}
                value={config.width}
                onChange={(e) => setConfig({ ...config, width: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold block mb-1">الارتفاع (mm)</label>
              <input
                type="number"
                onFocus={(e) => e.target.select()}
                value={config.height}
                onChange={(e) => setConfig({ ...config, height: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm text-center"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-bold block mb-1">نص مخصص</label>
            <input
              type="text"
              placeholder="مثال: عرض خاص"
              value={config.customText}
              onChange={(e) => setConfig({ ...config, customText: e.target.value })}
              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 font-bold block mb-1">حجم الخط</label>
              <input
                type="number"
                onFocus={(e) => e.target.select()}
                value={config.fontSize}
                onChange={(e) => setConfig({ ...config, fontSize: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold block mb-1">هامش (Gap)</label>
              <input
                type="number"
                onFocus={(e) => e.target.select()}
                value={config.horizontalGap}
                onChange={(e) => setConfig({ ...config, horizontalGap: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm text-center"
              />
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default BarcodePrinterSidebar;
