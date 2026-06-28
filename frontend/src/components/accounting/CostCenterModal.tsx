import React from "react";
import { X, Target } from "lucide-react";
import { CostCenter } from "../../types";

interface CostCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCenter: CostCenter | null;
  formData: Partial<CostCenter>;
  setFormData: (val: Partial<CostCenter>) => void;
  onSave: () => void;
}

const CostCenterModal: React.FC<CostCenterModalProps> = ({
  isOpen,
  onClose,
  editingCenter,
  formData,
  setFormData,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:hidden">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl text-slate-800">
            {editingCenter ? "تعديل مركز" : "مركز تكلفة جديد"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                الكود
              </label>
              <input
                className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-500 font-mono text-center font-bold bg-white "
                placeholder="CC-01"
                value={formData.code || ""}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                الاسم
              </label>
              <input
                className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-500 font-bold bg-white "
                placeholder="فرع القاهرة..."
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              الميزانية التقديرية (اختياري)
            </label>
            <div className="relative">
              <Target className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                onFocus={(e) => e.target.select()}
                className="w-full border border-slate-200 p-3 pr-10 rounded-xl outline-none focus:border-indigo-500 font-bold bg-white "
                placeholder="0.00"
                value={formData.budget || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budget: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              وصف
            </label>
            <textarea
              className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-500 resize-none text-sm bg-white "
              placeholder="تفاصيل إضافية..."
              rows={3}
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={onSave}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
            >
              حفظ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostCenterModal;
