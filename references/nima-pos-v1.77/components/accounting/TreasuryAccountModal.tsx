import React from "react";
import { X } from "lucide-react";
import { TreasuryAccount } from "../../types";

interface TreasuryAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountFormData: Partial<TreasuryAccount>;
  setAccountFormData: (val: Partial<TreasuryAccount>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const TreasuryAccountModal: React.FC<TreasuryAccountModalProps> = ({
  isOpen,
  onClose,
  accountFormData,
  setAccountFormData,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">إضافة خزينة / حساب</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              اسم الخزينة / الحساب
            </label>
            <input
              type="text"
              required
              value={accountFormData.name || ""}
              onChange={(e) =>
                setAccountFormData({ ...accountFormData, name: e.target.value })
              }
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold outline-none"
              placeholder="مثال: خزينة المندوب أندري"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">النوع</label>
            <select
              required
              value={accountFormData.type || "safe"}
              onChange={(e) =>
                setAccountFormData({
                  ...accountFormData,
                  type: e.target.value as any,
                })
              }
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold outline-none"
            >
              <option value="safe">خزينة فرع / رئيسية</option>
              <option value="cashier">خزينة كاشير</option>
              <option value="representative">خزينة مندوب</option>
              <option value="bank">حساب بنكي</option>
              <option value="petty_cash">عهدة</option>
              <option value="other">أخرى</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
              حفظ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TreasuryAccountModal;
