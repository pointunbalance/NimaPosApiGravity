import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { X, Plus, Trash2, Package, Save, PackageSearch, Calendar } from 'lucide-react';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { generateReferenceNumber } from '../../utils/generateReference';

interface NewConsignmentModalProps {
  isOpen: boolean;
  closeModal: () => void;
  formatCurrency: (amount: number) => string;
}

export const NewConsignmentModal: React.FC<NewConsignmentModalProps> = ({
  isOpen,
  closeModal,
  formatCurrency,
}) => {
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];

  const { register, handleSubmit, control, watch, setValue, reset } = useForm({
    defaultValues: {
      type: 'inward' as 'inward' | 'outward',
      partyId: '',
      referenceNumber: `CSG-LOADING`,
      date: new Date().toISOString().split('T')[0],
      items: [] as { productId: number; name: string; quantity: number; agreedPrice: number; total: number; soldQuantity: number; returnedQuantity: number }[],
      notes: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchItems = watch('items');
  const watchType = watch('type');

  const formFinalTotal = watchItems.reduce((sum, item) => sum + item.total, 0);

  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const initForm = async () => {
        const generatedRef = await generateReferenceNumber('consignments', 'CSG');
        reset({
          type: 'inward',
          partyId: '',
          referenceNumber: generatedRef,
          date: new Date().toISOString().split('T')[0],
          items: [],
          notes: ''
        });
        setSelectedProductId('');
        setItemQuantity(1);
        setItemPrice(0);
      };
      initForm();
    }
  }, [isOpen, reset]);

  const handleAddItem = () => {
    if (!selectedProductId || itemQuantity <= 0 || itemPrice < 0) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    if (watchType === 'outward' && product.stock < itemQuantity) {
      alert(`الكمية المتوفرة في المخزن (${product.stock}) أقل من المطلوبة للإرسال كأمانة.`);
      return;
    }

    append({
      productId: product.id!,
      name: product.name,
      agreedPrice: itemPrice,
      quantity: itemQuantity,
      total: itemPrice * itemQuantity,
      soldQuantity: 0,
      returnedQuantity: 0
    });

    setSelectedProductId('');
    setItemQuantity(1);
    setItemPrice(0);
  };

  const onSubmit = async (data: any) => {
    try {
      if (data.items.length === 0) {
        alert("يجب إضافة صنف واحد على الأقل.");
        return;
      }
      if (!data.partyId) {
        alert("يجب اختيار الجهة (المورد أو العميل).");
        return;
      }

      let partyName = "";
      if (data.type === 'inward') {
          const supplier = suppliers.find(s => s.id === Number(data.partyId));
          partyName = supplier ? supplier.name : 'مورد غير معروف';
      } else {
          const customer = customers.find(c => c.id === Number(data.partyId));
          partyName = customer ? customer.name : 'عميل نقدي';
      }

      await (db as any).transaction('rw', db.consignments, db.products, async () => {
          await db.consignments.add({
              type: data.type,
              partyId: Number(data.partyId),
              partyName,
              referenceNumber: data.referenceNumber,
              date: data.date,
              status: "active",
              items: data.items.map((i: any) => ({
                  productId: i.productId,
                  name: i.name,
                  quantity: i.quantity,
                  agreedPrice: i.agreedPrice,
                  soldQuantity: 0,
                  returnedQuantity: 0
              })),
              totalValue: formFinalTotal,
              notes: data.notes,
              createdAt: new Date().toISOString()
          });

          // Update stock based on consignment type
          for(const item of data.items) {
             const product = await db.products.get(item.productId);
             if(product) {
                 const stockChange = data.type === 'inward' ? item.quantity : -item.quantity;
                 await db.products.update(item.productId, {
                     stock: product.stock + stockChange
                 });
             }
          }
      });

      closeModal();
    } catch (e: any) {
        alert("حدث خطأ أثناء الحفظ: " + e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-2 text-sm rounded-xl shadow-lg shadow-indigo-200">
                  <PackageSearch className="w-6 h-6" />
              </div>
              <div>
                  <h3 className="text-xl font-extrabold text-gray-800">إضافة بضاعة أمانة</h3>
                  <p className="text-xs text-gray-500 font-medium">سجل بضاعة أمانة الموردين أو الأمانة المنصرفة للعملاء</p>
              </div>
          </div>
          <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Box: Items selection */}
            <div className="flex-1 flex flex-col border-l border-gray-200 bg-gray-50/50">
                <div className="p-5 bg-white border-b border-gray-200 shadow-sm z-10 flex flex-wrap gap-3 items-end">
                     <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">المنتج</label>
                        <select 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={selectedProductId}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setSelectedProductId(val);
                                const p = products.find(prod => prod.id === val);
                                if(p) setItemPrice(p.price || 0);
                            }}
                        >
                            <option value="">اختر المنتج...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id} disabled={watchType === 'outward' && p.stock <= 0}>
                                    {p.name} - متوفر: {p.stock}
                                </option>
                            ))}
                        </select>
                     </div>
                     <div className="w-24">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">الكمية</label>
                        <input type="number" min="1" value={itemQuantity} onChange={e => setItemQuantity(Number(e.target.value))} onFocus={e => e.target.select()} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-center" />
                     </div>
                     <div className="w-32">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">سعر الأمانة</label>
                        <input type="number" min="0" value={itemPrice} onChange={e => setItemPrice(Number(e.target.value))} onFocus={e => e.target.select()} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-center" />
                     </div>
                     <button onClick={handleAddItem} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 h-11 flex items-center justify-center">
                         <Plus className="w-5 h-5" />
                     </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                    {fields.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                            <Package className="w-12 h-12 mb-3 opacity-20" />
                            <p className="font-medium">لم يتم إضافة أصناف إلى الكشف</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                             {fields.map((item, idx) => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-indigo-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs border border-indigo-100">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span>{formatCurrency(item.agreedPrice)} x {item.quantity}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg text-sm">{formatCurrency(item.total)}</span>
                                        <button onClick={() => remove(idx)} className="text-gray-300 hover:text-red-500 p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                             ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Box: Setup & Totals */}
            <div className="w-full lg:w-96 bg-white p-6 overflow-y-auto border-l border-gray-100 shadow-xl z-20 flex flex-col">
                <div className="flex-1 space-y-4">
                    <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">بيانات الإيصال</h4>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2 p-1 bg-gray-100 rounded-xl">
                        <button 
                            type="button"
                            onClick={() => { setValue('type', 'inward'); setValue('partyId', ''); }}
                            className={`py-2 rounded-lg text-sm font-bold transition-all ${watchType === 'inward' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            واردة من مورد
                        </button>
                        <button 
                            type="button"
                            onClick={() => { setValue('type', 'outward'); setValue('partyId', ''); }}
                            className={`py-2 rounded-lg text-sm font-bold transition-all ${watchType === 'outward' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            منصرفة لعميل
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">{watchType === 'inward' ? 'المورد' : 'العميل'}</label>
                        <select {...register('partyId')} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                            <option value="">-- اختر {watchType === 'inward' ? 'المورد' : 'العميل'} --</option>
                            {watchType === 'inward' ? suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            )) : customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">تاريخ الإيصال</label>
                            <input type="date" {...register('date')} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">رقم المرجع</label>
                            <input type="text" {...register('referenceNumber')} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">ملاحظات (اختياري)</label>
                        <textarea {...register('notes')} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none font-medium" placeholder="ملاحظات حول البضاعة..."></textarea>
                    </div>

                    <div className="border-t border-dashed border-gray-200 pt-4 mt-6">
                         <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <span className="text-gray-700 font-bold text-sm">إجمالي القيمة التقديرية</span>
                            <span className="text-xl font-black text-indigo-700">{formatCurrency(formFinalTotal)}</span>
                         </div>
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button onClick={closeModal} className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">إلغاء</button>
                    <button onClick={handleSubmit(onSubmit)} className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                        <Save className="w-5 h-5" />
                        حفظ الكشف
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
