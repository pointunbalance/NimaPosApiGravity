import React from "react";
import { X } from "lucide-react";

interface ProjectAccountingModalProps {
  editingId: number | null;
  formData: {
    projectCode: string;
    projectName: string;
    client: string;
    budget: number;
    actual: number;
    revenue: number;
    completion: number;
    status: string;
  };
  setFormData: (data: any) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ProjectAccountingModal: React.FC<ProjectAccountingModalProps> = ({
  editingId,
  formData,
  setFormData,
  onClose,
  onSubmit,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 font-bold">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">
            {editingId ? "تعديل مشروع" : "إضافة مشروع جديد"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">الرمز</label>
              <input
                required
                type="text"
                value={formData.projectCode}
                onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">اسم المشروع</label>
              <input
                required
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">العميل</label>
              <input
                required
                type="text"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">الحالة</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              >
                <option value="بدأ حديثاً">بدأ حديثاً</option>
                <option value="جاري العمل">جاري العمل</option>
                <option value="مكتمل">مكتمل</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">الموازنة</label>
              <input
                required
                type="number"
                min="0"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">الفعلي</label>
              <input
                required
                type="number"
                min="0"
                value={formData.actual}
                onChange={(e) => setFormData({ ...formData, actual: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">الإيرادات</label>
              <input
                required
                type="number"
                min="0"
                value={formData.revenue}
                onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">نسبة الإنجاز (%)</label>
            <input
              required
              type="number"
              min="0"
              max="100"
              value={formData.completion}
              onChange={(e) => setFormData({ ...formData, completion: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition font-bold"
            >
              {editingId ? "تعديل المشروع" : "إضافة المشروع"}
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

export default ProjectAccountingModal;
