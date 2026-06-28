import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const serialSchema = z.object({
  serials: z.array(z.object({
    value: z.string().min(1, 'السيريال مطلوب')
  }))
});

export type SerialFormData = z.infer<typeof serialSchema>;

interface SerialEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentItemForSerials: { itemIdx: number; productId: number; productName: string; qty: number } | null;
  confirmSerials: (serials: string[]) => void;
}

const SerialEntryModal: React.FC<SerialEntryModalProps> = ({
  isOpen,
  onClose,
  currentItemForSerials,
  confirmSerials
}) => {
  const { handleSubmit, control, reset, getValues } = useForm<SerialFormData>({
    resolver: zodResolver(serialSchema),
    defaultValues: { serials: [] }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "serials"
  });

  const [serialInput, setSerialInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      reset({ serials: [] });
      setSerialInput('');
    }
  }, [isOpen, reset]);

  const handleSerialAdd = () => {
    const trimmed = serialInput.trim();
    if (!trimmed) return;
    
    const currentSerials = getValues('serials');
    if (currentSerials.some(s => s.value === trimmed)) {
      alert('هذا السيريال مضاف بالفعل');
      return;
    }
    
    if (currentSerials.length >= (currentItemForSerials?.qty || 0)) {
      alert('تم إدخال العدد المطلوب بالكامل');
      return;
    }
    
    append({ value: trimmed });
    setSerialInput('');
  };

  const onSubmit = (data: SerialFormData) => {
    if (!currentItemForSerials) return;
    if (data.serials.length !== currentItemForSerials.qty) {
      if (!window.confirm(`تم إدخال ${data.serials.length} سيريال فقط من أصل ${currentItemForSerials.qty}. هل تريد المتابعة؟ (سيتم اعتبار الباقي بدون سيريال)`)) return;
    }
    confirmSerials(data.serials.map(s => s.value));
  };

  if (!isOpen || !currentItemForSerials) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800">إدخال الأرقام التسلسلية (IMEI)</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-4 bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-sm">
            <p className="font-bold text-indigo-800">{currentItemForSerials.productName}</p>
            <p className="text-indigo-600">الكمية المطلوبة: {currentItemForSerials.qty} | المدخل: {fields.length}</p>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 font-mono text-sm"
              placeholder="Scan or type serial..."
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSerialAdd();
                }
              }}
              autoFocus
            />
            <button type="button" onClick={handleSerialAdd} className="bg-indigo-600 text-white px-4 rounded-xl font-bold"><Plus /></button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {fields.map((field, idx) => (
              <div key={field.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                <span className="font-mono text-sm font-bold text-gray-700">{field.value}</span>
                <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t bg-slate-50">
          <button
            onClick={handleSubmit(onSubmit)}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
          >
            تأكيد وإضافة
          </button>
        </div>
      </div>
    </div>
  );
};

export default SerialEntryModal;
