import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { TrendingUp, Clock, Target, AlertTriangle, ChefHat, Utensils, CreditCard } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';

export default function PerformanceMatrix() {
  const users = useLiveQuery(() => db.users.toArray());
  const orders = useLiveQuery(() => db.orders.toArray());
  const products = useLiveQuery(() => db.products.toArray());
  const adjustments = useLiveQuery(() => db.stockAdjustments.where('reason').anyOf('wastage', 'shortage', 'damage').toArray());

  const userStats = useMemo(() => {
    if (!users || !orders || !products || !adjustments) return [];

    const stats = users.map(user => {
      let type = '';
      let score = 0;
      let label = '';
      let details = '';

      if (user.role === 'waiter' || user.jobTitle?.includes('ويتر') || user.jobTitle?.includes('مقدم')) {
        type = 'waiter';
        label = 'مؤشر سرعة الخدمة';
        // Calculate average time from order start (فتح الطاولة) to completion (إغلاق الفاتورة) for dine-in
        const userOrders = orders.filter(o => o.orderType === 'dine-in' && (o.userId === user.id || o.salespersonId === user.id) && o.completedAt);
        if (userOrders.length > 0) {
          const totalMins = userOrders.reduce((sum, o) => {
             return sum + differenceInMinutes(new Date(o.completedAt!), new Date(o.date));
          }, 0);
          const avgMins = totalMins / userOrders.length;
          // Score logic: < 15 mins = 100%, 30 mins = 50%, > 45 mins = 0%
          score = Math.max(100 - (Math.max(avgMins - 15, 0) * 3), 0);
          details = `متوسط وقت الخدمة (من فتح الطاولة للإغلاق): ${Math.round(avgMins)} دقيقة (${userOrders.length} طلب)`;
        } else {
          details = 'لا يوجد طلبات كافية للتقييم';
        }
      } else if (user.role === 'cashier' || user.jobTitle?.includes('كاشير')) {
        type = 'cashier';
        label = 'مؤشر المبيعات الإضافية (Upselling)';
        
        // Find "upsell" products (e.g. desserts, sides, add-ons)
        const upsellCategories = ['حلويات', 'مقبلات', 'إضافات', 'مشروبات', 'اصناف اضافية', 'احجام كبيرة'];
        const upsellProductIds = products.filter(p => upsellCategories.some(c => p.category?.includes(c))).map(p => p.id);
        
        const userOrders = orders.filter(o => o.cashierName === user.name || o.userId === user.id);
        if (userOrders.length > 0) {
          let upsellHits = 0;
          userOrders.forEach(o => {
             const hasUpsell = o.items.some(i => upsellProductIds.includes(i.productId));
             if (hasUpsell) upsellHits++;
          });
          const successRate = (upsellHits / userOrders.length) * 100;
          score = successRate * 2.5; // Boost score slightly (assuming ~40% is excellent)
          score = Math.min(Math.round(score), 100);
          details = `نجح في بيع (أصناف إضافية/حلو) في ${upsellHits} من أصل ${userOrders.length} طلب (${Math.round(successRate)}%)`;
        } else {
           details = 'لا يوجد طلبات كافية للتقييم';
        }
      } else if (user.role === 'chef' || user.jobTitle?.includes('شيف') || user.jobTitle?.includes('طباخ')) {
        type = 'chef';
        label = 'مؤشر دقة التحضير';
        
        // Lower adjustments/wastage -> better score
        const myAdjustments = adjustments.filter(a => Number(a.quantity) > 0);
        // Calculate the value of the wastage instead of just quantity for better accuracy
        let totalWastageValue = 0;
        myAdjustments.forEach(a => {
            const product = products.find(p => p.id === a.productId);
            totalWastageValue += (Number(a.quantity) * (product?.costPrice || 1));
        });
        
        // If loss is 0, score is 100. If loss > 1000, score goes down.
        score = Math.max(100 - (totalWastageValue / 50), 0);
        details = `قلة الفروقات وعجز المخزون: إجمالي التسويات/الهالك ${totalWastageValue.toFixed(2)} ج.م`;
      } else {
         return null;
      }

      return {
         user, type, score: Math.round(score), label, details
      };
    }).filter(s => s !== null);

    return stats;
  }, [users, orders, products, adjustments]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  if (!users) return <div className="p-8 text-center text-slate-500">جاري تحميل البيانات...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex items-start gap-4">
        <div className="bg-indigo-600 p-3 rounded-xl text-white mt-1 shrink-0">
          <Target size={24} />
        </div>
        <div>
           <h3 className="text-lg font-bold text-indigo-900 mb-1">مصفوفة الأداء الذكية (Automated Performance Matrix)</h3>
           <p className="text-sm text-indigo-700 leading-relaxed max-w-3xl">
             يقوم النظام باحتساب مؤشرات الأداء تلقائياً بناءً على البيانات الفعّالة للنظام: سرعة إغلاق الطاولات للويتر، نسبة المبيعات الإضافية (Upselling) للكاشير، وتقارير الفروقات وتلافي الهالك للشيف.
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userStats.map((stat: any) => (
           <div key={stat.user.id} className={`p-6 rounded-2xl border ${getScoreBg(stat.score)} shadow-sm relative overflow-hidden transition-all hover:shadow-md`}>
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                 {stat.type === 'waiter' && <Utensils size={100} />}
                 {stat.type === 'cashier' && <CreditCard size={100} />}
                 {stat.type === 'chef' && <ChefHat size={100} />}
              </div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                 <div>
                    <h4 className="font-bold text-lg text-slate-800">{stat.user.name}</h4>
                    <p className="text-xs text-slate-500 font-medium bg-white/50 px-2 py-0.5 rounded-full inline-block mt-1 border border-slate-200 border-opacity-50">
                      {stat.user.jobTitle || stat.user.role}
                    </p>
                 </div>
                 <div className={`text-3xl font-black ${getScoreColor(stat.score)}`}>
                    {stat.score}%
                 </div>
              </div>

              <div className="relative z-10 bg-white/60 p-3 rounded-lg border border-white backdrop-blur-sm">
                 <div className="flex items-center gap-2 mb-1">
                    {stat.type === 'waiter' && <Clock size={16} className="text-indigo-500" />}
                    {stat.type === 'cashier' && <TrendingUp size={16} className="text-indigo-500" />}
                    {stat.type === 'chef' && <AlertTriangle size={16} className="text-indigo-500" />}
                    <h5 className="font-bold text-sm text-slate-700">{stat.label}</h5>
                 </div>
                 <p className="text-xs text-slate-600 mt-1 leading-relaxed">{stat.details}</p>
                 
                 <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${stat.score >= 85 ? 'bg-emerald-500' : stat.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} 
                      style={{ width: `${stat.score}%` }}
                    ></div>
                 </div>
              </div>
           </div>
        ))}
        {userStats.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
             لا يوجد بيانات كافية لاحتساب المؤشرات التلقائية (تأكد من وجود طلبات للطاولات، ومبيعات كاشير، وتسويات هالك).
          </div>
        )}
      </div>
    </div>
  );
}
