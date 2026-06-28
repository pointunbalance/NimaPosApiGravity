import React from "react";
import { X } from "lucide-react";

interface CostElementModalProps {
  editingId: number | null;
  formData: { code: string; name: string; type: string; behavior: string; defaultCenter: string };
  setFormData: (data: any) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const CostElementModal: React.FC<CostElementModalProps> = ({
  editingId,
  formData,
  setFormData,
  onClose,
  onSubmit,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 font-bold">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">
            {editingId ? "تعديل عنصر التكلفة" : "عنصر تكلفة جديد"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">الرمز (Code)</label>
              <input
                required
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">الاسم</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">النوع</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
              >
                <option value="مباشرة">مباشرة</option>
                <option value="غير مباشرة">غير مباشرة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">السلوك</label>
              <select
                value={formData.behavior}
                onChange={(e) => setFormData({ ...formData, behavior: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
              >
                <option value="متغيرة">متغيرة</option>
                <option value="ثابتة">ثابتة</option>
                <option value="مختلطة">مختلطة</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              مركز التكلفة الافتراضي
            </label>
            <input
              required
              type="text"
              value={formData.defaultCenter}
              onChange={(e) => setFormData({ ...formData, defaultCenter: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-bold"
            >
              {editingId ? "تعديل" : "حفظ وإضافة"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 transition font-bold"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CostElementModal;
