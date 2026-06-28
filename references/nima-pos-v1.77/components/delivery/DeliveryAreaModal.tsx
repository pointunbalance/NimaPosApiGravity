import React, { useState, useEffect } from 'react';
import { DeliveryArea } from '../../types';
import { db } from '../../db';
import { X, MapPin } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface DeliveryAreaModalProps {
  area?: DeliveryArea;
  onClose: () => void;
}

export default function DeliveryAreaModal({ area, onClose }: DeliveryAreaModalProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<Partial<DeliveryArea>>({
    name: '',
    deliveryFee: 0,
    isActive: true,
    notes: ''
  });

  useEffect(() => {
    if (area) {
      setFormData(area);
    }
  }, [area]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
       showToast('اسم المنطقة مطلوب', 'warning');
       return;
    }

    try {
      if (area && area.id) {
        await db.deliveryAreas.update(area.id, formData);
        showToast('تم التحديث بنجاح', 'success');
      } else {
        await db.deliveryAreas.add(formData as DeliveryArea);
        showToast('تم الإضافة بنجاح', 'success');
      }
      onClose();
    } catch (err) {
      showToast('حدث خطأ أثناء الحفظ', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" dir="rtl">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <MapPin className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold text-slate-800 text-lg">{area ? 'تعديل منطقة' : 'منطقة جديدة'}</h3>
               <p className="text-xs text-slate-500">إعداد قيم التوصيل للمنطقة</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-right">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">اسم المنطقة <span className="text-red-500">*</span></label>
            <input 
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="مثال: حي الشاطئ, جنوب المدينة..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">رسوم التوصيل</label>
            <div className="relative">
              <input 
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.deliveryFee}
                onChange={e => setFormData({...formData, deliveryFee: Number(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-left"
                dir="ltr"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">SAR</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات (اختياري)</label>
            <textarea 
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              rows={3}
              placeholder="أي تفاصيل أو ملاحظات عن هذه المنطقة..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
             <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.isActive ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${formData.isActive ? 'left-1' : 'left-7'}`} />
             </div>
             <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">تفعيل التوصيل للمنطقة</span>
          </label>

          <div className="pt-4 border-t border-slate-100 flex gap-3">
             <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-bold shadow-md shadow-indigo-200 transition-all">حفظ المنطقة</button>
             <button type="button" onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-6 py-3 font-bold transition-all">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}
