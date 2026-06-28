import React, { useMemo } from 'react';
import { X, Award, AlertCircle } from 'lucide-react';
import { RFQ, Product, Supplier } from '../../types';

interface CompareRFQsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfqs: RFQ[];
  products: Product[];
  suppliers: Supplier[];
  currency: string;
}

export const CompareRFQsModal: React.FC<CompareRFQsModalProps> = ({
  isOpen, onClose, rfqs, products, suppliers, currency
}) => {
  const comparisonData = useMemo(() => {
    // We want to group everything by product, then list all suppliers who quoted that product
    const productMap = new Map<number, {
        productName: string,
        quotes: { supplierName: string, rfqNumber: string, price: number, rfqId: number, status: string }[]
    }>();

    // Only consider active/received/accepted RFQs (exclude draft, rejected, cancelled)
    const validRFQs = rfqs?.filter(r => ['sent', 'received', 'accepted'].includes(r.status)) || [];

    validRFQs.forEach(rfq => {
        const supplier = suppliers.find(s => s.id === rfq.supplierId)?.name || 'مورد مجهول';
        
        rfq.items.forEach(item => {
            if (item.quotedPrice && item.quotedPrice > 0) {
                const prod = products.find(p => p.id === item.productId);
                const pName = prod?.name || `Product #${item.productId}`;
                
                if (!productMap.has(item.productId)) {
                    productMap.set(item.productId, { productName: pName, quotes: [] });
                }
                
                productMap.get(item.productId)!.quotes.push({
                    supplierName: supplier,
                    rfqNumber: rfq.rfqNumber,
                    price: item.quotedPrice,
                    rfqId: rfq.id!,
                    status: rfq.status
                });
            }
        });
    });

    const result = Array.from(productMap.values());
    result.forEach(prod => {
        prod.quotes.sort((a, b) => a.price - b.price); // Lowest price first
    });
    
    return result.sort((a, b) => a.productName.localeCompare(b.productName));
  }, [rfqs, products, suppliers]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-[2rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 shrink-0">
                <div>
                    <h3 className="font-extrabold text-xl text-slate-800 flex items-center gap-2">
                        مقارنة عروض الأسعار
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">يعرض هذا التقرير مقارنة لأفضل الأسعار لكل منتج من عروض الموردين الحالية.</p>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {comparisonData.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-lg font-bold text-slate-500">لا توجد عروض أسعار مسعرة متاحة للمقارنة</h4>
                        <p className="text-sm text-slate-400 mt-1">يرجى إضافة عروض أسعار ووضع السعر المعروض (Quoted Price).</p>
                    </div>
                ) : (
                    comparisonData.map((prod, idx) => {
                        const bestPrice = prod.quotes[0]?.price;
                        
                        return (
                            <div key={idx} className="bg-white border text-right border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                                    <h4 className="font-bold text-lg text-slate-800">{prod.productName}</h4>
                                    <span className="text-sm font-semibold text-slate-500">{prod.quotes.length} عروض استيراد</span>
                                </div>
                                <div className="p-4 overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-slate-500 border-b border-slate-100">
                                                <th className="pb-3 px-4 font-semibold text-right">المورد</th>
                                                <th className="pb-3 px-4 font-semibold text-center">رقم العرض</th>
                                                <th className="pb-3 px-4 font-semibold text-center">حالة العرض</th>
                                                <th className="pb-3 px-4 font-semibold text-center">السعر المقدم</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {prod.quotes.map((q, qIdx) => {
                                                const isBest = q.price === bestPrice;
                                                return (
                                                    <tr key={qIdx} className={`border-b border-slate-50 ${isBest ? 'bg-emerald-50/50' : ''}`}>
                                                        <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                                                            {isBest && <span title="أفضل سعر"><Award className="w-4 h-4 text-emerald-500" /></span>}
                                                            {q.supplierName}
                                                        </td>
                                                        <td className="py-3 px-4 text-center font-semibold text-slate-600">{q.rfqNumber}</td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">
                                                                {q.status === 'accepted' ? 'مقبول' : q.status === 'received' ? 'مستلم' : 'مرسل'}
                                                            </span>
                                                        </td>
                                                        <td className={`py-3 px-4 text-center font-black ${isBest ? 'text-emerald-600 text-lg' : 'text-slate-600'}`}>
                                                            {q.price.toLocaleString()} {currency}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                <button onClick={onClose} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all">
                    إغلاق
                </button>
            </div>
        </div>
    </div>
  );
};

export default CompareRFQsModal;
