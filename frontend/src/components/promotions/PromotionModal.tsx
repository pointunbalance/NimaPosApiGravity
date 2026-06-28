import React, { useEffect, useState } from 'react';
import { Tag, XCircle, Save, Search, Plus, X } from 'lucide-react';
import { Promotion, PromotionType, PromotionTarget, Product, Category } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';

const promotionSchema = z.object({
  name: z.string().min(1, 'اسم العرض مطلوب'),
  code: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed_amount', 'bogo', 'combo']),
  value: z.coerce.number().min(0, 'يجب أن تكون القيمة 0 أو أكثر'),
  buyQuantity: z.coerce.number().optional(),
  getQuantity: z.coerce.number().optional(),
  
  comboBuyProducts: z.array(z.number()).optional(),
  comboGetProducts: z.array(z.number()).optional(),
  
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  daysOfWeek: z.array(z.number()).optional(),

  target: z.enum(['order', 'product', 'category', 'customer_tier', 'customer_segment']),
  targetIds: z.array(z.union([z.string(), z.number()])).optional(),
  minOrderValue: z.coerce.number().min(0).optional(),
  startDate: z.string().min(1, 'تاريخ البدء مطلوب'),
  endDate: z.string().optional().nullable(),
  usageLimit: z.coerce.number().optional().nullable(),
  isActive: z.boolean().default(true),
  usedCount: z.number().default(0)
});

export type PromotionFormData = z.infer<typeof promotionSchema>;

interface PromotionModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  editingPromo: Promotion | null;
  currency: string;
  onSave: (data: PromotionFormData) => Promise<void>;
}

const PromotionModal: React.FC<PromotionModalProps> = ({
  showModal,
  setShowModal,
  editingPromo,
  currency,
  onSave,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<PromotionFormData>({
    resolver: zodResolver(promotionSchema) as any,
    defaultValues: {
      name: '',
      code: '',
      description: '',
      type: 'percentage',
      value: 0,
      target: 'order',
      targetIds: [],
      minOrderValue: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      usageLimit: null,
      isActive: true,
      usedCount: 0
    }
  });

  const type = watch('type');
  const target = watch('target');
  const targetIds = watch('targetIds') || [];

  const products = useLiveQuery(() => db.products.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];
  
  const [searchTarget, setSearchTarget] = useState('');

  useEffect(() => {
    if (showModal) {
      if (editingPromo) {
        reset({
          name: editingPromo.name,
          code: editingPromo.code || '',
          description: editingPromo.description || '',
          type: editingPromo.type,
          value: editingPromo.value,
          buyQuantity: editingPromo.buyQuantity,
          getQuantity: editingPromo.getQuantity,
          comboBuyProducts: editingPromo.comboBuyProducts || [],
          comboGetProducts: editingPromo.comboGetProducts || [],
          startTime: editingPromo.startTime || '',
          endTime: editingPromo.endTime || '',
          daysOfWeek: editingPromo.daysOfWeek || [],
          target: editingPromo.target,
          targetIds: editingPromo.targetIds || [],
          minOrderValue: editingPromo.minOrderValue || 0,
          startDate: new Date(editingPromo.startDate).toISOString().split('T')[0],
          endDate: editingPromo.endDate ? new Date(editingPromo.endDate).toISOString().split('T')[0] : '',
          usageLimit: editingPromo.usageLimit || null,
          isActive: editingPromo.isActive,
          usedCount: editingPromo.usedCount || 0
        });
      } else {
        reset({
          name: '',
          code: '',
          description: '',
          type: 'percentage',
          value: 0,
          target: 'order',
          targetIds: [],
          minOrderValue: 0,
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          usageLimit: null,
          isActive: true,
          usedCount: 0
        });
      }
      setSearchTarget('');
    }
  }, [showModal, editingPromo, reset]);

  if (!showModal) return null;

  const onSubmitForm = async (data: PromotionFormData) => {
    await onSave(data);
  };

  const handleAddTarget = (id: number | string) => {
    if (!targetIds.includes(id)) {
      setValue('targetIds', [...targetIds, id]);
    }
  };

  const handleRemoveTarget = (id: number | string) => {
    setValue('targetIds', targetIds.filter(tId => tId !== id));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTarget.toLowerCase()) || 
    (p.barcode && p.barcode.toLowerCase().includes(searchTarget.toLowerCase()))
  ).slice(0, 5); // Show top 5 matches

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTarget.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Tag className="w-6 h-6 text-brand-500" />
            {editingPromo ? 'تعديل العرض الترويجي' : 'إنشاء عرض ترويجي جديد'}
          </h2>
          <button
            onClick={() => setShowModal(false)}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="promoForm" onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">اسم العرض *</label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none ${errors.name ? 'border-red-500' : 'border-slate-200'}`}
                  placeholder="مثال: خصم الصيف"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">كود الخصم (اختياري)</label>
                <input
                  type="text"
                  {...register('code')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-mono uppercase"
                  placeholder="SUMMER20"
                />
                <p className="text-xs text-slate-500">اتركه فارغاً إذا كان العرض يطبق تلقائياً</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">وصف العرض</label>
              <textarea
                {...register('description')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none h-20"
                placeholder="تفاصيل إضافية عن العرض..."
              />
            </div>

            {/* Type & Value */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-800">نوع وقيمة الخصم</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">نوع العرض</label>
                  <select
                    {...register('type')}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed_amount">مبلغ ثابت</option>
                    <option value="bogo">اشتر X واحصل على Y</option>
                    <option value="combo">عرض تجميعي (Combo)</option>
                  </select>
                </div>

                {type === 'combo' ? (
                  <div className="col-span-1 md:col-span-2 space-y-4">
                     <p className="text-xs text-slate-500">العرض التجميعي (Combo) يطبق على مستوى الطلب تلقائياً</p>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <label className="block text-sm font-bold text-slate-700">اشتراط شراء المنتجات (الكل)</label>
                               <div className="relative">
                                 <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                 <input
                                   type="text"
                                   placeholder="ابحث عن منتج للشراء..."
                                   value={searchTarget}
                                   onChange={(e) => setSearchTarget(e.target.value)}
                                   className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                 />
                               </div>
                               {searchTarget && (
                                 <div className="bg-white border border-slate-200 rounded-lg shadow-sm max-h-40 overflow-y-auto">
                                   {filteredProducts.map(product => (
                                     <div 
                                       key={product.id} 
                                       className="p-2 hover:bg-slate-50 flex justify-between items-center cursor-pointer border-b border-slate-100 last:border-0"
                                       onClick={() => {
                                         const current = watch('comboBuyProducts') || [];
                                         if (!current.includes(product.id!)) setValue('comboBuyProducts', [...current, product.id!]);
                                       }}
                                     >
                                       <span className="text-sm font-medium">{product.name}</span>
                                       <Plus className="w-4 h-4 text-brand-500" />
                                     </div>
                                   ))}
                                 </div>
                               )}
                               
                               <div className="flex flex-wrap gap-2 mt-3">
                                 {(watch('comboBuyProducts') || []).map(id => {
                                   const product = products.find(p => p.id === Number(id));
                                   return product ? (
                                     <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                                       {product.name}
                                       <button type="button" onClick={() => {
                                            setValue('comboBuyProducts', (watch('comboBuyProducts') || []).filter((pid: number) => pid !== id));
                                       }} className="hover:text-red-500">
                                         <X className="w-3 h-3" />
                                       </button>
                                     </span>
                                   ) : null;
                                 })}
                               </div>
                        </div>

                        <div className="space-y-2">
                             <label className="block text-sm font-bold text-slate-700">للحصول على خصم في المنتجات (الكل)</label>
                               <div className="relative">
                                 <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                 <input
                                   type="text"
                                   placeholder="ابحث عن منتج بالمكتبة أدناه..."
                                   className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                   disabled
                                 />
                               </div>
                               <p className="text-xs text-slate-500 my-1">يرجى إضافة المنتجات أدناه</p>
                               <div className="bg-slate-50 border border-slate-200 rounded-lg shadow-sm max-h-40 overflow-y-auto">
                                   {products.map(product => (
                                     <div 
                                       key={product.id} 
                                       className="p-2 hover:bg-slate-100 flex justify-between items-center cursor-pointer border-b border-slate-100 last:border-0"
                                       onClick={() => {
                                         const current = watch('comboGetProducts') || [];
                                         if (!current.includes(product.id!)) setValue('comboGetProducts', [...current, product.id!]);
                                       }}
                                     >
                                       <span className="text-sm font-medium">{product.name}</span>
                                       <Plus className="w-4 h-4 text-brand-500" />
                                     </div>
                                   ))}
                                 </div>
                               
                               <div className="flex flex-wrap gap-2 mt-3">
                                 {(watch('comboGetProducts') || []).map(id => {
                                   const product = products.find(p => p.id === Number(id));
                                   return product ? (
                                     <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                                       {product.name}
                                       <button type="button" onClick={() => {
                                            setValue('comboGetProducts', (watch('comboGetProducts') || []).filter((pid: number) => pid !== id));
                                       }} className="hover:text-red-500">
                                         <X className="w-3 h-3" />
                                       </button>
                                     </span>
                                   ) : null;
                                 })}
                               </div>
                        </div>
                     </div>

                     <div className="space-y-2 mt-4">
                       <label className="block text-sm font-bold text-slate-700">قيمة الخصم على منتجات (الاحصل عليها) (%)</label>
                       <div className="relative">
                         <input
                           type="number"
                           onFocus={(e) => e.target.select()}
                           min="0"
                           max="100"
                           {...register('value')}
                           className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                           placeholder="مثال: 100 لجعله مجانياً بالكامل"
                         />
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                       </div>
                       <p className="text-xs text-slate-500">أدخل 100 لجعل المنتجات مجانية بالكامل.</p>
                     </div>
                  </div>
                ) : type !== 'bogo' ? (
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">قيمة الخصم *</label>
                    <div className="relative">
                      <input
                        type="number"
                        onFocus={(e) => e.target.select()}
                        min="0"
                        step={type === 'percentage' ? '1' : '0.01'}
                        {...register('value')}
                        className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none ${errors.value ? 'border-red-500' : 'border-slate-200'}`}
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        {type === 'percentage' ? '%' : currency}
                      </span>
                    </div>
                    {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700">اشتر (الكمية)</label>
                      <input
                        type="number"
                        onFocus={(e) => e.target.select()}
                        min="1"
                        {...register('buyQuantity')}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700">
                        احصل على (الكمية)
                      </label>
                      <input
                        type="number"
                        onFocus={(e) => e.target.select()}
                        min="1"
                        {...register('getQuantity')}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="block text-sm font-bold text-slate-700">قيمة الخصم على المنتج المجاني (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          onFocus={(e) => e.target.select()}
                          min="0"
                          max="100"
                          {...register('value')}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                          placeholder="مثال: 100 لجعله مجانياً بالكامل"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                      </div>
                      <p className="text-xs text-slate-500">أدخل 100 إذا كان المنتج الثاني مجانياً بالكامل، أو 50 لخصم نصف السعر.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Targeting */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-800">الاستهداف والشروط</h4>
              
              {/* Happy Hour Specific */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-200">
                  <div className="space-y-2">
                       <label className="block text-sm font-bold text-slate-700">أيام العرض (اختياري)</label>
                       <select 
                           multiple
                           onChange={(e) => {
                               const options = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                               setValue('daysOfWeek', options);
                           }}
                           className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none h-24"
                       >
                           <option value="0">الأحد</option>
                           <option value="1">الإثنين</option>
                           <option value="2">الثلاثاء</option>
                           <option value="3">الأربعاء</option>
                           <option value="4">الخميس</option>
                           <option value="5">الجمعة</option>
                           <option value="6">السبت</option>
                       </select>
                       <p className="text-xs text-slate-500">للتحديد المتعدد اضغط Ctrl/Cmd</p>
                  </div>
                  <div className="space-y-2">
                       <label className="block text-sm font-bold text-slate-700">وقت البدء (Happy Hour)</label>
                       <input 
                           type="time" 
                           {...register('startTime')}
                           className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                       />
                  </div>
                  <div className="space-y-2">
                       <label className="block text-sm font-bold text-slate-700">وقت الانتهاء</label>
                       <input 
                           type="time" 
                           {...register('endTime')}
                           className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                       />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">تطبيق العرض على</label>
                  <select
                    {...register('target')}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="order">إجمالي الطلب</option>
                    <option value="product">منتجات محددة</option>
                    <option value="category">أقسام محددة</option>
                    <option value="customer_tier">مستوى عملاء محدد</option>
                    <option value="customer_segment">فئة عملاء محددة (Tags)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">الحد الأدنى للطلب</label>
                  <div className="relative">
                    <input
                      type="number"
                      onFocus={(e) => e.target.select()}
                      min="0"
                      {...register('minOrderValue')}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                      placeholder="0"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      {currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Target Selection */}
              {target === 'product' && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <label className="block text-sm font-bold text-slate-700">اختر المنتجات المشمولة بالعرض</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="ابحث عن منتج..."
                      value={searchTarget}
                      onChange={(e) => setSearchTarget(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                  </div>
                  {searchTarget && (
                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm max-h-40 overflow-y-auto">
                      {filteredProducts.map(product => (
                        <div 
                          key={product.id} 
                          className="p-2 hover:bg-slate-50 flex justify-between items-center cursor-pointer border-b border-slate-100 last:border-0"
                          onClick={() => {
                            handleAddTarget(product.id!);
                            setSearchTarget('');
                          }}
                        >
                          <span className="text-sm font-medium">{product.name}</span>
                          <Plus className="w-4 h-4 text-brand-500" />
                        </div>
                      ))}
                      {filteredProducts.length === 0 && (
                        <div className="p-3 text-center text-sm text-slate-500">لا توجد منتجات مطابقة</div>
                      )}
                    </div>
                  )}
                  
                  {targetIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {targetIds.map(id => {
                        const product = products.find(p => p.id === Number(id));
                        return product ? (
                          <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                            {product.name}
                            <button type="button" onClick={() => handleRemoveTarget(id)} className="hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              )}

              {target === 'category' && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <label className="block text-sm font-bold text-slate-700">اختر الأقسام المشمولة بالعرض</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="ابحث عن قسم..."
                      value={searchTarget}
                      onChange={(e) => setSearchTarget(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                  </div>
                  {searchTarget && (
                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm max-h-40 overflow-y-auto">
                      {filteredCategories.map(category => (
                        <div 
                          key={category.id} 
                          className="p-2 hover:bg-slate-50 flex justify-between items-center cursor-pointer border-b border-slate-100 last:border-0"
                          onClick={() => {
                            handleAddTarget(category.id!);
                            setSearchTarget('');
                          }}
                        >
                          <span className="text-sm font-medium">{category.name}</span>
                          <Plus className="w-4 h-4 text-brand-500" />
                        </div>
                      ))}
                      {filteredCategories.length === 0 && (
                        <div className="p-3 text-center text-sm text-slate-500">لا توجد أقسام مطابقة</div>
                      )}
                    </div>
                  )}
                  
                  {targetIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {targetIds.map(id => {
                        const category = categories.find(c => c.id === Number(id));
                        return category ? (
                          <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                            {category.name}
                            <button type="button" onClick={() => handleRemoveTarget(id)} className="hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              )}

              {target === 'customer_segment' && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <label className="block text-sm font-bold text-slate-700">فئات العملاء (استهداف العلامات / Tags)</label>
                  <p className="text-xs text-slate-500">اكتب اسم الفئة (مثلاً: VIP, FirstTime, موظف) واضغط Enter لإضافتها</p>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="اضغط Enter للإضافة..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            handleAddTarget(val);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                  </div>
                  
                  {targetIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {targetIds.map(id => (
                        <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                          {id}
                          <button type="button" onClick={() => handleRemoveTarget(id)} className="hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {target === 'customer_tier' && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <label className="block text-sm font-bold text-slate-700">اختر مستوى العملاء (Tiers)</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddTarget(e.target.value);
                        e.target.value = ''; // Reset select
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="">-- اختر مستوى --</option>
                    <option value="bronze">برونزي</option>
                    <option value="silver">فضي</option>
                    <option value="gold">ذهبي</option>
                    <option value="platinum">بلاتيني</option>
                  </select>
                  
                  {targetIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {targetIds.map(id => (
                        <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                          {id === 'bronze' ? 'برونزي' : id === 'silver' ? 'فضي' : id === 'gold' ? 'ذهبي' : 'بلاتيني'}
                          <button type="button" onClick={() => handleRemoveTarget(id)} className="hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dates & Limits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">تاريخ البدء *</label>
                <input
                  type="date"
                  {...register('startDate')}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none ${errors.startDate ? 'border-red-500' : 'border-slate-200'}`}
                />
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  تاريخ الانتهاء (اختياري)
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  الحد الأقصى للاستخدام (اختياري)
                </label>
                <input
                  type="number"
                  onFocus={(e) => e.target.select()}
                  min="1"
                  {...register('usageLimit')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="عدد المرات الإجمالي"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            form="promoForm"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-brand-600 text-white font-bold hover:bg-brand-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            حفظ العرض
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionModal;

