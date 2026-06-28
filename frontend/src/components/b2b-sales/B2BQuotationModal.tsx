import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Quotation, Customer, Product, OrderItem } from '../../types';
import { Loader2, Search, Plus, Trash2, ShoppingCart } from 'lucide-react';

const quotationSchema = z.object({
  customerId: z.coerce.number().optional(),
  customerName: z.string().min(1, 'يجب إدخال اسم العميل'),
  date: z.coerce.date(),
  expiryDate: z.coerce.date().optional(),
  subtotalAmount: z.coerce.number().min(0),
  discountAmount: z.coerce.number().min(0).optional(),
  taxAmount: z.coerce.number().min(0).optional(),
  totalAmount: z.coerce.number().min(0),
  notes: z.string().optional(),
  status: z.enum(['pending', 'accepted', 'rejected', 'converted']).default('pending')
});

export type QuotationFormData = z.infer<typeof quotationSchema> & { items: OrderItem[] };

interface B2BQuotationModalProps {
  editingQuotation: Quotation | null;
  customers: Customer[];
  products: Product[];
  onClose: () => void;
  onSave: (data: QuotationFormData) => Promise<void>;
}

const B2BQuotationModal: React.FC<B2BQuotationModalProps> = ({
  editingQuotation,
  customers,
  products,
  onClose,
  onSave
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema) as any,
    defaultValues: {
      customerId: 0,
      customerName: '',
      date: new Date(),
      expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days default
      subtotalAmount: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      status: 'pending'
    }
  });

  const [items, setItems] = useState<OrderItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const watchCustomerId = watch('customerId');
  const watchDiscount = watch('discountAmount') || 0;
  const watchTax = watch('taxAmount') || 0;

  useEffect(() => {
    if (watchCustomerId && watchCustomerId > 0) {
      const customer = customers.find(c => c.id === Number(watchCustomerId));
      if (customer) {
        setValue('customerName', customer.name);
      }
    }
  }, [watchCustomerId, customers, setValue]);

  useEffect(() => {
    if (editingQuotation) {
      reset({
        customerId: editingQuotation.customerId || 0,
        customerName: editingQuotation.customerName,
        date: new Date(editingQuotation.date),
        expiryDate: editingQuotation.expiryDate ? new Date(editingQuotation.expiryDate) : undefined,
        subtotalAmount: editingQuotation.subtotalAmount,
        discountAmount: editingQuotation.discountAmount || 0,
        taxAmount: editingQuotation.taxAmount || 0,
        totalAmount: editingQuotation.totalAmount,
        notes: editingQuotation.notes || '',
        status: editingQuotation.status
      });
      setItems(editingQuotation.items || []);
    } else {
      reset({
        customerId: 0,
        customerName: '',
        date: new Date(),
        expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        subtotalAmount: 0,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        notes: '',
        status: 'pending'
      });
      setItems([]);
    }
  }, [editingQuotation, reset]);

  // Auto-calculate total amount when items change
  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setValue('subtotalAmount', subtotal);
    const total = subtotal - watchDiscount + watchTax;
    setValue('totalAmount', total);
  }, [items, watchDiscount, watchTax, setValue]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
      p.barcode?.includes(productSearch)
    ).slice(0, 5);
  }, [products, productSearch]);

  const addProduct = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        productId: product.id!,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price
      }];
    });
    setProductSearch('');
  };

  const addCustomItem = () => {
    setItems(prev => [...prev, {
      productId: Date.now(),
      name: 'صنف مخصص',
      price: 0,
      quantity: 1,
      total: 0
    }]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: QuotationFormData) => {
    await onSave({ ...data, items });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-slate-800">{editingQuotation ? 'تعديل عرض السعر' : 'إنشاء عرض سعر جديد'}</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <form id="b2b-quotation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">العميل (مسجل)</label>
                <select
                  {...register('customerId')}
                  className={`w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${errors.customerId ? 'border-red-500' : 'border-slate-200'}`}
                >
                  <option value={0}>اختر العميل (اختياري)...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">اسم العميل (مطلوب)</label>
                <input
                  type="text"
                  {...register('customerName')}
                  className={`w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${errors.customerName ? 'border-red-500' : 'border-slate-200'}`}
                  placeholder="اسم العميل أو الشركة"
                />
                {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">تاريخ العرض</label>
                <input
                  type="date"
                  {...register('date')}
                  className={`w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${errors.date ? 'border-red-500' : 'border-slate-200'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">تاريخ الانتهاء</label>
                <input
                  type="date"
                  {...register('expiryDate')}
                  className={`w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${errors.expiryDate ? 'border-red-500' : 'border-slate-200'}`}
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Items Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-500" />
                  الأصناف
                </h4>
              </div>

              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="ابحث لإضافة منتج..."
                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-medium"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                  {filteredProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden">
                      {filteredProducts.map(p => (
                        <div 
                          key={p.id}
                          onClick={() => addProduct(p)}
                          className="flex justify-between p-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0"
                        >
                          <span className="font-bold text-slate-800">{p.name}</span>
                          <span className="text-indigo-600 font-mono">{p.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  type="button"
                  onClick={addCustomItem}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> صنف مخصص
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-slate-500 font-bold text-sm">
                    <tr>
                      <th className="p-3">الصنف</th>
                      <th className="p-3 w-32">السعر</th>
                      <th className="p-3 w-24">الكمية</th>
                      <th className="p-3 w-32">المجموع</th>
                      <th className="p-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3">
                          <input 
                            type="text"
                            className="w-full bg-transparent border-none outline-none font-bold text-slate-800"
                            value={item.name}
                            onChange={e => updateItem(idx, 'name', e.target.value)}
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="number" onFocus={(e) => e.target.select()} 
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-mono focus:border-indigo-500 outline-none"
                            value={item.price}
                            onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="number" onFocus={(e) => e.target.select()} 
                            min="1"
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-bold focus:border-indigo-500 outline-none"
                            value={item.quantity}
                            onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                          />
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          {(item.price * item.quantity).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 p-1 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-400 font-medium">لم يتم إضافة أصناف</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Totals Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">المجموع الفرعي</label>
                <input
                  type="number"
                  readOnly
                  {...register('subtotalAmount')}
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">الخصم</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('discountAmount')}
                  className={`w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold ${errors.discountAmount ? 'border-red-500' : 'border-slate-200'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">الضريبة</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('taxAmount')}
                  className={`w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold ${errors.taxAmount ? 'border-red-500' : 'border-slate-200'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">الإجمالي النهائي</label>
                <input
                  type="number"
                  readOnly
                  {...register('totalAmount')}
                  className="w-full p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl outline-none font-bold text-indigo-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ملاحظات وشروط العرض</label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="أضف أي ملاحظات أو شروط إضافية هنا..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
              ></textarea>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            form="b2b-quotation-form"
            disabled={isSubmitting || items.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            حفظ عرض السعر
          </button>
        </div>
      </div>
    </div>
  );
};

export default B2BQuotationModal;
