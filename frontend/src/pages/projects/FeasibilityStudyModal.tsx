import React from "react";
import { X, FileText, DollarSign, AlertTriangle, Save } from "lucide-react";
import { FeasibilityStudy, Project } from "../../types";

interface FeasibilityStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: Partial<FeasibilityStudy>;
  handleFormChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  handleSave: (e: React.FormEvent) => void;
  projects: Project[];
  editingStudy: FeasibilityStudy | null;
  currencyCode: string;
}

export const FeasibilityStudyModal: React.FC<FeasibilityStudyModalProps> = ({
  isOpen,
  onClose,
  formData,
  handleFormChange,
  handleSave,
  projects,
  editingStudy,
  currencyCode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-6 flex justify-between items-center z-10 rounded-t-[2rem]">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            {editingStudy ? "تعديل دراسة الجدوى" : "دراسة جدوى جديدة"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                عنوان الدراسة *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title || ""}
                onChange={handleFormChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                placeholder="مثال: إنشاء فرع جديد في الرياض"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                وصف المشروع / ملخص تنفيذي
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description || ""}
                onChange={handleFormChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium resize-none"
                placeholder="ملخص عن المشروع وأهدافه..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                المشروع المرتبط (اختياري)
              </label>
              <select
                name="projectId"
                value={formData.projectId || 0}
                onChange={handleFormChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value={0}>بدون ارتباط</option>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                حالة الدراسة
              </label>
              <select
                name="status"
                value={formData.status || "draft"}
                onChange={handleFormChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="draft">مسودة</option>
                <option value="under_review">قيد المراجعة</option>
                <option value="approved">معتمدة</option>
                <option value="rejected">مرفوضة</option>
              </select>
            </div>

            <div className="md:col-span-2 mt-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                المؤشرات المالية (Financials)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    التكلفة المتوقعة ({currencyCode})
                  </label>
                  <input
                    type="number"
                    name="expectedCost"
                    value={formData.expectedCost || 0}
                    onChange={handleFormChange}
                    min="0"
                    onFocus={(e) => e.target.select()}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    الإيرادات المتوقعة ({currencyCode})
                  </label>
                  <input
                    type="number"
                    name="expectedRevenue"
                    value={formData.expectedRevenue || 0}
                    onChange={handleFormChange}
                    min="0"
                    onFocus={(e) => e.target.select()}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    عائد الاستثمار (ROI %) - تقريبي
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="roi"
                      value={formData.roi || 0}
                      onChange={handleFormChange}
                      step="0.01"
                      disabled
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold opacity-80"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    يحسب تلقائياً بناءً على التكلفة والإيراد
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    فترة الاسترداد (بالأشهر)
                  </label>
                  <input
                    type="number"
                    name="paybackPeriod"
                    value={formData.paybackPeriod || 0}
                    onChange={handleFormChange}
                    min="0"
                    onFocus={(e) => e.target.select()}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                مستوى المخاطرة{" "}
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </label>
              <select
                name="riskLevel"
                value={formData.riskLevel || "medium"}
                onChange={handleFormChange}
                disabled
                className="w-full px-4 py-3 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl font-medium cursor-not-allowed"
              >
                <option value="low">منخفضة (تلقائي)</option>
                <option value="medium">متوسطة (تلقائي)</option>
                <option value="high">مرتفعة (تلقائي)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                ملاحظات إضافية وتوصيات
              </label>
              <textarea
                name="notes"
                rows={4}
                value={formData.notes || ""}
                onChange={handleFormChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium resize-none"
                placeholder="توصيات للمضي قدماً في المشروع..."
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-slate-100">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              حفظ الدراسة
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
