import React from 'react';
import { PricingRule } from '../../types';

interface PricingRuleModalProps {
  isModalOpen: boolean;
  handleCloseModal: () => void;
  editingRule: PricingRule | null;
  formData: Partial<PricingRule>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<PricingRule>>>;
  handleSubmit: (e: React.FormEvent) => void;
  currency?: string;
}

const PricingRuleModal: React.FC<PricingRuleModalProps> = ({
  isModalOpen,
  handleCloseModal,
  editingRule,
  formData,
  setFormData,
  handleSubmit,
  currency,
}) => {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {editingRule ? 'تعديل قاعدة التسعير' : 'إضافة قاعدة تسعير جديدة'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم القاعدة</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="مثال: سلع منخفضة التكلفة"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">من تكلفة ({currency})</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.minCost}
                onChange={(e) => setFormData({ ...formData, minCost: Number(e.target.value) })}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">إلى تكلفة ({currency})</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.maxCost}
                onChange={(e) => setFormData({ ...formData, maxCost: Number(e.target.value) })}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">هامش الربح (%)</label>
            <div className="relative">
              <input
                type="number"
                required
                min="0"
                step="0.1"
                value={formData.marginPercentage}
                onChange={(e) => setFormData({ ...formData, marginPercentage: Number(e.target.value) })}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-8"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              سيتم إضافة هذه النسبة إلى سعر التكلفة لتحديد سعر البيع.
            </p>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              القاعدة نشطة
            </label>
          </div>

          <div className="flex gap-3 pt-4 mt-6 border-t border-gray-100">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PricingRuleModal;
