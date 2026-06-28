import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Star, Send, ChefHat, UserCircle2, Sparkles, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../context/ToastContext';

export default function CustomerFeedback() {
  const { success, error: showError } = useToast();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const order = useLiveQuery(() => db.orders.get(Number(orderId)));
  const existingFeedback = useLiveQuery(() => db.customerFeedbacks.where('orderId').equals(Number(orderId)).first());

  const [foodRating, setFoodRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  useEffect(() => {
    if (existingFeedback) {
      setSubmitted(true);
    }
  }, [existingFeedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !order) return;

    if (foodRating === 0 || serviceRating === 0 || cleanlinessRating === 0) {
      showError("يرجى إكمال التقييم لجميع العناصر");
      return;
    }

    try {
      await db.customerFeedbacks.add({
        orderId: Number(orderId),
        date: new Date(),
        foodRating,
        serviceRating,
        cleanlinessRating,
        comment,
        waiterId: order.userId || order.salespersonId,
        waiterName: order.cashierName || 'غير محدد',
        tableNumber: order.tableNumber
      });

      // Simple notification rule: If any rating is poor (<= 2), send an alert
      if (foodRating <= 2 || serviceRating <= 2 || cleanlinessRating <= 2) {
        await db.notifications.add({
          type: 'warning',
          date: new Date(),
          isRead: false,
          title: `تقييم سيء للطاولة: ${order.tableNumber || 'سفري'}`,
          message: `طعام: ${foodRating}، خدمة: ${serviceRating}، نظافة: ${cleanlinessRating}. الويتر: ${order.cashierName || 'غير محدد'}. تعليق: ${comment}`
        });
      }

      success("تم إرسال التقييم بنجاح. شكراً لك!");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      showError("حدث خطأ أثناء حفظ التقييم");
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden" dir="rtl">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center z-10 mx-4 border border-slate-100">
           <h2 className="text-xl font-bold text-slate-800">جاري التحميل...</h2>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 relative overflow-hidden" dir="rtl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -ml-20 -mb-20"></div>

        <div className="bg-white/80 backdrop-blur-md p-10 rounded-3xl shadow-2xl max-w-md w-full text-center z-10 mx-4 border border-white">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">شكراً لتقييمك!</h2>
          <p className="text-slate-600 mb-8 font-medium">نحن نأخذ رأيك بجدية لتحسين خدماتنا.</p>
          <button 
             onClick={() => window.close()}
             className="w-full py-4 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all active:scale-95"
          >
             إغلاق النافذة
          </button>
        </div>
      </div>
    );
  }

  const RatingStars = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => {
    return (
      <div className="flex gap-2 justify-center" dir="ltr">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`transition-all ${value >= star ? 'scale-110 text-amber-400 drop-shadow-md' : 'text-slate-200 hover:text-amber-200 hover:scale-105'}`}
          >
            <Star fill={value >= star ? 'currentColor' : 'none'} size={36} strokeWidth={value >= star ? 1 : 2} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen py-10 px-4 bg-slate-50 flex items-center justify-center relative" dir="rtl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 drop-shadow-2xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 drop-shadow-2xl"></div>

      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden relative z-10 border border-slate-100">
        <div className="bg-slate-900 p-8 text-center text-white pb-12 rounded-b-[3rem] relative shadow-lg">
          <div className="absolute inset-0 overflow-hidden rounded-b-[3rem] opacity-20 pointer-events-none">
             <div className="absolute top-4 right-10 w-2 h-2 rounded-full bg-white animate-ping"></div>
             <div className="absolute bottom-6 left-12 w-1.5 h-1.5 rounded-full bg-white/60"></div>
          </div>
          <Sparkles className="mx-auto w-10 h-10 text-amber-400 mb-3" />
          <h1 className="text-3xl font-black tracking-tight mb-2">كيف كانت تجربتك؟</h1>
          <p className="text-slate-400 font-medium">يسعدنا سماع رأيك لتحسين خدماتنا باستمرار.</p>
          
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white text-slate-800 px-6 py-2 rounded-2xl shadow-xl flex items-center justify-between gap-4 w-10/12 pointer-events-none border border-slate-100">
             <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400">الطلب #</p>
                <p className="font-black text-lg">{order.referenceNumber || order.id}</p>
             </div>
             <div className="w-px h-8 bg-slate-100"></div>
             <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400">التاريخ</p>
                <p className="font-black text-sm">{format(new Date(order.date), 'dd/MM')}</p>
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-16 space-y-8">
          
          <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center gap-2 text-orange-900 mb-2">
              <ChefHat size={24} className="text-orange-500" />
              <h3 className="font-black text-lg">جودة الطعام</h3>
            </div>
            <RatingStars value={foodRating} onChange={setFoodRating} />
          </div>

          <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center gap-2 text-indigo-900 mb-2">
              <UserCircle2 size={24} className="text-indigo-500" />
              <h3 className="font-black text-lg">مستوى الخدمة</h3>
            </div>
            <RatingStars value={serviceRating} onChange={setServiceRating} />
            {order.cashierName && (
               <p className="text-center text-xs text-indigo-500 font-bold bg-white w-fit mx-auto px-3 py-1 rounded-full border border-indigo-100 shadow-sm">الموظف: {order.cashierName}</p>
            )}
          </div>

          <div className="bg-sky-50/50 p-6 rounded-3xl border border-sky-100 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center gap-2 text-sky-900 mb-2">
              <Sparkles size={24} className="text-sky-500" />
              <h3 className="font-black text-lg">النظافة العامة</h3>
            </div>
            <RatingStars value={cleanlinessRating} onChange={setCleanlinessRating} />
          </div>

          <div className="space-y-3">
             <label className="block text-sm font-bold text-slate-700 mx-2">ملاحظات إضافية (اختياري)</label>
             <textarea 
               value={comment}
               onChange={(e) => setComment(e.target.value)}
               className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none resize-none h-24 text-sm font-medium transition-all"
               placeholder="هل يوجد أي شيء آخر ترغب في إضافته؟"
             />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white font-black text-lg rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <Send size={20} /> أرسل التقييم
          </button>
        </form>
      </div>
    </div>
  );
}
