import React from 'react';
import { X, Printer, ShoppingBag } from 'lucide-react';
import { StoreSaleType } from './storeTypes';

interface StoreSaleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: StoreSaleType | null;
  currency: string;
}

export const StoreSaleDetailModal: React.FC<StoreSaleDetailModalProps> = ({
  isOpen,
  onClose,
  sale,
  currency
}) => {
  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 text-right font-sans" dir="rtl">
      
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header bar closer */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center flex-row-reverse text-right">
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div>
            <h3 className="font-black text-sm tracking-tight">سند مبيعات وفاتورة تفصيلية</h3>
            <p className="text-[10px] text-slate-400 mt-1">معاينة التدوينات والالتزامات الضريبية والمالية</p>
          </div>
        </div>

        {/* Invoice template Area */}
        <div id="store-printable-invoice-receipt" className="p-6 space-y-5 text-right font-sans">
          
          <div className="text-center space-y-1.5 border-b pb-4">
            <h4 className="font-black text-slate-850 text-sm">معسكر النخبة الرياضي المحترف</h4>
            <span className="text-[10px] text-slate-400 block font-bold">فرع المقابلة وتدريبات الكافيتريا</span>
            <span className="text-[10px] text-slate-400 block font-mono">سجل تجاري: #775-992-1</span>
          </div>

          <div className="space-y-2 text-xs font-bold text-slate-655 border-b pb-4">
            <div className="flex justify-between items-center flex-row-reverse text-right">
              <span className="text-slate-400">رقم الفاتورة:</span>
              <span className="font-extrabold text-indigo-700">#{sale.id}</span>
            </div>

            <div className="flex justify-between items-center flex-row-reverse text-right">
              <span className="text-slate-400">قيد اليومية العام:</span>
              <span className="font-mono text-slate-800">{sale.journalRef}</span>
            </div>

            <div className="flex justify-between items-center flex-row-reverse text-right">
              <span className="text-slate-400">اسم المشتري / اللاعب:</span>
              <span className="font-black text-slate-800">{sale.customerName}</span>
            </div>

            <div className="flex justify-between items-center flex-row-reverse text-right">
              <span className="text-slate-400">طريقة الدفع المقيدة:</span>
              <span>{sale.paymentMethod === 'cash' ? '💵 نقدي بالنظام' : '💳 شبكة بنكية دائنة'}</span>
            </div>

            <div className="flex justify-between items-center flex-row-reverse text-right">
              <span className="text-slate-400">تاريخ ووقت التوريد:</span>
              <span className="font-mono text-slate-600">{new Date(sale.date).toLocaleString()}</span>
            </div>
          </div>

          {/* Items checklist */}
          <div className="space-y-2">
            <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 flex-row-reverse text-right border-r-2 border-indigo-600 pr-2">
              <ShoppingBag className="w-4 h-4 text-indigo-500" />
              <span>بنود وفحوص السلّم المباع:</span>
            </h5>

            <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border divide-y divide-slate-100">
              {(sale.items || []).map((item, idx) => (
                <div key={idx} className="py-2 flex justify-between items-center text-xs font-semibold flex-row-reverse text-right">
                  <div className="flex-1 text-right">
                    <span className="font-black text-slate-800 block text-[11px]">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold block">{item.price} x {item.quantity}</span>
                  </div>
                  <span className="font-sans font-black text-slate-800 shrink-0">
                    {item.total.toLocaleString()} {currency}
                  </span>
                </div>
              ))}
            </div>

            {/* Total calculation */}
            <div className="p-3 bg-slate-900 text-white rounded-xl flex justify-between items-center text-xs font-black flex-row-reverse text-right">
              <span>الإجمالي العام الميراد سداده:</span>
              <span className="font-sans text-sm pb-0.5 text-emerald-400">{sale.totalAmount.toLocaleString()} {currency}</span>
            </div>
          </div>

          <p className="text-[9px] text-slate-400 font-bold text-center leading-normal pt-2">
            * تم إصدار هذه الفاتورة محاسبياً تلقائياً بموجب نظام الدفتر المزدوج للمبيعات اليومية للأصول.
          </p>

        </div>

        {/* Buttons drawer */}
        <div className="p-5 bg-slate-50 border-t flex gap-3 text-xs flex-row-reverse">
          <button
            type="button"
            onClick={() => {
              const printContent = document.getElementById('store-printable-invoice-receipt')?.innerHTML;
              if (printContent) {
                const win = window.open('', '', 'width=600,height=800');
                if (win) {
                  win.document.write(`
                    <html dir="rtl">
                      <head>
                        <title>طباعة الفاتورة - معسكر النخبة</title>
                        <style>
                          body { font-family: sans-serif; padding: 25px; text-align: right; }
                          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                          th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: right; }
                        </style>
                      </head>
                      <body>
                        ${printContent}
                      </body>
                    </html>
                  `);
                  win.document.close();
                  win.focus();
                  win.print();
                  win.close();
                }
              }
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg flex items-center justify-center gap-1.5 cursor-pointer flex-row-reverse"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الإيصال فورياً</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold bg-white rounded-lg cursor-pointer"
          >
            إغلاق المعاينة
          </button>
        </div>

      </div>

    </div>
  );
};
export default StoreSaleDetailModal;
