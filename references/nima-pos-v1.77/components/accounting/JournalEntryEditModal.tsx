import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, Paperclip, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { JournalEntryLine, Account, CostCenter, JournalEntry } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { compressImage } from '../../utils/imageCompression';
import { journalEntrySchema, JournalEntryFormData } from './journalEntrySchema';

interface JournalEntryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEntry: JournalEntry | null;
  accounts?: Account[];
  costCenters?: CostCenter[];
  onSubmit: (data: JournalEntryFormData, attachment: string) => void;
}

export const JournalEntryEditModal: React.FC<JournalEntryEditModalProps> = ({
  isOpen, onClose, editingEntry, accounts, costCenters, onSubmit
}) => {
  const [entryAttachment, setEntryAttachment] = useState('');
  const fiscalYears = useLiveQuery(() => db.fiscalYears.toArray(), []);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<JournalEntryFormData>({
    resolver: zodResolver(journalEntrySchema) as any,
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      status: 'posted',
      lines: [
        { accountId: 0, debit: 0, credit: 0, description: '' },
        { accountId: 0, debit: 0, credit: 0, description: '' }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines'
  });

  const lines = watch('lines');
  const status = watch('status');
  const entryDate = watch('date');

  useEffect(() => {
    if (isOpen) {
      if (editingEntry) {
        reset({
          date: new Date(editingEntry.date).toISOString().split('T')[0],
          description: editingEntry.description,
          reference: editingEntry.reference || '',
          status: editingEntry.status,
          lines: editingEntry.lines.length > 0 ? editingEntry.lines.map(l => ({
            accountId: l.accountId,
            debit: l.debit || 0,
            credit: l.credit || 0,
            description: l.description || '',
            costCenterId: l.costCenterId || 0
          })) : [
            { accountId: 0, debit: 0, credit: 0, description: '' },
            { accountId: 0, debit: 0, credit: 0, description: '' }
          ]
        });
        // setEntryAttachment(editingEntry.attachment || '');
        setEntryAttachment('');
      } else {
        reset({
          date: new Date().toISOString().split('T')[0],
          description: '',
          reference: '',
          status: 'posted',
          lines: [
            { accountId: 0, debit: 0, credit: 0, description: '' },
            { accountId: 0, debit: 0, credit: 0, description: '' }
          ]
        });
        setEntryAttachment('');
      }
    }
  }, [isOpen, editingEntry, reset]);

  if (!isOpen) return null;

  const totalDebit = (lines || []).reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = (lines || []).reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const diff = totalDebit - totalCredit;
  const isBalanced = Math.abs(diff) < 0.01 && totalDebit > 0;

  // Check if date is in a closed fiscal year
  const isDateClosed = () => {
      if (!fiscalYears || !entryDate) return false;
      const d = new Date(entryDate).getTime();
      return fiscalYears.some(fy => {
          const start = new Date(fy.startDate).setHours(0,0,0,0);
          const end = new Date(fy.endDate).setHours(23,59,59,999);
          return d >= start && d <= end && fy.status === 'closed';
      });
  };

  const isClosed = isDateClosed();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          compressImage(file).then(result => setEntryAttachment(result));
      }
  };

  const handleFormSubmit = (data: JournalEntryFormData) => {
    if (isClosed) {
        alert('لا يمكن إضافة أو تعديل قيود في سنة مالية مغلقة.');
        return;
    }
    if (!isBalanced && data.status === 'posted') {
      alert('لا يمكن ترحيل قيد غير متوازن. يمكنك حفظه كمسودة.');
      return;
    }
    onSubmit(data, entryAttachment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col h-[90vh] overflow-hidden animate-in zoom-in-95">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b bg-slate-50 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-lg"><Plus className="w-6 h-6" /></div>
              <div>
                <h3 className="font-extrabold text-xl text-slate-800">{editingEntry ? 'تعديل قيد' : 'قيد يومية جديد'}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="posted" {...register('status')} disabled={isClosed} className="text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-xs font-bold text-slate-600">ترحيل نهائي</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="draft" {...register('status')} disabled={isClosed} className="text-amber-600 focus:ring-amber-500" />
                    <span className="text-xs font-bold text-slate-600">حفظ كمسودة</span>
                  </label>
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-6 h-6"/></button>
          </div>
          
          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 bg-white">
            {isClosed && (
                <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-200 font-bold">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    تاريخ القيد يقع ضمن فترة مالية مغلقة. لا يمكن حفظ التعديلات.
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ القيد</label>
                <input 
                  type="date" 
                  className={`w-full px-4 py-2.5 bg-white border ${errors.date ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold [color-scheme:light]`}
                  {...register('date')}
                />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">البيان (الوصف العام)</label>
                <input 
                  type="text" 
                  className={`w-full px-4 py-2.5 bg-white border ${errors.description ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium`}
                  {...register('description')}
                  placeholder="مثال: إثبات فاتورة مبيعات رقم..." 
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">المرجع</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                  {...register('reference')}
                  placeholder="INV-001" 
                />
              </div>
            </div>

            {/* Lines Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase">
                  <tr>
                    <th className="p-4 w-12 text-center">#</th>
                    <th className="p-4">الحساب</th>
                    <th className="p-4 w-40">مدين</th>
                    <th className="p-4 w-40">دائن</th>
                    <th className="p-4 w-64">البيان (اختياري)</th>
                    <th className="p-4 w-40">مركز التكلفة</th>
                    <th className="p-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fields.map((field, idx) => (
                    <tr key={field.id} className="bg-white hover:bg-slate-50">
                      <td className="p-4 text-center text-xs text-slate-400">{idx + 1}</td>
                      <td className="p-2">
                        <select className={`w-full p-2 bg-white border ${errors.lines?.[idx]?.accountId ? 'border-red-500' : 'border-slate-200'} rounded-lg outline-none focus:border-indigo-500 text-sm font-bold`} {...register(`lines.${idx}.accountId`)}>
                          <option value={0}>اختر الحساب...</option>
                          {accounts?.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                        </select>
                      </td>
                      <td className="p-2">
                        <input type="number" onFocus={(e) => e.target.select()} min="0" step="0.01" className={`w-full p-2 border rounded-lg text-center font-bold outline-none focus:ring-2 ${(lines || [])[idx]?.debit > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 '} ${errors.lines?.[idx]?.debit ? 'border-red-500' : ''}`} {...register(`lines.${idx}.debit`, { valueAsNumber: true, onChange: (e) => { if (Number(e.target.value) > 0) setValue(`lines.${idx}.credit`, 0); } })} />
                      </td>
                      <td className="p-2">
                        <input type="number" onFocus={(e) => e.target.select()} min="0" step="0.01" className={`w-full p-2 border rounded-lg text-center font-bold outline-none focus:ring-2 ${(lines || [])[idx]?.credit > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 '} ${errors.lines?.[idx]?.credit ? 'border-red-500' : ''}`} {...register(`lines.${idx}.credit`, { valueAsNumber: true, onChange: (e) => { if (Number(e.target.value) > 0) setValue(`lines.${idx}.debit`, 0); } })} />
                      </td>
                      <td className="p-2">
                        <input type="text" className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-xs" placeholder="شرح فرعي..." {...register(`lines.${idx}.description`)} />
                      </td>
                      <td className="p-2">
                        <select className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-xs" {...register(`lines.${idx}.costCenterId`)}>
                          <option value={0}>-</option>
                          {costCenters?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <button type="button" onClick={() => { if(fields.length > 2) remove(idx) }} className={`text-slate-300 transition-colors ${fields.length > 2 ? 'hover:text-red-500' : 'opacity-50 cursor-not-allowed'}`} disabled={fields.length <= 2}><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {errors.lines?.root && <p className="text-red-500 text-xs p-2">{errors.lines.root.message}</p>}
              <button type="button" onClick={() => append({ accountId: 0, debit: 0, credit: 0, description: '' })} disabled={isClosed} className="w-full py-2 bg-slate-50 text-indigo-600 text-xs font-bold hover:bg-slate-100 transition-colors border-t border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">
                + إضافة سطر جديد
              </button>
            </div>

            {/* Attachments */}
            <div className="flex items-center gap-4">
              <label className={`flex items-center gap-2 cursor-pointer bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm font-bold shadow-sm ${isClosed ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Paperclip className="w-4 h-4" />
                <span>إرفاق مستند</span>
                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*,.pdf" disabled={isClosed} />
              </label>
              {entryAttachment && (
                <span className="text-xs text-emerald-600 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> تم إرفاق الملف
                </span>
              )}
            </div>
          </div>

          {/* Footer Stats */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isBalanced ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-red-100 border-red-200 text-red-800'}`}>
                  {isBalanced ? <CheckCircle2 className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
                  <span className="font-bold text-sm">{isBalanced ? 'القيد متوازن' : `غير متوازن (الفرق: ${Math.abs(diff).toLocaleString()})`}</span>
                </div>
              </div>

              <div className="flex gap-8 items-center bg-white px-6 py-2 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">إجمالي المدين</p>
                  <p className="text-lg font-black text-slate-800">{totalDebit.toLocaleString()}</p>
                </div>
                <div className="w-[1px] h-8 bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-red-600 uppercase">إجمالي الدائن</p>
                  <p className="text-lg font-black text-slate-800">{totalCredit.toLocaleString()}</p>
                </div>
              </div>

              <button type="submit" className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 ${((isBalanced || status === 'draft') && !isClosed) ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-gray-400 cursor-not-allowed'}`} disabled={(!isBalanced && status === 'posted') || isClosed}>
                <Save className="w-5 h-5" /> حفظ {status === 'draft' ? 'المسودة' : 'وترحيل'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
