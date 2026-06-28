import React, { forwardRef } from 'react';
import { ScanLine, AlertTriangle } from 'lucide-react';
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

interface BarcodePrinterPreviewProps {
  config: LabelConfig;
  queue: PrintItem[];
  isValidBarcode: (code: string | undefined, format: string) => boolean;
  formatCurrency: (amount: number) => string;
  storeName?: string;
  currency?: string;
}

const BarcodePrinterPreview = forwardRef<HTMLDivElement, BarcodePrinterPreviewProps>(
  ({ config, queue, isValidBarcode, formatCurrency, storeName, currency }, ref) => {
    return (
      <div className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center items-start">
        <div
          id="print-container"
          ref={ref}
          className={`bg-white shadow-2xl transition-all duration-300 origin-top ${
            config.paperType === 'a4' ? 'min-h-[297mm] p-[5mm]' : 'p-2'
          }`}
          style={{
            width: config.paperType === 'a4' ? '210mm' : 'auto',
            maxWidth: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'flex-start',
            gap: `${config.verticalGap}mm ${config.horizontalGap}mm`,
          }}
        >
          {queue.length === 0 ? (
            <div className="w-full h-64 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 rounded-xl m-4">
              <ScanLine className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-bold">قائمة الطباعة فارغة</p>
              <p className="text-sm">أضف منتجات من القائمة الجانبية</p>
            </div>
          ) : (
            queue
              .flatMap((item) => Array(item.quantity).fill(item.product))
              .map((prod, idx) => {
                const barcodeVal = prod.barcode || String(prod.id).padStart(8, '0');
                const valid = isValidBarcode(barcodeVal, config.format);

                return (
                  <div
                    key={`${prod.id}-${idx}`}
                    className="label-item flex flex-col items-center justify-center bg-white border border-gray-200 text-center overflow-hidden relative break-inside-avoid"
                    style={{
                      width: `${config.width}mm`,
                      height: `${config.height}mm`,
                      padding: '1mm',
                    }}
                  >
                    {config.showStoreName && (
                      <div
                        className="font-bold text-gray-800 leading-none mb-[1mm] w-full truncate"
                        style={{ fontSize: `${config.fontSize * 0.9}pt` }}
                      >
                        {storeName || 'Nima Pos'}
                      </div>
                    )}

                    {config.customText && (
                      <div
                        className="text-gray-600 leading-none mb-[1mm] w-full truncate"
                        style={{ fontSize: `${config.fontSize * 0.8}pt` }}
                      >
                        {config.customText}
                      </div>
                    )}

                    {config.showName && (
                      <div
                        className="font-bold text-black leading-tight w-full line-clamp-2 mb-[1mm]"
                        style={{ fontSize: `${config.fontSize}pt` }}
                      >
                        {prod.name}
                      </div>
                    )}

                    {/* Barcode SVG Container */}
                    <div className="flex-1 w-full flex items-center justify-center overflow-hidden my-[1mm] relative">
                      {!valid && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 print-hidden">
                          <div className="text-red-500 text-[8px] font-bold flex flex-col items-center">
                            <AlertTriangle className="w-4 h-4 mb-1" />
                            صيغة خاطئة
                          </div>
                        </div>
                      )}
                      <svg
                        data-barcode={barcodeVal}
                        data-valid={valid ? 'true' : 'false'}
                        className="w-full h-full max-h-full"
                      ></svg>
                    </div>

                    {config.showCode && (
                      <div
                        className="font-mono text-gray-600 leading-none tracking-wider mb-[1mm]"
                        style={{ fontSize: `${config.fontSize * 0.8}pt` }}
                      >
                        {prod.barcode || prod.id}
                      </div>
                    )}

                    {config.showPrice && (
                      <div
                        className="font-black text-black leading-none"
                        style={{ fontSize: `${config.fontSize * 1.2}pt` }}
                      >
                        {formatCurrency(prod.price)}{' '}
                        <span style={{ fontSize: '0.6em' }}>{currency || 'IQD'}</span>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>
    );
  }
);

BarcodePrinterPreview.displayName = 'BarcodePrinterPreview';

export default BarcodePrinterPreview;
