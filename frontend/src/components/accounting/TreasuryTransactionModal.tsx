import React from "react";
import { X } from "lucide-react";
import { TreasuryTransaction, TreasuryAccount } from "../../types";

interface TreasuryTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction: TreasuryTransaction | null;
  formData: Partial<TreasuryTransaction>;
  setFormData: (val: Partial<TreasuryTransaction>) => void;
  treasuryAccounts: TreasuryAccount[];
  onSubmit: (e: React.FormEvent) => void;
}

const TreasuryTransactionModal: React.FC<TreasuryTransactionModalProps> = ({
  isOpen,
  onClose,
  editingTransaction,
  formData,
  setFormData,
  treasuryAccounts,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {editingTransaction ? "تعديل حركة" : "تسجيل حركة جديدة"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                نوع الحركة
              </label>
              <select
                required
                value={formData.type || "inflow"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as any,
                    category:
                      e.target.value === "transfer" ? "transfer" : "operational",
                  })
                }
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold outline-none"
              >
                <option value="inflow">وارد (مقبوضات)</option>
                <option value="outflow">صادر (مدفوعات)</option>
                <option value="transfer">تحويل داخلي</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                المبلغ
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                التاريخ
              </label>
              <input
                type="date"
                required
                value={formData.date ? formData.date.split("T")[0] : ""}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold outline-none color-scheme-light"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                التصنيف
              </label>
              <select
                required
                value={formData.category || "operational"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as any,
                  })
                }
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold outline-none"
                disabled={formData.type === "transfer"}
              >
                {formData.type === "transfer" ? (
                  <option value="transfer">تحويل داخلي</option>
                ) : (
                  <>
                    <option value="sales">مبيعات</option>
                    <option value="expenses">مصروفات</option>
                    <option value="loan">قروض</option>
                    <option value="investment">استثمارات</option>
                    <option value="operational">تشغيلي</option>
                    <option value="other">أخرى</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {formData.type === "transfer" ? "من حساب" : "الحساب"}
              </label>
              <select
                required
                value={formData.sourceAccountId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    sourceAccountId: val ? parseInt(val) : undefined,
                    sourceAccount: val,
                  });
                }}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold outline-none"
              >
                <option value="">-- اختر حساب --</option>
                {treasuryAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {formData.type === "transfer" && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  إلى حساب
                </label>
                <select
                  required
                  value={formData.destinationAccountId || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      destinationAccountId: val ? parseInt(val) : undefined,
                      destinationAccount: val,
                    });
                  }}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold outline-none"
                >
                  <option value="">-- اختر حساب --</option>
                  {treasuryAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                طريقة الدفع
              </label>
              <select
                required
                value={formData.paymentMethod || "bank_transfer"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentMethod: e.target.value as any,
                  })
                }
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold outline-none"
              >
                <option value="cash">نقدي</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="check">شيك</option>
                <option value="card">بطاقة ائتمان</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                رقم المرجع (اختياري)
              </label>
              <input
                type="text"
                value={formData.referenceNumber || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    referenceNumber: e.target.value,
                  })
                }
                placeholder="رقم الشيك أو التحويل..."
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                الحالة
              </label>
              <select
                required
                value={formData.status || "completed"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as any,
                  })
                }
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold outline-none"
              >
                <option value="completed">مكتبل</option>
                <option value="pending">معلق</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              البيان / الوصف
            </label>
            <textarea
              required
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold outline-none"
              placeholder="تفاصيل الحركة..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold"
            >
              {editingTransaction ? "حفظ التعديلات" : "تسجيل الحركة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TreasuryTransactionModal;
