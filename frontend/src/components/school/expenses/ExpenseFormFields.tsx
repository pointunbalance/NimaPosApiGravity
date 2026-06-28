import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { DollarSign, FileText, Upload } from 'lucide-react';

interface ExpenseFormValues {
  title: string;
  amount: number;
  category: string;
  paymentMethod: 'cash' | 'card' | 'bank';
  date: string;
  referenceNumber?: string;
  vendor?: string;
  taxAmount?: number;
  notes?: string;
}

interface ExpenseFormFieldsProps {
  register: UseFormRegister<ExpenseFormValues>;
  errors: FieldErrors<ExpenseFormValues>;
  paymentMethod: 'cash' | 'card' | 'bank';
  receiptImage: string | null;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ExpenseFormFields: React.FC<ExpenseFormFieldsProps> = ({
  register,
  errors,
  paymentMethod,
  receiptImage,
  handleImageUpload,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">البيان</label>
        <input 
          type="text" 
          {...register('title')}
          className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.title ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800`}
          placeholder="مثال: فاتورة كهرباء شهر مايو"
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">المبلغ</label>
          <div className="relative">
            <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="number" 
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              className={`w-full pl-4 pr-10 py-2.5 bg-slate-50 border ${errors.amount ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800`}
              placeholder="0.00"
            />
          </div>
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">قيمة الضريبة (إن وجدت)</label>
          <div className="relative">
            <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="number" 
              step="0.01"
              {...register('taxAmount', { valueAsNumber: true })}
              className={`w-full pl-4 pr-10 py-2.5 bg-slate-50 border ${errors.taxAmount ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800`}
              placeholder="0.00"
            />
          </div>
          {errors.taxAmount && <p className="text-red-500 text-xs mt-1">{errors.taxAmount.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">التصنيف</label>
          <select 
            {...register('category')}
            className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.category ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800`}
          >
            <option value="rent">إيجار</option>
            <option value="salary">رواتب</option>
            <option value="utilities">فواتير (كهرباء/ماء)</option>
            <option value="purchase">مشتريات بضاعة</option>
            <option value="marketing">تسويق وإعلانات</option>
            <option value="maintenance">صيانة وإصلاح</option>
            <option value="supplies">مستلزمات مكتبية</option>
            <option value="government">رسوم حكومية</option>
            <option value="transportation">نقل ومواصلات</option>
            <option value="other">نثريات / أخرى</option>
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">التاريخ</label>
          <input 
            type="date" 
            {...register('date')}
            className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.date ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800`}
          />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">المورد / المستفيد</label>
          <input 
            type="text" 
            {...register('vendor')}
            className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.vendor ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800`}
            placeholder="اسم الجهة أو الشخص"
          />
          {errors.vendor && <p className="text-red-500 text-xs mt-1">{errors.vendor.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">رقم المرجع / الفاتورة</label>
          <input 
            type="text" 
            {...register('referenceNumber')}
            className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.referenceNumber ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800`}
            placeholder="مثال: INV-1234"
          />
          {errors.referenceNumber && <p className="text-red-500 text-xs mt-1">{errors.referenceNumber.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">طريقة الدفع</label>
        <div className="flex gap-4">
          <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${paymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
            <input 
              type="radio" 
              value="cash"
              {...register('paymentMethod')}
              className="hidden"
            />
            <DollarSign className="w-4 h-4" />
            نقدي
          </label>
          <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
            <input 
              type="radio" 
              value="card"
              {...register('paymentMethod')}
              className="hidden"
            />
            <FileText className="w-4 h-4" />
            بطاقة
          </label>
          <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${paymentMethod === 'bank' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
            <input 
              type="radio" 
              value="bank"
              {...register('paymentMethod')}
              className="hidden"
            />
            <FileText className="w-4 h-4" />
            تحويل بنكي
          </label>
        </div>
        {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات (اختياري)</label>
        <textarea 
          {...register('notes')}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-20 text-slate-800"
          placeholder="أي تفاصيل إضافية..."
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">صورة الإيصال (اختياري)</label>
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative overflow-hidden">
          <input 
            type="file" 
            accept="image/*"
            onChange={handleImageUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          {receiptImage ? (
            <div className="relative h-32 w-full">
              <img src={receiptImage} alt="Receipt" className="h-full w-full object-contain" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <p className="text-white font-bold text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  تغيير الصورة
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4 flex flex-col items-center text-slate-500">
              <Upload className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm font-bold">انقر لرفع صورة الإيصال</p>
              <p className="text-xs mt-1 opacity-75">PNG, JPG حتى 5MB</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
