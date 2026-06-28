import React from 'react';
import { X, MinusCircle, PlusCircle } from 'lucide-react';
import { OrderItem } from '../../types';

interface RefundModalProps {
  refundItems: {item: OrderItem, refundQty: number, remainingQty: number}[];
  refundReason: string;
  setRefundReason: (reason: string) => void;
  handleRefundQtyChange: (idx: number, delta: number) => void;
  calculateRefundTotal: () => number;
  executePartialRefund: () => void;
  setIsRefundModalOpen: (isOpen: boolean) => void;
  formatCurrency: (amount: number) => string;
}

const RefundModal: React.FC<RefundModalProps> = ({
  refundItems,
  refundReason,
  setRefundReason,
  handleRefundQtyChange,
  calculateRefundTotal,
  executePartialRefund,
  setIsRefundModalOpen,
  formatCurrency
}) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl text-slate-800">تحديد الأصناف المرتجعة</h3>
          <button onClick={() => setIsRefundModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto space-y-3 mb-6 pr-1">
          {refundItems.map((ri, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex-1">
                <p className="font-bold text-sm text-slate-800">{ri.item.name}</p>
                <p className="text-xs text-slate-500">الكمية المتاحة للاسترجاع: {ri.remainingQty}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleRefundQtyChange(idx, -1)} className="p-1.5 bg-white border rounded-lg hover:bg-red-50 text-red-600"><MinusCircle className="w-4 h-4" /></button>
                <span className="w-8 text-center font-bold text-lg">{ri.refundQty}</span>
                <button onClick={() => handleRefundQtyChange(idx, 1)} className="p-1.5 bg-white border rounded-lg hover:bg-green-50 text-green-600"><PlusCircle className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">سبب الاسترجاع</label>
          <input 
            className="w-full px-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
            placeholder="عيوب صناعة، تغيير رأي..."
            value={refundReason}
            onChange={e => setRefundReason(e.target.value)}
          />
        </div>

        <div className="flex justify-between items-center border-t pt-4 mb-4">
          <span className="font-bold text-slate-600">إجمالي قيمة المرتجع</span>
          <span className="font-black text-xl text-red-600">{formatCurrency(calculateRefundTotal())}</span>
        </div>

        <button 
          onClick={executePartialRefund}
          className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
        >
          تأكيد الاسترجاع وإنشاء فاتورة دائنة
        </button>
      </div>
    </div>
  );
};

export default RefundModal;
