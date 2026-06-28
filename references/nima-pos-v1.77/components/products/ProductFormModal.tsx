import React, { useState, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { X, Save, Barcode, ScanBarcode, Box, Trash2, UploadCloud, ImageIcon, DollarSign, Package, ChevronRight, ChevronLeft, Check, PlusSquare, Boxes, Layers } from 'lucide-react';
import { Product } from '../../types';
import { compressImage } from '../../utils/imageCompression';
import { generateBarcode } from '../../utils/generateBarcode';

const unitSchema = z.object({
  name: z.string().min(1, 'مطلوب'),
  conversionFactor: z.coerce.number().min(0.0001, 'يجب أن يكون أكبر من 0'),
  price: z.coerce.number().min(0, 'لا يمكن أن يكون سالباً'),
  costPrice: z.coerce.number().optional(),
  barcode: z.string().optional()
});

const variantSchema = z.object({
  name: z.string().min(1, 'مطلوب'),
  price: z.coerce.number().min(0, 'لا يمكن أن يكون سالباً')
});

const compositionSchema = z.object({
  productId: z.number(),
  quantity: z.coerce.number().min(0.0001, 'يجب أن يكون أكبر من 0')
});

const modifierOptionSchema = z.object({
  name: z.string().min(1, 'مطلوب'),
  price: z.coerce.number().min(0, 'لا يمكن أن يكون سالباً')
});

const productModifierSchema = z.object({
  name: z.string().min(1, 'مطلوب'),
  required: z.boolean(),
  multiple: z.boolean(),
  options: z.array(modifierOptionSchema)
});

const productPriceTierSchema = z.object({
  minQuantity: z.coerce.number().min(1),
  price: z.coerce.number().min(0)
});

const productBogoRuleSchema = z.object({
  buyQuantity: z.coerce.number().min(1),
  getQuantity: z.coerce.number().min(1)
});

const productSchema = z.object({
  name: z.string().min(1, 'اسم المنتج مطلوب'),
  barcode: z.string().optional(),
  price: z.coerce.number().min(0, 'السعر لا يمكن أن يكون سالباً'),
  wholesalePrice: z.coerce.number().min(0).optional(),
  brand: z.string().optional(),
  averageCost: z.coerce.number().min(0).optional(),
  
  // Advanced Pricing
  retailDiscount: z.coerce.number().optional(),
  retailDiscountType: z.enum(['percentage', 'fixed']).optional(),
  wholesaleDiscount: z.coerce.number().optional(),
  wholesaleDiscountType: z.enum(['percentage', 'fixed']).optional(),
  priceTiers: z.array(productPriceTierSchema).optional(),
  bogoRules: z.array(productBogoRuleSchema).optional(),

  costPrice: z.coerce.number().min(0).optional(),
  category: z.string().optional(),
  stock: z.coerce.number().min(0).optional(),
  alertThreshold: z.coerce.number().min(0).optional(),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  type: z.enum(['simple', 'composite', 'service']),
  composition: z.array(compositionSchema).optional(),
  variants: z.array(variantSchema).optional(),
  units: z.array(unitSchema).optional(),
  trackSerial: z.boolean().optional(),
  isFavorite: z.coerce.number().optional(),
  modifiers: z.array(productModifierSchema).optional(),
  requiresPeriodicMaintenance: z.boolean().optional(),
  maintenancePeriodDays: z.coerce.number().optional()
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  uniqueCategories: string[];
  simpleProducts: Product[];
  onSave: (data: ProductFormValues) => Promise<void>;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  uniqueCategories,
  simpleProducts,
  onSave
}) => {
  // Wizard Flow State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [selectedIngredientId, setSelectedIngredientId] = useState<number | ''>('');
  const [selectedIngredientQty, setSelectedIngredientQty] = useState(1);

  // Global Units
  const globalUnits = useLiveQuery(() => db.measurementUnits.toArray()) || [];

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    trigger,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: product ? {
      ...product,
      composition: product.composition || [],
      variants: product.variants || [],
      units: product.units || [],
      modifiers: product.modifiers || [],
      images: product.images || []
    } : {
      name: '',
      barcode: '',
      price: 0,
      wholesalePrice: 0,
      costPrice: 0,
      averageCost: 0,
      brand: '',
      category: '',
      stock: 0,
      alertThreshold: 5,
      image: '',
      images: [],
      type: 'simple',
      composition: [],
      variants: [],
      units: [],
      trackSerial: false,
      isFavorite: 0,
      modifiers: [],
      requiresPeriodicMaintenance: false,
      maintenancePeriodDays: undefined
    }
  });

  const { fields: unitFields, append: appendUnit, remove: removeUnit } = useFieldArray({
    control,
    name: 'units'
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants'
  });

  const { fields: compFields, append: appendComp, remove: removeComp } = useFieldArray({
    control,
    name: 'composition'
  });

  const { fields: modifierFields, append: appendModifier, remove: removeModifier, update: updateModifier } = useFieldArray({
    control,
    name: 'modifiers'
  });

  const { fields: tierFields, append: appendTier, remove: removeTier } = useFieldArray({
    control,
    name: 'priceTiers'
  });

  const { fields: bogoFields, append: appendBogo, remove: removeBogo } = useFieldArray({
    control,
    name: 'bogoRules'
  });

  const type = watch('type');
  const price = watch('price');
  const imagePreview = watch('image');
  const imagesGallery = watch('images') || [];

  const steps = useMemo(() => {
    const s = [
      { id: 'basic', label: 'البيانات الأساسية', subtitle: 'الاسم، الفئة، والنوع', icon: Package },
      { id: 'pricing', label: 'التسعير والمخزون', subtitle: 'الرصيد، والتكلفة', icon: DollarSign },
      { id: 'advanced_pricing', label: 'التسعير المتقدم', subtitle: 'الخصومات و الباقات', icon: DollarSign },
    ];
    if (type === 'composite') {
      s.push({ id: 'composition', label: 'المكونات والوصفة', subtitle: 'مكونات المنتج المركب', icon: Boxes });
    }
    if (type !== 'service') {
      s.push({ id: 'units', label: 'الوحدات المتعددة', subtitle: 'مثل: كرتونة، دستة', icon: Box });
    }
    s.push({ id: 'variants', label: 'الخيارات المتاحة', subtitle: 'مثل: مقاس، لون', icon: Layers });
    s.push({ id: 'modifiers', label: 'إضافات الطعام', subtitle: 'تخصيص الطلبات', icon: PlusSquare });
    
    return s;
  }, [type]);

  const safeStepIndex = Math.min(currentStepIndex, steps.length - 1);
  const currentStep = steps[safeStepIndex];

  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep.id === 'basic') {
      fieldsToValidate = ['name', 'type'];
    } else if (currentStep.id === 'pricing') {
      fieldsToValidate = ['price'];
      if (type === 'simple') fieldsToValidate.push('stock');
    }
    
    if (fieldsToValidate.length > 0) {
      const isStepValid = await trigger(fieldsToValidate as any);
      if (!isStepValid) return;
    }

    if (safeStepIndex < steps.length - 1) {
      setCurrentStepIndex(safeStepIndex + 1);
    } else {
      handleSubmit(onSubmit)();
    }
  };

  const handlePrev = () => {
    if (safeStepIndex > 0) {
      setCurrentStepIndex(safeStepIndex - 1);
    }
  };

  const filteredIngredients = useMemo(() => {
    return simpleProducts.filter(p => 
      p.name && p.name.toLowerCase().includes(ingredientSearch.toLowerCase()) && 
      p.id !== product?.id
    );
  }, [simpleProducts, ingredientSearch, product]);

  const handleGenerateBarcode = async () => {
    const category = getValues('category');
    const price = getValues('price');
    const cost = getValues('costPrice');
    const barcode = await generateBarcode(category, price, cost, undefined);
    setValue('barcode', barcode, { shouldValidate: true });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file).then(result => {
        setValue('image', result, { shouldValidate: true });
        const currentImages = getValues('images') || [];
        if (!currentImages.includes(result)) {
          setValue('images', [...currentImages, result], { shouldValidate: true });
        }
      });
    }
  };

  const handleMultipleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const compressed: string[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const res = await compressImage(files[i]);
          compressed.push(res);
        } catch (err) {
          console.error("Error compressing image", err);
        }
      }
      if (compressed.length > 0) {
        const currentImages = getValues('images') || [];
        const uniqueNew = compressed.filter(c => !currentImages.includes(c));
        const newImages = [...currentImages, ...uniqueNew];
        setValue('images', newImages, { shouldValidate: true });
        
        if (!getValues('image')) {
          setValue('image', compressed[0], { shouldValidate: true });
        }
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = getValues('images') || [];
    const imageToRemove = currentImages[index];
    const newImages = currentImages.filter((_, idx) => idx !== index);
    setValue('images', newImages, { shouldValidate: true });
    
    if (watch('image') === imageToRemove) {
      setValue('image', newImages.length > 0 ? newImages[0] : '', { shouldValidate: true });
    }
  };

  const handleSetMainImage = (index: number) => {
    const currentImages = getValues('images') || [];
    const selectAsMain = currentImages[index];
    setValue('image', selectAsMain, { shouldValidate: true });
  };

  const onSubmit = async (data: ProductFormValues) => {
    await onSave(data);
  };

  // Temporary state for new unit
  const [newUnit, setNewUnit] = useState({ name: '', factor: '', price: '', cost: '', barcode: '' });
  const handleAddUnit = () => {
    if (!newUnit.name || !newUnit.factor || !newUnit.price) return;
    appendUnit({
      name: newUnit.name,
      conversionFactor: parseFloat(newUnit.factor),
      price: parseFloat(newUnit.price),
      costPrice: newUnit.cost ? parseFloat(newUnit.cost) : undefined,
      barcode: newUnit.barcode
    });
    setNewUnit({ name: '', factor: '', price: '', cost: '', barcode: '' });
  };

  // Temporary state for new variant
  const [newVariant, setNewVariant] = useState({ name: '', price: '' });
  const handleAddVariant = () => {
    if (!newVariant.name || !newVariant.price) return;
    appendVariant({
      name: newVariant.name,
      price: parseFloat(newVariant.price)
    });
    setNewVariant({ name: '', price: '' });
  };

  const handleAddIngredient = () => {
    if (!selectedIngredientId || selectedIngredientQty <= 0) return;
    if (compFields.find(c => c.productId === Number(selectedIngredientId))) return;
    appendComp({
      productId: Number(selectedIngredientId),
      quantity: selectedIngredientQty
    });
    setSelectedIngredientId('');
    setSelectedIngredientQty(1);
    setIngredientSearch('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-5xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
               <Package className="w-6 h-6" />
             </div>
             <div>
                <h3 className="text-xl font-extrabold text-slate-800">
                  {product ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-1">تكوين إعدادات المنتج والوحدات والمخزون</p>
             </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-slate-50 p-3 rounded-2xl shadow-sm hover:shadow transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Wizard Sidebar */}
          <div className="hidden md:flex flex-col w-72 bg-slate-50 border-l border-slate-100 overflow-y-auto">
            <div className="p-4 space-y-2">
              {steps.map((step, idx) => {
                const isActive = idx === safeStepIndex;
                const isPast = idx < safeStepIndex;
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStepIndex(idx)}
                    disabled={!isPast && !isActive}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all outline-none text-right ${
                      isActive 
                        ? 'bg-white shadow-sm border border-indigo-100 text-indigo-600' 
                        : isPast
                        ? 'cursor-pointer hover:bg-slate-100 text-slate-700'
                        : 'opacity-50 cursor-not-allowed text-slate-400'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'bg-indigo-100 text-indigo-600' : isPast ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isPast ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm tracking-wide">{step.label}</div>
                      <div className={`text-xs mt-0.5 font-medium ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>{step.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar relative">
            <form id="productForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl mx-auto pb-10">
              {currentStep.id === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Text Inputs */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        اسم المنتج <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('name')}
                        dir="rtl"
                        className={`w-full px-4 py-3 bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-base font-bold transition-all text-right placeholder:font-medium placeholder:text-slate-400`}
                        placeholder="أدخل اسم المنتج بوضوح..."
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">الفئة (القسم)</label>
                        <div className="relative">
                          <input
                            {...register('category')}
                            list="categories"
                            dir="rtl"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-right"
                            placeholder="اختر أو اكتب الفئة..."
                          />
                          <datalist id="categories">
                            {uniqueCategories.map((c) => (
                              <option key={c} value={c} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">الماركة (العلامة التجارية)</label>
                        <input
                          {...register('brand')}
                          dir="rtl"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-right"
                          placeholder="مثال: Apple, Samsung, Kingston..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">الباركود</label>
                      <div className="relative group">
                        <Barcode className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          {...register('barcode')}
                          dir="ltr"
                          style={{ paddingLeft: '120px', paddingRight: '40px' }}
                          className="w-full py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono text-sm transition-all text-left"
                          placeholder="امسح الباركود..."
                        />
                        <button
                          type="button"
                          onClick={handleGenerateBarcode}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 px-3.5 py-1.5 rounded-xl transition-colors active:scale-95 whitespace-nowrap shadow-sm hover:text-slate-400"
                        >
                          توليد تلقائي
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-2">صورة المنتج</label>
                    <div className="relative aspect-square w-full max-w-[220px] mx-auto lg:mx-0">
                      {imagePreview ? (
                        <div className="relative w-full h-full rounded-3xl overflow-hidden border border-slate-200 group bg-slate-50 flex items-center justify-center">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <label className="cursor-pointer p-3 rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm">
                              <UploadCloud className="w-5 h-5" />
                              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                            <button 
                              type="button"
                              onClick={() => setValue('image', '')}
                              className="p-3 rounded-2xl bg-white text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-full bg-slate-50 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-3xl cursor-pointer transition-colors group">
                          <div className="p-4 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                            <ImageIcon className="w-6 h-6 text-indigo-500" />
                          </div>
                          <span className="text-sm font-bold text-slate-600 text-center px-4">انقر للرفع<br />أو تغيير الصورة</span>
                          <span className="text-xs text-slate-400 mt-2 font-medium">PNG, JPG, WEBP</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Multiple Image Gallery */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">معرض صور المنتج (صور إضافية)</h4>
                      <p className="text-xs text-slate-500 font-medium">يمكنك رفع عدة صور لتظهر في تفاصيل المنتج وخدمة شاشة العرض.</p>
                    </div>
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95">
                        <UploadCloud className="w-4 h-4" />
                        <span>تحميل صور إضافية</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleMultipleImagesUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {imagesGallery.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
                      <ImageIcon className="w-5 h-5 text-slate-300 mb-1.5 opacity-60" />
                      <p className="text-xs font-black text-slate-600">لا توجد صور إضافية في معرض هذا المنتج حالياً.</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">ارفع مجموعة صور لعرضها بشكل متتالي في شاشات الكاشير وعرض العملاء.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                      {imagesGallery.map((imgUrl, index) => {
                        const isMain = imagePreview === imgUrl;
                        return (
                          <div 
                            key={index} 
                            className={`group relative aspect-square rounded-2xl overflow-hidden border bg-slate-50 flex items-center justify-center transition-all ${
                              isMain ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <img src={imgUrl} alt={`Gallery ${index + 1}`} className="w-full h-full object-contain" />
                            
                            {/* Tags or overlays */}
                            {isMain && (
                              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-indigo-600 text-[10px] font-black text-white shadow">
                                رئيسية
                              </div>
                            )}

                            {/* Hover Controls */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              {!isMain && (
                                <button
                                  type="button"
                                  onClick={() => handleSetMainImage(index)}
                                  className="p-2 rounded-lg bg-white/90 hover:bg-white text-indigo-600 hover:text-indigo-700 transition-all font-bold text-[10px] shadow"
                                  title="تعيين كصورة رئيسية"
                                >
                                  رئيسية
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="p-2 rounded-lg bg-white/90 hover:bg-white text-red-600 hover:text-red-700 transition-all shadow"
                                title="حذف من المعرض"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-r from-violet-50/70 via-indigo-50/40 to-white border border-indigo-100 p-5 rounded-2xl shadow-sm transition-all hover:shadow-md">
                  <label className="flex items-center gap-4 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        {...register('trackSerial')}
                        className="peer sr-only"
                      />
                      <div className="w-6 h-6 bg-white border-2 border-slate-300 rounded-lg peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-800 flex items-center gap-2 text-base">
                          <ScanBarcode className="w-5 h-5 text-indigo-500 shrink-0" /> تتبع الأرقام التسلسلية (IMEI / SN)
                        </span>
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full select-none">
                          خيار متقدم للأنشطة التقنية والصيانة
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-500 mt-1.5 leading-relaxed">
                        قم بتفعيل هذا الخيار للأجهزة الإلكترونية والموبايلات التي تتطلب أرقاماً فريدة لكل قطعة لضمان سلامة عمليات الضمان والتتبع.
                      </p>
                    </div>
                  </label>
                </div>
                
                <div className="pt-4 space-y-4">
                  <label className="block text-sm font-bold text-slate-700">نوع المنتج <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className={`flex flex-col items-start gap-2 cursor-pointer p-4 rounded-2xl border-2 transition-all ${type === 'simple' ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-[0_4px_20px_rgba(79,70,229,0.06)]' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
                      <input
                        type="radio"
                        value="simple"
                        {...register('type')}
                        className="sr-only"
                      />
                      <Box className={`w-6 h-6 ${type === 'simple' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <div>
                        <span className="text-sm font-black text-slate-800 block">منتج بسيط</span>
                        <span className="text-xs font-medium text-slate-500">منتج عادي له مخزون وكمية</span>
                      </div>
                    </label>

                    <label className={`flex flex-col items-start gap-2 cursor-pointer p-4 rounded-2xl border-2 transition-all ${type === 'service' ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-[0_4px_20px_rgba(79,70,229,0.06)]' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
                      <input
                        type="radio"
                        value="service"
                        {...register('type')}
                        className="sr-only"
                      />
                      <Package className={`w-6 h-6 ${type === 'service' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <div>
                        <span className="text-sm font-black text-slate-800 block">منتج خدمي</span>
                        <span className="text-xs font-medium text-slate-500">خدمات مثل التوصيل، لا تُخصم من المخزون</span>
                      </div>
                    </label>

                    <label className={`flex flex-col items-start gap-2 cursor-pointer p-4 rounded-2xl border-2 transition-all ${type === 'composite' ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-[0_4px_20px_rgba(79,70,229,0.06)]' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
                      <input
                        type="radio"
                        value="composite"
                        {...register('type')}
                        className="sr-only"
                      />
                      <Boxes className={`w-6 h-6 ${type === 'composite' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <div>
                        <span className="text-sm font-black text-slate-800 block">منتج مركب (وصفة)</span>
                        <span className="text-xs font-medium text-slate-500">يتكون من مكونات مثل الساندوتش أو القهوة</span>
                      </div>
                    </label>
                  </div>
                </div>

              </div>
              )}

              {currentStep.id === 'pricing' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-black text-slate-800 mb-6 flex items-center gap-3 text-lg">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    التسعير والمخزون
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        سعر الشراء (التكلفة)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          {...register('costPrice', { valueAsNumber: true })}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-base font-bold transition-all text-slate-800"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        متوسط تكلفة الصنف
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          {...register('averageCost', { valueAsNumber: true })}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-base font-bold transition-all text-slate-600"
                          placeholder="0.00"
                          title="متوسط التكلفة للوحدة المحسوب تلقائياً من المشتريات"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        سعر البيع قطاعي <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          {...register('price', { valueAsNumber: true })}
                          onFocus={(e) => e.target.select()}
                          className={`w-full px-4 py-3 bg-slate-50 border ${errors.price ? 'border-red-500' : 'border-slate-200'} rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-base font-black text-emerald-600 transition-all`}
                          placeholder="0.00"
                        />
                        {errors.price && <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.price.message}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        سعر الجملة
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          {...register('wholesalePrice', { valueAsNumber: true })}
                          onFocus={(e) => e.target.select()}
                          className={`w-full px-4 py-3 bg-slate-50 border ${errors.wholesalePrice ? 'border-red-500' : 'border-slate-200'} rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-base font-black text-emerald-600 transition-all`}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {type === 'simple' && (
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200 shadow-sm mt-8">
                      <h4 className="font-black text-slate-800 mb-5 flex items-center gap-3 text-lg">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                          <Box className="w-5 h-5" />
                        </div>
                        إدارة المخزون والصيانة
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                            {product ? 'المخزون الحالي (وحدة أساسية)' : 'الرصيد الافتتاحي'}
                          </label>
                          <input
                            type="number"
                            step="any"
                            {...register('stock', { valueAsNumber: true })}
                            onFocus={(e) => e.target.select()}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                            disabled={!!product}
                          />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                            حد التنبيه (Low Stock)
                          </label>
                          <input
                            type="number"
                            step="any"
                            {...register('alertThreshold', { valueAsNumber: true })}
                            onFocus={(e) => e.target.select()}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold transition-all"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-8 border-t border-slate-200/60 pt-6">
                          <label className="flex items-center gap-4 cursor-pointer mb-5 group">
                             <div className="relative flex items-center justify-center">
                              <input
                                type="checkbox"
                                {...register('requiresPeriodicMaintenance')}
                                className="peer sr-only"
                              />
                              <div className="w-6 h-6 bg-slate-100 border-2 border-slate-300 rounded-lg peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                                <svg className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                            <div>
                              <span className="font-bold text-slate-700 text-sm">يتطلب صيانة دورية </span>
                              <span className="text-xs font-medium text-slate-500 block mt-0.5">مثال: فلاتر المياه تحتاج تغيير كل فترة</span>
                            </div>
                          </label>

                          {watch('requiresPeriodicMaintenance') && (
                              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                                    فترة الصيانة الدورية (بالأيام)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    {...register('maintenancePeriodDays', { valueAsNumber: true })}
                                    placeholder="مثال: 30"
                                    className="w-full max-w-sm px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold transition-all"
                                  />
                              </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}

              {currentStep.id === 'advanced_pricing' && (
              <div className="space-y-6">
                
                {/* Fixed/Percentage Discounts */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-indigo-500" />
                    خصومات ثابتة
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Retail Discount */}
                    <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100">
                      <h4 className="font-bold text-slate-700">سعر المستهلك (القطاعي)</h4>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          {...register('retailDiscount')}
                          placeholder="قيمة الخصم"
                          className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        />
                        <select
                          {...register('retailDiscountType')}
                          className="px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        >
                          <option value="fixed">ثابت</option>
                          <option value="percentage">نسبة %</option>
                        </select>
                      </div>
                    </div>

                    {/* Wholesale Discount */}
                    <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100">
                      <h4 className="font-bold text-slate-700">سعر الجملة</h4>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          {...register('wholesaleDiscount')}
                          placeholder="قيمة الخصم"
                          className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                        <select
                          {...register('wholesaleDiscountType')}
                          className="px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        >
                          <option value="fixed">ثابت</option>
                          <option value="percentage">نسبة %</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tiered Pricing */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-6 animate-in slide-in-from-bottom-2 duration-300 delay-75">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-500" />
                      التسعير حسب الشريحة (الكمية)
                    </h3>
                    <button
                      type="button"
                      onClick={() => appendTier({ minQuantity: 10, price: 0 })}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold transition-colors text-sm flex items-center gap-2"
                    >
                      <PlusSquare className="w-4 h-4" />
                      إضافة شريحة
                    </button>
                  </div>
                  
                  {tierFields.length === 0 ? (
                    <p className="text-slate-500 text-sm italic">لا توجد شرائح حالياً. أضف شريحة لتغيير السعر تلقائياً عند وصول المشتري لكمية معينة.</p>
                  ) : (
                    <div className="space-y-3">
                      {tierFields.map((field, index) => (
                        <div key={field.id} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100">
                          <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs font-bold text-slate-500 mb-1">عند شراء كمية</label>
                            <input
                              type="number"
                              {...register(`priceTiers.${index}.minQuantity` as const, { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors"
                              placeholder="10"
                            />
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs font-bold text-slate-500 mb-1">يصبح السعر الجديد</label>
                            <input
                              type="number"
                              {...register(`priceTiers.${index}.price` as const, { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-indigo-50/30 focus:bg-white text-indigo-700 font-bold transition-colors"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="flex items-end self-stretch md:self-auto py-1">
                            <button
                              type="button"
                              onClick={() => removeTier(index)}
                              className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BOGO Rules */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-6 animate-in slide-in-from-bottom-2 duration-300 delay-150">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <Check className="w-5 h-5 text-indigo-500" />
                      عرض الباقات (البيع بالقطع)
                    </h3>
                    {bogoFields.length === 0 && (
                      <button
                        type="button"
                        onClick={() => appendBogo({ buyQuantity: 5, getQuantity: 1 })}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold transition-colors text-sm flex items-center gap-2"
                      >
                        <PlusSquare className="w-4 h-4" />
                        إضافة عرض
                      </button>
                    )}
                  </div>
                  
                  {bogoFields.length === 0 ? (
                    <p className="text-slate-500 text-sm italic">مثال: اشتري 10 واحصل على 1 مجاناً.</p>
                  ) : (
                    <div className="space-y-3">
                      {bogoFields.map((field, index) => (
                        <div key={field.id} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100">
                          <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs font-bold text-slate-500 mb-1">عندما يشتري (قطع مدفوعة)</label>
                            <input
                              type="number"
                              {...register(`bogoRules.${index}.buyQuantity` as const, { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors"
                              placeholder="10"
                            />
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs font-bold text-slate-500 mb-1">يأخذ (قطع مجانية)</label>
                            <input
                              type="number"
                              {...register(`bogoRules.${index}.getQuantity` as const, { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-emerald-50/30 focus:bg-white text-emerald-700 font-bold transition-colors"
                              placeholder="1"
                            />
                          </div>
                          <div className="flex items-end self-stretch md:self-auto py-1">
                            <button
                              type="button"
                              onClick={() => removeBogo(index)}
                              className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
              )}

              {currentStep.id === 'units' && (
              <div className="space-y-6">
                <div className="bg-indigo-50/80 p-5 rounded-2xl border border-indigo-100 flex items-start gap-4 shadow-sm animate-in fade-in">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl shrink-0 mt-0.5">
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-indigo-900 mb-1">وحدات القياس المتعددة</h5>
                    <p className="text-sm text-indigo-700/80 font-medium leading-relaxed">
                      الوحدة الأساسية حالياً هي <b>(قطعة - 1)</b> وسعر بيعها هو <b>{price?.toLocaleString() || 0}</b>. 
                      يمكنك إضافة وحدات كبرى مثل "كرتونة" أو "درزن" مع تحديد معامل التحويل (مثال: الكرتونة = 12 قطعة).
                    </p>
                  </div>
                </div>

                <div className="p-5 border border-slate-200 rounded-3xl bg-slate-50/50 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-indigo-500 h-full"></div>
                  <h4 className="font-black text-slate-800 mb-4 text-base">إضافة وحدة جديدة</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start mb-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">اسم الوحدة</label>
                      {globalUnits.length > 0 ? (
                          <select
                              value={newUnit.name}
                              onChange={(e) => {
                                  const selected = globalUnits.find(u => u.name === e.target.value);
                                  if (selected) {
                                      setNewUnit({ ...newUnit, name: selected.name, factor: selected.factor.toString() });
                                  } else {
                                      setNewUnit({ ...newUnit, name: e.target.value });
                                  }
                              }}
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all"
                          >
                              <option value="">-- اختر الوحدة --</option>
                              {globalUnits.map((u, i) => (
                                  <option key={i} value={u.name}>{u.name} (x{u.factor})</option>
                              ))}
                          </select>
                      ) : (
                          <input
                            type="text"
                            placeholder="مثال: كرتونة"
                            value={newUnit.name}
                            onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all"
                          />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">المعامل (تحتوي كم قطعة؟)</label>
                      <input
                        type="number"
                        placeholder="12"
                        value={newUnit.factor}
                        onChange={(e) => setNewUnit({ ...newUnit, factor: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">سعر بيع الوحدة</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newUnit.price}
                        onChange={(e) => setNewUnit({ ...newUnit, price: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-black text-emerald-600 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                    <div className="w-full sm:w-1/2 lg:w-1/3">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">باركود الوحدة</label>
                      <div className="relative group">
                        <input
                          type="text"
                          dir="ltr"
                          placeholder="Scan..."
                          value={newUnit.barcode}
                          onChange={(e) => setNewUnit({ ...newUnit, barcode: e.target.value })}
                          style={{ paddingLeft: '85px', paddingRight: '12px' }}
                          className="w-full py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-mono transition-all text-left"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const random = Math.floor(100000000000 + Math.random() * 900000000000).toString();
                            setNewUnit({ ...newUnit, barcode: random });
                          }}
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap active:scale-95"
                        >
                          توليد تلقائي
                        </button>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleAddUnit}
                      className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                    >
                      إضافة الوحدة
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-white border-2 border-indigo-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                        <Box className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="font-bold text-slate-800 text-base">القطعة (الوحدة الأساسية)</span>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-black">x1</span>
                    </div>
                    <div className="flex items-center gap-6">
                       <span className="text-xs font-bold text-slate-400">السعر:</span>
                       <div className="text-lg font-black text-emerald-600">
                         {price?.toLocaleString() || 0}
                       </div>
                    </div>
                  </div>

                  {unitFields.map((unit, idx) => (
                    <div
                      key={unit.id}
                      className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-2xl shadow-sm group hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                           <Box className="w-4 h-4 text-slate-500" />
                        </div>
                        <span className="font-bold text-slate-800 text-base">{unit.name}</span>
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-black">
                          x{unit.conversionFactor}
                        </span>
                        {unit.barcode && (
                          <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Barcode className="w-3 h-3" />
                            {unit.barcode}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-slate-400">السعر:</span>
                           <div className="text-lg font-black text-emerald-600">
                             {unit.price.toLocaleString()}
                           </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUnit(idx)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

              {currentStep.id === 'variants' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="p-5 border border-slate-200 rounded-3xl bg-slate-50/50 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-indigo-500 h-full"></div>
                  <h4 className="font-black text-slate-800 mb-4 text-base">إضافة خيار جديد</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">اسم الخيار</label>
                      <input
                        type="text"
                        placeholder="مثال: حجم كبير، لون أحمر"
                        value={newVariant.name}
                        onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">السعر الإضافي</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0.00"
                          value={newVariant.price}
                          onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                          className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-black text-emerald-600 transition-all"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">+</span>
                      </div>
                    </div>
                    <div className="md:col-span-1">
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                      >
                        إضافة الخيار
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {variantFields.map((variant, idx) => (
                    <div
                      key={variant.id}
                      className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-2xl shadow-sm group hover:border-indigo-300 transition-colors"
                    >
                      <div className="font-bold text-slate-800 text-base">{variant.name}</div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-slate-400">السعر الإضافي:</span>
                           <div className="text-lg font-black text-emerald-600">
                             +{variant.price.toLocaleString()}
                           </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {variantFields.length === 0 && (
                     <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                        <p className="text-sm font-bold text-slate-500">لا توجد خيارات مضافة بعد.</p>
                     </div>
                  )}
                </div>
              </div>
            )}

              {currentStep.id === 'modifiers' && (
              <div className="space-y-6">
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                  <p className="text-xs text-indigo-700 font-medium">
                    استخدم هذه الشاشة لإضافة مجموعات خيارات للمنتج (مثل: نوع الخبز، الإضافات، حجم المشروب).
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => appendModifier({ name: '', required: false, multiple: false, options: [] })}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-200"
                  >
                    + إضافة مجموعة خيارات
                  </button>
                </div>

                <div className="space-y-4">
                  {modifierFields.map((modifier, idx) => (
                    <div key={modifier.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">اسم المجموعة</label>
                            <input
                              type="text"
                              {...register(`modifiers.${idx}.name` as const)}
                              placeholder="مثال: الإضافات"
                              className="w-full p-2 rounded-lg border text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-6">
                            <input
                              type="checkbox"
                              {...register(`modifiers.${idx}.required` as const)}
                              className="w-4 h-4 text-indigo-600 rounded"
                            />
                            <label className="text-sm font-bold text-slate-700">إجباري</label>
                          </div>
                          <div className="flex items-center gap-2 mt-6">
                            <input
                              type="checkbox"
                              {...register(`modifiers.${idx}.multiple` as const)}
                              className="w-4 h-4 text-indigo-600 rounded"
                            />
                            <label className="text-sm font-bold text-slate-700">اختيار متعدد</label>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeModifier(idx)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="pl-4 border-r-2 border-indigo-200 space-y-2">
                        <h5 className="text-xs font-bold text-slate-500">الخيارات</h5>
                        {modifier.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              {...register(`modifiers.${idx}.options.${optIdx}.name` as const)}
                              placeholder="اسم الخيار"
                              className="flex-1 p-2 rounded-lg border text-sm"
                            />
                            <input
                              type="number"
                              {...register(`modifiers.${idx}.options.${optIdx}.price` as const, { valueAsNumber: true })}
                              placeholder="السعر الإضافي"
                              className="w-32 p-2 rounded-lg border text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = [...modifier.options];
                                newOptions.splice(optIdx, 1);
                                updateModifier(idx, { ...modifier, options: newOptions });
                              }}
                              className="text-red-400 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = [...modifier.options, { name: '', price: 0 }];
                            updateModifier(idx, { ...modifier, options: newOptions });
                          }}
                          className="text-xs text-indigo-600 font-bold hover:text-indigo-800"
                        >
                          + إضافة خيار
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

              {currentStep.id === 'composition' && (
              <div className="space-y-6">
                {type === 'composite' && (
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">إضافة مكون</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1">بحث عن مكون</label>
                        <input
                          type="text"
                          placeholder="ابحث..."
                          value={ingredientSearch}
                          onChange={(e) => setIngredientSearch(e.target.value)}
                          className="w-full p-2 rounded-lg border text-sm"
                        />
                        {ingredientSearch && filteredIngredients.length > 0 && (
                          <div className="absolute z-10 w-64 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredIngredients.map((ing) => (
                              <div
                                key={ing.id}
                                className="p-2 hover:bg-slate-50 cursor-pointer text-sm font-bold text-slate-700"
                                onClick={() => {
                                  setSelectedIngredientId(ing.id!);
                                  setIngredientSearch(ing.name);
                                }}
                              >
                                {ing.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">الكمية</label>
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={selectedIngredientQty}
                          onChange={(e) => setSelectedIngredientQty(Number(e.target.value))}
                          className="w-full p-2 rounded-lg border text-sm"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <button
                          type="button"
                          onClick={handleAddIngredient}
                          className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"
                        >
                          إضافة
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {type === 'composite' && (
                  <div className="space-y-2">
                    {compFields.map((comp, idx) => {
                      const ing = simpleProducts.find((p) => p.id === comp.productId);
                      return (
                        <div
                          key={comp.id}
                          className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm group"
                        >
                          <div className="font-bold text-slate-800">{ing?.name || 'مكون غير معروف'}</div>
                          <div className="flex items-center gap-4">
                            <div className="text-sm font-bold text-slate-600">
                              الكمية: {comp.quantity}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeComp(idx)}
                              className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </form>
          </div>
        </div>

        {/* Wizard Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
          <button
            type="button"
            onClick={handlePrev}
            disabled={safeStepIndex === 0}
            className="w-full md:w-auto px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
            السابق
          </button>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {!product && (
               <label className="flex items-center justify-center gap-2 cursor-pointer group px-4">
                 <input 
                   type="checkbox" 
                   className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                   checked={saveAndAddAnother} 
                   onChange={(e) => setSaveAndAddAnother(e.target.checked)} 
                 />
                 <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">إضافة منتج آخر بعد الحفظ</span>
               </label>
            )}

            {safeStepIndex < steps.length - 1 && (
               <button
                 type="button"
                 onClick={handleSubmit(onSubmit)}
                 disabled={isSubmitting}
                 className="w-full sm:w-auto px-6 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
               >
                 <Save className="w-4 h-4" />
                 تخطي وحفظ سريع
               </button>
            )}
            
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
              {isSubmitting ? (
                 'جاري الحفظ...'
              ) : safeStepIndex === steps.length - 1 ? (
                <>
                  <Check className="w-5 h-5" />
                  حفظ نهائي للمنتج
                </>
              ) : (
                <>
                  التالي
                  <ChevronLeft className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;
