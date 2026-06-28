import React, { useEffect } from 'react';
import { X, ClipboardCheck, ArrowRightLeft, History, Plus, Trash2 } from 'lucide-react';
import { Warehouse as IWarehouse } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// --- ADD / EDIT WAREHOUSE MODAL ---
const warehouseSchema = z.object({
  name: z.string().min(1, 'اسم المخزن مطلوب'),
  address: z.string().optional(),
  isMain: z.boolean(),
});

export type WarehouseFormData = z.infer<typeof warehouseSchema>;

interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingWarehouse: IWarehouse | null;
  handleSaveWarehouse: (data: WarehouseFormData) => void;
}

export const WarehouseModal: React.FC<WarehouseModalProps> = ({
  isOpen, onClose, editingWarehouse, handleSaveWarehouse
}) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: '',
      address: '',
      isMain: false
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (editingWarehouse) {
        reset({
          name: editingWarehouse.name,
          address: editingWarehouse.address || '',
          isMain: editingWarehouse.isMain || false
        });
      } else {
        reset({ name: '', address: '', isMain: false });
      }
    }
  }, [isOpen, editingWarehouse, reset]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="font-black text-xl text-slate-800">{editingWarehouse ? 'تعديل مخزن' : 'إضافة مخزن جديد'}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={handleSubmit(handleSaveWarehouse)} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">اسم المخزن <span className="text-red-500">*</span></label>
            <input type="text" {...register('name')} className={`w-full bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-200'} px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold transition-all`} placeholder="مثال: المخزن الرئيسي، فرع جدة..." autoFocus />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">العنوان</label>
            <input type="text" {...register('address')} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium transition-all" placeholder="عنوان المخزن..." />
          </div>
          <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <input type="checkbox" id="isMainWh" {...register('isMain')} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer" />
            <label htmlFor="isMainWh" className="text-sm font-bold text-indigo-900 cursor-pointer">تعيين كمخزن رئيسي</label>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all">إلغاء</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50">{editingWarehouse ? 'حفظ التعديلات' : 'إضافة المخزن'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- STOCK ADJUSTMENT MODAL ---
const stockAdjustmentSchema = z.object({
  newCountQty: z.number().min(0, 'الكمية يجب أن تكون 0 أو أكثر'),
  adjustmentReason: z.string().min(1, 'سبب التعديل مطلوب'),
  adjustmentNotes: z.string().optional(),
});

export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: {itemId?: number, productId: number, productName: string, currentQty: number} | null;
  handleUpdateStock: (data: StockAdjustmentFormData) => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen, onClose, editingItem, handleUpdateStock
}) => {
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<StockAdjustmentFormData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      newCountQty: 0,
      adjustmentReason: 'correction',
      adjustmentNotes: ''
    }
  });

  const newCountQty = watch('newCountQty');

  useEffect(() => {
    if (isOpen && editingItem) {
      reset({
        newCountQty: editingItem.currentQty,
        adjustmentReason: 'correction',
        adjustmentNotes: ''
      });
    }
  }, [isOpen, editingItem, reset]);

  if (!isOpen || !editingItem) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="font-black text-xl text-slate-800 flex items-center gap-2"><ClipboardCheck className="w-6 h-6 text-indigo-600" /> تعديل جرد</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={handleSubmit(handleUpdateStock)} className="p-6 space-y-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
            <p className="text-xs text-slate-500 font-bold mb-1">المنتج</p>
            <p className="font-black text-lg text-slate-800">{editingItem.productName}</p>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-slate-500 font-medium">الرصيد النظري (Theoretical) الحالي:</span>
              <span className="font-bold text-slate-800">{editingItem.currentQty}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">الرصيد الفعلي (الجديد) <span className="text-red-500">*</span></label>
            <input type="number" min="0" {...register('newCountQty', { valueAsNumber: true })} className={`w-full bg-slate-50 border ${errors.newCountQty ? 'border-red-500' : 'border-slate-200'} px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-black text-xl text-center transition-all`} autoFocus />
            {errors.newCountQty && <p className="text-red-500 text-xs mt-1 text-center">{errors.newCountQty.message}</p>}
            {newCountQty !== editingItem.currentQty && !isNaN(newCountQty) && (
              <p className={`text-xs font-bold mt-2 text-center ${newCountQty > editingItem.currentQty ? 'text-emerald-600' : 'text-red-600'}`}>
                الفرق: {newCountQty > editingItem.currentQty ? '+' : ''}{newCountQty - editingItem.currentQty}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">سبب التعديل</label>
            <select {...register('adjustmentReason')} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-sm text-slate-700">
              <option value="correction">تصحيح جرد</option>
              <option value="damage">تالف / هالك</option>
              <option value="theft">سرقة / مفقود</option>
              <option value="gift">هدايا / عينات</option>
              <option value="other">أخرى</option>
            </select>
            {errors.adjustmentReason && <p className="text-red-500 text-xs mt-1">{errors.adjustmentReason.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات</label>
            <input type="text" {...register('adjustmentNotes')} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-sm transition-all" placeholder="تفاصيل إضافية..." />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all">إلغاء</button>
            <button type="submit" disabled={isSubmitting || newCountQty === editingItem.currentQty || isNaN(newCountQty)} className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed">تحديث الرصيد</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- TRANSFER MODAL ---
const transferSchema = z.object({
  transferTargetId: z.number().min(1, 'المخزن الوجهة مطلوب'),
  transferQty: z.number().min(1, 'الكمية يجب أن تكون أكبر من صفر'),
});

export type TransferFormData = z.infer<typeof transferSchema>;

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  transferItem: {productId: number, productName: string, maxQty: number} | null;
  handleTransfer: (data: TransferFormData) => void;
  warehouses: IWarehouse[] | undefined;
  selectedWarehouseId: number | null;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen, onClose, transferItem,
  handleTransfer, warehouses, selectedWarehouseId
}) => {
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      transferTargetId: undefined,
      transferQty: 1
    }
  });

  const transferTargetId = watch('transferTargetId');
  const transferQty = watch('transferQty');

  useEffect(() => {
    if (isOpen) {
      reset({ transferTargetId: undefined, transferQty: 1 });
    }
  }, [isOpen, reset]);

  if (!isOpen || !transferItem) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="font-black text-xl text-slate-800 flex items-center gap-2"><ArrowRightLeft className="w-6 h-6 text-orange-500" /> نقل مخزون</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={handleSubmit(handleTransfer)} className="p-6 space-y-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
            <p className="text-xs text-slate-500 font-bold mb-1">المنتج</p>
            <p className="font-black text-lg text-slate-800">{transferItem.productName}</p>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-slate-500 font-medium">المتوفر في هذا المخزن:</span>
              <span className="font-bold text-slate-800">{transferItem.maxQty}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">نقل إلى مخزن <span className="text-red-500">*</span></label>
            <select {...register('transferTargetId', { valueAsNumber: true })} className={`w-full bg-slate-50 border ${errors.transferTargetId ? 'border-red-500' : 'border-slate-200'} px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-bold text-sm text-slate-700`}>
              <option value="" disabled selected>اختر المخزن الوجهة...</option>
              {warehouses?.filter(w => w.id !== selectedWarehouseId).map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            {errors.transferTargetId && <p className="text-red-500 text-xs mt-1">{errors.transferTargetId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">الكمية المراد نقلها <span className="text-red-500">*</span></label>
            <input type="number" min="1" max={transferItem.maxQty} {...register('transferQty', { valueAsNumber: true })} className={`w-full bg-slate-50 border ${errors.transferQty ? 'border-red-500' : 'border-slate-200'} px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-black text-xl text-center transition-all`} />
            {errors.transferQty && <p className="text-red-500 text-xs mt-1 text-center">{errors.transferQty.message}</p>}
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all">إلغاء</button>
            <button type="submit" disabled={isSubmitting || !transferTargetId || isNaN(transferTargetId) || isNaN(transferQty) || transferQty <= 0 || transferQty > transferItem.maxQty} className="flex-1 py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed">تأكيد النقل</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- HISTORY MODAL ---
interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyItem: {productId: number, name: string} | null;
  itemAdjustments: any[];
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen, onClose, historyItem, itemAdjustments
}) => {
  if (!isOpen || !historyItem) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h3 className="font-black text-xl text-slate-800 flex items-center gap-2"><History className="w-6 h-6 text-indigo-600" /> سجل حركات المخزون</h3>
            <p className="text-slate-500 text-sm mt-1 font-medium">{historyItem.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {itemAdjustments.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">لا توجد حركات مسجلة لهذا المنتج في هذا المخزن</p>
            </div>
          ) : (
            <div className="space-y-4">
              {itemAdjustments.map((adj, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${adj.type === 'increase' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {adj.type === 'increase' ? <Plus className="w-6 h-6" /> : <Trash2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{adj.reason === 'correction' ? 'تصحيح جرد' : adj.reason === 'damage' ? 'تالف' : adj.reason === 'theft' ? 'مفقود' : adj.reason === 'gift' ? 'هدية' : 'أخرى'}</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">{new Date(adj.date).toLocaleString('ar-EG')}</p>
                      {adj.notes && <p className="text-sm text-slate-600 mt-1">{adj.notes}</p>}
                    </div>
                  </div>
                  <div className={`font-black text-xl ${adj.type === 'increase' ? 'text-emerald-600' : 'text-red-600'}`} dir="ltr">
                    {adj.type === 'increase' ? '+' : '-'}{adj.quantity}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
