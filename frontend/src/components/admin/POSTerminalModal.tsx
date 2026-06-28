import React, { useEffect } from 'react';
import { X, MonitorSmartphone, Key } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { POSTerminal, Branch } from '../../types';
import { db } from '../../db';

const terminalSchema = z.object({
  name: z.string().min(1, 'اسم الجهاز مطلوب'),
  branchId: z.number().min(1, 'الفرع مطلوب'),
  status: z.enum(['online', 'offline', 'maintenance']),
  ipAddress: z.string().optional(),
  macAddress: z.string().optional(),
  deviceType: z.enum(['desktop', 'tablet', 'mobile', 'kiosk']),
});

type TerminalFormValues = z.infer<typeof terminalSchema>;

interface POSTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  terminalToEdit?: POSTerminal | null;
  branches: Branch[];
}

const POSTerminalModal: React.FC<POSTerminalModalProps> = ({ isOpen, onClose, terminalToEdit, branches }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TerminalFormValues>({
    resolver: zodResolver(terminalSchema),
    defaultValues: {
      name: '',
      branchId: branches.length > 0 ? branches[0].id : 0,
      status: 'offline',
      ipAddress: '',
      macAddress: '',
      deviceType: 'desktop',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (terminalToEdit) {
        reset({
          name: terminalToEdit.name,
          branchId: terminalToEdit.branchId,
          status: terminalToEdit.status,
          ipAddress: terminalToEdit.ipAddress || '',
          macAddress: terminalToEdit.macAddress || '',
          deviceType: terminalToEdit.deviceType || 'desktop',
        });
      } else {
        reset({
          name: '',
          branchId: branches.length > 0 ? branches[0].id : 0,
          status: 'offline',
          ipAddress: '',
          macAddress: '',
          deviceType: 'desktop',
        });
      }
    }
  }, [isOpen, terminalToEdit, branches, reset]);

  const onSubmit = async (data: TerminalFormValues) => {
    try {
      const terminalData: Partial<POSTerminal> = {
        ...data,
        lastSeen: terminalToEdit ? terminalToEdit.lastSeen : new Date().toISOString(),
      };

      if (!terminalToEdit) {
        // Generate a pairing code for new terminals
        terminalData.pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      }

      if (terminalToEdit && terminalToEdit.id) {
        await db.posTerminals.update(terminalToEdit.id, terminalData);
      } else {
        await db.posTerminals.add(terminalData as POSTerminal);
      }
      onClose();
    } catch (error) {
      console.error('Error saving terminal:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MonitorSmartphone className="w-5 h-5 text-indigo-600" />
            {terminalToEdit ? 'تعديل بيانات الجهاز' : 'إضافة جهاز نقطة بيع جديد'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم الجهاز</label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="مثال: كاشير 1"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الفرع</label>
              <select
                {...register('branchId', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {errors.branchId && <p className="text-red-500 text-xs mt-1">{errors.branchId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">نوع الجهاز</label>
              <select
                {...register('deviceType')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="desktop">كمبيوتر مكتبي (Desktop)</option>
                <option value="tablet">جهاز لوحي (Tablet)</option>
                <option value="mobile">هاتف محمول (Mobile)</option>
                <option value="kiosk">جهاز خدمة ذاتية (Kiosk)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">عنوان IP (اختياري)</label>
              <input
                type="text"
                {...register('ipAddress')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left"
                dir="ltr"
                placeholder="192.168.1.x"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">عنوان MAC (اختياري)</label>
              <input
                type="text"
                {...register('macAddress')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left uppercase"
                dir="ltr"
                placeholder="00:1A:2B:3C:4D:5E"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">الحالة</label>
              <select
                {...register('status')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="online">متصل (Online)</option>
                <option value="offline">غير متصل (Offline)</option>
                <option value="maintenance">في الصيانة (Maintenance)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-70"
            >
              {terminalToEdit ? 'حفظ التعديلات' : 'إضافة الجهاز'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default POSTerminalModal;
