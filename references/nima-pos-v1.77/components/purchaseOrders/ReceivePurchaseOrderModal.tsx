import React, { useState, useEffect } from 'react';
import { PurchaseOrder, PurchaseOrderItem } from '../../types';
import { X, Package, Box, CheckCircle2 } from 'lucide-react';

interface ReceivePurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  onReceive: (receivedItems: { productId: number, quantity: number, costPrice: number }[], isComplete: boolean) => Promise<void>;
  currency: string;
}

export const ReceivePurchaseOrderModal: React.FC<ReceivePurchaseOrderModalProps> = ({
  isOpen, onClose, order, onReceive, currency
}) => {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (order) {
      const initial: Record<number, number> = {};
      order.items.forEach(item => {
        const remaining = item.quantity - (item.receivedQuantity || 0);
        initial[item.productId] = Math.max(0, remaining);
      });
      setQuantities(initial);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleReceive = async () => {
    setIsProcessing(true);
    try {
      const receivedItemsToPass = order.items.map(item => ({
        productId: item.productId,
        quantity: quantities[item.productId] || 0,
        costPrice: item.costPrice
      })).filter(i => i.quantity > 0);

      if (receivedItemsToPass.length === 0) {
        alert('لم يتم استلام أي كميات.');
        return;
      }

      // Check if this makes the order completely received
      let isComplete = true;
      order.items.forEach(item => {
        const alreadyReceived = item.receivedQuantity || 0;
        const newlyReceived = quantities[item.productId] || 0;
        if (alreadyReceived + newlyReceived < item.quantity) {
          isComplete = false;
        }
      });

      await onReceive(receivedItemsToPass, isComplete);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
            <div>
                <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                    <Box className="text-emerald-500" />
                    استلام بضاعة (أمر شراء P-{order.id})
                </h3>
                <p className="text-slate-500 text-sm mt-1">المورد: {order.supplierName}</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <table className="w-full text-right text-sm border-collapse">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                        <th className="px-4 py-3">المنتج</th>
                        <th className="px-4 py-3 text-center">الكمية المطلوبة</th>
                        <th className="px-4 py-3 text-center">المستلم سابقاً</th>
                        <th className="px-4 py-3 text-center">المتبقي</th>
                        <th className="px-4 py-3 text-center w-32">الكمية المستلمة الآن</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {order.items.map(item => {
                        const remaining = item.quantity - (item.receivedQuantity || 0);
                        return (
                            <tr key={item.productId} className={remaining <= 0 ? "opacity-50" : ""}>
                                <td className="px-4 py-3 font-bold text-slate-800">{item.productName}</td>
                                <td className="px-4 py-3 text-center text-slate-600 font-bold">{item.quantity}</td>
                                <td className="px-4 py-3 text-center text-blue-600 font-bold">{item.receivedQuantity || 0}</td>
                                <td className="px-4 py-3 text-center text-rose-600 font-bold">{remaining}</td>
                                <td className="px-4 py-3 text-center">
                                    <input 
                                        type="number"
                                        min="0"
                                        max={remaining}
                                        value={quantities[item.productId] ?? 0}
                                        onChange={(e) => {
                                            const val = Math.max(0, Math.min(remaining, Number(e.target.value)));
                                            setQuantities(prev => ({...prev, [item.productId]: val}));
                                        }}
                                        disabled={remaining <= 0}
                                        className="w-full px-2 py-1 border border-slate-300 rounded text-center focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
            <button 
                onClick={handleReceive}
                disabled={isProcessing}
                className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50"
            >
                <CheckCircle2 className="w-5 h-5" />
                تأكيد الاستلام
            </button>
            <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50">إلغاء</button>
        </div>
      </div>
    </div>
  );
};
export default ReceivePurchaseOrderModal;
