import React from 'react';
import { GiftCard } from '../../types';

interface GiftCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCard: GiftCard | null;
  formData: Partial<GiftCard>;
  setFormData: (data: Partial<GiftCard>) => void;
  onSave: () => void;
}

const GiftCardModal: React.FC<GiftCardModalProps> = ({
  isOpen,
  onClose,
  editingCard,
  formData,
  setFormData,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          {editingCard ? 'تعديل بطاقة هدية' : 'إصدار بطاقة جديدة'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">رقم البطاقة</label>
            <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="مثال: GC-1234-5678"
                />
                <button 
                  onClick={() => {
                        const array = new Uint32Array(3);
                        window.crypto.getRandomValues(array);
                        const code = 'GC-' + array[0].toString(36).toUpperCase() + '-' + array[1].toString(36).toUpperCase();
                        setFormData({ ...formData, code: code });
                  }}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                  type="button"
                >
                    توليد
                </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الرصيد الأساسي</label>
            <input
              type="number"
              value={formData.initialBalance || ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setFormData({ ...formData, initialBalance: val, currentBalance: val });
              }}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {editingCard && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الرصيد الحالي</label>
              <input
                type="number"
                value={formData.currentBalance || ''}
                onChange={(e) => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الانتهاء</label>
            <input
              type="date"
              value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ''}
              onChange={(e) => setFormData({ ...formData, expiryDate: new Date(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
            <select
              value={formData.status || 'active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">نشط</option>
              <option value="used">مستخدم</option>
              <option value="expired">منتهي الصلاحية</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
};

export default GiftCardModal;
