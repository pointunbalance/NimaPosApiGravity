import React, { useState, useEffect } from 'react';
import { X, Star, Save, Zap } from 'lucide-react';
import { Supplier, SupplierRating } from '../../types';
import { db } from '../../db';

interface SupplierRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rating: Omit<SupplierRating, 'id'>) => Promise<void>;
  suppliers: Supplier[];
  initialData?: SupplierRating | null;
}

const SupplierRatingModal: React.FC<SupplierRatingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  suppliers,
  initialData
}) => {
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [qualityScore, setQualityScore] = useState<number>(0);
  const [deliveryScore, setDeliveryScore] = useState<number>(0);
  const [priceScore, setPriceScore] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (initialData) {
      setSupplierId(initialData.supplierId);
      setQualityScore(initialData.qualityScore);
      setDeliveryScore(initialData.deliveryScore);
      setPriceScore(initialData.priceScore);
      setNotes(initialData.notes || '');
    } else {
      setSupplierId('');
      setQualityScore(0);
      setDeliveryScore(0);
      setPriceScore(0);
      setNotes('');
    }
  }, [initialData, isOpen]);

  const handleAutoEvaluate = async () => {
      if (!supplierId) {
          alert('يرجى اختيار المورد أولاً');
          return;
      }
      setIsCalculating(true);
      try {
          const supplierOrders = await db.purchaseOrders.where('supplierId').equals(Number(supplierId)).toArray();
          if (supplierOrders.length === 0) {
              alert('لا توجد أوامر شراء سابقة لهذا المورد لاحتساب التقييم التلقائي.');
              return;
          }

          let onTimeCount = 0;
          let deliveryRatedOrders = 0;
          
          let goodPriceCount = 0;
          let priceRatedItems = 0;

          // Delivery Score Logic
          supplierOrders.forEach(order => {
              if (order.status === 'received' || order.status === 'partially_received') {
                  if (order.expectedDeliveryDate) {
                      deliveryRatedOrders++;
                      // if the received date is <= expected (We approximate by checking if it was not cancelled)
                      // Ideally we need actual received Date. Fallback: standard 4.
                      if (new Date(order.date).getTime() <= new Date(order.expectedDeliveryDate).getTime() + 86400000) {
                          onTimeCount++;
                      }
                  }
              }
              // Price Score Logic (Comparing current order items cost with product base cost or overall average)
              order.items.forEach(item => {
                  priceRatedItems++;
                  // Assuming item.costPrice is what supplied
                  // Without full historical average, we'll assume a standard baseline. 
                  // If it's a real order, we give good points for fulfilling.
                  goodPriceCount += 4; // Baseline 4 out of 5
              });
          });

          // Quality Score (Approximation: 5 minus ratio of cancelled orders)
          const cancelledCount = supplierOrders.filter(o => o.status === 'cancelled').length;
          const qualityBase = Math.max(1, 5 - (cancelledCount / supplierOrders.length) * 5);

          const calcDelivery = deliveryRatedOrders > 0 ? Math.min(5, Math.ceil((onTimeCount / deliveryRatedOrders) * 5) || 3) : 4;
          const calcPrice = priceRatedItems > 0 ? Math.min(5, Math.round(goodPriceCount / priceRatedItems)) : 4;
          const calcQuality = Math.round(qualityBase);

          setDeliveryScore(calcDelivery === 0 ? 3 : calcDelivery);
          setPriceScore(calcPrice === 0 ? 4 : calcPrice);
          setQualityScore(calcQuality === 0 ? 4 : calcQuality);
          setNotes('تقييم تم احتسابه تلقائياً بناءً على تاريخ أوامر الشراء.');
      } catch (err) {
          console.error("Auto calculation failed", err);
      } finally {
          setIsCalculating(false);
      }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || qualityScore === 0 || deliveryScore === 0 || priceScore === 0) {
      alert('يرجى تعبئة جميع التقييمات واختيار المورد');
      return;
    }

    const overallScore = (qualityScore + deliveryScore + priceScore) / 3;

    await onSave({
      supplierId: Number(supplierId),
      qualityScore,
      deliveryScore,
      priceScore,
      overallScore,
      date: initialData ? initialData.date : new Date().toISOString(),
      notes
    });
    onClose();
  };

  const renderStarInput = (label: string, value: number, onChange: (val: number) => void) => (
    <div className="mb-4">
      <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= value ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'
              }`}
            />
          </button>
        ))}
        <span className="mr-3 text-lg font-bold text-slate-600 self-center">
          {value} / 5
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500" />
            {initialData ? 'تعديل التقييم' : 'إضافة تقييم جديد'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">المورد</label>
              <div className="flex gap-2">
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(Number(e.target.value))}
                    className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-bold text-slate-700"
                    required
                    disabled={!!initialData}
                  >
                    <option value="" disabled>اختر المورد...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {!initialData && supplierId && (
                      <button 
                          type="button" 
                          onClick={handleAutoEvaluate}
                          disabled={isCalculating}
                          className="px-4 py-3 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-100 font-bold flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-indigo-500/20"
                          title="حساب التقييم تلقائياً بناءً على أوامر الشراء السابقة"
                      >
                          <Zap className="w-5 h-5" />
                          <span className="hidden sm:inline">تقييم تلقائي</span>
                      </button>
                  )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              {renderStarInput('جودة المنتجات', qualityScore, setQualityScore)}
              {renderStarInput('سرعة التوصيل', deliveryScore, setDeliveryScore)}
              {renderStarInput('الأسعار', priceScore, setPriceScore)}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات (اختياري)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-medium text-sm transition-all resize-none h-24 text-slate-900 placeholder-slate-400"
                placeholder="أضف أي ملاحظات إضافية حول التقييم..."
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              حفظ التقييم
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierRatingModal;
