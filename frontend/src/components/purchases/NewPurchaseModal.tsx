import React, { useState, useEffect } from 'react';
import { Package, X, ChevronDown, CalendarDays, Plus, Trash2, Save, Upload } from 'lucide-react';
import { Product, Supplier } from '../../types';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import SerialEntryModal from './SerialEntryModal';
import { compressImage } from '../../utils/imageCompression';

export const purchaseSchema = z.object({
  supplierId: z.number().min(1, 'المورد مطلوب'),
  invoiceNumber: z.string().min(1, 'رقم الفاتورة مطلوب'),
  date: z.string().min(1, 'تاريخ الفاتورة مطلوب'),
  paymentType: z.enum(['cash', 'credit']),
  notes: z.string().optional(),
  attachment: z.string().optional(),
  tax: z.number().min(0),
  discount: z.number().min(0),
  items: z.array(z.object({
    productId: z.number(),
    name: z.string(),
    costPrice: z.number().min(0),
    quantity: z.number().min(1),
    bonusQuantity: z.number().min(0).optional(),
    total: z.number(),
    expiryDate: z.string().optional(),
    serials: z.array(z.string()).optional()
  })).min(1, 'يجب إضافة منتج واحد على الأقل')
});

export type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface NewPurchaseModalProps {
  isOpen: boolean;
  closeModal: () => void;
  products: Product[] | undefined;
  suppliers: Supplier[] | undefined;
  handleSavePurchase: (data: PurchaseFormData) => void;
  formatCurrency: (amount: number) => string;
}

const NewPurchaseModal: React.FC<NewPurchaseModalProps> = ({
  isOpen, closeModal, products, suppliers, handleSavePurchase, formatCurrency
}) => {
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      paymentType: 'cash',
      tax: 0,
      discount: 0,
      items: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchItems = watch("items");
  const watchTax = watch("tax");
  const watchDiscount = watch("discount");
  const watchAttachment = watch("attachment");

  const formSubtotal = watchItems.reduce((sum, i) => sum + i.total, 0);
  const formFinalTotal = Math.max(0, formSubtotal + (watchTax || 0) - (watchDiscount || 0));

  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemBonusQuantity, setItemBonusQuantity] = useState(0);
  const [itemCost, setItemCost] = useState(0);
  const [itemExpiry, setItemExpiry] = useState('');

  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [currentItemForSerials, setCurrentItemForSerials] = useState<{itemIdx: number, productId: number, productName: string, qty: number} | null>(null);

  useEffect(() => {
    if (isOpen) {
      reset({
        date: new Date().toISOString().split('T')[0],
        paymentType: 'cash',
        tax: 0,
        discount: 0,
        items: []
      });
      resetInput();
    }
  }, [isOpen, reset]);

  const resetInput = () => {
    setSelectedProductId('');
    setItemQuantity(1);
    setItemBonusQuantity(0);
    setItemCost(0);
    setItemExpiry('');
  };

  const addItemToForm = () => {
    if (!selectedProductId || itemQuantity <= 0 || itemCost < 0) return;
    
    const product = products?.find(p => p.id === Number(selectedProductId));
    if (!product) return;

    if (product.trackSerial) {
        setCurrentItemForSerials({
            itemIdx: fields.length,
            productId: product.id!,
            productName: product.name,
            qty: itemQuantity
        });
        setIsSerialModalOpen(true);
        return;
    }

    append({
      productId: product.id!,
      name: product.name,
      costPrice: itemCost,
      quantity: itemQuantity,
      bonusQuantity: itemBonusQuantity > 0 ? itemBonusQuantity : undefined,
      total: itemCost * itemQuantity,
      expiryDate: itemExpiry || undefined
    });
    resetInput();
  };

  const confirmSerials = (serials: string[]) => {
      if(!currentItemForSerials) return;

      append({
          productId: currentItemForSerials.productId,
          name: currentItemForSerials.productName,
          costPrice: itemCost,
          quantity: currentItemForSerials.qty,
          bonusQuantity: itemBonusQuantity > 0 ? itemBonusQuantity : undefined,
          total: itemCost * currentItemForSerials.qty,
          expiryDate: itemExpiry || undefined,
          serials: serials
      });

      setIsSerialModalOpen(false);
      setCurrentItemForSerials(null);
      resetInput();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          compressImage(file).then(result => setValue('attachment', result));
      }
  };

  const onSubmit = (data: PurchaseFormData) => {
    handleSavePurchase(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-200">
                  <Package className="w-6 h-6" />
              </div>
              <div>
                  <h3 className="text-xl font-extrabold text-gray-800">فاتورة مشتريات جديدة</h3>
                  <p className="text-xs text-gray-500 font-medium">إدخال بضاعة (مع تتبع الصلاحية)</p>
              </div>
          </div>
          <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Side: Items & Scanner */}
            <div className="flex-1 flex flex-col border-l border-gray-200 bg-gray-50/50">
                
                {/* Manual Add Form */}
                <div className="p-5 bg-white border-b border-gray-200 shadow-sm z-10">
                    <div className="flex flex-col lg:flex-row gap-3 items-end">
                        <div className="flex-1 w-full relative">
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">المنتج (بحث يدوي)</label>
                            <div className="relative">
                                <select 
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                    value={selectedProductId}
                                    onChange={e => {
                                        const prod = products?.find(p => p.id === Number(e.target.value));
                                        setSelectedProductId(Number(e.target.value));
                                        if(prod && prod.costPrice) setItemCost(prod.costPrice);
                                    }}
                                >
                                    <option value="">اختر المنتج...</option>
                                    {products?.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (مخزون: {p.stock})</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="w-full lg:w-28 relative">
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center justify-between">
                                الكمية
                            </label>
                            <input 
                                type="number" onFocus={(e) => e.target.select()} 
                                min="1"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500"
                                value={itemQuantity}
                                onChange={e => setItemQuantity(Number(e.target.value))}
                            />
                        </div>
                        <div className="w-full lg:w-24 relative">
                            <label className="block text-xs font-bold text-emerald-600 mb-1.5" title="بونص مجاني">
                                بونص مجاني
                            </label>
                            <input 
                                type="number" onFocus={(e) => e.target.select()} 
                                min="0" placeholder="0"
                                className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-center outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-800"
                                value={itemBonusQuantity || ''}
                                onChange={e => setItemBonusQuantity(Number(e.target.value))}
                            />
                        </div>
                        <div className="w-full lg:w-28">
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">سعر التكلفة</label>
                            <input 
                                type="number" onFocus={(e) => e.target.select()} 
                                min="0"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500"
                                value={itemCost}
                                onChange={e => setItemCost(Number(e.target.value))}
                            />
                        </div>
                        {/* Expiry Date Input */}
                        <div className="w-full lg:w-36">
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 text-orange-600 flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" /> انتهاء الصلاحية
                            </label>
                            <input 
                                type="date"
                                className="w-full px-4 py-3 bg-white border border-orange-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500 text-orange-800"
                                value={itemExpiry}
                                onChange={e => setItemExpiry(e.target.value)}
                            />
                        </div>

                        <button 
                            onClick={addItemToForm}
                            disabled={!selectedProductId}
                            className="w-full lg:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-5">
                    {fields.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                            <Package className="w-12 h-12 mb-3 opacity-20" />
                            <p className="font-medium">لم يتم إضافة أصناف بعد</p>
                            {errors.items && <p className="text-red-500 text-sm mt-2">{errors.items.message}</p>}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {fields.map((item, idx) => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-indigo-100 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs border border-indigo-100">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span>{formatCurrency(item.costPrice)} x {item.quantity}</span>
                                                {item.bonusQuantity ? (
                                                    <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                                                        +{item.bonusQuantity} بونص
                                                    </span>
                                                ) : null}
                                                {item.expiryDate && (
                                                    <span className="text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-bold">
                                                        Exp: {new Date(item.expiryDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {item.serials && item.serials.length > 0 && (
                                                    <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-bold">
                                                        Serials: {item.serials.length}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg text-sm">{formatCurrency(item.total)}</span>
                                        <button onClick={() => remove(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Totals Footer */}
                <div className="p-5 bg-white border-t border-gray-200">
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 mb-1">الضريبة</label>
                            <input type="number" {...register('tax', { valueAsNumber: true })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                            {errors.tax && <p className="text-red-500 text-xs mt-1">{errors.tax.message}</p>}
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 mb-1">الخصم</label>
                            <input type="number" {...register('discount', { valueAsNumber: true })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                            {errors.discount && <p className="text-red-500 text-xs mt-1">{errors.discount.message}</p>}
                        </div>
                    </div>
                    <div className="flex justify-between items-center mb-4 pt-4 border-t border-dashed border-gray-200">
                        <span className="text-gray-500 font-bold text-sm">الإجمالي النهائي</span>
                        <span className="text-3xl font-black text-gray-800">{formatCurrency(formFinalTotal)}</span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={closeModal} className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">إلغاء</button>
                        <button onClick={handleSubmit(onSubmit)} className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                            <Save className="w-5 h-5" />
                            حفظ الفاتورة
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side: Invoice Info */}
            <div className="w-full lg:w-80 bg-white p-6 overflow-y-auto border-l border-gray-100 shadow-xl z-20">
                <h4 className="font-bold text-gray-800 mb-4">بيانات الفاتورة</h4>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">المورد</label>
                        <select 
                            {...register('supplierId', { valueAsNumber: true })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">اختر المورد...</option>
                            {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        {errors.supplierId && <p className="text-red-500 text-xs mt-1">{errors.supplierId.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">رقم الفاتورة</label>
                        <input 
                            type="text" 
                            {...register('invoiceNumber')}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="مثال: INV-2024-001"
                        />
                        {errors.invoiceNumber && <p className="text-red-500 text-xs mt-1">{errors.invoiceNumber.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">تاريخ الفاتورة</label>
                        <input 
                            type="date" 
                            {...register('date')}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">طريقة الدفع</label>
                        <select 
                            {...register('paymentType')}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="cash">نقدي (خصم من الصندوق)</option>
                            <option value="credit">آجل (إضافة لرصيد المورد)</option>
                        </select>
                        {errors.paymentType && <p className="text-red-500 text-xs mt-1">{errors.paymentType.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">ملاحظات</label>
                        <textarea 
                            {...register('notes')}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20"
                            placeholder="أي ملاحظات إضافية..."
                        />
                        {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">مرفق الفاتورة (صورة)</label>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative">
                            {watchAttachment ? (
                                <div className="relative">
                                    <img src={watchAttachment} alt="Attachment" className="max-h-32 mx-auto rounded-lg" />
                                    <button 
                                        type="button"
                                        onClick={() => setValue('attachment', '')}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                    <span className="text-xs text-gray-500 font-bold">اضغط لرفع صورة الفاتورة</span>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
      <SerialEntryModal 
        isOpen={isSerialModalOpen}
        onClose={() => setIsSerialModalOpen(false)}
        currentItemForSerials={currentItemForSerials}
        confirmSerials={confirmSerials}
      />
    </div>
  );
};

export default NewPurchaseModal;
