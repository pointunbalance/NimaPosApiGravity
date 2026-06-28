import React, { useState } from 'react';
import { X, Printer, AlertCircle, FileText } from 'lucide-react';
import { Order } from '../../types';
import { db } from '../../db';

interface ReturnDetailsProps {
  selectedReturn: Order;
  setSelectedReturn: (order: Order | null) => void;
  setInvoicePreviewOrder: (order: Order | null) => void;
  customerMap: Map<number, string>;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
}

const ReturnDetails: React.FC<ReturnDetailsProps> = ({
  selectedReturn,
  setSelectedReturn,
  setInvoicePreviewOrder,
  customerMap,
  formatCurrency,
  formatDate
}) => {
  const [loadingOriginal, setLoadingOriginal] = useState(false);

  const handleViewOriginalOrder = async () => {
    if (!selectedReturn.parentOrderId) return;
    setLoadingOriginal(true);
    try {
      const originalOrder = await db.orders.get(selectedReturn.parentOrderId);
      if (originalOrder) {
        setInvoicePreviewOrder(originalOrder);
      } else {
        alert('لم يتم العثور على الفاتورة الأصلية');
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء جلب الفاتورة الأصلية');
    } finally {
      setLoadingOriginal(false);
    }
  };

  return (
    <div className="w-full lg:w-[400px] xl:w-[450px] bg-white border-r border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-300 relative z-20">
      <div className="bg-slate-900 text-white p-8 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 opacity-50"></div>
        <button onClick={() => setSelectedReturn(null)} className="absolute top-6 left-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"><X className="w-5 h-5" /></button>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3 opacity-70 text-xs font-mono font-medium tracking-wider">
            <span>مرتجع #{selectedReturn.id}</span>
            <span>•</span>
            <span>{formatDate(selectedReturn.date)}</span>
          </div>
          <div className="flex justify-between items-end mt-6">
            <div>
              <p className="text-slate-400 text-sm mb-1 font-medium">إجمالي المسترد</p>
              <h2 className="text-4xl font-black text-red-400 tracking-tight" dir="ltr">{formatCurrency(Math.abs(selectedReturn.totalAmount))}</h2>
            </div>
            <button 
              onClick={() => setInvoicePreviewOrder(selectedReturn)}
              className="bg-white text-slate-900 p-3.5 rounded-2xl shadow-lg hover:bg-slate-100 transition-all hover:scale-105"
              title="طباعة إيصال المرتجع"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1.5 font-bold">الفاتورة الأصلية</p>
            <div className="flex items-center gap-2">
              <p className="font-mono font-bold text-slate-800 text-base">#{selectedReturn.parentOrderId}</p>
              <button 
                onClick={handleViewOriginalOrder}
                disabled={loadingOriginal}
                className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                title="عرض الفاتورة الأصلية"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="text-left">
            <p className="text-xs text-slate-500 mb-1.5 font-bold">العميل</p>
            <p className="font-bold text-slate-800 text-base">{selectedReturn.customerId ? customerMap.get(selectedReturn.customerId) : 'عميل عام'}</p>
          </div>
        </div>

        {selectedReturn.note && (
          <div className="bg-amber-50 text-amber-800 p-4 rounded-2xl border border-amber-100/50 text-sm font-medium flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{selectedReturn.note}</p>
          </div>
        )}

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">الأصناف المسترجعة ({selectedReturn.items.length})</h4>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {selectedReturn.items.map((item, idx) => (
              <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-red-50 text-red-600 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border border-red-100">
                    {Math.abs(item.quantity)}x
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                  </div>
                </div>
                <span className="font-black text-slate-700 text-base" dir="ltr">{formatCurrency(Math.abs(item.total))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnDetails;
