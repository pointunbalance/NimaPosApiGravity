import React, { useState, useEffect } from 'react';
import { X, AlertCircle, MinusCircle, PlusCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Order, OrderItem } from '../../types';

interface NewReturnModalProps {
  foundOrder: Order | null;
  setFoundOrder: (order: Order | null) => void;
  searchOrderId: string;
  setSearchOrderId: (id: string) => void;
  searchError: string;
  setSearchError: (error: string) => void;
  handleSearchOrder: () => void;
  refundItems: {item: OrderItem, refundQty: number, remainingQty: number}[];
  handleRefundQtyChange: (idx: number, delta: number) => void;
  refundReason: string;
  setRefundReason: (reason: string) => void;
  calculateRefundTotal: () => number;
  executePartialRefund: (warehouseId?: number, method?: string) => void;
  customerMap: Map<number, string>;
  formatCurrency: (amount: number) => string;
  onClose: () => void;
}

const NewReturnModal: React.FC<NewReturnModalProps> = ({
  foundOrder,
  setFoundOrder,
  searchOrderId,
  setSearchOrderId,
  searchError,
  setSearchError,
  handleSearchOrder,
  refundItems,
  handleRefundQtyChange,
  refundReason,
  setRefundReason,
  calculateRefundTotal,
  executePartialRefund,
  customerMap,
  formatCurrency,
  onClose
}) => {
  const warehouses = useLiveQuery(() => db.warehouses.toArray(), []) || [];
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | ''>('');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'credit' | 'wallet' | 'split'>('cash');

  useEffect(() => {
    if (warehouses.length > 0 && selectedWarehouseId === '') {
      const main = warehouses.find(w => w.isMain);
      if (main) setSelectedWarehouseId(main.id!);
      else setSelectedWarehouseId(warehouses[0].id!);
    }
  }, [warehouses]);

  useEffect(() => {
    if (foundOrder) {
      setRefundMethod(foundOrder.paymentMethod as any || 'cash');
    }
  }, [foundOrder]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-black text-2xl text-slate-800">تسجيل مرتجع جديد</h3>
          <button onClick={() => { onClose(); setFoundOrder(null); setSearchOrderId(''); setSearchError(''); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
        </div>

        {!foundOrder ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">رقم الفاتورة الأصلية</label>
              <div className="flex gap-3">
                <input 
                  type="number" 
                  className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white font-mono text-lg transition-all"
                  placeholder="أدخل رقم الفاتورة..."
                  value={searchOrderId}
                  onChange={e => setSearchOrderId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchOrder()}
                  autoFocus
                />
                <button 
                  onClick={handleSearchOrder}
                  className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                  بحث
                </button>
              </div>
              {searchError && (
                <div className="mt-3 flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl text-sm font-bold">
                  <AlertCircle className="w-4 h-4" />
                  {searchError}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">الفاتورة</p>
                <p className="font-mono font-black text-slate-800 text-lg">#{foundOrder.id}</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500 font-bold mb-1">العميل</p>
                <p className="font-bold text-slate-800 text-lg">{foundOrder.customerId ? customerMap.get(foundOrder.customerId) : 'عميل عام'}</p>
              </div>
            </div>

            <div className="max-h-[30vh] overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
              {refundItems.map((ri, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                  <div className="flex-1">
                    <p className="font-bold text-base text-slate-800 mb-1">{ri.item.name}</p>
                    <p className="text-xs font-medium text-slate-500">الكمية المتاحة للاسترجاع: <span className="font-bold text-slate-700">{ri.remainingQty}</span></p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <button onClick={() => handleRefundQtyChange(idx, -1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200 text-red-600 transition-colors shadow-sm"><MinusCircle className="w-4 h-4" /></button>
                    <span className="w-8 text-center font-black text-lg text-slate-800">{ri.refundQty}</span>
                    <button onClick={() => handleRefundQtyChange(idx, 1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-green-50 hover:border-green-200 text-green-600 transition-colors shadow-sm"><PlusCircle className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">إرجاع إلى مستودع</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm font-bold"
                  value={selectedWarehouseId}
                  onChange={e => setSelectedWarehouseId(Number(e.target.value))}
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">طريقة الاسترداد</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm font-bold"
                  value={refundMethod}
                  onChange={e => setRefundMethod(e.target.value as any)}
                >
                  <option value="cash">نقدي</option>
                  <option value="credit">بطاقة ائتمان</option>
                  <option value="wallet">محفظة العميل</option>
                </select>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-2">سبب الاسترجاع <span className="text-slate-400 font-normal">(اختياري)</span></label>
              <input 
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition-all text-sm font-medium"
                placeholder="مثال: عيوب صناعة، تغيير رأي..."
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-6 mb-6">
              <span className="font-bold text-slate-500">إجمالي قيمة المرتجع</span>
              <span className="font-black text-3xl text-red-600 tracking-tight" dir="ltr">{formatCurrency(calculateRefundTotal())}</span>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setFoundOrder(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
              >
                إلغاء
              </button>
              <button 
                onClick={() => executePartialRefund(selectedWarehouseId ? Number(selectedWarehouseId) : undefined, refundMethod)}
                className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-95"
              >
                تأكيد الاسترجاع
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewReturnModal;
